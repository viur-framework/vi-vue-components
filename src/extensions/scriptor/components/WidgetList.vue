<template>
  <div
    class="wrapper-widget"
    ref="wrapper"
  >
    <template v-if="state.scriptor?.hideInternalMessages && ['all', 'internal'].includes(type)">
      <component
        :is="getWidget(entry['type'])"
        v-for="entry in state.scriptor?.internalMessages?.slice(-100)"
        :key="entry.data['unique_id']"
        :entry="entry"
      >
      </component>
    </template>
    <template v-if="['all', 'script'].includes(type)">
      <component
        :is="getWidget(entry['type'])"
        v-for="entry in state.scriptor?.messages?.slice(-100)"
        :key="entry.data['unique_id']"
        :entry="entry"
      >
      </component>
    </template>
    <div
      v-if="state.isEmpty"
      class="wrapper-empty"
    >
      {{ $t('scriptor.no_messages') }}
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch } from "vue"
import { useScriptorStore } from "../store/scriptor"
import { computedAsync } from "@vueuse/core"
import widgets from "./widgets/index"

const scriptorStore = useScriptorStore()
const wrapper = ref(null)

const props = defineProps({
  type: {
    default: "all",
    validator(value, props) {
      return ["script", "internal", "all"].includes(value)
    }
  },
  id: {
    required: true
  }
})

const state = reactive({
  scriptor: computed(() => {
    return scriptorStore.state.instances[props.id]
  }),
  isEmpty: computed(() => !(state.scriptor?.messages.length && state.scriptor?.internalMessages))
})

function getWidget(type) {
  if (["install", "err", "stdout", "stderr", "log", "info", "error", "debug", "warning"].includes(type)) {
    return widgets.logEntry
  } else if (["alert"].includes(type)) {
    return widgets.alertEntry
  } else if (["select"].includes(type)) {
    return widgets.selectEntry
  } else if (["input"].includes(type)) {
    return widgets.textInput
  } else if (["diffcmp"].includes(type)) {
    return widgets.diffCompare
  } else if (["table"].includes(type)) {
    return widgets.tableEntry
  } else if (["multiple-dialog"].includes(type)) {
    return widgets.multipleInputs
  }

  return widgets.debugEntry
}

</script>

<style scoped>
.wrapper-widget {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 10px;
}

.wrapper-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
