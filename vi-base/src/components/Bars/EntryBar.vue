<template>
  <div class="bar" style="z-index: 50">
    <save :module="module" :action="action" :skelkey="skelkey"></save>
    <save
      name="action.save_close"
      icon="check-all"
      :close="true"
      :module="module" :action="action" :skelkey="skelkey"
    ></save>
  </div>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'
import Save from "../Actions/save.vue";

export default defineComponent({
  props: {},
  components: {Save},
  setup(props, context) {
    const state = reactive({})
    return {state}
  }
})
</script>

<style scoped lang="less">

</style>
