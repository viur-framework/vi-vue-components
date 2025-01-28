<template>
  <form-handler
    :module="module.replace('.', '/')"
    :group="!['node', 'leaf'].includes(skeltype) ? skeltype : ''"
    :action="'edit'"
    :skelkey="skelkey"
    :skeltype="['node', 'leaf'].includes(skeltype) ? skeltype : ''"
  >
  </form-handler>
</template>

<script setup>
import { reactive, defineComponent, onDeactivated, watch, getCurrentInstance } from "vue"
import FormHandler from "../handler/FormHandler.vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import utils from "../utils"

  const props = defineProps({
    module: {
      type: String,
      required: true
    },
    group: String,
    skelkey: {
      type: String,
      default: ""
    },
    skeltype: String
  })

    const state = reactive({})
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

</script>

<style scoped></style>
