<template>
  <div class="wrapper drag-handler">
    <sl-icon name="list" :title="rendered"></sl-icon>
  </div>
</template>

<script setup>
import { reactive } from "vue"
import { useDBStore } from "../stores/db"


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
