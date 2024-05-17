<template>
  <form-handler
    :module="module.replace('.', '/')"
    :view="state.view"
    :group="group ? group : !['node', 'leaf'].includes(skeltype) ? skeltype : ''"
    :action="route.meta['action']"
    :skelkey="skelkey"
    :skeltype="['node', 'leaf'].includes(skeltype) ? skeltype : ''"
  >
  </form-handler>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, onDeactivated, watch, getCurrentInstance, computed } from "vue"
import FormHandler from "../handler/FormHandler.vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import utils from "../utils"

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    group: String,
    skelkey: String,
    skeltype: String
  },
  components: { FormHandler },
  setup(props, context) {
    const state = reactive({
      view: computed(() => {
        if (Object.keys(route.query).includes("view")) {
          return route.query["view"]
        }
        return null
      })})
    const dbStore = useDBStore()
    const route = useRoute()

    watch(
      () => dbStore.state["vi.modules"],
      (newVal, oldVal) => {
        //wait till modules loaded
        if (
          !utils.objectEmpty(newVal) &&
          dbStore.state["handlers.opened"].filter((e) => e["url"] === route.fullPath).length <= 0
        ) {
          dbStore.addOpened(route.fullPath, props.module, route.query?.["view"])
        }
      }
    )

    return {
      state,
      route
    }
  }
})
</script>

<style scoped></style>
