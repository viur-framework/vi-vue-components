<template>
  <li
    v-for="(child, idx) in state.currentEntry['_nodes']"
    :key="child['key']"
    :style="{ marginLeft: (path.concat([idx]).length - 2) * 10 + 'px' }"
  >
    <div
      class="entry"
      :draggable="child['_dragging'] && treeState.dragging"
      :class="{
        dropin: child['_isover'] && child['_drop'] === 'in',
        dropafter: child['_isover'] && child['_drop'] === 'after',
        dropbefore: child['_isover'] && child['_drop'] === 'before'
      }"
      @dragstart="tree.onDragStart($event, idx)"
      @dragenter.prevent="tree.onDragEnter($event, idx)"
      @dragover.prevent="tree.onDragOver($event, idx)"
      @dragleave="tree.onDragLeave($event, idx)"
      @drop.stop="tree.onDrop($event, idx)"
      @click="selectChild(idx)"
    >
      <div
        v-if="treeState.dragging"
        class="dragger"
        @mouseup="tree.mouseUpHandle($event, idx)"
        @mousedown="tree.mouseDownHandle($event, idx)"
      >
        <sl-icon name="grip-vertical"></sl-icon>
      </div>

      <div
        class="chevron"
        @click="clickToExpand(idx)"
      >
        <sl-icon
          name="caret-right-fill"
          :class="{ disabled: child['_disabled'], expanded: child['_expanded'] }"
        ></sl-icon>
      </div>

      <div
        v-if="child['_status'] === 'loading'"
        class="loading"
      >
        <sl-spinner-viur></sl-spinner-viur>
      </div>

      <div
        class="item"
        :class="{ active: isactive(idx) }"
      >
        <sl-icon
          name="folder"
          class="item-icon"
        ></sl-icon>

        <div class="title">
          {{ child["name"] }}
        </div>
      </div>
    </div>
    <tree-folder-item
      v-if="child['_expanded']"
      :module="module"
      :path="path.concat([idx])"
    ></tree-folder-item>
  </li>
</template>

<script setup>
import { reactive, defineComponent, inject, onBeforeMount, watch, computed, onMounted, unref, toRaw } from "vue"
import { Request } from "@viur/vue-utils"
import useTree from "./tree.js"


  const props = defineProps( {
    module: {
      type: String,
      required: true
    },
    path: {
      type: Array
    }
  })

    const treeState = inject("handlerState")
    const state = reactive({
      currentEntry: {},
      currentRootNode: null
    })
    const tree = useTree(props.module, treeState, state)

    onMounted(() => {
      buildCurrentEntry()
    })
    watch(
      () => props.path,
      (newVal, oldVal) => {
        if (!newVal.every((x) => oldVal.includes(x))) {
          buildCurrentEntry()
        } else if (props.path.length === 1 && state.currentRootNode != treeState.tree?.[0]?.["key"]) {
          buildCurrentEntry()
        }
      }
    )
    function selectChild(idx) {
      treeState.selectedPath = props.path.concat([idx])
    }

    function isactive(idx) {
      return treeState.selectedPath.toString() === props.path.concat([idx]).toString()
    }

    function clickToExpand(idx) {
      if (state.currentEntry["_nodes"][idx]["_loading"] === true) return 0 //wait

      if (!Object.keys(state.currentEntry["_nodes"][idx]).includes("_nodes")) {
        tree.requestChildren(idx).then(() => expandChildren(idx))
      } else {
        expandChildren(idx)
      }
    }

    function expandChildren(idx) {
      let clickedEntry = state.currentEntry["_nodes"][idx]
      if (Object.keys(clickedEntry).includes("_expanded")) {
        clickedEntry["_expanded"] = !clickedEntry["_expanded"]
      } else {
        clickedEntry["_expanded"] = true
      }
    }
    function buildCurrentEntry() {
      state.currentEntry = tree.EntryFromPath(props.path)
      if (props.path && props.path.length === 1 && props.path[0] === 0) {
        // prefetch rootnode childs
        state.currentRootNode = state.currentEntry["key"]
        state.currentEntry["_status"] = "loading"
        Request.get(`/vi/${props.module}/list`, {
          dataObj: {
            skelType: "node",
            orderby: "sortindex",
            parententry: state.currentEntry["key"],
            ...treeState.params
          }
        }).then(async (resp) => {
          let data = await resp.json()
          state.currentEntry["_nodes"] = data["skellist"]
          state.currentEntry["_disabled"] = false
          state.currentEntry["_status"] = "loaded" //loading, loaded
          state.currentEntry["_dragging"] = false
          state.currentEntry["_isover"] = false
          state.currentEntry["_drop"] = null
        })
      }
    }
</script>

<style scoped>
.dropin {
  background-color: var(--sl-color-neutral-400);
}

.dropafter {
  border-bottom: 4px solid var(--sl-color-neutral-400) !important;
}

.dropbefore {
  border-top: 4px solid var(--sl-color-neutral-400) !important;
}

.dragger {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-right: var(--sl-spacing-x-small);
  height: 100%;
  cursor: move;
  opacity: 0.2;
  transition: opacity ease 0.3s;
  color: var(--vi-foreground-color);

  & sl-icon {
    font-size: 1em;
  }
}

.active {
  color: var(--sl-color-primary-500);
  font-weight: 600;
}

.entry {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 10px;
  cursor: pointer;
  position: relative;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;

  &:hover {
    background-color: var(--sl-color-neutral-100);

    & .dragger {
      opacity: 1;
    }
  }
}

.loading {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.6);
}

.item {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.item-icon {
  width: 1em;
  height: 1em;
  margin-right: var(--sl-spacing-small);
  color: var(--vi-foreground-color);
}

.chevron {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1em;
  min-width: 1em;
  height: 1em;
  margin-right: var(--sl-spacing-x-small);

  & sl-icon {
    font-size: 0.7em;
    color: var(--vi-foreground-color);

    &.expanded {
      transform: rotate(90deg);
    }

    &.disabled {
      opacity: 0.4;
    }
  }
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--vi-foreground-color);
}

.disabled {
  opacity: 0.4;
}
</style>
