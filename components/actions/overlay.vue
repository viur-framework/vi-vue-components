<template>
  <sl-button
    :disabled="!state.active"
    size="small"
    :title="$t('actions.overlay')"
    @click="openDrawer"
  >
    <sl-icon
      slot="prefix"
      name="file-earmark-pdf"
    ></sl-icon>
    {{ $t("actions.overlay") }}
  </sl-button>
</template>

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"
import { useDBStore } from "../stores/db"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const dbStore = useDBStore()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      })
    })

    function openDrawer() {
      dbStore.state["skeldrawer.opened"] = !dbStore.state["skeldrawer.opened"]
    }

    return {
      state,
      handlerState,
      openDrawer
    }
  }
})
</script>

<style scoped></style>
