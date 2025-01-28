<template>
  <sl-dropdown
    distance="10"
    hoist
    stay-open-on-select
  >
    <sl-button
      slot="trigger"
      size="small"
      :title="state.group.name"
      variant="default"
    >
      <sl-icon
        v-once
        slot="prefix"
        aria-hidden="true"
        :library="state.group.library"
        :name="state.group.icon"
      >
      </sl-icon>
    </sl-button>
    <template v-if="state.group.showName">{state.group.name}}</template>
    <sl-menu>
      <slot></slot>
    </sl-menu>
  </sl-dropdown>
</template>

<script setup>

import { reactive, defineComponent, inject, computed } from "vue"

  const props = defineProps( {
    group: Object
  })

    const state = reactive({
      group: computed(() => {
        return {
          shownName: props.group["shownName"] ? props.group["shownName"] : false,
          name: props.group["name"],
          icon: props.group["icon"] ? props.group["icon"] : "chevron-down",
          library: props.group["library"] ? props.group["library"] : "default"
        }
      })
    })

</script>

<style scoped></style>
