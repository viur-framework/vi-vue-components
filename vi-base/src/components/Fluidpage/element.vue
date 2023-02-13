<template>

  <div class="fluid-element element"
       :class="{
              [state.width]:true,
              [state.height]:true,
              'ghost':state.isGhost
       }"
       :draggable="state.draggable"
       @dragstart="startDragging"
       @dragover.prevent="dragOver"
       @dragend.prevent="dragEnd"
  >
    <sl-icon name="menu"
             @mousedown="onMouseDownDragger"
             @mouseup="onMouseUpDragger"
    >

    </sl-icon>
    {{skel["sortindex"]}}
    <h1 v-if="skel['headline'] || skel['subline']">{{ skel["headline"] }}, {{ skel["subline"] }}</h1>
    <h2>{{ skel["kind"] }}, {{ skel["active"] }},
      <span v-if="skel['downloaditems']">Dateien {{ skel['downloaditems'].length }}</span>
      <span v-if="skel['url']">Navigation: {{ skel['url'] }}</span>
    </h2>

    <sl-avatar v-if="skel['image']"
               shape="square"
               style="--size: 3em"
               :image="Request.downloadUrlFor(skel['image'],false)"
               :label="skel['image']['dest']['name']"
    >

    </sl-avatar>
    <sl-button-group v-if="handlerState.currentSelection?.[0]['key'] === skel['key']">
      <edit></edit>
      <delete></delete>
    </sl-button-group>

    {{skel["width"]}}
    <sl-button v-if="skel['width']!=='fullwidth' && skel['width']!=='12'" @click="expandContent">expand</sl-button>
    <sl-button  v-if="skel['width']!=='1'" @click="shrinkContent">shrink</sl-button>
  </div>
</template>

<script>
import {Request} from '@viur/viur-vue-utils'
import {computed, reactive, inject, provide} from "vue";
import Edit from "../Actions/edit.vue";
import Delete from "../Actions/delete.vue";

export default {
  components: {Delete, Edit},
  props: {
    skel: Object
  },
  setup(props, context) {
    const state = reactive({
      width:computed(()=>'fluid-width-' + props.skel["width"]),
      height:computed(()=>'fluid-height-' + props.skel["height"]),
      isGhost:false,
      draggable:false
    })
    const changeOrder = inject('changeOrder')
    const updateDragged = inject('updateDragged')
    const updateWidth = inject('updateWidth')
    const entrySelected = inject('entrySelected')
    const handlerState = inject("state")

    function startDragging(e){
      let target = e.target;
      if (!target.classList.contains('fluid-element')){
        target = target.closest('.fluidpage-element')
      }
      handlerState.dragCurrentElement = {
        "element":target,
        "key":props.skel["key"]
      };
      e.dataTransfer.effectAllowed = 'move';
      state.isGhost = true
    }

    function dragOver(e){
      e.dataTransfer.dropEffect = 'move';
      let target = e.target;
      if (!target.classList.contains('fluid-element')){
        target = target.closest('.fluidpage-element')
      }

      if (target && target !== handlerState.dragCurrentElement['element']) {
          changeOrder(handlerState.dragCurrentElement['key'], props.skel["key"])
      }
    }
    function dragEnd(e){
      state.isGhost = false
      state.draggable=false
      updateDragged()
    }

    function onMouseDownDragger(e){
      state.draggable = true
    }

    function onMouseUpDragger(e){
      state.draggable = false
    }


    function expandContent(){
      updateWidth(props.skel["key"], parseInt(props.skel["width"])+1+"")
    }

    function shrinkContent(){
      if (props.skel["width"]==="fullwidth"){
        updateWidth(props.skel["key"], "12")
      }else{
        updateWidth(props.skel["key"], parseInt(props.skel["width"])-1+"")
      }
    }

    return {
      Request,
      state,
      startDragging,
      handlerState,
      dragOver,
      dragEnd,
      expandContent,
      shrinkContent,
      entrySelected,
      onMouseDownDragger,
      onMouseUpDragger
    };
  }
}
</script>

<style lang="less" scoped>
.element {
  border: 1px solid var(--sl-color-primary-500);
}

h1 {
  font-weight: bold;
}

.ghost {
  border: 1px dashed #000;
}
</style>
