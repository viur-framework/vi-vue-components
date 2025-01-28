<template>
  <div
    class="fluid-element element"
    :class="{
      [state.width]: true,
      [state.height]: true,
      ghost: state.isGhost,
      'is-selected': handlerState.currentSelection?.[0]['key'] === skel['key']
    }"
    :draggable="state.draggable"
    @dragstart="startDragging"
    @dragover.prevent="dragOver"
    @dragend.prevent="dragEnd"
  >
    <div class="actions_before">

    </div>

    <div class="header">
      <div
        class="dragger"
        @mousedown="onMouseDownDragger"
        @mouseup="onMouseUpDragger"
      >
        <sl-icon name="list"></sl-icon>
      </div>

      <div class="header-type" :title="'Typ: ' + skel['kind'] ">
        {{ Utils.getDescr(currentlist.structure["kind"],skel["kind"])}}
      </div>


      <sl-select v-if="state.languages && state.languages?.length>0" placeholder="Sprache" size="small" @sl-change="changeLang" class="langchooser" :value="state.lang"
        :class="{ 'is-selected': handlerState.currentSelection?.[0]['key'] === skel['key'] }"
      >
          <sl-option v-for="lang in state.languages" :value="lang" :key="lang">
            {{$t(lang)}}
          </sl-option>
        </sl-select>

      <div :class="{ 'is-selected': handlerState.currentSelection?.[0]['key'] === skel['key'] }"
                        class="button-group"
      >

        <sl-button
          v-if="skel['width'] !== 'fullwidth' "
          class="square-btn expand"
          title="Expand"
          size="small"
          @click="expandContent"
        >
          <sl-icon name="plus-lg" slot="prefix"></sl-icon>
        </sl-button>
        <sl-button
          v-if="skel['width'] !== '1'"
          class="square-btn shrink"
          title="Shrink"
          size="small"
          @click="shrinkContent"
        >
          <sl-icon name="dash-lg" slot="prefix"></sl-icon>
        </sl-button>

        <edit></edit>
        <delete></delete>
      </div>



      <sl-dropdown class="edit-dropdown">
        <sl-button slot="trigger"
                    class="square-btn"
                   size="small"
        >
          <sl-icon slot="prefix" name="three-dots"
          ></sl-icon>
        </sl-button>
        <sl-button
          v-if="skel['width'] !== 'fullwidth'"
          class="square-btn expand"
          title="Expand"
          size="small"
          @click="expandContent"
        >
          <sl-icon name="plus-lg" slot="prefix"></sl-icon>
        </sl-button>
        <sl-button
          v-if="skel['width'] !== '1'"
          class="square-btn shrink"
          title="Shrink"
          size="small"
          @click="shrinkContent"
        >
          <sl-icon name="dash-lg" slot="prefix"></sl-icon>
        </sl-button>

        <edit></edit>
        <delete></delete>
      </sl-dropdown>


    </div>

    <div class="content">
      <sl-avatar
        v-if="skel['image']"
        shape="square"
        class="image"
        style="--size: 3em"
        :image="Request.downloadUrlFor(skel['image'], false)"
        :label="skel['image']['dest']['name']"
      >
      </sl-avatar>

      <div class="column">
        <h2 class="element-headline" v-if="skel['headline']">{{ dataValue(skel["headline"]) }}</h2>
        <h3 class="element-headline" v-if="skel['subline']">{{ dataValue(skel["subline"]) }}</h3>

        <div
          v-if="skel['descr']"
          class="text-desc"
          v-html="dataValue(skel['descr'])"
        ></div>
        <div class="info-item"
             v-if="skel['downloaditems']">
          <span>Dateien:</span>
          {{ skel["downloaditems"].length }}
        </div>
        <div class="info-item"
             v-if="skel['url']">
          <span>Navigation:</span>
          {{ dataValue(skel['url']) }}
        </div>
        <!--<span class="sortindex">sortindex: {{ skel["sortindex"] }}</span>-->
      </div>
    </div>
    <div class="actions-after">
      <add
        :label="false"
        :params="{
          sortindex: calculateIndex(state.nextIdx),
          'fluidpage': route.params['key']
        }"
      ></add>
    </div>
  </div>
