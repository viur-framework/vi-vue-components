<template>
  <div class="ellipsis">{{ rendered }}</div>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, onMounted, inject, computed } from "vue"
import { useDBStore } from "../stores/db"

export default defineComponent({
  props: {
    skel: Object,
    bonename: String,
    structure: Object,
    idx: Number,
    rendered: String
  },
  components: {},
  setup(props, context) {
    const dbStore = useDBStore()
    const state = reactive({})

    return {
      state,
      dbStore
    }
  }
})
</script>

<style scoped></style>
