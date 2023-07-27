<template>
  <div class="more-entries">

    <template v-if="['listhandler'].includes(handerState['type'])">
      <component v-for="action in dbStore.state['floatingbar.actions']" :is="action">
    </component>
    </template>

    <next-page v-if="['listhandler'].includes(handerState['type'])"></next-page>
    <set-amount v-if="['listhandler'].includes(handerState['type'])"></set-amount>
    <reload></reload>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, inject} from 'vue'
import Reload from "../actions/reload.vue";
import SetAmount from "../actions/setamount.vue";
import NextPage from "../actions/nextpage.vue";;
import { useDBStore } from '../stores/db';


export default defineComponent({
  props: {},
  components: {SetAmount, Reload, NextPage},
  setup(props, context) {
    const state = reactive({})
    const dbStore = useDBStore()
    const handerState = inject('handlerState')
    return {state,dbStore, handerState}
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
