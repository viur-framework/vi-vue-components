<template>
  <keep-alive :include="viewStore.state.cacheListNames">
    <component
      :is="viewStore.wrap(component)"
      :key="route.fullPath"
    />
  </keep-alive>
</template>

<script setup>
import { defineComponent } from "vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import { useViewStore } from "../stores/views"

  const props = defineProps({
    component: Object
  })

    const viewStore = useViewStore()
    const route = useRoute()
    const dbStore = useDBStore()

</script>

<style scoped></style>
