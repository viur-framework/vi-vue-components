<template>
  <sl-alert v-if="!inMultiple"
    variant="neutral"
    open
  >
    {{ entry.data.text }}
    <br />
    <sl-input
      v-if="!state.multiline"
      v-model="state.value"
      :disabled="state.buttonDisabled"
      :type="state.inputType"
    ></sl-input>
    <sl-textarea
      v-if="state.multiline"
      :disabled="state.buttonDisabled"
      v-model="state.value"
    ></sl-textarea>
    <br />
    <sl-button
      :disabled="state.buttonDisabled || !state.sendable"
      @click="buttonCallback"
    >
      send
    </sl-button>
  </sl-alert>
  <div v-else><!--pack in one -->
     {{ entry.data.text }}
    <sl-input
      v-if="!state.multiline"
      v-model="state.value"
      :disabled="state.buttonDisabled"
      :type="state.inputType"
    ></sl-input>
    <sl-textarea
      v-if="state.multiline"
      :disabled="state.buttonDisabled"
      v-model="state.value"
    ></sl-textarea>
  </div>
</template>

<script setup>
import {reactive, computed, onMounted} from "vue"
import { useScriptorStore } from "../../store/scriptor"

const scriptorStore = useScriptorStore()

onMounted(() => {
      state.value = props.entry.data.default_value ?? ""
})


const props = defineProps({
  entry: {type: Object},
  inMultiple:{type:Boolean,default:false}
})

async function buttonCallback(event, option) {
  state.buttonDisabled = true
  await scriptorStore.sendResult("textResult", state.value)
}

const state = reactive({
  sendable: computed(() => {
    return state.value !== ""
  }),
  value: "",
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
defineExpose({state})
</script>
