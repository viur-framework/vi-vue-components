<template>
  <status-bar></status-bar>
  <widget-list></widget-list>
</template>

<script setup>
  import WidgetList from './components/WidgetList.vue';
  import StatusBar from './components/StatusBar.vue';

  let state = {
    id:null
  }

</script>
