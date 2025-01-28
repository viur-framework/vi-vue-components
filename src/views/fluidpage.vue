<template>
  <fluidpage-handler
    :module="module.replace('.', '/')"
    :group="group"
    :view="state.view"
  >
  </fluidpage-handler>
</template>

<script setup>
import { reactive, defineComponent, computed } from "vue"
import { onBeforeRouteUpdate, useRoute } from "vue-router"
import FluidpageHandler from "../handler/FluidpageHandler.vue"
import { useUserStore } from "@viur/vue-utils/login/stores/user"

  const props = defineProps({
    module: {
      type: String,
      required: true
    },
    group: String,
    parentmodule:String
  })

    const route = useRoute()
    const userStore = useUserStore()

    const state = reactive({
      view: computed(() => {
        if (Object.keys(route.query).includes("view")) {
          return route.query["view"]
        }
        return null
      })
    })

    onBeforeRouteUpdate(async (to, from) => {
      userStore.updateUser()
    })

</script>

<style scoped></style>
