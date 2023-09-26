// @ts-nocheck
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
      let skelkey = handler?.["to"]?.["params"]?.["skelkey"]
      let exists = state.lastEntries.filter((x) => x?.["to"]?.["params"]?.["skelkey"] === skelkey)
      if (exists.length === 0) {
        state.lastEntries.push(handler)
      }
    }

    function removeAllEntries() {
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
