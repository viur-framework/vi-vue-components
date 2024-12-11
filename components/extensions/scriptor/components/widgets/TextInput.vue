<template>
  <sl-alert
    variant="neutral"
    open
  >
    {{ entry.data.text }}
    <br />
    <sl-input
      v-if="!state.multiline"
      v-model="state.text"
      :disabled="state.buttonDisabled"
      :type="state.inputType"
    ></sl-input>
    <sl-textarea
      v-if="state.multiline"
      :disabled="state.buttonDisabled"
      v-model="state.text"
    ></sl-textarea>
    <br />
    <sl-button
      :disabled="state.buttonDisabled || !state.sendable"
      @click="buttonCallback"
    >
      send
    </sl-button>
  </sl-alert>
</template>

<script setup>
import {reactive, computed, onMounted} from "vue"
import { useScriptorStore } from "../../store/scriptor"

const scriptorStore = useScriptorStore()

onMounted(() => {
      state.text = props.entry.data.default_value ?? ""
})

const props = defineProps({
  entry: {
    type: Object
  }
})

async function buttonCallback(event, option) {
  state.buttonDisabled = true
  await scriptorStore.sendResult("textResult", state.text)
}

const state = reactive({
  sendable: computed(() => state.text != ""),
  text: "",
  multiline: computed(() => props.entry.data.input_type === "text"),
  buttonDisabled: false,
  inputType: computed(() => {
    if (props.entry.data.input_type === "date" && props.entry.data.use_time) {
      return "datetime-local"
    } else {
      return props.entry.data.input_type
    }
  })
})
</script>
