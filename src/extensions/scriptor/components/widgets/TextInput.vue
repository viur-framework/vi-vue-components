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
      :label="entry.data.title"
    ></sl-input>
    <sl-textarea
      v-if="state.multiline"
      v-model="state.value"
      :disabled="state.buttonDisabled"
      :placeholder="props.entry.data.placeholder"
      :label="entry.data.title"
    ></sl-textarea>
    <sl-button :disabled="state.buttonDisabled || !state.sendable" @click="buttonCallback">send</sl-button>
  </sl-alert>
  <div v-else class="alert-text-input-wrap">
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
      :label="entry.data.title"
    ></sl-input>
    <sl-textarea
      v-if="state.multiline"
      v-model="state.value"
      :disabled="state.buttonDisabled"
      :placeholder="props.entry.data.placeholder"
      :label="entry.data.title"
    ></sl-textarea>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from "vue"
import { useScriptorStore } from "../../store/scriptor"

const scriptorStore = useScriptorStore()

onMounted(() => {
  state.value = props.entry.data.default_value ?? ""
})

const props = defineProps({
  entry: { type: Object },
  inMultiple: { type: Boolean, default: false },
  dataKey: { type: String },
  instanceId: { required: true },
})

async function buttonCallback(event, option) {
  // Sperren hängt an der Nachricht im Store (state.buttonDisabled ist darauf
  // gespiegelt), damit ein Remount nach dem Zurückholen aus dem Minimieren
  // die Antwort nicht erneut sendbar macht.
  scriptorStore.markMessageAnswered(props.instanceId, props.entry.data.unique_id)
  await scriptorStore.sendResult(props.instanceId, "textResult", state.value)
}

const state = reactive({
  sendable: computed(() => {
    return state.value !== "" || props.entry.empty
  }),
  value: "",
  multiline: computed(() => props.entry.data.input_type === "text"),
  buttonDisabled: computed(() => !!props.entry.data.answered),
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
.alert-text-input-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-x-small);
}
</style>
