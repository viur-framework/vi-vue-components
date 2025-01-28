<template>
  <sl-card>
    <div slot="header">
      {{ entry.data["title"] }}
    </div>
    <p class="paragraph">
      {{ entry.data["text"] }}
    </p>

    <div v-if="!state.isMultiple">
      <sl-button
        :variant="state.selectedOptions.includes(option.key) ? 'success' : 'default'"
        :disabled="state.isDisabled"
        v-for="option in state.options"
        :key="option.key"
        @click="selectSingleOption(option)"
      >
        {{ option.key }}
      </sl-button>
    </div>

    <div
      v-else
      class="wrapper-multi-select"
    >
      <sl-checkbox
        :disabled="state.isDisabled"
        v-for="option in state.options"
        :checked="option.selected"
        :key="option"
        @sl-change="toggleSelection(option)"
      >
        {{ option.key }}
      </sl-checkbox>
    </div>

    <div
      slot="footer"
      v-if="state.isMultiple"
    >
      <sl-button
        size="small"
        variant="success"
        :disabled="state.isDisabled"
        @click="sendMultipleOptions"
      >
        {{ "send" }}
      </sl-button>
    </div>
  </sl-card>

</template>

<script setup>
import {computed, onMounted, reactive} from "vue"
import {useScriptorStore} from "../../store/scriptor"

const scriptorStore = useScriptorStore()

const props = defineProps({
  entry: {
    type: Object
  },
  inMultiple: {type: Boolean, default: false},
})

onMounted(() => {
  let opts = []
  for (const [key, value] of Object.entries(props.entry.data.choices)) {
    let nopt = {key: key, selected: false}
    opts.push(nopt)
  }
  state.options = opts
})

const state = reactive({
  selectedOptions: [],
  isMultiple: computed(() => props.entry.data["multiple"]),
  isDisabled: false,
  options: {},
  value: [],
  sendable: computed(() => {
    return state.value !==[]
  })
})

function toggleSelection(option) {
  option.selected = !option.selected
}

async function selectSingleOption(option) {
  if (!props.inMultiple) {
    await scriptorStore.sendResult("selectResult", option.key)
    state.isDisabled = true
  } else {
    state.value = option.key
    state.selectedOptions = []
    state.selectedOptions.push(option.key)
  }
}

async function sendMultipleOptions() {
  let res = []
  for (const opt of state.options) {
    if (opt.selected) {
      res.push(opt.key)
    }
  }
  await scriptorStore.sendResult("selectResult", res)
  state.isDisabled = true
}

defineExpose({state})
</script>
<style scoped>
.wrapper-multi-select {
  display: flex;
  flex-direction: column;
}
</style>
