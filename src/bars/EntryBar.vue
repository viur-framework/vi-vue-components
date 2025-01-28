<template>
  <div class="bar" style="z-index: 50">
    <reloadentry></reloadentry>

    <template v-if="appStore.state.debug">
      <debugentry></debugentry>
    </template>
    <save v-if="['clone', 'add'].includes(handlerState.action)" :module="handlerState.module"
      name="actions.save_next"></save>
    <save :module="handlerState.module" ></save>
    <save name="actions.save_close" icon="check-all" :close="true" :module="handlerState.module"></save>
  </div>
</template>

<script setup>

import { reactive, defineComponent, inject } from "vue"
import Save from "../actions/save.vue"
import Debugentry from "../actions/debugentry.vue"
import Reloadentry from "../actions/reloadentry.vue"
import { useAppStore } from "../stores/app"

    const appStore = useAppStore()
    const state = reactive({})
    const handlerState = inject("handlerState")

</script>

<style scoped>
.bar {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-left: 10px;
}

sl-button {
  margin-left: 5px;
}
</style>
