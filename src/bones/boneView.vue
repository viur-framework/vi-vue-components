<template>
  <div class="ellipsis">{{ rendered }}</div>
</template>

<script setup>

import { reactive, defineComponent, onMounted, inject, computed } from "vue"
import { useDBStore } from "../stores/db"

  const props = defineProps({
    skel: Object,
    bonename: String,
    structure: Object,
    idx: Number,
    rendered: String
  })

    const dbStore = useDBStore()
    const state = reactive({})
</script>

<style scoped></style>
