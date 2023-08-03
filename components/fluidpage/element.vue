<template>
  <div
    class="fluid-element element"
    style="position: relative"
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
      <add
        :label="false"
        :params="{ sortindex: calculateIndex(state.prevIdx) }"
      ></add>
    </div>

    <div class="header">
      <div
        class="dragger"
        @mousedown="onMouseDownDragger"
        @mouseup="onMouseUpDragger"
      >
        <sl-icon name="draggable"></sl-icon>
      </div>

      <sl-button-group :class="{ 'is-selected': handlerState.currentSelection?.[0]['key'] === skel['key'] }">
        <sl-button
          v-if="skel['width'] !== 'fullwidth' && skel['width'] !== '12'"
          class="size-btn expand"
          title="Expand"
          size="small"
          @click="expandContent"
        >
          <sl-icon name="plus"></sl-icon>
        </sl-button>
        <sl-button
          v-if="skel['width'] !== '1'"
          class="size-btn shrink"
          title="Shrink"
          size="small"
          @click="shrinkContent"
        >
          <sl-icon name="minus"></sl-icon>
        </sl-button>
        <edit></edit>
        <delete></delete>
      </sl-button-group>
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
        <h2 class="element-headline">
          {{ skel["kind"] }}
          <component v-if="skel['headline']">: {{ skel["headline"] }}</component>
          <component v-else-if="skel['subline']">: {{ skel["subline"] }}</component>
        </h2>
        <span
          class="text-desc"
          v-html="skel['descr']"
          v-if="skel['descr']"
        ></span>
        <span v-if="skel['downloaditems']">Dateien: {{ skel["downloaditems"].length }}</span>
        <span v-if="skel['url']">Navigation: {{ skel["url"] }}</span>
        <span class="sortindex">sortindex: {{ skel["sortindex"] }}</span>
      </div>
    </div>
    <div class="actions_after">
      <add
        :label="false"
        :params="{
          sortindex: calculateIndex(state.nextIdx),
          'fluidpage.dest.key': route.params['key']
        }"
      ></add>
    </div>
  </div>
</template>

<script>
import { Request } from "@viur/vue-utils"
import { computed, reactive, inject, provide } from "vue"
import Utils from "../utils"
import Edit from "../actions/edit.vue"
import Delete from "../actions/delete.vue"
import Add from "../actions/add.vue"
import { useRoute } from "vue-router"

export default {
  components: { Delete, Edit, Add },
  props: {
    skel: Object
  },
  setup(props, context) {
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
      })
    })
    const changeOrder = inject("changeOrder")
    const updateDragged = inject("updateDragged")
    const updateWidth = inject("updateWidth")
    const entrySelected = inject("entrySelected")
    const handlerState = inject("handlerState")
    const calculateIndex = inject("calculateIndex")
    const currentlist = inject("currentlist")

    function startDragging(e) {
      let target = e.target
      if (!target.classList.contains("fluid-element")) {
        target = target.closest(".fluidpage-element")
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
        target = target.closest(".fluidpage-element")
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
      updateWidth(props.skel["key"], parseInt(props.skel["width"]) + 1 + "")
    }

    function shrinkContent() {
      if (props.skel["width"] === "fullwidth") {
        updateWidth(props.skel["key"], "12")
      } else {
        updateWidth(props.skel["key"], parseInt(props.skel["width"]) - 1 + "")
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
      calculateIndex,
      Utils,
      route
    }
  }
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

  &.is-selected {
    cursor: initial;
    border: 1px solid var(--sl-color-primary-200);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);

    & .element-headline {
      color: var(--sl-color-primary-500);
    }

    & .actions_after,
    & .actions_before  {
      opacity: 1;
    }
  }
}

sl-button {
  &::part(base) {
    aspect-ratio: 1;
  }
}

:deep(.sl-button-group__button):not(.size-btn) {
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
  flex-wrap: nowrap;
  padding-bottom: var(--sl-spacing-small);
  margin-bottom: var(--sl-spacing-small);
  border-bottom: 1px solid var(--sl-color-neutral-300);
}

.dragger {
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1;
  cursor: move;
  width: 1.9em;
  margin-right: auto;
}

.element-headline {
  font-weight: bold;
  line-height: 1.3;
  margin-bottom: 10px;
}

.content {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  width: 100%;
  align-items: flex-start;
  height: calc(100% - 56px);

  sl-avatar{
    flex: 1 0 45%;
    aspect-ratio: 1;

    &::part(base){
      width: 100%;
      height: 100%;
    }
  }
}

.column {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: 100%;
}

.image {
  margin-right: var(--sl-spacing-medium);
  border: 1px solid var(--sl-color-neutral-300);
}

sl-button-group {
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

.actions_after {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transition: all ease .3s;
  z-index: 1;

  :deep(sl-button){
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
  transition: all ease .3s;
  z-index: 1;

  :deep(sl-button){
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
  width: 100%;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

</style>
