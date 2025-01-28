<template>
  <div class="home">View {{ route.path }} is missing.</div>
</template>

<script setup>
import { defineComponent, reactive } from "vue"
import { useRoute } from "vue-router"

const route = useRoute()
const state = reactive({})

</script>

<style scoped></style>
