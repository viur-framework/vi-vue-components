<template>
  <hierarchy-handler
    :module="module.replace('.', '/')"
  >
  </hierarchy-handler>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, computed } from "vue"
import HierarchyHandler from "../handler/HierarchyHandler.vue"
import { onBeforeRouteUpdate, useRoute } from "vue-router"
import { useUserStore } from "@viur/vue-utils/login/stores/user"

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    }
  },
  components: { HierarchyHandler },
  setup(props, context) {
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
      userstore.updateUser()
    })

    return { state }
  }
})
</script>

<style scoped></style>
