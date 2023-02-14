<template>

  <div class="fluid-element element"
       :class="{
              [state.width]:true,
              [state.height]:true,
              'ghost':state.isGhost,
              'is-selected':handlerState.currentSelection?.[0]['key'] === skel['key']
       }"
       :draggable="state.draggable"
       @dragstart="startDragging"
       @dragover.prevent="dragOver"
       @dragend.prevent="dragEnd"
  >
    <div class="header">
      <div class="dragger"
           @mousedown="onMouseDownDragger"
           @mouseup="onMouseUpDragger">
          <sl-icon name="draggable"></sl-icon>
      </div>

      <sl-button-group :class="{'is-selected':handlerState.currentSelection?.[0]['key'] === skel['key']}">
        <sl-button class="size-btn expand"
               title="Expand"
               size="small"
               v-if="skel['width']!=='fullwidth' && skel['width']!=='12'"
               @click="expandContent">
            <sl-icon name="plus"></sl-icon>
        </sl-button>
        <sl-button class="size-btn shrink"
                   title="Shrink"
                   size="small"
                   v-if="skel['width']!=='1'"
                   @click="shrinkContent">
            <sl-icon name="minus"></sl-icon>
        </sl-button>
        <edit></edit>
        <delete></delete>
    </sl-button-group>



    </div>

    <div class="content">
      <sl-avatar v-if="skel['image']"
               shape="square"
               class="image"
               style="--size: 3em"
               :image="Request.downloadUrlFor(skel['image'],false)"
               :label="skel['image']['dest']['name']"
      >
      </sl-avatar>

      <div class="column">
        <h2 class="element-headline">
          {{ skel["kind"] }}
          <component v-if='skel["headline"]'>: {{ skel["headline"] }}</component>
          <component v-else-if='skel["subline"]'>: {{ skel["subline"] }}</component>
        </h2>


        <span v-if="skel['downloaditems']">Dateien: {{ skel['downloaditems'].length }}</span>
        <span v-if="skel['url']">Navigation: {{ skel['url'] }}</span>
      </div>

    </div>

  </div>
</template>

<script>
import {Request} from '@viur/viur-vue-utils'
import {computed, reactive, inject, provide} from "vue";
import Utils from "../../utils"
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
      onMouseUpDragger,
      Utils
    };
  }
}
</script>

<style lang="less" scoped>
.element {
  border: 1px solid var(--sl-color-neutral-200);
  box-shadow: 0 0 5px rgba(0, 0, 0, .2);
  padding: var(--sl-spacing-small);
  position: relative;
  cursor: pointer;
  background-color: #fff;
  z-index: 1;

  &.is-selected{
    cursor: initial;
    border: 1px solid var(--sl-color-primary-200);
    box-shadow: 0 0 5px rgba(0, 0, 0, .2);

    .element-headline{
      color: var(--sl-color-primary-500)
    }
  }
}

sl-button{
  &::part(base){
    aspect-ratio: 1;
  }
}

:deep(.sl-button-group__button):not(.size-btn){
  &::part(base){
    aspect-ratio: 1;
    padding-left: 0;
  }

  &::part(label){
    display: none;
  }
}

.header{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  padding-bottom: var(--sl-spacing-small);
  margin-bottom: var(--sl-spacing-small);
  border-bottom: 1px solid var(--sl-color-neutral-300);
}

.dragger{
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1;
  cursor: move;
  width: 1.9em;
  margin-right: auto;
}

.element-headline{
  font-weight: bold;
}

.content{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

.column{
  display: flex;
  flex-direction: column;
}

.image{
  margin-right: var(--sl-spacing-medium);
  border: 1px solid var(--sl-color-neutral-300);
}

sl-button-group{
  opacity: .3;
  mix-blend-mode: luminosity;
  transition: all ease .3s;

  &.is-selected, &:hover{
    opacity: 1;
    mix-blend-mode: normal;
  }
}

.ghost {
  background-color: var(--sl-color-primary-100);
  opacity: .7;
}
</style>
