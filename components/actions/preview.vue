<template>
  <sl-button
    :disabled="!state.active"
    size="small"
    :title="$t('actions.preview')"
    @click="openPreview"
  >
    <sl-icon
      slot="prefix"
      name="eye"
    ></sl-icon>
  </sl-button>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useRoute } from "vue-router"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const dbStore = useDBStore()
    const route = useRoute()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      })
    })

    function openPreview() {
      let module = handlerState["module"]
      if (Object.keys(route.params).includes("parentmodule")) {
        module = route.params["parentmodule"]
      }

      let conf = dbStore.state["vi.modules"][module]
      if (Object.keys(conf).includes("previewurls")) {
        //previewurls will be removed on stable release
        for (const [k, v] of Object.entries(conf["previewurls"])) {
          for (let selection of handlerState.currentSelection) {
            window.open(import.meta.env.VITE_API_URL + v.replace("{{key}}", selection["key"]), "_blank").focus()
          }
        }
      }
      if (Object.keys(conf).includes("preview")) {
        for (const [k, v] of Object.entries(conf["preview"])) {
          for (let selection of handlerState.currentSelection) {
            window.open(import.meta.env.VITE_API_URL + v.replace("{{key}}", selection["key"]), "_blank").focus()
          }
        }
      }
    }

    return {
      state,
      openPreview
    }
  }
})
</script>

<style scoped></style>
