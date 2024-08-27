// @ts-nocheck
import { reactive, ref, computed, unref } from "vue"
import { defineStore } from "pinia"
import { computedAsync, useWebWorker, useBrowserLocation, unrefElement } from '@vueuse/core'

export const useScriptorStore = defineStore("scriptorStore", () => {

const scriptor_api = new URL(useBrowserLocation().value.pathname+"/scriptor/public/viur_scriptor_api-0.0.3-py3-none-any.whl",
                             useBrowserLocation().value.origin).href

  const instanceTemplate = {
    scriptKey:null,
    scriptCode:"#### scriptor ####\n\nasync def main():\n    logger.info('Hello World')",
    messages:[],
    internalMessages:[],
    hideInternalMessages:false,
  }


  const state = reactive({
    workerObject:null,
    pyoPackages:[],
    packages:[],
    initCode:"",
    runningActions: new Map(),
    isReady:false, //scriptor webworker ready
    isRunning:computed(()=>{ // user script is running
      return state.runningActions.size > 0
    }),
    apiUrl: computed(()=>{
      //api Server could be a different server
      if (import.meta.env.VITE_API_URL){
        return import.meta.env.VITE_API_URL
      }
      return useBrowserLocation().value.origin
    }),
    currentInstance:null,
    instances:reactive({

    })
  })

  function createNewInstance(id=null){
    const instanceId = id || new Date().getTime().toString()
    if (!Object.keys(state.instances).includes(instanceId)){
      state.instances[instanceId] = reactive({...instanceTemplate})
    }

    return instanceId
  }

  function createWebWorker(){
    if (state.workerObject){
      state.workerObject.terminate()
    }
    state.workerObject = useWebWorker("./s/scriptor/public/webworker.js")
    const nativWorker = state.workerObject.worker
    nativWorker.onmessage = async (event)=>{
      const { id, ...data } = event.data
      console.log(event)
      handleWebWorkerMessages(id,data)
    }
    nativWorker.onmessageerror = async (error)=>{
      console.log(error)
    }
  }

  async function load(pyoPackages = [], packages = [], initCode = "") {
    pyoPackages.unshift(scriptor_api) //inject viur_scriptor package
    packages.unshift("requests","chardet","python-magic","openpyxl") // inject scriptor dependencies

    initCode = `with open("config.py", "w") as f:\n\tf.write("BASE_URL='${state.apiUrl}'")`+initCode

    if(state.workerObject){
      return new Promise((resolve)=>{
        state.runningActions.set("_pyinstaller", resolve)

        state.workerObject.post({
          id:"_pyinstaller",
          python:"",
          pyoPackages: pyoPackages,
          packages: packages,
          initCode: initCode,
          transformCode:"" //usage?
        })
      })
    }
  }

  async function execute(code, id=null, context={}){
    let currentId = createNewInstance(id) // create needed Instance Object
    state.currentInstance=currentId
    let currentState = state.instances[currentId]
    currentState.messages = []
    currentState.internalMessages = []


    if (!state.isReady){
      createWebWorker()
      await load()
    }


    code+="\nimport traceback\nimport viur.scriptor\nawait viur.scriptor._init_modules()\nfrom viur.scriptor import *\n \ntry:\n    await main()\nexcept:\n    logger.error(traceback.format_exc())\n"

    return new Promise((resolve)=>{
      state.runningActions.set(currentId, resolve)

      state.workerObject.post({
        id: currentId,
        python: code,
        ...context,
      });
    })
  }

  function handleCallback(id,data){
    let callback = state.runningActions.get(id)
    if (callback){
      callback({ results: data.res, error: null })
      state.runningActions.delete(id)
    }


  }

  function addMessageEntry(type,id, data){
    console.log(data)
    console.log(id)
    let currentState = state.instances[id]
    data["unique_id"] = new Date().getTime().toString()
    currentState.messages.push({type:type, data:data})
  }

  function addInternalMessageEntry(type,id,data){
    console.log(data)
    let currentState = state.instances[id]
    data["unique_id"] = new Date().getTime().toString()
    //currentState.internalMessages.push({type:type, data:data})
  }

  function normalizeText(text){
    text.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;")
                  .replace(/\ /g, " ")
                  .replace(/\n/g, "<br />")
    return text
  }

  async function handleWebWorkerMessages(id, data){
    if (!id){
      id = state.currentInstance
    }
    let currentState = state.instances[id]
    switch (data.type) {
      case "installlog":
        //installer status
        addInternalMessageEntry('install',id,data)
        if (data["msg"]["stage"]===5){
          state.isReady=true
        }else{
          state.isReady=false
        }
        break
      case "run_end":  {
        //script ended
        handleCallback(id,data)
        break
      }
      case "end":
        //action ended
        handleCallback(id, data)
        break

      case "err":
        //script error
        addMessageEntry("exception",data)
        handleCallback(id, data)
        break
      case "stdout":
        //normal
        addMessageEntry("default",data)
        break
      case "stderr":
        //error
        addMessageEntry("error",data)
        break
      case "log":
        data.msg = normalizeText(data.text)
        addMessageEntry(data.level,id,data)
        break
      case "alert":
        data.msg = normalizeText(data.text)
        addMessageEntry(data.type,id,data)
        break
      case "select":
        addMessageEntry(data.type,id,data)
        break
      default:
        throw new Error(`Unknown event type ${data.type}`)
    }

    /*
    switch (data.type) {

      case "progressbar":
        progressBar.set({
          total: data.total,
          step: data.step,
          maxStep: data.max_step,
          txt: data.txt
        });
        break;

	   case "download":
		   var url = window.URL.createObjectURL(data["blob"]);
		   var downloadLink = document.createElement("a");
		   downloadLink.href = url;
		   downloadLink.download = data["filename"];
		   document.body.appendChild(downloadLink);
		   downloadLink.click();
		   document.body.removeChild(downloadLink);
		break;
		case "log":
			pyLogging.get().push({
        text: data.text.replace(/&/g, "&amp;")
                       .replace(/</g, "&lt;")
                       .replace(/>/g, "&gt;")
                       .replace(/"/g, "&quot;")
                       .replace(/'/g, "&#039;")
                       .replace(/\ /g, " ")
                       .replace(/\n/g, "<br />"),
        level: data.level,
       done: false
      })
      pyLogging.notify();
		  break;

    case "alert":
			pyDialogs.get().push({
				type: "alert",
				text: data.text,
        image: data.image,
        done: false
			})
			pyDialogs.notify();
      break;

    case "confirm":
			pyDialogs.get().push({
				type: "confirm",
				title: data.title,
        text: data.text,
        cancel: data.cancel,
        image: data.image,
        done: false
			})
			pyDialogs.notify();
      break;

      case "diffcmp":
        pyDialogs.get().push({
          type: "diffcmp",
          title: data.title,
          changes: data.changes,
          image: data.image,

          done: false
        })
        pyDialogs.notify();
        break;

    case "input":
			pyDialogs.get().push({
				type: "input",
        done: false,
        ...data
			})
			pyDialogs.notify();
      break;


      case "select":
        pyDialogs.get().push({
          type: "select",
          done: false,
          ...data
        })
        pyDialogs.notify();
        break;

        case "table":
          pyDialogs.get().push({
            type: "table",
            done: false,
            ...data
          })
          pyDialogs.notify();
          break;



        case "showDirectoryPicker":
          {
            let handle = -1;
            try {
              handle = await window.showDirectoryPicker({
                mode: "readwrite"
            })
            }
            catch (e) {
            }

            post({
                id: "_setDirectoryHandle",
                handle
            });


            break;
          }

        case "showSaveFilePicker":
            let handle = -1;
            try {
              handle = await window.showSaveFilePicker()
            }
            catch (e) {
            }

            post({
                id: "_setFileHandle",
                handle: handle
            });


            break;

          case "showOpenFilePicker": {
            let handle = -1;
            try {
              handle = await window.showOpenFilePicker({
                multiple: false
              })
            }
            catch (e) {
            }

            post({
                id: "_setOpenFilePickerHandle",
                handle
            });


            break;
          }
      default:
        pyExecState.set(0);
        throw new Error(`Unknown event type ${data.type}`)
    }
        */
  }


  async function sendResult(type, data) {
    let messageId = "_sendDialogSignal"

    let message = {}

    //Dialogs needs type
    if (messageId === "_sendDialogSignal"){
      message = {
        type: type,
        data: data
      }
    }
    return new Promise((resolve) => {
			state.workerObject.worker.postMessage({
				id: messageId,
				...message
			});
      resolve()
		});
	}


  return {
    state,
    execute,
    sendResult,
    createNewInstance
  }
})
