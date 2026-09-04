<template>
  <sl-badge
    :variant="state.userStatus['variant']"
    pill
    :title="state.userStatus['text']"
    :pulse="state.userStatus['pulse']"
    @click="reset"
  >
    <span v-if="state.scriptor?.envState === 'ready'">&nbsp;</span>
    <span v-else>&nbsp;</span>
  </sl-badge>
  <slot :disabled="state.userStatus.pulse" :execute="executeScript"></slot>
</template>

<script setup>
import { reactive, computed } from "vue"
import { useScriptorStore } from "../store/scriptor"
import { describeInstanceStatus } from "../store/instanceStatus"
const scriptorStore = useScriptorStore()

const props = defineProps({
  id: {
    required: true,
  },
})

const state = reactive({
  scriptor: computed(() => {
    return scriptorStore.state.instances[props.id]
  }),
  userStatus: computed(() => {
    return describeInstanceStatus(scriptorStore.state.instances[props.id])
  }),
})

async function executeScript(scriptParams) {
  await scriptorStore.execute(state.scriptor.scriptCode, props.id, {}, scriptParams)
}
async function exitScript() {
  await scriptorStore.exitScript(props.id)
}
function reset() {
  const instance = scriptorStore.state.instances[props.id]
  if (!instance) {
    return
  }
  instance.messages = []
  instance.internalMessages = []
}

defineExpose({
  reset,
  executeScript,
  exitScript,
  state,
})
</script>

<style scoped>
sl-badge{
  position: relative;
  translate: none;

  &::part(base) {
    width: .8rem;
    height: .8rem;
    padding: 0;
  }
}
</style>
