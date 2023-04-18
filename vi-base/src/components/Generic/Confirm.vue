<template>
  <sl-dialog></sl-dialog>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'

export default defineComponent({
  props: [],
  components: {},
  setup(props, context) {
    const state = reactive({})
    return {
      state
    }
  }
})
</script>

<style scoped lang="less">

</style>