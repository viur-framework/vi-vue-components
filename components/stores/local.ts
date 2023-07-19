// @ts-nocheck
import {reactive, unref} from "vue";
import {defineStore} from "pinia";
import {useRoute} from "vue-router";


export const useLocalStore = defineStore("localStore", () => {
  const state = reactive({
    listamount:"30"
  })

  return {
    state,
  }
},
{persist: true})
