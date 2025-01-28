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
      {{ Utils.renderValue(node["name"]) }}
    </sl-option>
  </sl-select>
</template>

<script setup>
import { reactive, defineComponent, inject, computed, onMounted } from "vue"
import { useContextStore } from "../stores/context"
import Utils from "../utils";
    const contextStore = useContextStore()
    const state = reactive({
      initValue: computed(() => {
        return handlerState["currentRootNode"]?.["key"]
      }),
      visible: true
    })
    const handlerState = inject("handlerState")
    const changeRootNode = inject("changeRootNode")

    function rootNodeChange(e) {
      changeRootNode(e.target.value)
    }

    onMounted(()=>{
      let context = contextStore.getCurrentContext()
      if (Object.keys(context).includes('parentrepo') || Object.keys(context).includes('@rootNode')){
        state.visible=false
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
