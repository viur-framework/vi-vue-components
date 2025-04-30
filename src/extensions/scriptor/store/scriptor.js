// @ts-nocheck
import {computed, reactive} from "vue"
import {defineStore} from "pinia"
import {useBrowserLocation, useWebWorker, useUrlSearchParams} from "@vueuse/core"
import {useContextStore} from "../../../stores/context";

export const useScriptorStore = defineStore("scriptorStore", () => {
  const instanceTemplate = {
    scriptKey: null,
    scriptCode: "#### scriptor ####\nfrom viur.scriptor import *\n\nasync def main():\n    logger.info('Hello World')",
    messages: [],
    internalMessages: [],
    hideInternalMessages: false
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
    scriptorVersion: "latest"
  })

  const progress = reactive({
    total: 100,
    step: -1,
    max_step: -1,
    txt: ""
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
      state.instances[instanceId] = reactive({...instanceTemplate})
    }

    return instanceId
  }

  function createWebWorker() {
    if (state.workerObject) {
      state.workerObject.terminate()
    }

    let path = `${useBrowserLocation().value.pathname.replace("/main.html", "")}/scriptor/public/webworker.js`;
    if (import.meta.env.DEV) {
      path = import.meta.url
      path = path.substring(0, path.lastIndexOf('/')) + "/../public/webworker.js";
    }
    state.workerObject = useWebWorker(path)

    const nativWorker = state.workerObject.worker
    nativWorker.onmessage = async (event) => {
      const {id, ...data} = event.data
      handleWebWorkerMessages(id, data)
    }
    nativWorker.onmessageerror = async (error) => {
      console.log(error)
    }
  }

  async function load(pyoPackages = [], packages = [], initCode = "") {
    if (import.meta.env.DEV && import.meta.env.VITE_SCRIPTOR_URL) {
      packages.unshift(import.meta.env.VITE_SCRIPTOR_URL)
    } else {
      if (state.scriptorVersion==="latest"){
        packages.unshift("viur-scriptor-api")
      }else{
        packages.unshift(`viur-scriptor-api${state.scriptorVersion}`)
      }
    }


    initCode = `with open("config.py", "w") as f:\n\tf.write("BASE_URL='${state.apiUrl}'")` + initCode

    if (state.workerObject) {
      return new Promise((resolve) => {
        state.runningActions.set("_pyinstaller", resolve)

        state.workerObject.post({
          id: "_pyinstaller",
          python: "",
          pyoPackages: pyoPackages,
          packages: packages,
          initCode: initCode,
          transformCode: "" //usage?
        })
      })
    }
  }

  async function setParams(scriptParams={}) {
    const contextStore = useContextStore();
    //Use window object, because useRoute not work outside module.
    const tabId = (window.location.hash || '').replace(/^#/, '').split("_")[1].replace("=","")
    let selectedEntries = contextStore.getLocalContext(tabId,true)["_selectedEntries"];
    if (!selectedEntries && !scriptParams)
    {
      return
    }
    if (!scriptParams) {
      scriptParams = {}
    }
    if (!selectedEntries) {
      selectedEntries = {}
    }
    else {
      selectedEntries = {"__selected_entries":selectedEntries}
    }
    const params = Object.assign(selectedEntries, scriptParams)

    if (state.workerObject) {
      return new Promise((resolve) => {
        state.runningActions.set("setParams", resolve)
        state.workerObject.post({
          id: "setParams",
          python: "",
          params: JSON.parse(JSON.stringify(params))
        })
      })
    }
  }


  async function exitScript()
  {
    console.log("exit programm")
    sendResult("exit","__exit__")
  }


  async function execute(code, id = null, context = {},scriptParams={}) {
    let currentId = createNewInstance(id) // create needed Instance Object
    state.currentInstance = currentId
    let currentState = state.instances[currentId]
    currentState.messages = []
    currentState.internalMessages = []

    if (!state.isReady && !state.isLoading) {
      state.isLoading = true;
      createWebWorker()
      await load()
      state.isLoading = false;
    }
    if (code === undefined) {
      console.log("Nothing to execute")
      code = ""
    }
    await setParams(scriptParams);
    code = `${code}\nimport viur.scriptor\nimport traceback\nawait viur.scriptor._init_modules()\nfrom viur.scriptor import *\n\ntry:\n    await main()\nexcept:\n    logger.error(traceback.format_exc())\n`

    return new Promise((resolve) => {
      state.runningActions.set(currentId, resolve)

      state.workerObject.post({
        id: currentId,
        python: code,
        ...context
      })
    })
  }


  function handleCallback(id, data) {
    let callback = state.runningActions.get(id)
    if (callback) {
      callback({results: data.res, error: null})
      state.runningActions.delete(id)
    }
  }
  function preload()
  {
    //start empty script for preloading all libraries
    execute()
  }

  function addMessageEntry(type, id, data) {
    let currentState = state.instances[id]
    data["unique_id"] = new Date().getTime().toString()
    currentState.messages.push({type: type, data: data})
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
        try {
          openhandle = await window.showOpenFilePicker({
            multiple: false
          })
        } catch (e) {
        }
        await sendResult("showOpenFilePickerResult", openhandle)
        break
      case "showSaveFilePicker":
        let savehandle = -1
        try {
          savehandle = await window.showSaveFilePicker()
        } catch (e) {
        }
        await sendResult("showSaveFilePickerResult", savehandle)
        break
      case "showDirectoryPicker":
        let dirhandle = -1
        try {
          dirhandle = await window.showDirectoryPicker({
            mode: "readwrite"
          })
        } catch (e) {
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
        currentState.messages.length = data["length"];
        break
      default:
        if (["select", "input", "diffcmp", "table", "stdout", "stderr","raw_html"].includes(data.type)) {
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
        data: data
      }
    }
    return new Promise((resolve) => {
      state.workerObject.worker.postMessage({
        id: messageId,
        ...message
      })
      resolve()
    })
  }

  function fetchScriptorVersions(){
    async function get(){
      try {
          const response = await fetch(`https://pypi.org/pypi/viur-scriptor-api/json`);
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const versions = Object.keys(data.releases);
          versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
          return versions.filter(x=>x.startsWith("1."));
      } catch (error) {
          console.error("Fehler beim Abrufen der Daten:", error);
          return [];
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
    preload
  }
})
