<template>
  <list-handler
    :module="module.replace('.', '/')"
    :group="group"
    :view="state.view"
  >
  </list-handler>
</template>

<script setup>
import { reactive, defineComponent, computed } from "vue"
import { useRoute, onBeforeRouteUpdate } from "vue-router"
import ListHandler from "../handler/ListHandler.vue"
import { useUserStore } from "@viur/vue-utils/login/stores/user"

  const props = defineProps({
    module: {
      type: String,
      required: true
    },
    group: String
  })

    const route = useRoute()
    const userstore = useUserStore()

    const state = reactive({
      view: computed(() => {
        if (Object.keys(route.query).includes("view")) {
          return route.query["view"]
        }
        return null
      })
    })

    onBeforeRouteUpdate(async (to, from) => {
      userstore.updateUser()
    })

</script>

<style scoped></style>
