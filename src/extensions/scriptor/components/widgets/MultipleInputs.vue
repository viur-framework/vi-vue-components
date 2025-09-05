<template>
  <sl-alert variant="neutral" open>
    <div class="alert-array-wrap" v-if="Array.isArray(entry.data.components)">
      <div class="alert-data-wrap" v-for="_entry in entry.data.components">
        <component
          :is="getWidget(_entry['type'])"
          ref="elements"
          :entry="{ data: _entry }"
          :in-multiple="true"
        ></component>
      </div>
    </div>
    <template v-else>
      <div class="alert-data-wrap" v-for="(_entry, key) in entry.data.components">
        <component
          :is="getWidget(_entry['type'])"
          ref="elements"
          :entry="{ data: _entry }"
          :in-multiple="true"
          :data-key="key"
        ></component>
      </div>
    </template>

    <sl-button class="alert-footer-btn" :disabled="state.buttonDisabled || !state.sendable" @click="buttonCallback">
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

<style scoped>

.alert-data-wrap{
  & + .alert-data-wrap{
    margin-top: var(--sl-spacing-small);
  }
}

.alert-array-wrap{
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-small)
}

.alert-footer-btn{
  margin-top: var(--sl-spacing-medium);
}

</style>
