<template>
  <sl-select
    size="small"
    :value="state.initValue"
    @sl-change="rootNodeChange"
  >
    <sl-option
      v-for="node in handlerState['availableRootNodes']"
      :key="node['key']"
      :value="node['key']"
      :selected="handlerState['currentRootNode']['key'] === node['key']"
    >
      {{ node["name"] }}
    </sl-option>
  </sl-select>
</template>

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({
      initValue: computed(() => {
        return handlerState["currentRootNode"]?.["key"]
      })
    })
    const handlerState: any = inject("handlerState")
    const changeRootNode: any = inject("changeRootNode")

    function rootNodeChange(e: Event) {
      changeRootNode(e.target.value)
    }

    return { state, rootNodeChange, handlerState }
  }
})
</script>

<style scoped>
sl-select {
  &::part(form-control) {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  &::part(form-control-label) {
    margin-right: 7px;
    margin-bottom: 0;
  }
}
</style>
