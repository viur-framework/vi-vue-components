<template>
  <div class="bar" style="z-index: 50">
    <!-- component-type customActions (e.g. for Singleton handlers) -->
    <template v-for="(action, name) in componentActions" :key="name">
      <component
        :is="dbStore.state['handlerbar.actions'][action.component]"
        v-if="dbStore.state['handlerbar.actions']?.[action.component]"
        :info="action"
      ></component>
    </template>

    <formutils></formutils>
    <deleteentry v-if="['edit'].includes(handlerState.action)"></deleteentry>
    <reloadentry></reloadentry>

    <template v-if="appStore.state.debug">
      <debugentry></debugentry>
    </template>
    <save
      v-if="['clone', 'add'].includes(handlerState.action)"
      :module="handlerState.module"
      name="actions.save_next"
    ></save>
    <save :module="handlerState.module"></save>
    <save name="actions.save_close" icon="check-all" :close="true" :module="handlerState.module"></save>
  </div>
</template>

<script setup>
import { computed, inject } from "vue"
import Save from "../actions/save.vue"
import Debugentry from "../actions/debugentry.vue"
import Reloadentry from "../actions/reloadentry.vue"
import Formutils from "../actions/formutils.vue"
import Deleteentry from "../actions/deleteentry.vue"
import { useAppStore } from "../stores/app"
import { useDBStore } from "../stores/db"

const appStore = useAppStore()
const dbStore = useDBStore()
const handlerState = inject("handlerState")

const componentActions = computed(() => {
  const conf = dbStore.getConf(handlerState.module, handlerState.view)
  const result = {}
  for (const [name, action] of Object.entries(conf?.customActions ?? {})) {
    const showInEntryBar = action?.["entryBar"] ?? action?.["entrybar"] ?? conf?.["handler"] === "singleton"
    if (action.action === "component" && action.component && showInEntryBar) {
      result[name] = action
    }
  }
  return result
})
</script>

<style scoped>
.bar {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-left: 10px;
  gap: 5px;
}
</style>
