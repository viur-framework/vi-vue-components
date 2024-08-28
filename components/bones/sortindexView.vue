<template>
  <div class="wrapper drag-handler">
    <sl-icon name="list" :title="rendered"></sl-icon>
    <sl-spinner v-if="handlerState.entryUpdate"></sl-spinner>
  </div>
</template>

<script setup>
import { reactive, inject } from "vue"
import { useDBStore } from "../stores/db"

const handlerState = inject("handlerState")

const props = defineProps( {
  skel: Object,
  bonename: String,
  structure: Object,
  idx: Number,
  rendered: String
})

const dbStore = useDBStore()
const state = reactive({})
</script>

<style scoped>
.wrapper{
  display:flex;
  justify-content: center;
}
sl-icon{
  min-width:30px;
  width: 1.2em;
  height:1.5em;
}

</style>
