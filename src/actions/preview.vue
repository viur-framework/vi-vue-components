<template>
  <sl-button v-if="typeof state.conf?.['preview'] === 'string'" :disabled="!state.active" size="small"
    :title="$t('actions.preview')" @click="openPreview">
    <sl-icon slot="prefix" name="eye"></sl-icon>
  </sl-button>

  <sl-select v-else-if="state.conf?.['preview']" placeholder="Vorschau" size="small" @sl-change="openPreview" :disabled="!state.active">
    <sl-option v-for="(k, v) in state.conf?.['preview']" :value="k">{{ v }}</sl-option>
  </sl-select>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useContextStore} from "../stores/context";
import { useRoute } from "vue-router"

    const handlerState = inject("handlerState")
    const dbStore = useDBStore()
    const contextStore = useContextStore()
    const route = useRoute()
    const state = reactive({
      active: computed(() => {
        if (Object.keys(route.params).includes("parentmodule")) {
          return true
        }
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      conf: computed(() => {
        let module = handlerState["module"]
        return dbStore.state["vi.modules"][module]
      })
    })

    function buildUrl(url, selection) {
      url = url.replace("{{module}}", handlerState.module)

      if (selection) {
        for (const [k, v] of Object.entries(selection)) {
          url = url.replace(`{{${k}}}`, v)
        }
      }
      let handlerId = route?.query?.["_"]
      let context = contextStore.getContext(handlerId)

      for (const [k, v] of Object.entries(context)) {
        url = url.replace(`{{@${k}}}`, v)
      }
      return url
    }

    function openPreview(e) {
      let url = state.conf["preview"]
      if (e["type"] === "sl-change") {
        url = e.target.value
      }
      let items = handlerState.currentSelection
      if (!items){
        items = [null]
      }
      for (let selection of items) {
        window.open(import.meta.env.VITE_API_URL + buildUrl(url, selection), "_blank").focus()
      }
      e.target.value = ""
    }
</script>

<style scoped></style>
