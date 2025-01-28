<template>
  <sl-alert
    v-if="duration"
    :variant="variant"
    open
    :duration="duration"
    closable
  >
    <sl-icon
      slot="icon"
      :name="icon"
      sprite
    ></sl-icon>
    <div class="bold">{{ headline }} {{ time.toLocaleString() }}</div>
    <slot></slot>
  </sl-alert>

  <sl-alert
    v-else
    :variant="variant"
    style="margin-bottom: 10px"
    open
    closable
  >
    <sl-icon
      slot="icon"
      :name="icon"
      sprite
    ></sl-icon>
    <div class="bold">{{ headline }} {{ time.toLocaleString() }}</div>
    <slot></slot>
  </sl-alert>
</template>

<script setup>
import { defineComponent, onMounted, ref } from "vue"

  const props = defineProps({
    icon: String,
    variant: String,
    headline: String,
    duration: Number,
    time: Date
  })

</script>

<style scoped>
.bold {
  font-weight: bold;
}

sl-alert {
  &::part(message) {
    padding: var(--sl-spacing-x-small);
  }

  &::part(icon) {
    padding: var(--sl-spacing-x-small) var(--sl-spacing-x-small) var(--sl-spacing-x-small) var(--sl-spacing-medium);
  }
}
</style>
