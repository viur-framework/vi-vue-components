<template>
  <div class="more-entries">
    <filter-action></filter-action>
    <next-page></next-page>
    <set-amount></set-amount>
    <reload></reload>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent} from 'vue'
import Reload from "../Actions/reload.vue";
import SetAmount from "../Actions/setamount.vue";
import NextPage from "../Actions/nextpage.vue";
import FilterAction from "../Actions/filter.vue";


export default defineComponent({
  props: {},
  components: {SetAmount, Reload, NextPage, FilterAction},
  setup(props, context) {
    const state = reactive({})
    return {state}
  }
})
</script>

<style scoped lang="less">

.more-entries{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 15px;
  padding: 10px;
  background-color: var(--vi-label-background-color);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, .2);
  border-radius: var(--sl-border-radius-medium);
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
}

sl-select{
  &::part(form-control){
    flex-direction: row;
    align-items: center;
  }

  &::part(form-control-label){
    margin-right: 10px;
    font-size: .8em;
  }

  &::part(form-control-input){
    width: 80px;
  }
}

</style>
