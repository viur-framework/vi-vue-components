import { reactive } from "vue"
import { defineStore } from "pinia"
import { ListRequest, Request } from "@viur/vue-utils"

export const useModulesStore = defineStore("modulesStore", () => {
  const state = reactive({
    modules: {},
    loaded: false
  })

  function setmodules() {
    Request.get(`/vi/_moduleconf?limit=99`).then(async (resp) => {
      let data = await resp.json()
      for (const skel of data["skellist"]) {
        state.modules[skel["name"]] = skel
      }
      state.loaded = true
    })
  }

  return { state, setmodules }
})
