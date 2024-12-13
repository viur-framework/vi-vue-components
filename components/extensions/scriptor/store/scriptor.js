// @ts-nocheck
import { reactive, ref, computed, unref } from "vue"
import { defineStore } from "pinia"
import { computedAsync, useWebWorker, useBrowserLocation, unrefElement } from "@vueuse/core"

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
    instances: reactive({})
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
      state.instances[instanceId] = reactive({ ...instanceTemplate })
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
      const { id, ...data } = event.data
      handleWebWorkerMessages(id, data)
    }
    nativWorker.onmessageerror = async (error) => {
      console.log(error)
    }
  }

  async function load(pyoPackages = [], packages = [], initCode = "") {

    packages.unshift("viur-scriptor-api")

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

  async function execute(code, id = null, context = {}) {
    let currentId = createNewInstance(id) // create needed Instance Object
    state.currentInstance = currentId
    let currentState = state.instances[currentId]
    currentState.messages = []
    currentState.internalMessages = []

    if (!state.isReady) {
      createWebWorker()
      await load()
    }
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
      callback({ results: data.res, error: null })
      state.runningActions.delete(id)
    }
  }

  function addMessageEntry(type, id, data) {
    let currentState = state.instances[id]
    data["unique_id"] = new Date().getTime().toString()
    currentState.messages.push({ type: type, data: data })
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
            mode: "readwrite"
          })
        } catch (e) {}
        await sendResult("showDirectoryPickerResult", dirhandle)
        break
      case "progressbar":
        setProgress(data.total, data.step, data.max_step, data.txt)
        break
      case "multiple-dialog":
        data["components"] = JSON.parse(data["components"])
        addMessageEntry(data.type, id, data)
        break
      default:
        if (["select", "input", "diffcmp", "table", "stdout", "stderr"].includes(data.type)) {
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

  return {
    state,
    progress,
    execute,
    sendResult,
    createNewInstance
  }
})
