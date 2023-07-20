<template>
  <div class="more-entries">
    <!--<filter-action></filter-action>-->
    <component v-for="action in dbStore.state['floatingbar.actions']" :is="action">
    </component>
    <next-page></next-page>
    <set-amount></set-amount>
    <reload></reload>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent} from 'vue'
import Reload from "../actions/reload.vue";
import SetAmount from "../actions/setamount.vue";
import NextPage from "../actions/nextpage.vue";
import FilterAction from "../actions/filter.vue";
import { useDBStore } from '../stores/db';


export default defineComponent({
  props: {},
  components: {SetAmount, Reload, NextPage, FilterAction},
  setup(props, context) {
    const state = reactive({})
    const dbStore = useDBStore()
    return {state,dbStore}
  }
})
</script>

<style scoped>

.more-entries{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 15px;
  padding: 10px;
  background-color: var(--vi-label-background-color);
  border: 1px solid var(--sl-color-neutral-300);
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
