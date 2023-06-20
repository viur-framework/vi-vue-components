// @ts-nocheck
import {reactive, unref} from "vue";
import {defineStore} from "pinia";


export const useContextStore = defineStore("contextStore", () => {
  const state = reactive({
    globalContext:{},
    localContext:{},
  })

  function setContext(key,value, handlerId=null){
    if (handlerId){
      if(Object.keys(state.localContext).includes(handlerId)){
        state.localContext[handlerId][key] = value
      }else{
        state.localContext[handlerId] = {key:value}
      }

    }else{
      state.globalContext[key] = value
    }
  }

  function getContext(handlerId){
    let context = {}
    if(Object.keys(state.localContext).includes(handlerId)){
      context = unref(state.localContext[handlerId])
    }
    context = {...state.globalContext, ...context}

    return context
  }


  return {
    state,
    getContext,
    setContext
  }
})
