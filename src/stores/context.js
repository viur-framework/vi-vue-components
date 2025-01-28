import { reactive, unref, toRaw } from "vue"
import { defineStore } from "pinia"
import { useRoute } from "vue-router"

export const useContextStore = defineStore("contextStore", () => {
  const state = reactive({
    globalContext: {},
    localContext: {}
  })

  function setContext(key, value, handlerId = null) {
    if (handlerId) {

      if (Object.keys(state.localContext).includes(''+ handlerId)) {
        state.localContext[handlerId][key] = value
      } else {
        state.localContext[handlerId] = { [key]: value }
      }
    } else {
      state.globalContext[key] = value
    }
  }

  function copyLocalContext(oldHandlerId, newHandlerId) {
    let old = getLocalContext(oldHandlerId)
    state.localContext[newHandlerId] = structuredClone(old)
  }

  function getLocalContext(handlerId) {
    let context = {}
    if (Object.keys(state.localContext).includes(handlerId)) {
      context = toRaw(state.localContext[handlerId])
    }
    return context
  }

  function getCurrentContext() {
    let route = useRoute()
    let handlerId = route?.query?.["_"]
    return getContext(handlerId)
  }

  function getContext(handlerId) {
    return { ...unref(state.globalContext), ...getLocalContext(handlerId) }
  }

  return {
    state,
    getContext,
    setContext,
    getLocalContext,
    copyLocalContext,
    getCurrentContext
  }
})
