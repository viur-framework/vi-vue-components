<template>
  <div v-if="inMultiple">
    {{ entry.data["title"] || entry.data["text"] }} :
    <div class="alert-wrapper">
      <v-image v-if="entry['data']['image']" class="img" :src="entry['data']['image']"></v-image>
      <div v-if="!state.isMultiple">
        <sl-button
          v-for="option in state.options"
          :key="option.key"
          :variant="state.selectedOptions.includes(option.key) ? 'success' : 'default'"
          :disabled="state.isDisabled"
          @click="selectSingleOption(option)"
        >
          {{ state.showValue ? option.value : option.key }}
        </sl-button>
      </div>

      <div v-else class="wrapper-multi-select">
        <sl-checkbox
          v-for="option in state.options"
          :key="option"
          :disabled="state.isDisabled"
          :checked="option.selected"
          @sl-change="toggleSelection(option)"
        >
          {{ state.showValue ? option.value : option.key }}
        </sl-checkbox>
      </div>
    </div>
  </div>

  <sl-card v-else>
    <div slot="header">
      {{ entry.data["title"] }}
    </div>
    <div class="alert-wrapper">
      <v-image v-if="entry['data']['image']" class="img" :src="entry['data']['image']"></v-image>
      <p class="paragraph">
        {{ entry.data["text"] }}
      </p>
    </div>

    <div v-if="!state.isMultiple">
      <sl-button
        v-for="option in state.options"
        :key="option.key"
        :variant="state.selectedOptions.includes(option.key) ? 'success' : 'default'"
        :disabled="state.isDisabled"
        @click="selectSingleOption(option)"
      >
        {{ state.showValue ? option.value : option.key }}
      </sl-button>
    </div>

    <div v-else class="wrapper-multi-select">
      <sl-checkbox
        v-for="option in state.options"
        :key="option"
        :disabled="state.isDisabled"
        :checked="option.selected"
        @sl-change="toggleSelection(option)"
      >
        {{ state.showValue ? option.value : option.key }}
      </sl-checkbox>
    </div>

    <div v-if="state.isMultiple" slot="footer">
      <sl-button size="small" variant="success" :disabled="state.isDisabled" @click="sendMultipleOptions">
        {{ "send" }}
      </sl-button>
    </div>
  </sl-card>
</template>

<script setup>
import { computed, onMounted, reactive } from "vue"
import { useScriptorStore } from "../../store/scriptor"
import VImage from "@viur/vue-utils/generic/Image.vue"

const scriptorStore = useScriptorStore()

const props = defineProps({
  entry: {
    type: Object,
  },
  inMultiple: { type: Boolean, default: false },
  dataKey: { type: String },
})

onMounted(() => {
  const opts = []
  for (const [key, value] of Object.entries(props.entry.data.choices)) {
    opts.push({key: key, value: value, selected: state.selectedOptions.includes(key)})
  }
  state.options = opts
})

const state = reactive({
  selectedOptions: props.entry.data?.default_value || [],
  isMultiple: computed(() => props.entry.data["multiple"]),
  isDisabled: false,
  options: {},
  value: props.entry.data?.default_value || [],
  sendable: computed(() => {
    return state.value.length !== 0
  }),
  showValue: computed(() => props.entry.data["show_values"])
})

function toggleSelection(option) {
  option.selected = !option.selected
  const res = []
  for (const opt of state.options) {
    if (opt.selected) {
      res.push(opt.key)
    }
  }
  state.value = res
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
  if (!props.inMultiple) {
    state.isDisabled = true
    await scriptorStore.sendResult("selectResult", [...state.value])
  }
}

defineExpose({ state, props })
</script>
<style scoped>
.wrapper-multi-select {
  display: flex;
  flex-direction: column;
}
.alert-wrapper {
  display: flex;
  flex-direction: row;
  gap: 10px;

  & :deep(.image-wrap) {
    width: 100px;
    height: 100px;
    margin-bottom: 10px;
  }
}
</style>
