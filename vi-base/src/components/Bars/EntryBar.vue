<template>
  <div class="bar" style="z-index: 50">
    <reloadentry v-if="!['add'].includes(handlerState.action)"></reloadentry>

    <debugentry></debugentry>
    <save :module="module" :action="action" name="actions.save_next" v-if="['clone','add'].includes(handlerState.action)"></save>
    <save :module="module" :action="action"></save>
    <save
      name="actions.save_close"
      icon="check-all"
      :close="true"
      :module="module" :action="action"
    ></save>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, inject} from 'vue'
import Save from "../Actions/save.vue";
import Debugentry from "../Actions/debugentry.vue";
import Reloadentry from '../Actions/reloadentry.vue';


export default defineComponent({
  props: {},
  components: {Debugentry, Save, Reloadentry},
  setup(props, context) {
    const state = reactive({})
    const handlerState: any = inject("state");
    return {state, handlerState}
  }
})
</script>

<style scoped lang="less">

.bar{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-left: 10px;
}

sl-button{
  margin-left: 5px;
}

</style>
