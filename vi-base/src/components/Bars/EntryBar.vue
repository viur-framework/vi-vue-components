<template>
  <div class="bar" style="z-index: 50">
    <debugentry></debugentry>
    <save :module="module" :action="action"></save>
    <save
      name="action.save_close"
      icon="check-all"
      :close="true"
      :module="module" :action="action"
    ></save>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent} from 'vue'
import Save from "../Actions/save.vue";
import Debugentry from "../Actions/debugentry.vue";


export default defineComponent({
  props: {},
  components: {Debugentry, Save},
  setup(props, context) {
    const state = reactive({})
    return {state}
  }
})
</script>

<style scoped lang="less">

sl-button{
  margin-left: 5px;
}

</style>
