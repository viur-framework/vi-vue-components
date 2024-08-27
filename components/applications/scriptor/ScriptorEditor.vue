<template>
  <status-bar :id="state.id"></status-bar>
  <code-editor :id="state.id"></code-editor>
  <widget-list :id="state.id"></widget-list>
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
