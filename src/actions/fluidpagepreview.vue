<template>
    <sl-button size="small" variant="info" outline @click="state.opened=true">Vorschau</sl-button>

    <sl-dialog class="preview-dialog" open label="Vorschau" style="--width: 85%" @sl-hide="state.opened=false" v-if="state.opened">
        <div class="label-wrapper" slot="label">

            Vorschau
            <div class="button-wrapper">
            <sl-button-group>
                <sl-button  size="small" title="Smartphone: Breite 480px" @click="state.currentWidth='480px'"><sl-icon slot="prefix" name="phone"></sl-icon></sl-button>
                <sl-button  size="small" title="Tablet Breite 768px" @click="state.currentWidth='768px'"><sl-icon slot="prefix" name="tablet-landscape"></sl-icon></sl-button>
                <sl-button  size="small" title="Breite 100%" @click="state.currentWidth='100%'"><sl-icon slot="prefix" name="display"></sl-icon></sl-button>
            </sl-button-group>
            </div>

        </div>
        <div class="iframe-wrapper">
            <iframe class="aframe" ref="aframe" :src="state.url" :style="{width:state.currentWidth}"></iframe>
        </div>
    </sl-dialog>
</template>

<script setup>
import { computed, reactive,useTemplateRef } from 'vue';
import {useRoute} from 'vue-router'
import { useDraggable } from '@vueuse/core'

const aframe = useTemplateRef('aframe')
const route = useRoute()
const state = reactive({
    url: computed(()=>{
        return `${import.meta.env.VITE_API_URL}/${route.params.parentmodule}/view/${route.params.key}`
    }),
    currentWidth:"100%",
    opened:false
    
})


</script>

<style scoped>
.button-wrapper{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap:10px;
}

.label-wrapper{
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.resizer{
    height:100%;
    width: 20px;
    background-color: var(--sl-color-neutral-600);
    cursor: pointer;
}

.iframe-wrapper{
    height: 100%;
    display:flex;
    justify-content: center;

}
.aframe{
    width: 100%;
    height: 100%;
}

.preview-dialog{

  &::part(panel) {
    height: 100%;
    max-height: calc(100% - 100px);
    margin-bottom: 40px;
  }

  &::part(footer) {
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }

}

</style>