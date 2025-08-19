<template>
  <sl-card class="interaction">
    <div slot="header">Alert</div>
    <div class="alert-wrapper">
      <v-image v-if="entry['data']['image']" class="img" :src="entry['data']['image']"></v-image>
      <p class="paragraph">
        {{ entry["data"]["text"] }}
      </p>
    </div>

    <sl-button slot="footer" variant="success" size="small" :disabled="state.inputDisabled" @click="pressedOk">
      OK
    </sl-button>
  </sl-card>
</template>

<script setup>
import { reactive, computed } from "vue"
import VImage from "@viur/vue-utils/generic/Image.vue"

import { useScriptorStore } from "../../store/scriptor"
const scriptorStore = useScriptorStore()

const props = defineProps({
  entry: {
    type: Object,
  },
})

const state = reactive({
  inputDisabled: false,
})

async function pressedOk() {
  await scriptorStore.sendResult("alertResult", {})
  state.inputDisabled = true
}
</script>

<style scoped>
.alert-wrapper {
  display: flex;
  flex-direction: row;
  gap: 10px;
  & :deep(.image-wrap) {
    width: 100px;
    height: 100px;
  }
}
</style>
