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

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"

export default defineComponent({
  props: {
    group: Object
  },
  components: {},
  setup(props, context) {
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

    return { state }
  }
})
</script>

<style scoped></style>
