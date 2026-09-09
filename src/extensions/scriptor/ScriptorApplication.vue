<template>
  <sl-split-panel vertical style="height: 100%; --min: 50px; --max: 100%" position="50">
    <div slot="start">
      <status-bar :id="state.id"></status-bar>
      <div class="wrapper-editor">
        <code-editor :id="state.id"></code-editor>
      </div>
    </div>
    <div slot="end" class="wrapper-widgets">
      <widget-list :id="state.id"></widget-list>
    </div>
  </sl-split-panel>
</template>

<script setup>
import { reactive, onMounted, onBeforeMount, onBeforeUnmount } from "vue"
import WidgetList from "./components/WidgetList.vue"
import StatusBar from "./components/StatusBar.vue"
import CodeEditor from "./components/CodeEditor.vue"
import { useScriptorStore } from "./store/scriptor"
const scriptorStore = useScriptorStore()
const state = reactive({
  id: null,
})

onBeforeMount(() => {
  state.id = scriptorStore.createNewInstance()
})

// Closing the vi tab drops this view from the keep-alive cache and unmounts the
// component. Without cleanup the instance and its worker stay behind in the
// store, unreachable, and keep occupying one of the three worker slots.
// destroyInstance parks a ready worker, so the loaded environment is handed on
// to the next window instead of being lost.
onBeforeUnmount(() => {
  if (state.id) {
    scriptorStore.destroyInstance(state.id)
    state.id = null
  }
})
</script>
<style scoped>
.wrapper-editor {
  height: calc(100% - 50px);
  width: 100%;
}

.wrapper-widgets {
  overflow-y: auto;
}
</style>
