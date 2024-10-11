// @ts-nocheck
import { reactive } from 'vue'
import { defineStore } from "pinia";
import { useRouter} from "vue-router";

export const useExtensionsStore = defineStore("extensionsStore", () => {
  const router = useRouter()

  const state = reactive({
    extensions: {"debug":{
        name:"debug",
        routes:[],
        init:()=>console.log("debug"),
        subhandlers:{
            "list":{
                name:"Debug",
                icon:"bug-fill",
                route:null
            }
        }
    }}
  })

  function addExtension(extension) {
    state.extensions[extension.name] = extension
  }

  function removeExtension(extensionIdentifier) {
    delete state.extensions[extensionIdentifier]
  }

  function initExtensions() {
    //register routes
    //register topbar actions
    //register subhandlers


    // add routes
    for( const [name, extension] of Object.entries(state.extensions)){
      if (extension?.["routes"]){
        for (const route of extension.routes){
          router.addRoute(route)
        }
      }
    }


  }

  return {
    state,
    addExtension,
    removeExtension,
    initExtensions
  }
})
