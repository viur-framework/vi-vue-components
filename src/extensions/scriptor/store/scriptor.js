// @ts-nocheck
import { computed, reactive } from "vue"
import { defineStore } from "pinia"
import { useBrowserLocation, useWebWorker, useUrlSearchParams } from "@vueuse/core"
import { useContextStore } from "../../../stores/context"
import { useMessageStore } from "../../../stores/message"
import { Request } from "@viur/vue-utils"
import { readEnvCache, writeEnvCache, dropEnvCache } from "./envCache"
import { resolveWorkerPath } from "./workerBridge"

// Sitzungsweit geteilt: das importable-ZIP ist für alle Worker gleich.
const env = {
  importable: undefined,
  importableLoaded: false,
  loadingLock: null,
}

export const useScriptorStore = defineStore("scriptorStore", () => {
  const instanceTemplate = {
    scriptKey: null,
    scriptCode: "#### scriptor ####\nfrom viur.scriptor import *\n\nasync def main():\n    logger.info('Hello World')",
    messages: [],
    messageBuffer: [],
    messageBufferFluscher: null,
    internalMessages: [],
    hideInternalMessages: false,
  }

  const state = reactive({
    workerObject: null,
    pyoPackages: [],
    packages: [],
    initCode: "",
    runningActions: new Map(),
    isReady: false, //scriptor webworker ready
    isLoading: false, //scriptor webworker ready
    isRunning: computed(() => {
      // user script is running
      return state.runningActions.size > 0
    }),
    apiUrl: computed(() => {
      //api Server could be a different server
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
      }
      return useBrowserLocation().value.origin
    }),
    currentInstance: null,
    instances: reactive({}),
    scriptorVersion: "latest",
  })

  const progress = reactive({
    total: 100,
    step: -1,
    max_step: -1,
    txt: "",
  })

  function setProgress(total, step, max_step, txt) {
    progress.total = total
    progress.step = step
    progress.max_step = max_step
    progress.txt = txt
  }

  function createNewInstance(id = null) {
    const instanceId = id || new Date().getTime().toString()
    if (!Object.keys(state.instances).includes(instanceId)) {
      state.instances[instanceId] = reactive({ ...instanceTemplate })
    }

    return instanceId
  }

  // Zwischenstufe bis Task 5: alle Instanzen zeigen auf denselben Worker.
  function createWebWorker(instanceId) {
    if (state.workerObject) {
      state.workerObject.terminate()
    }
    const path = resolveWorkerPath(useBrowserLocation().value.pathname)
    state.workerObject = useWebWorker(path)

    if (instanceId && state.instances[instanceId]) {
      state.instances[instanceId].worker = state.workerObject
      if (!state.instances[instanceId].pendingActions) {
        state.instances[instanceId].pendingActions = new Map()
      }
    }

    const nativWorker = state.workerObject.worker
    nativWorker.onmessage = async (event) => {
      const { id, ...data } = event.data
      handleWebWorkerMessages(id, data)
    }
    nativWorker.onmessageerror = async (error) => {
      console.log(error)
    }
    window.setInterval(() => {
      const instance = state.instances[state.currentInstance]
      if (!instance) {
        return
      }
      if (instance.messageBuffer.length) {
        instance.messages = instance.messages.concat([...instance.messageBuffer])
        instance.messageBuffer = []
      }
    }, 50)
    //Flush only all messages after 50ms
  }

  // Paketliste für den Kaltstart. Im Dev-Modus wird eine direkte Wheel-URL
  // benutzt, sonst der PyPI-Name mit optionaler Versionsangabe.
  function buildPackageList() {
    const packages = [...state.packages]
    if (import.meta.env.DEV && import.meta.env.VITE_SCRIPTOR_URL) {
      packages.unshift(import.meta.env.VITE_SCRIPTOR_URL)
    } else if (state.scriptorVersion === "latest") {
      packages.unshift("viur-scriptor-api")
    } else {
      packages.unshift(`viur-scriptor-api${state.scriptorVersion}`)
    }
    return packages
  }

  // Das importable-ZIP ist für alle Worker identisch. Einmal pro Sitzung holen
  // und den ArrayBuffer weitergeben — postMessage klont ihn, überträgt ihn also
  // nicht, sodass er mehrfach verwendbar bleibt.
  async function getImportable() {
    if (env.importableLoaded) {
      return env.importable
    }
    try {
      const response = await Request.get("/vi/script/get_importable")
      if (response.status === 200) {
        env.importable = await response.arrayBuffer()
      }
    } catch (error) {
      // Kein importable vorhanden — kein Fehlerfall.
    }
    env.importableLoaded = true
    return env.importable
  }

  // Schickt den Installer-Auftrag an den Worker der Instanz und wartet auf
  // dessen Abschluss. envCache === null erzwingt den Kaltstart-Pfad.
  function postEnvInstall(instanceId, envCache) {
    const instance = state.instances[instanceId]
    if (!instance?.worker) {
      return Promise.resolve({ results: null, error: "no_worker" })
    }
    return new Promise((resolve) => {
      instance.pendingActions.set("_pyinstaller", resolve)
      instance.worker.post({
        id: "_pyinstaller",
        python: "",
        pyoPackages: [...state.pyoPackages],
        packages: buildPackageList(),
        initCode: `with open("config.py", "w") as f:\n\tf.write("BASE_URL='${state.apiUrl}'")` + state.initCode,
        transformCode: "",
        importable: env.importable,
        envCache: envCache || undefined,
      })
    })
  }

  async function load(instanceId) {
    const instance = state.instances[instanceId]
    if (!instance) {
      return false
    }
    const version = cacheVersion()
    await getImportable()

    const cached = await readEnvCache(version)
    let result = await postEnvInstall(instanceId, cached)

    if (result?.error && cached) {
      // Veraltetes oder beschädigtes Lockfile: Eintrag verwerfen und genau
      // einmal auf den Kaltstart zurückfallen. Ohne diesen Pfad würde ein
      // defekter Cache den Scriptor dauerhaft blockieren.
      console.warn("Scriptor: warm start failed, falling back to cold start", result.error)
      await dropEnvCache(version)
      result = await postEnvInstall(instanceId, null)
    }

    return !result?.error
  }

  async function setParams(scriptParams = {}) {
    const contextStore = useContextStore()
    //Use window object, because useRoute not work outside module.
    const urlData = (window.location.hash || "").replace(/^#/, "").split("_")
    const tabId = urlData[urlData.length - 1].replace("=", "")
    let selectedEntries = contextStore.getLocalContext(tabId, true)["_selectedEntries"]
    if (!selectedEntries && !scriptParams) {
      return
    }
    if (!scriptParams) {
      scriptParams = {}
    }
    if (!selectedEntries) {
      selectedEntries = {}
    } else {
      selectedEntries = { __selected_entries: selectedEntries }
    }
    const params = Object.assign(selectedEntries, scriptParams)
    params["__is_dev__"] = import.meta.env.DEV
    if (state.workerObject) {
      return new Promise((resolve) => {
        state.runningActions.set("setParams", resolve)
        state.workerObject.post({
          id: "setParams",
          python: "",
          params: JSON.parse(JSON.stringify(params)),
        })
      })
    }
  }

  async function exitScript() {
    sendResult("exit", "__exit__")
  }

  async function execute(code, id = null, context = {}, scriptParams = {}) {
    let currentId = createNewInstance(id) // create needed Instance Object
    state.currentInstance = currentId
    let currentState = state.instances[currentId]
    currentState.messages = []
    currentState.messageBuffer = []
    currentState.internalMessages = []

    if (!state.isReady && !state.isLoading) {
      state.isLoading = true
      createWebWorker(currentId)
      await load(currentId)
      state.isLoading = false
    }
    if (code === undefined) {
      console.log("Nothing to execute")
      code = ""
    }
    await setParams(scriptParams)
    code = `${code}\nimport viur.scriptor\nimport traceback\nawait viur.scriptor._init_modules()\nfrom viur.scriptor import *\n\ntry:\n    await main()\nexcept:\n    logger.error(traceback.format_exc())\n`

    return new Promise((resolve) => {
      state.runningActions.set(currentId, resolve)

      state.workerObject.post({
        id: currentId,
        python: code,
        ...context,
      })
    })
  }

  function handleCallback(id, data) {
    const payload = { results: data.res ?? null, error: data.msg ?? null }
    let callback = state.runningActions.get(id)
    if (callback) {
      callback(payload)
      state.runningActions.delete(id)
    }
    for (const instance of Object.values(state.instances)) {
      const instanceCallback = instance.pendingActions?.get(id)
      if (instanceCallback) {
        instanceCallback(payload)
        instance.pendingActions.delete(id)
      }
    }
  }

  function preload() {
    //start empty script for preloading all libraries
    execute()
  }

  function addMessageEntry(type, id, data) {
    let currentState = state.instances[id]
    data["unique_id"] = new Date().getTime().toString()
    currentState.messageBuffer.push({ type: type, data: data })
  }

  function addInternalMessageEntry(type, id, data) {
    let currentState = state.instances[id]
    data["unique_id"] = new Date().getTime().toString()
    // currentState.internalMessages.push({type:type, data:data})
  }

  function normalizeText(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\ /g, "&nbsp;")
      .replace(/\n/g, "<br />")
  }

  // Cache-Schlüssel muss die Version enthalten, sonst liefert ein
  // Versionswechsel weiterhin die alte Umgebung aus.
  function cacheVersion() {
    return state.scriptorVersion || "latest"
  }

  async function handleWebWorkerMessages(id, data) {
    if (!id) {
      id = state.currentInstance
    }

    let currentState = state.instances[id]

    switch (data.type) {
      case "installlog":
        //installer status
        addInternalMessageEntry("install", id, data)
        if (data["msg"]["stage"] === 5) {
          state.isReady = true
        } else {
          state.isReady = false
        }
        break
      case "stdout":
        addInternalMessageEntry("install", id, data)
        break
      case "run_end": //script ended
      case "end": //action ended
        handleCallback(id, data)
        break
      case "err": //script error
        addMessageEntry("error", id, data)
        handleCallback(id, data)
        break
      case "log":
        data.msg = normalizeText(data.text)
        addMessageEntry(data.level, id, data)
        break
      case "alert":
        data.msg = normalizeText(data.text)
        addMessageEntry(data.type, id, data)
        break
      case "download":
        let a = document.createElement("a")
        a.href = window.URL.createObjectURL(data.blob)
        a.download = data.filename
        a.click()
        break
      case "showOpenFilePicker":
        let openhandle = -1
        const types = data.types || []
        try {
          openhandle = await window.showOpenFilePicker({
            multiple: false,
            types: types,
          })
        } catch (e) {}
        await sendResult("showOpenFilePickerResult", openhandle)
        break
      case "showSaveFilePicker":
        let savehandle = -1
        try {
          savehandle = await window.showSaveFilePicker()
        } catch (e) {}
        await sendResult("showSaveFilePickerResult", savehandle)
        break
      case "showDirectoryPicker":
        let dirhandle = -1
        try {
          dirhandle = await window.showDirectoryPicker({
            mode: "readwrite",
          })
        } catch (e) {
          console.error("Failed to open the FilePicker", e)
        }
        await sendResult("showDirectoryPickerResult", dirhandle)
        break
      case "progressbar":
        setProgress(data.total, data.step, data.max_step, data.txt)
        break
      case "multiple-dialog":
        data["components"] = JSON.parse(data["components"])
        addMessageEntry(data.type, id, data)
        break
      case "clear":
        currentState.messages.length = data["length"]
        break
      case "system-message":
        const messageStore = useMessageStore()
        messageStore.addMessage(data["_type"], data["title"], data["text"])
        break
      case "envlock":
        // Kaltstart hat die Umgebung aufgelöst — Lockfile für weitere Worker
        // sichern. Fehlschläge sind unkritisch, dann bleibt es beim Kaltstart.
        await writeEnvCache(cacheVersion(), data["lock"], data["installed"])
        break
      default:
        if (["select", "input", "diffcmp", "table", "stdout", "stderr", "raw_html"].includes(data.type)) {
          addMessageEntry(data.type, id, data)
          break
        } else {
          throw new Error(`Unknown event type ${data.type}`)
        }
    }
  }

  async function sendResult(type, data) {
    let messageId = "_sendDialogSignal"

    let message = {}
    //Dialogs needs type
    if (messageId === "_sendDialogSignal") {
      message = {
        type: type,
        data: data,
      }
    }
    return new Promise((resolve) => {
      state.workerObject.worker.postMessage({
        id: messageId,
        ...message,
      })
      resolve()
    })
  }

  function fetchScriptorVersions() {
    async function get() {
      try {
        const response = await fetch(`https://pypi.org/pypi/viur-scriptor-api/json`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const versions = Object.keys(data.releases)
        versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
        return versions.filter((x) => x.startsWith("1."))
      } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error)
        return []
      }
    }

    return get()
  }

  return {
    state,
    progress,
    execute,
    exitScript,
    sendResult,
    createNewInstance,
    fetchScriptorVersions,
    preload,
  }
})
