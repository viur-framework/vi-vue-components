<template>
  <sl-alert
    open
    :variant="state.variant"
  >
    <div v-html="state.message"></div>
  </sl-alert>
</template>

<script setup>
import { reactive, computed } from "vue"
const props = defineProps({
  entry: {
    type: Object
  }
})

const variant_lookup = {
  error: "danger",
  fatal: "danger",
  critical: "danger",
  warning: "warning",
  info: "info",
  debug: "info"
}

const state = reactive({
  message: computed(() => {
    if (props.entry["type"] === "install") {
      return props.entry["data"]["msg"]["msg"]
    } else {
      return props.entry["data"]["msg"]
    }
  }),
  variant: computed(() => {
    return variant_lookup[props.entry["type"]] ?? "default"
  })
})
</script>
