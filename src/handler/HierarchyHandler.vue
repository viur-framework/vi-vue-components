<template>
  <div class="main-wrapper">
    <handler-bar :module="module"></handler-bar>

    <sl-details
      v-if="modulesStore.state.loaded && modulesStore.state.modules[module]?.['help_text']"
      open
      summary="Modul Info"
    >
      <div v-html="modulesStore.state.modules[module]['help_text']"></div>
    </sl-details>
    <div
      v-if="Object.keys(state.selectedPath).length > 0"
      class="table-wrapper"
      @scroll="stickyHeader"
    >
      <loader
        v-if="!state.ready"
        size="3"
      ></loader>
      <table>
        <thead>
          <tr>
            <th
              style="width: 50px"
              class="open-column"
            ></th>
            <th
              style="width: 10px"
              class="drag-column"
            ></th>
            <th
              v-for="name in state.selectedBones"
              style="width: 150px"
              :class="{ 'stick-header': state.sticky }"
            >
              {{ state.structure?.[name]["descr"] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <table-node-item
            :module="module"
            :path="state.currentRootNode ? [0] : []"
            @loaded="setSelectedBones"
          ></table-node-item>
        </tbody>
      </table>
    </div>
    <floating-bar></floating-bar>
  </div>
</template>

<script setup>

import {
  reactive,
  defineComponent,
  computed,
  provide,
  onBeforeMount,
  watch,
  toRaw,
  onActivated,
  onDeactivated
} from "vue"
import HandlerBar from "../bars/HandlerBar.vue"
import { Request } from "@viur/vue-utils"
import { useDBStore } from "../stores/db"
import { useModulesStore } from "../stores/modules"
import { useRoute } from "vue-router"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import TableNodeItem from "../tree/TableNodeItem.vue"
import FloatingBar from "../bars/FloatingBar.vue"
import useTree from "../tree/tree.js"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import HandlerContext from "../main/context/HandlerContext.vue";

  const props = defineProps({
    module: {
      type: String,
      required: true
    },
    view: null,
    selector: false
  })
  const emit = defineEmits(["currentSelection", "closeSelector"])

    const dbStore = useDBStore()
    const userStore = useUserStore()
    const modulesStore = useModulesStore()
    const route = useRoute()

    const state = reactive({
      type: "hierarchyhandler",
      skeltype: "node",
      storeName: computed(() => {
        let name = `module___${props.module}`
        if (props.view) {
          name += `___${props.view}`
        }
        return name
      }),
      tabId: route.query?.["_"],
      availableRootNodes: [],
      currentSelectionType: "node",
      currentRootNode: null,
      currentNode: null,
      nodes: [],
      module: props.module,
      group: null,
      view: computed(() => props.view),
      structure: {},
      active: false,
      selectedBones: [],
      selectedRows: [],
      sticky: false,

      dragging: true,
      selectedPath: [],
      draggedEntry: null,
      refreshList: false,
      tree: [],
      selectedEntries: computed(() => {
        let retVal = []
        let entry = state.tree
        let x = 0
        for (let i of state.selectedPath) {
          if (Array.isArray(entry)) {
            entry = entry[i]
            if (!entry) break
            entry["_expanded"] = true
            retVal.push(entry)
          }
          if (state.selectedPath.length - 1 !== x && Object.keys(entry).includes("_nodes")) {
            entry = entry["_nodes"]
          }
          x += 1
        }
        return retVal
      }),
      currentEntry: computed(() => {
        return tree.EntryFromPath(state.selectedPath)
      }),
      currentSelection: [],
      selector: computed(() => props.selector),
      ready: false,
      conf: null
    })
    provide("handlerState", state) // expose to components
    const tree = useTree(props.module, state, state)

    function reloadAction() {
      state.selectedPath = []
      return fetchRoots().then(() => {
        state.tree = [state.currentRootNode]
        state.selectedPath = [0]
      })
    }
    provide("reloadAction", reloadAction)

    function entrySelected(e) {
      console.log(state.selectedEntries)

      return 0
    }

    onActivated(() => {
      state.active = true

      let tabData = dbStore.getTabById(route.query["_"])

      if (tabData?.["update"]) {
        reloadAction()
        tabData["update"] = false
      }
    })

    onDeactivated(() => {
      state.active = false
    })

    function fetchRoots() {
      return Request.get(`/vi/${props.module}/listRootNodes`).then(async (resp) => {
        let data = await resp.json()
        state.availableRootNodes = data
        if (!state.currentRootNode) {
          state.currentRootNode = data[0]
        }
      })
    }

    onBeforeMount(() => {
      state.conf = dbStore.getConf(props.module, props.view)
      fetchRoots().then(() => {
        state.tree = [state.currentRootNode]
        state.selectedPath = [0]
      })
    })

    watch(
      () => state.selectedEntries,
      (newVal, oldVal) => {
        state.currentSelection = [state.currentEntry]
        emit("currentSelection", state.currentSelection)
      }
    )

    function setSelectedBones() {
      let conf = dbStore.getConf(state.module)
      state.ready = true
      let bones = []
      for (const [k, v] of Object.entries(state.structure)) {
        if (conf?.["columns"]) {
          if (conf["columns"].includes(k)) bones.push(k)
        } else {
          if (v["visible"]) bones.push(k)
        }
      }
      state.selectedBones = bones
    }

    function changeRootNode(key) {
      state.currentRootNode = state.availableRootNodes.filter((i) => i["key"] === key)[0]
      reloadAction()
    }
    provide("changeRootNode", changeRootNode)

    function closeSelector() {
      emit("closeSelector")
    }
    provide("closeSelector", closeSelector)

    function itemMeta(item, skelType = "leaf") {
      let currentType = skelType

      if (item?.["kind"] && item?.["kind"] !== "-") {
        currentType += `.${item["kind"]}`
      }

      let currentMeta = toRaw(state.conf?.["kinds"]?.[currentType])
      if (!currentMeta) return 0
      if (Object.keys(state.conf?.["kinds"]).includes(currentType)) {
        currentMeta = state.conf?.["kinds"][currentType]
      }
      if (!Object.keys(currentMeta).includes("library")) {
        currentMeta["library"] = "default"
      }

      return currentMeta
    }
    provide("itemMeta", itemMeta)
</script>

<style scoped>
.table-wrapper {
  overflow: auto;
  flex: 1;
}

table {
  width: 100%;
  table-layout: fixed;

  & tbody {
    & tr {
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

      &:nth-child(even) {
        background-color: var(--sl-color-neutral-100);
      }

      &:hover {
        background-color: var(--sl-color-neutral-200);
      }
    }

    & tr.selected {
      background-color: var(--sl-color-primary-50);

      td {
        font-weight: 700;
      }
    }
  }

  & thead {
    & th {
      position: relative;
      padding: 0.4em 0.6em;
      resize: horizontal;
      overflow: hidden;
      background: linear-gradient(
        var(--vi-background-color) 0%,
        var(--vi-background-color) calc(100% - 2px),
        var(--sl-color-neutral-700) 100%
      );
      font-weight: 700;
      border-right: 1px solid var(--sl-color-neutral-300);
      text-overflow: ellipsis;

      &:last-child {
        border-right: 0;
      }

      &::-webkit-resizer {
        border-color: transparent;
        display: block;
      }

      &:after {
        content: "";
        border-style: solid;
        border-width: 0 0 12px 12px;
        border-color: transparent transparent var(--sl-color-neutral-200) transparent;
        z-index: 1;
        position: absolute;
        right: 0;
        bottom: 2px;
        pointer-events: none;
      }

      &:hover {
        &:after {
          border-color: transparent transparent var(--sl-color-neutral-700) transparent;
        }
      }
    }
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
  position: relative;
}

.more-entries {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 15px;
  padding: 10px;
  background-color: var(--vi-label-background-color);
  border: 1px solid var(--sl-color-neutral-300);
  border-radius: var(--sl-border-radius-medium);
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
}

sl-select {
  &::part(form-control) {
    flex-direction: row;
    align-items: center;
  }

  &::part(form-control-label) {
    margin-right: 10px;
    font-size: 0.8em;
  }

  &::part(form-control-input) {
    width: 80px;
  }
}

sl-split-panel {
  --min: 300px;
  --max: 40%;
  flex: 1;

  &::part(panel) {
    display: flex;
    flex-direction: column;
  }
}

sl-table {
  flex: 1;
  display: flex;
  height: 0;

  &::part(base) {
    margin-top: 0;
    border: none;
    border-radius: 0;
  }
}

.drag-column {
  padding: 0;
  resize: none;
  border-right: none;

  &:after {
    content: none;
  }
}

.open-column {
  resize: none;
  border-right: none;

  &:after {
    content: none;
  }
}
</style>
