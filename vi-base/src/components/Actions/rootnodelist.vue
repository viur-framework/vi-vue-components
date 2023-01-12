<template>
  <sl-select @sl-change="rootNodeChange" :value="state.initValue">
  <sl-menu-item v-for="node in handlerState['currentRootNodes']" :value="node['key']">{{node["name"]}}</sl-menu-item>
  </sl-select>

</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({
      initValue:computed(()=>{
        if(handlerState['currentRootNodes'].length>0)
        {
          return handlerState['currentRootNodes'][0]['key']
        }
        return ""
      })
    });
    const handlerState: any = inject("state");
    const changerootNode: any = inject("changerootNode")
    function rootNodeChange(e: Event) {
     changerootNode(e.target.value);
    }

    return {state, rootNodeChange,handlerState}
  }
})
</script>

<style scoped lang="less">

sl-select{
  &::part(form-control){
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  &::part(form-control-label){
    margin-right: 7px;
    margin-bottom: 0;
  }
}

</style>
