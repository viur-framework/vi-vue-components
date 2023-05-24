<template>
    <label class="bone-name" @click="state.debug=!state.debug">
      <slot></slot>
    </label>
    <div v-if="state.debug">
      <VueJsonPretty :data="boneState"></VueJsonPretty>
    </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject} from 'vue'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

export default defineComponent({
    props:{
        name:String,
        value:Object,
        index:Number,
        lang:String,
        readonly:Boolean,
        params:Object,
    },
    components: {VueJsonPretty},
    emits:["change"],
    setup(props, context) {
      const boneState = inject("boneState")
        const state = reactive({
          debug:false
        })
        return {
            state,
            boneState
        }
    }
})
</script>

<style scoped>
  .bone-name{
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: flex-start;
    font-size: var(--sl-input-font-size-medium);
    min-height: var(--sl-input-height-medium);
    padding: 0.4em 0.7em;
    color: var(--sl-color-neutral-900);
    background-color: var(--sl-color-neutral-200);
    border: none;
    border-top-left-radius: var(--sl-input-border-radius-medium);
    border-bottom-left-radius: var(--sl-input-border-radius-medium);
    gap: 10px;
    word-break: break-word;
  }
</style>