</template>

<script setup>
import { Request } from "@viur/vue-utils"
import { computed, reactive, inject, provide } from "vue"
import Utils from "../utils"
import Edit from "../actions/edit.vue"
import Delete from "../actions/delete.vue"
import Add from "../actions/add.vue"
import { useRoute } from "vue-router"

  const props = defineProps({
    skel: Object
  })

    const route = useRoute()
    const state = reactive({
      width: computed(() => "fluid-width-" + props.skel["width"]),
      height: computed(() => "fluid-height-" + props.skel["height"]),
      isGhost: false,
      draggable: false,
      nextIdx: computed(() => {
        let idx = currentlist.state.skellist.findIndex((e) => e["key"] === props.skel["key"])
        return idx + 1
      }),
      prevIdx: computed(() => {
        let idx = currentlist.state.skellist.findIndex((e) => e["key"] === props.skel["key"])
        if (idx === 0) {
          return idx
        } else {
          return idx
        }
      }),
      lang:"de",
      languages:computed(()=>{
        return currentlist.structure['headline']?.['languages']
      })
    })
    const changeOrder = inject("changeOrder")
    const updateDragged = inject("updateDragged")
    const updateWidth = inject("updateWidth")
    const entrySelected = inject("entrySelected")
    const handlerState = inject("handlerState")
    const calculateIndex = inject("calculateIndex")
    const currentlist = inject("currentlist")

    function changeLang(e){
      state.lang = e.target.value
    }

    function startDragging(e) {
      let target = e.target
      if (!target.classList.contains("fluid-element")) {
        target = target.closest(".fluid-element")
      }
      handlerState.dragCurrentElement = {
        element: target,
        key: props.skel["key"]
      }
      e.dataTransfer.effectAllowed = "move"
      state.isGhost = true
    }

    function dragOver(e) {
      e.dataTransfer.dropEffect = "move"
      let target = e.target
      if (!target.classList.contains("fluid-element")) {
        target = target.closest(".fluid-element")
      }

      if (target && target !== handlerState.dragCurrentElement["element"]) {
        changeOrder(handlerState.dragCurrentElement["key"], props.skel["key"])
      }
    }
    function dragEnd(e) {
      state.isGhost = false
      state.draggable = false
      updateDragged()
    }

    function onMouseDownDragger(e) {
      state.draggable = true
    }

    function onMouseUpDragger(e) {
      state.draggable = false
    }

    function expandContent() {
      if (parseInt(props.skel["width"])===12){
        updateWidth(props.skel["key"], "fullwidth")
      }else{
        updateWidth(props.skel["key"], parseInt(props.skel["width"]) + 1 + "")
      }
      
    }

    function shrinkContent() {
      if (props.skel["width"] === "fullwidth") {
        updateWidth(props.skel["key"], "12")
      } else {
        updateWidth(props.skel["key"], parseInt(props.skel["width"]) - 1 + "")
      }
    }

    function dataValue(obj){
      if (typeof obj === "string"){
        return obj
      }
      return obj[state.lang]

    }
</script>

