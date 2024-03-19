<template>
  <sl-select
    v-if="state.visible"
    size="small"
    :value="state.initValue"
    @sl-change="rootNodeChange"
  >
    <sl-option
      v-for="node in handlerState['availableRootNodes']"
      :key="node['key']"
      :value="node['key']"
      :selected="handlerState['currentRootNode']?.['key'] === node['key']"
    >
      {{ node["name"] }}
    </sl-option>
  </sl-select>
</template>

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject, computed, onMounted } from "vue"
import { useContextStore } from "../stores/context"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const contextStore = useContextStore()
    const state = reactive({
      initValue: computed(() => {
        return handlerState["currentRootNode"]?.["key"]
      }),
      visible: true
    })
    const handlerState: any = inject("handlerState")
    const changeRootNode: any = inject("changeRootNode")

    function rootNodeChange(e: Event) {
      changeRootNode(e.target.value)
    }

    onMounted(()=>{
      let context = contextStore.getCurrentContext()
      if (Object.keys(context).includes('parentrepo') || Object.keys(context).includes('@rootNode')){
        state.visible=false
      }
    })

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
