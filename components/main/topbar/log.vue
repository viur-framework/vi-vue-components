<template>
  <sl-button
    size="small"
    variant="default"
    @click="openInfo"
    class="btn--mobile-simple"
  >
    <sl-icon
      name="clock"
      slot="prefix"
      sprite
    ></sl-icon>
  </sl-button>
</template>

<script lang="ts">
import { reactive, defineComponent } from "vue"
import { useMessageStore } from "../../stores/message"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({})
    const messageStore = useMessageStore()

    function openInfo() {
      messageStore.state.opened = !messageStore.state.opened
    }

    return {
      state,
      openInfo
    }
  }
})
</script>

<style scoped></style>
