<template>
  <sl-button
    size="small"
    variant="secondary"
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

<style scoped>
  sl-button{
    &::part(base){
      background-color: var(--sl-color-neutral-500);
      border-color: var(--sl-color-neutral-500);
    }
  }
</style>
