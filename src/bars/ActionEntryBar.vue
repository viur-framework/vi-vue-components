<template>
  <div class="bar" style="z-index: 50">
    <reloadentry></reloadentry>
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
