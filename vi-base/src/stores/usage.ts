import {reactive, computed, watch} from "vue";
import {defineStore} from "pinia";


export const useUsagestore = defineStore("usageStore", () => {
  const state = reactive({
    favorites:[],
    last:[]
  })

  function addToFavorites(route){
    state.favorites.unshift(route)
    if (state.favorites.length>4){
      state.favorites = state.favorites.splice(4)
    }
  }

  function addToLast(route){
    state.last.unshift(route)
     if (state.last.length>4){
      state.last.splice(4)
    }
  }


  return {
    state,
    addToFavorites,
    addToLast


  }
}, {
  "persist": true
})
