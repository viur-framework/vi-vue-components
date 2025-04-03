import { reactive, unref, toRaw } from "vue"
import { defineStore } from "pinia"
import { useRoute } from "vue-router"

export const useContextStore = defineStore("contextStore", () => {
  const state = reactive({
    globalContext: {},
    localContext: {},
    localPrivateContext:{} // keys that start with _ are private, private contexts are not cloned!
  })

  function setContext(key, value, handlerId = null) {
    if (handlerId) {
      if (key.startsWith("_")) {
        if (Object.keys(state.localPrivateContext).includes('' + handlerId)) {
          state.localPrivateContext[handlerId][key] = value
        } else {
          state.localPrivateContext[handlerId] = {[key]: value}
        }
      } else {
        if (Object.keys(state.localContext).includes('' + handlerId)) {
          state.localContext[handlerId][key] = value
        } else {
          state.localContext[handlerId] = {[key]: value}
        }
      }
    } else {
      state.globalContext[key] = value
    }
  }

  function copyLocalContext(oldHandlerId, newHandlerId) {
    let old = getLocalContext(oldHandlerId)
    state.localContext[newHandlerId] = structuredClone(old)
  }

  function getLocalContext(handlerId, includePrivate=false) {
    let context = {}
    if (Object.keys(state.localContext).includes(handlerId)) {
      context = toRaw(state.localContext[handlerId])
      if (includePrivate && Object.keys(state.localPrivateContext).includes(handlerId)){
        context = {...context, ... toRaw(state.localPrivateContext[handlerId])}
      }
    }
    return context
  }

  function getCurrentContext(includePrivate=false) {
    let route = useRoute()
    let handlerId = route?.query?.["_"]
    return getContext(handlerId,includePrivate)
  }

  function getContext(handlerId, includePrivate=false) {
    return { ...unref(state.globalContext), ...getLocalContext(handlerId, includePrivate) }
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
