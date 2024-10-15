<template>
  <sl-card class="interaction">
    <div slot="header">Alert</div>

    <p class="paragraph">
      {{ entry["data"]["text"] }}
    </p>

    <sl-button
      slot="footer"
      variant="success"
      size="small"
      :disabled="state.inputDisabled"
      @click="pressedOk"
      >OK</sl-button
    >
  </sl-card>
</template>

<script setup>
import { reactive, computed } from "vue"

import { useScriptorStore } from "../../store/scriptor"
const scriptorStore = useScriptorStore()

const props = defineProps({
  entry: {
    type: Object
  }
})

const state = reactive({
  inputDisabled: false
})

async function pressedOk() {
  await scriptorStore.sendResult("alertResult", {})
  state.inputDisabled = true
}
</script>

<style scoped></style>
