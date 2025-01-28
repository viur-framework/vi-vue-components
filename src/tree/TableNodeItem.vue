<template>
  <template
    v-for="(child, idx) in state.currentEntry['_nodes']"
    :key="child['key']"
  >
    <tr
      :draggable="child['_dragging'] && treeState.dragging"
      :data-layer="state.layer"
      class="entry"
      :class="{
        dropin: child['_isover'] && child['_drop'] === 'in',
        dropafter: child['_isover'] && child['_drop'] === 'after',
        dropbefore: child['_isover'] && child['_drop'] === 'before',
        active: isactive(idx)
      }"
      @dragstart="tree.onDragStart($event, idx)"
      @dragenter.prevent="tree.onDragEnter($event, idx)"
      @dragover.prevent="tree.onDragOver($event, idx)"
      @dragleave="tree.onDragLeave($event, idx)"
      @drop.stop="tree.onDrop($event, idx)"
    >
      <td
        class="expand-cell"
        @click="clickToExpand(idx)"
      >
        <div
          class="chevron"
          :style="{ marginLeft: path.concat([idx]).length - 2 + 'em' }"
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
      </td>

      <td
        v-if="treeState.dragging"
        class="drag-cell"
        @mouseup="tree.mouseUpHandle($event, idx)"
        @mousedown="tree.mouseDownHandle($event, idx)"
      >
        <div class="dragger">
          <sl-icon name="grip-vertical"></sl-icon>
        </div>
      </td>

      <template v-for="name in treeState.selectedBones">
        <td
          v-if="!name?.startsWith('_')"
          @click="selectChild(idx)"
          @dblclick="openEditor"
        >
          <div class="ellipsis">
            {{ getBoneViewer(child, name) }}
          </div>
        </td>
      </template>
    </tr>
    <table-node-item
      v-if="child['_expanded']"
      :module="module"
      :path="path.concat([idx])"
    ></table-node-item>
  </template>
</template>

<script setup>
import { reactive, defineComponent, inject, onBeforeMount, watch, computed, onMounted, unref, toRaw } from "vue"
import { useRouter } from "vue-router"
import { useDBStore } from "../stores/db"
import { Request, boneLogic } from "@viur/vue-utils"
import useTree from "./tree.js"

  const props = defineProps({
    module: {
      type: String,
      required: true
    },
    path: {
      type: Array
    }
  })
  const emit = defineEmits(["loaded"])
    const treeState = inject("handlerState")
    const closeSelector = inject("closeSelector")
    const dbStore = useDBStore()
    const router = useRouter()
    const state = reactive({
      currentEntry: {},
      layer: computed(() => props.path.length)
    })
    const tree = useTree(props.module, treeState, state)

    function structureToDict(structure) {
      if (Array.isArray(structure)) {
        let struct = {}
        for (const idx in structure) {
          struct[structure[idx][0]] = structure[idx][1]
        }
        return struct
      } else {
        return structure
      }
    }

    onMounted(() => {
      state.currentEntry = tree.EntryFromPath(props.path)
      if (props.path && props.path.length === 1 && props.path[0] === 0) {
        // prefetch rootnode childs
        state.currentEntry["_status"] = "loading"
        Request.get(`/vi/${props.module}/list`, {
          dataObj: {
            skelType: "node",
            orderby: "sortindex",
            parententry: state.currentEntry["key"],
            limit: 99,
            ...treeState.params
          }
        }).then(async (resp) => {
          let data = await resp.json()
          if (!treeState.structure || Object.keys(treeState.structure).length === 0) {
            let structure = data["structure"]
            if (!data["structure"]) {
              const moduleStructure = await Request.getStructure(treeState.module).then((structureResponse) =>
                structureResponse.json().then((_structure) => _structure)
              )
              structure = moduleStructure["viewNodeSkel"]
            }
            treeState.structure = structureToDict(structure)
          }

          state.currentEntry["_nodes"] = data["skellist"]
          state.currentEntry["_disabled"] = false
          state.currentEntry["_status"] = "loaded" //loading, loaded
          state.currentEntry["_dragging"] = false
          state.currentEntry["_isover"] = false
          state.currentEntry["_drop"] = null
          emit("loaded")
        })
      }
    })

    function selectChild(idx) {
      treeState.selectedPath = props.path.concat([idx])
    }

    function isactive(idx) {
      return treeState.selectedPath.toString() === props.path.concat([idx]).toString()
    }

    function clickToExpand(idx) {
      console.log("expand")
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

    function getBoneViewer(skel, boneName) {
      const { getBoneValue, bones_state } = boneLogic(skel, treeState.structure)
      return getBoneValue(boneName, (skel = skel))
    }

    function openEditor(e) {
      if (treeState.selector) {
        closeSelector()
        return 0
      }

      const url = `/db/${treeState.module}/edit/node/${treeState.currentSelection[0]["key"]}`
      let route = router.resolve(unref(url))
      dbStore.addOpened(route, treeState.module, treeState.view)
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

.ellipsis {
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

tr {
  cursor: pointer;
  transition: all ease 0.3s;

  & td {
    padding: 0.4em 0.6em;
    overflow: hidden;
    word-wrap: break-word;
    border-right: 1px solid var(--sl-color-neutral-300);
    border-bottom: 1px solid var(--sl-color-neutral-300);

    &:last-child {
      border-right: 0;
    }
  }

  &.selected {
    background-color: var(--sl-color-primary-50);

    td {
      font-weight: 700;
    }
  }

  &:not([data-layer="1"]) {
    & .chevron {
      position: relative;

      &:before {
        content: "";
        display: inline-block;
        position: absolute;
        width: 0.3em;
        height: 0.5em;
        top: 0;
        left: -0.35em;
        border-bottom: 1px solid var(--sl-color-neutral-600);
        border-left: 1px solid var(--sl-color-neutral-600);
      }
    }
  }

  &:nth-child(even) {
    background-color: var(--sl-color-neutral-100);
  }

  &:hover {
    background-color: var(--sl-color-neutral-200);
  }
}

.drag-cell {
  padding: 0;
  cursor: move;
  opacity: 0.2;
  transition: opacity ease 0.3s;
  color: var(--vi-foreground-color);
  border-right: none;
  position: relative;
  text-align: center;
  vertical-align: middle;

  &:hover {
    opacity: 1;
  }
}

.dragger {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 1em;

  & sl-icon {
    font-size: 1.5em;
  }
}

.entry {
  padding: 0 10px;
  cursor: pointer;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;

  &.active {
    background-color: var(--sl-color-neutral-300);

    td {
      font-weight: 700;
    }
  }

  &:hover {
    .drag-cell {
      opacity: 1;
    }
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.6);
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
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

.expand-cell {
  border-right: none;
  padding: 0.4em 0.3em;
}

.chevron {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1em;
  height: 1em;
  margin-right: var(--sl-spacing-x-small);

  & sl-icon {
    font-size: 0.7em;
    color: var(--sl-color-neutral-700);

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