<style scoped>
.element {
  border: 1px solid var(--sl-color-neutral-200);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  padding: var(--sl-spacing-small);
  position: relative;
  cursor: pointer;
  background-color: #fff;
  z-index: 1;
  min-height: 195px;

  &.is-selected {
    cursor: initial;
    border: 1px solid var(--sl-color-primary-200);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);

    & .element-headline {
      color: var(--sl-color-primary-500);
    }

    & .actions-after,
    & .actions_before {
      opacity: 1;
    }
  }

  &.fluid-width-1,
  &.fluid-width-2 {
    .button-group{
      display: none;
    }

    .edit-dropdown{
      display: flex;
    }

    .content{
      flex-direction: column;

      .image{
        margin-bottom: var(--sl-spacing-x-small);
      }

      * {
        width: 100%;
        max-width: 100%;
      }
    }
   }


  &.fluid-width-1,
  &.fluid-width-2,
  &.fluid-width-3,
  &.fluid-width-4 {
    .button-group{
      display: none;
    }

    .edit-dropdown{
      display: flex;
    }
  }

  &.fluid-width-fullwidth {
    .actions-after{
      margin-right: var(--sl-spacing-small);

      & :deep(sl-button){
        transform: none;
      }
    }
   }
}

sl-button {
  &::part(base) {
    aspect-ratio: 1;
  }
}

:deep(.sl-button-group__button):not(.square-btn) {
  &::part(base) {
    aspect-ratio: 1;
    padding-left: 0;
  }

  &::part(label) {
    display: none;
  }
}

.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  padding-bottom: var(--sl-spacing-small);
  margin-bottom: var(--sl-spacing-small);
  border-bottom: 1px solid var(--sl-color-neutral-300);
  gap:5px;
}

.dragger {
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1;
  cursor: move;
  width: 1.9em;
  margin-right: var(--sl-spacing-small);
}

.header-type{
  margin-right: auto;
  font-weight: 600;
  color: var(--sl-color-neutral-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.element-headline {
  font-weight: bold;
  line-height: 1.3;
  margin-bottom: var(--sl-spacing-2x-small);
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 700px;
}

.content {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  width: 100%;
  align-items: flex-start;
  height: calc(100% - 56px);
}

.column {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 1px;
  flex: 1 1 70%;
  height: 100%;
}

.image {
  margin-right: var(--sl-spacing-medium);
  border: 1px solid var(--sl-color-neutral-300);
  max-width: 200px;
  min-width: 60px;
  flex: 1 1 30%;
  aspect-ratio: 1;

  &::part(base) {
    width: 100%;
    height: 100%;
  }
}

.button-group, .langchooser {
  display: flex;
  flex-direction: row;
  gap: var(--sl-spacing-2x-small);
  opacity: 0.3;
  mix-blend-mode: luminosity;
  transition: all ease 0.3s;

  &.is-selected,
  &:hover {
    opacity: 1;
    mix-blend-mode: normal;
  }
}

.ghost {
  background-color: var(--sl-color-primary-100);
  opacity: 0.7;
}

.actions-after {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transition: all ease 0.3s;
  z-index: 1;
  pointer-events: none;

  :deep(sl-button) {
    pointer-events: auto;
    transform: translateX(50%);
  }
}
.actions_before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transition: all ease 0.3s;
  z-index: 1;
  pointer-events: none;

  :deep(sl-button) {
    pointer-events: auto;
    transform: translateX(-50%);
  }
}

.sortindex {
  color: var(--sl-color-neutral-500);
  font-style: italic;
  font-size: var(--sl-font-size-small);
  margin-top: 10px;
}

.text-desc {
  max-width: 700px;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.edit-dropdown{
  display: none;

  &::part(popup){
    background-color: transparent;
  }
  &::part(panel){
    box-shadow: none;
    background-color: transparent;
    display:flex;
    flex-direction: column;
    gap:5px;
    margin-top:5px;
  }


  sl-button, sl-select{
    &:part(base){
      aspect-ratio: 1;
    }
  }
}

.info-item{
  display: flex;
  flex-direction: row;
  max-width: 700px;
  margin-top: var(--sl-spacing-x-small);
  text-overflow: ellipsis;
  overflow: hidden;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  span{
    font-weight: 600;
    margin-right: var(--sl-spacing-small);
  }
}

.square-btn{
  &::part(base){
    aspect-ratio: 1;
  }
}

.langchooser{
  width:110px;
}

</style>
