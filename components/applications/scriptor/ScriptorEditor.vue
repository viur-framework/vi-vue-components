<template>
  <sl-split-panel vertical style="height: 100%;--min:50px; --max:100% " position="50">
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
  import {reactive, onMounted, onBeforeMount} from 'vue'
  import WidgetList from './components/WidgetList.vue';
  import StatusBar from './components/StatusBar.vue';
  import CodeEditor from './components/CodeEditor.vue';
  import {useScriptorStore} from "./store/scriptor"
  const scriptorStore = useScriptorStore()
  const state = reactive({
    id:null
  })

  onBeforeMount(()=>{
    state.id = scriptorStore.createNewInstance()
  })

</script>
<style scoped>
.wrapper-editor{
  height: calc(100% - 50px);
  width:100%;
}

.wrapper-widgets{
  overflow-y: auto;
}

</style>
