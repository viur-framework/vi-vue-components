import { reactive, unref } from "vue"
import { defineStore } from "pinia"
import { useRoute } from "vue-router"

export const useLocalStore = defineStore(
  "localStore",
  () => {
    const state = reactive({
      listamount: "30",
      lastEntries: []
    })
    function addEntries(handler) {
      let exists = state.lastEntries.filter( x => x['key']===handler['key'])
      if (exists.length === 0) {
        state.lastEntries.unshift(handler)
        if (state.lastEntries.length > 12) {
          state.lastEntries = state.lastEntries.slice(0, 12)
        }
      }
    }

    function removeAllEntries(){
      state.lastEntries = []
    }

    return {
      state,
      addEntries,
      removeAllEntries
    }
  },
  { persist: true }
)
