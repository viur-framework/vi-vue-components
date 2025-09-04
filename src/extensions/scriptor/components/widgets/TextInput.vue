<template>
  <sl-alert v-if="!inMultiple" variant="neutral" open>
    <div>
      {{ entry.data.text }}
    </div>
    <sl-input
      v-if="!state.multiline"
      v-model="state.value"
      :disabled="state.buttonDisabled"
      :type="state.inputType"
      :placeholder="props.entry.data.placeholder"
    ></sl-input>
    <sl-textarea
      v-if="state.multiline"
      v-model="state.value"
      :disabled="state.buttonDisabled"
      :placeholder="props.entry.data.placeholder"
    ></sl-textarea>
    <sl-button :disabled="state.buttonDisabled || !state.sendable" @click="buttonCallback">send</sl-button>
  </sl-alert>
  <div class="alert-text-input-wrap" v-else>
    <!--pack in one -->
    <div>
      {{ entry.data.text }}
    </div>
    <sl-input
      v-if="!state.multiline"
      v-model="state.value"
      :disabled="state.buttonDisabled"
      :type="state.inputType"
      :placeholder="props.entry.data.placeholder"
    ></sl-input>
    <sl-textarea
      v-if="state.multiline"
      v-model="state.value"
      :disabled="state.buttonDisabled"
      :placeholder="props.entry.data.placeholder"
    ></sl-textarea>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from "vue"
import { useScriptorStore } from "../../store/scriptor"

const scriptorStore = useScriptorStore()

onMounted(() => {
  state.value = props.entry.data.default_value ?? ""
  console.log("mount text",props.entry)
})

const props = defineProps({
  entry: { type: Object },
  inMultiple: { type: Boolean, default: false },
  dataKey: { type: String },
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
  }),
})
defineExpose({ state, props })
</script>
<style scoped>
.alert-text-input-wrap{
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-x-small)
}
</style>
