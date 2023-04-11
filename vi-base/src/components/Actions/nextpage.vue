<template>
  <sl-button @click="loadnextpage" :loading="state.loading" :disabled="state.disable" size="small"
             :title="$t('actions.nextpage')">
    <sl-icon slot="prefix" name="menu"></sl-icon>
       {{ $t("actions.nextpage") }}
  </sl-button>

</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({
      disable:computed(()=>{
        if (!currentlist) return true
        return currentlist.state.state === 2
      }),
      loading:false
    });

    const nextpage: any = inject("nextpage")
    const currentlist: any = inject("currentlist")

    function loadnextpage(){
      state.loading = true
      nextpage().then((resp)=>{
        state.loading = false
      })
    }


    return {state, loadnextpage}
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
