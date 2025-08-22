<template>
  <sl-alert variant="neutral" open>
    <div v-if="Array.isArray(entry.data.components)">
      <div v-for="_entry in entry.data.components">
        <component
          :is="getWidget(_entry['type'])"
          ref="elements"
          :entry="{ data: _entry }"
          :in-multiple="true"
        ></component>
      </div>
    </div>
    <div v-else>
      <div v-for="(_entry, key) in entry.data.components">
        <component
          :is="getWidget(_entry['type'])"
          ref="elements"
          :entry="{ data: _entry }"
          :in-multiple="true"
          :data-key="key"
        ></component>
      </div>
    </div>

    <sl-button :disabled="state.buttonDisabled || !state.sendable" @click="buttonCallback">
      {{ entry.data.buttonText || "Send" }}
    </sl-button>
  </sl-alert>
</template>

<script setup>
import { computed, reactive, ref } from "vue"
import { useScriptorStore } from "../../store/scriptor"
import widgets from "./index"

const elements = ref([])
const scriptorStore = useScriptorStore()

const props = defineProps({
  entry: {
    type: Object,
  },
})

const state = reactive({
  buttonDisabled: false,
  sendable: computed(() => {
    for (const element of elements.value) {
      if (element.state && element.state.sendable !== undefined) {
        if (!element.state.sendable) {
          return false
        }
      }
    }
    return true
  }),
})

async function buttonCallback() {
  if (Array.isArray(props.entry.data.components)) {
    const result = []
    for (const element of elements.value) {
      if (element.state && element.state.value !== undefined) {
        result.push(element.state.value)
      }
    }
    await scriptorStore.sendResult("textResult", JSON.stringify(result))
  } else if (typeof props.entry.data.components === "object") {
    const result = {}

    for (const element of elements.value) {
      if (element.state && element.state.value !== undefined) {
        result[element.props.dataKey] = element.state.value
      }
    }
    await scriptorStore.sendResult("textResult", JSON.stringify(result))
  }
}

//todo zusammen fassen
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
  } else if (["raw_html"].includes(type)) {
    return widgets.rawHtml
  }
  return widgets.debugEntry
}
</script>
