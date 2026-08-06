// @ts-nocheck
import { computed, reactive } from "vue"
import { defineStore } from "pinia"
import { useBrowserLocation, useUrlSearchParams } from "@vueuse/core"
import { useContextStore } from "../../../stores/context"
import { useMessageStore } from "../../../stores/message"
import { Request } from "@viur/vue-utils"
import { readEnvCache, writeEnvCache, dropEnvCache } from "./envCache"
import { createInstanceWorker, resolveWorkerPath } from "./workerBridge"

// Sitzungsweit geteilt: das importable-ZIP ist für alle Worker gleich.
const env = {
  importable: undefined,
  importableLoaded: false,
  loadingLock: null,
}

// Pyodide belegt pro Instanz grob 150–300 MB. Drei parallele Worker sind der
// Kompromiss zwischen Nutzen und Speicherverbrauch.
const MAX_WORKERS = 3
// So lange wartet ein zweiter Worker bei leerem Cache auf den Kaltstart des
// ersten, bevor er selbst auflöst.
const COLD_START_WAIT_MS = 30000

export const useScriptorStore = defineStore("scriptorStore", () => {
  const state = reactive({
    pyoPackages: [],
    packages: [],
    initCode: "",
    // TEMPORÄR bis Task 9: aggregierte Sicht für die noch nicht umgestellte UI.
    // Nicht in 3.0.0 ausliefern.
    isReady: computed(() => Object.values(state.instances).some((i) => i.envState === "ready")),
    isLoading: computed(() => Object.values(state.instances).some((i) => i.envState === "loading")),
    // isRunning schließt die Ladephase mit ein, weil die alte Semantik
    // (runningActions.size > 0) während der Installation ebenfalls true war.
    // Davon hängt ab, dass der Ausführen-Knopf während des Ladens deaktiviert
    // bleibt — sonst kann der Nutzer einen zweiten Ladevorgang auslösen.
    isRunning: computed(() =>
      Object.values(state.instances).some((i) => i.runState === "running" || i.envState === "loading")
    ),
    apiUrl: computed(() => {
      //api Server could be a different server
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
      }
      return useBrowserLocation().value.origin
    }),
    instances: reactive({}),
    scriptorVersion: "latest",
  })

  // TEMPORÄR bis Task 9.
  const progress = computed(() => {
    const running = Object.values(state.instances).find((i) => i.runState === "running")
    return running?.progress || { total: 100, step: -1, max_step: -1, txt: "" }
  })

  function setProgress(instanceId, total, step, max_step, txt) {
    const instance = state.instances[instanceId]
    if (!instance) {
      return
    }
    instance.progress.total = total
    instance.progress.step = step
    instance.progress.max_step = max_step
    instance.progress.txt = txt
  }

  const DEFAULT_SCRIPT_CODE =
    "#### scriptor ####\nfrom viur.scriptor import *\n\nasync def main():\n    logger.info('Hello World')"

  // Factory statt geteiltem Objektliteral: ein Spread von { messages: [] }
  // kopiert die Array-Referenz, wodurch bisher alle Instanzen dasselbe
  // messages-, messageBuffer- und internalMessages-Array benutzt haben.
  function newInstanceState() {
    return reactive({
      scriptKey: null,
      scriptCode: DEFAULT_SCRIPT_CODE,
      messages: [],
      messageBuffer: [],
      internalMessages: [],
      hideInternalMessages: false,
      worker: null,
      envState: "cold", // cold | loading | ready | failed
      runState: "idle", // idle | running | done | error
      progress: { total: 100, step: -1, max_step: -1, txt: "" },
      pendingActions: new Map(),
    })
  }

  function createNewInstance(id = null) {
    const instanceId = id || new Date().getTime().toString()
    if (!Object.keys(state.instances).includes(instanceId)) {
      state.instances[instanceId] = newInstanceState()
    }
    return instanceId
  }

  function attachWorker(instanceId) {
    const instance = state.instances[instanceId]
    if (!instance || instance.worker) {
      return instance?.worker || null
    }
    const workerObject = createInstanceWorker({
      path: resolveWorkerPath(useBrowserLocation().value.pathname),
      instanceId: instanceId,
      onMessage: handleMessage,
      onError: failInstance,
    })
    if (!workerObject) {
      // Worker nicht erzeugbar — Instanz bleibt kalt, der Aufrufer bricht ab.
      instance.envState = "failed"
      return null
    }
    instance.worker = workerObject
    startBufferFlusher()
    return instance.worker
  }

  function activeWorkerCount() {
    return Object.values(state.instances).filter((instance) => instance.worker).length
  }

  function acquireWorker(instanceId) {
    const instance = state.instances[instanceId]
    if (!instance) {
      return false
    }
    if (instance.worker) {
      return true
    }
    if (activeWorkerCount() >= MAX_WORKERS) {
      useMessageStore().addMessage(
        "error",
        "Zu viele Skripte",
        `Es können maximal ${MAX_WORKERS} Skripte gleichzeitig laufen. Bitte ein laufendes Skript-Fenster schließen.`
      )
      return false
    }
    if (!attachWorker(instanceId)) {
      // Ohne diese Meldung bleibt ein fehlgeschlagener Worker-Start für den
      // Nutzer unsichtbar: execute() gibt nur {error} zurück, und beide
      // Aufrufstellen in der UI verwerfen den Rückgabewert.
      useMessageStore().addMessage(
        "error",
        "Skriptor konnte nicht gestartet werden",
        "Der Web Worker ließ sich nicht erzeugen. Bitte die Seite neu laden."
      )
      return false
    }
    return true
  }

  function failInstance(instanceId, error) {
    console.error("Scriptor worker error", instanceId, error)
    const instance = state.instances[instanceId]
    if (!instance) {
      return
    }
    instance.envState = "failed"
    instance.runState = "error"
    addMessageEntry("error", instanceId, { msg: error?.message || String(error) })
    // Callbacks auflösen, damit niemand endlos auf den toten Worker wartet.
    for (const [actionId, callback] of instance.pendingActions.entries()) {
      callback({ results: null, error: "worker_error" })
      instance.pendingActions.delete(actionId)
    }
    instance.worker?.terminate()
    instance.worker = null
  }

  // Laufende Env-Ladevorgänge pro Instanz. Absichtlich außerhalb von
  // state.instances, damit Vue die Promise nicht in einen reactive-Proxy wickelt.
  const envLoads = new Map()

  // Ein Interval für alle Instanzen. Bisher startete jeder
  // createWebWorker()-Aufruf ein weiteres, das nie gestoppt wurde.
  let bufferFlusher = null

  function startBufferFlusher() {
    if (bufferFlusher !== null) {
      return
    }
    bufferFlusher = window.setInterval(() => {
      for (const instance of Object.values(state.instances)) {
        if (instance.messageBuffer.length) {
          instance.messages = instance.messages.concat([...instance.messageBuffer])
          instance.messageBuffer = []
        }
      }
    }, 50)
  }

  function stopBufferFlusherIfIdle() {
    if (bufferFlusher !== null && !Object.keys(state.instances).length) {
      window.clearInterval(bufferFlusher)
      bufferFlusher = null
    }
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

    let cached = await readEnvCache(version)

    // Startet der Nutzer bei leerem Cache sofort zwei Skripte, wartet der zweite
    // auf das Lockfile des ersten statt die Auflösung doppelt zu machen. Nach
    // COLD_START_WAIT_MS löst er selbst auf, damit ein hängender erster Worker
    // ihn nicht blockiert.
    if (!cached && env.loadingLock) {
      cached = await Promise.race([
        env.loadingLock,
        new Promise((resolve) => window.setTimeout(() => resolve(null), COLD_START_WAIT_MS)),
      ])
    }

    let releaseLock = null
    if (!cached) {
      env.loadingLock = new Promise((resolve) => {
        releaseLock = resolve
      })
    }

    let result = await postEnvInstall(instanceId, cached)

    if (result?.error && cached) {
      console.warn("Scriptor: warm start failed, falling back to cold start", result.error)
      await dropEnvCache(version)
      result = await postEnvInstall(instanceId, null)
    }

    if (releaseLock) {
      // Nachfolger bekommen den frisch geschriebenen Cache-Eintrag — oder null,
      // wenn der Kaltstart gescheitert ist.
      releaseLock(result?.error ? null : await readEnvCache(version))
      env.loadingLock = null
    }

    return !result?.error
  }

  async function setParams(instanceId, scriptParams = {}) {
    const instance = state.instances[instanceId]
    if (!instance?.worker) {
      return
    }
    const contextStore = useContextStore()
    const urlData = (window.location.hash || "").replace(/^#/, "").split("_")
    const tabId = urlData[urlData.length - 1].replace("=", "")
    let selectedEntries = contextStore.getLocalContext(tabId, true)["_selectedEntries"]
    if (!selectedEntries && !scriptParams) {
      return
    }
    if (!scriptParams) {
      scriptParams = {}
    }
    selectedEntries = selectedEntries ? { __selected_entries: selectedEntries } : {}
    const params = Object.assign(selectedEntries, scriptParams)
    params["__is_dev__"] = import.meta.env.DEV

    return new Promise((resolve) => {
      instance.pendingActions.set("setParams", resolve)
      instance.worker.post({
        id: "setParams",
        python: "",
        params: JSON.parse(JSON.stringify(params)),
      })
    })
  }

  async function sendResult(instanceId, type, data) {
    const instance = state.instances[instanceId]
    if (!instance?.worker) {
      return
    }
    // post() statt worker.postMessage(): useWebWorker's post() entpackt den
    // shallowRef selbst und prüft auf einen vorhandenen Worker. Der Bestandscode
    // griff über state.workerObject.worker.postMessage zu, was nur wegen der
    // Ref-Entpackung durch reactive() funktionierte.
    instance.worker.post({
      id: "_sendDialogSignal",
      type: type,
      data: data,
    })
  }

  // Bricht das laufende Skript ab, lässt den Worker aber stehen — das Fenster
  // bleibt benutzbar. Für "Fenster zu" ist destroyInstance() zuständig.
  async function exitScript(instanceId) {
    await sendResult(instanceId, "exit", "__exit__")
  }

  async function execute(code, id = null, context = {}, scriptParams = {}) {
    const currentId = createNewInstance(id)
    const instance = state.instances[currentId]
    instance.messages = []
    instance.messageBuffer = []
    instance.internalMessages = []

    if (instance.envState !== "ready") {
      // Zweiter Klick während des Ladens muss auf denselben Ladevorgang warten.
      // Ohne diesen Riegel überschreibt der zweite postEnvInstall-Aufruf den
      // "_pyinstaller"-Callback des ersten, und dessen execute()-Promise löst
      // nie auf. Der alte Code war über das globale isLoading-Flag geschützt.
      let envLoad = envLoads.get(currentId)
      if (!envLoad) {
        if (!acquireWorker(currentId)) {
          return { results: null, error: "worker_limit" }
        }
        instance.envState = "loading"
        envLoad = load(currentId).finally(() => envLoads.delete(currentId))
        envLoads.set(currentId, envLoad)
      }
      const ok = await envLoad
      if (!ok) {
        instance.envState = "failed"
        return { results: null, error: "env_failed" }
      }
      instance.envState = "ready"
    }

    if (code === undefined) {
      console.log("Nothing to execute")
      code = ""
    }
    await setParams(currentId, scriptParams)
    code = `${code}\nimport viur.scriptor\nimport traceback\nawait viur.scriptor._init_modules()\nfrom viur.scriptor import *\n\ntry:\n    await main()\nexcept:\n    logger.error(traceback.format_exc())\n`

    instance.runState = "running"
    return new Promise((resolve) => {
      instance.pendingActions.set(currentId, resolve)
      instance.worker.post({ id: currentId, python: code, ...context })
    })
  }

  function handleCallback(instanceId, messageId, data) {
    const instance = state.instances[instanceId]
    const callback = instance?.pendingActions.get(messageId)
    if (callback) {
      callback({ results: data.res ?? null, error: data.msg ?? null })
      instance.pendingActions.delete(messageId)
    }
  }

  function preload(instanceId = null) {
    return execute(undefined, instanceId)
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

  async function handleMessage(instanceId, messageId, data) {
    const instance = state.instances[instanceId]
    if (!instance) {
      return
    }

    switch (data.type) {
      case "installlog":
        addInternalMessageEntry("install", instanceId, data)
        instance.envState = data["msg"]["stage"] === 5 ? "ready" : "loading"
        break
      case "envlock":
        await writeEnvCache(cacheVersion(), data["lock"], data["installed"])
        break
      case "stdout":
        addInternalMessageEntry("install", instanceId, data)
        break
      // Nur der Skriptlauf selbst beendet den Lauf. Der Worker sendet "end"
      // auch für jedes Dialogsignal (webworker.js:325) und für jede
      // FS-Operation; würde das runState auf "done" setzen, gälte ein Skript
      // ab der ersten Dialogantwort als fertig. run_end wird an genau zwei
      // Stellen gesendet (webworker.js:191 für den Lauf, :224 für den
      // Installer), die Skript-Nachricht trägt die Instanz-ID als messageId.
      case "run_end":
        if (messageId === instanceId && instance.runState === "running") {
          instance.runState = "done"
        }
        handleCallback(instanceId, messageId, data)
        break
      case "end":
        handleCallback(instanceId, messageId, data)
        break
      case "err":
        addMessageEntry("error", instanceId, data)
        // Ein Installer-Fehler ist kein fehlgeschlagener Lauf — das trägt
        // envState. Sonst meldet die Instanz einen Fehler für ein Skript, das
        // nie gestartet ist.
        if (messageId === instanceId) {
          instance.runState = "error"
        }
        handleCallback(instanceId, messageId, data)
        break
      case "log":
        data.msg = normalizeText(data.text)
        addMessageEntry(data.level, instanceId, data)
        break
      case "alert":
        data.msg = normalizeText(data.text)
        addMessageEntry(data.type, instanceId, data)
        break
      case "download": {
        const a = document.createElement("a")
        a.href = window.URL.createObjectURL(data.blob)
        a.download = data.filename
        a.click()
        break
      }
      case "showOpenFilePicker": {
        let openhandle = -1
        const types = data.types || []
        try {
          openhandle = await window.showOpenFilePicker({ multiple: false, types: types })
        } catch (e) {}
        await sendResult(instanceId, "showOpenFilePickerResult", openhandle)
        break
      }
      case "showSaveFilePicker": {
        let savehandle = -1
        try {
          savehandle = await window.showSaveFilePicker()
        } catch (e) {}
        await sendResult(instanceId, "showSaveFilePickerResult", savehandle)
        break
      }
      case "showDirectoryPicker": {
        let dirhandle = -1
        try {
          dirhandle = await window.showDirectoryPicker({ mode: "readwrite" })
        } catch (e) {
          console.error("Failed to open the FilePicker", e)
        }
        await sendResult(instanceId, "showDirectoryPickerResult", dirhandle)
        break
      }
      case "progressbar":
        setProgress(instanceId, data.total, data.step, data.max_step, data.txt)
        break
      case "multiple-dialog":
        data["components"] = JSON.parse(data["components"])
        addMessageEntry(data.type, instanceId, data)
        break
      case "clear":
        instance.messages.length = data["length"]
        break
      case "system-message": {
        const messageStore = useMessageStore()
        messageStore.addMessage(data["_type"], data["title"], data["text"])
        break
      }
      default:
        if (["select", "input", "diffcmp", "table", "stdout", "stderr", "raw_html"].includes(data.type)) {
          addMessageEntry(data.type, instanceId, data)
          break
        } else {
          throw new Error(`Unknown event type ${data.type}`)
        }
    }
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
