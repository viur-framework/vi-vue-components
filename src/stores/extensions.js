import { reactive } from 'vue'
import { defineStore } from "pinia";
import { useRouter} from "vue-router";

export const useExtensionsStore = defineStore("extensionsStore", () => {
  const router = useRouter()

  const state = reactive({
    extensions: {},
    activeExtensions: ["debug", "scriptor"]
  })

  function addExtension(extension) {
    state.extensions[extension.name] = extension
  }

  function removeExtension(extensionIdentifier) {
    delete state.extensions[extensionIdentifier]
  }

  function initExtensions() {
    loadExtensions()

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

  function loadExtensions() {
    const extensions = import.meta.glob("../extensions/**/extension.js", { eager: true })

    for (const [path, extension] of Object.entries(extensions)){
      let ext = extension.default()
      state.extensions[ext['name']] = ext

    }
  }



  return {
    state,
    addExtension,
    removeExtension,
    initExtensions
  }
})
