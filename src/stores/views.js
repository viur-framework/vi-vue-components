import { defineStore } from "pinia"
import { computed, h, reactive, toRaw } from "vue"
import { useRoute, useRouter } from "vue-router"

export const useViewStore = defineStore("viewStore", () => {
  const route = useRoute()
  const state = reactive({
    cacheList: {},
    cacheListNames: computed(() => Object.keys(state.cacheList))
  })

  function getView(component) {
    if (Object.keys(state.cacheList).includes(route.fullPath)) {
      return toRaw(state.cacheList[route.fullPath])
    } else {
      let wrapped = {
        name: route.fullPath,
        render() {
          return component
        }
      }
      state.cacheList[route.fullPath] = wrapped
      return wrapped
    }
  }

  function wrap(component) {
    return h(getView(component), null)
  }

  function destroy(route) {
    delete state.cacheList[route]
  }

  return {
    state,
    wrap,
    destroy
  }
})
