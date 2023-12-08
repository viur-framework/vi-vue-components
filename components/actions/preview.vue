<template>
  <sl-button
    v-if="(typeof state.conf?.['preview']) === 'string'"
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

  <sl-select v-else placeholder="Vorschau" @sl-change="openPreview">
    <sl-option v-for="(k,v) in state.conf?.['preview']" :value="k">{{v}}</sl-option>
  </sl-select>
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
      }),
      conf: computed(()=>{
        let module = handlerState["module"]
          if (Object.keys(route.params).includes("parentmodule")) {
          module = route.params["parentmodule"]
        }
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

      return url
    }

    function openPreview(e) {
      let url = state.conf["preview"]
      if (e['type']==="sl-change"){
        url = e.target.value
      }

      for (let selection of handlerState.currentSelection) {
        window.open(import.meta.env.VITE_API_URL + buildUrl(url, selection), "_blank").focus()
      }
      e.target.value = ""

    }

    return {
      state,
      openPreview
    }
  }
})
</script>

<style scoped></style>
