<template>
  <sl-button
    size="small"
    variant="default"
    class="btn--mobile-simple"
    @click="openInfo"
  >
    <sl-icon
      slot="prefix"
      name="clock"
      sprite
    ></sl-icon>
  </sl-button>
</template>

<script setup>
import { reactive, defineComponent } from "vue"
import { useMessageStore } from "../../stores/message"

    const state = reactive({})
    const messageStore = useMessageStore()

    function openInfo() {
      messageStore.state.opened = !messageStore.state.opened
    }

</script>

<style scoped></style>
