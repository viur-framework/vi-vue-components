<template>
  <div class="main-wrapper">
    <handler-bar
      v-if="!noTopbar"
      :module="module"
      handler="listhandler"
    ></handler-bar>
    <sl-details
      v-if="modulesStore.state.loaded && modulesStore.state.modules[module]?.['help_text']"
      open
      summary="Modul Info"
    >
      <div v-html="modulesStore.state.modules[module]['help_text']"></div>
    </sl-details>
    <div class="breadcrumb">
      <sl-breadcrumb>
        <sl-breadcrumb-item
          v-for="path in state.currentPath"
          :key="path['key']"
          @click="goToPath(path['key'])"
        >
          <sl-icon
            slot="prefix"
            :name="listItemMeta(path, 'node').icon"
            :library="listItemMeta(path, 'node').library"
          ></sl-icon>
          {{ Utils.renderValue( path["name"]) }}</sl-breadcrumb-item
        >
      </sl-breadcrumb>
      <div style="display:flex; flex-direction: row; gap:10px; align-items: center">
        <handler-context></handler-context>
      </div>
    </div>

    <sl-split-panel
      style="height: -moz-available; height: -webkit-fill-available"
      position-in-pixels="200"
      snap="200px"
    >
      <sl-tree
        slot="start"
        @sl-selection-change="nodeSelection"
      >
        <tree-item
          v-if="!state.needUpdate"
          :name="state.currentRootNode?.['name']"
          :skelkey="state.currentRootNode?.['key']"
          :node="state.currentRootNode"
          :current-path="state.currentPath"
          :load="true"
        ></tree-item>
      </sl-tree>
      <div
        slot="end"
        class="table-wrapper"
        @scroll="stickyHeader"
      >
        <loader
          v-if="handlerLogic.state.state === 0"
          size="3"
        ></loader>
        <table ref="datatable">
          <thead>
            <tr>
              <th
                style="width: 20px; min-width: 20px; padding: 0; resize: none; max-width: 20px"
                :class="{ 'stick-header': state.sticky }"
              ></th>
              <template v-for="bone in state.selectedBones">
                <th
                  v-if="handlerLogic.currentlist.structure?.[bone]"
                  :class="{ 'stick-header': state.sticky }"
                  :style="{ width: '150px' }"
                >
                  {{ handlerLogic.currentlist.structure?.[bone]?.["descr"] }}
                  <div
                    v-if="handlerLogic.currentlist.state.state === 2"
                    class="sort-arrow-wrap"
                  >
                    <sl-icon
                      v-if="state.sorting === '' || state.sorting !== bone + '$asc'"
                      name="caret-right-fill"
                      class="sort-arrow sort-up"
                      :class="{ 'sort-active': state.sorting === bone + '$desc' }"
                      :title="$t('actions.sortasc')"
                      @click="handlerLogic.sortAction(bone, 'asc')"
                    ></sl-icon>
                    <sl-icon
                      v-if="state.sorting === bone + '$asc'"
                      name="caret-right-fill"
                      class="sort-arrow sort-down"
                      :class="{ 'sort-active': state.sorting === bone + '$asc' }"
                      :title="$t('actions.sortdesc')"
                      @click="handlerLogic.sortAction(bone, 'desc')"
                    ></sl-icon>
                  </div>
                </th>
              </template>
            </tr>
          </thead>
          <vue-draggable v-model="state.skellist" @end="dragChange" tag="tbody" handle=".drag-handler" :disabled="false" direction="vertical">
            <template
              v-for="(skel, idx) in handlerLogic.currentNodeList?.state?.renderedSkellist"
              :key="skel['key']"
            >
              <tr
                data-skeltype="node"
                :class="{
                  selected: state.selectedRows.includes(idx) && state.currentSelectionType === 'node',
                  'is-hidden': !handlerLogic.filterAction(skel)
                }"
                @dblclick="primaryAction(skel, 'node')"
                @click.exact="entrySelected(idx, 'replace', 'node')"
                @click.ctrl="entrySelected(idx, 'append', 'node')"
                @click.shift="entrySelected(idx, 'range', 'node')"
              >
                <td>
                  <sl-icon
                    style="font-size: 1.1em"
                    :name="listItemMeta(handlerLogic.currentNodeList.state.skellist[idx], 'node').icon"
                    :library="listItemMeta(handlerLogic.currentNodeList.state.skellist[idx], 'node').library"
                  >
                  </sl-icon>
                </td>
                <template v-for="name in state.selectedBones">
                  <td v-if="handlerLogic.currentNodeList.structure?.[name]">
                    <component
                      :is="handlerLogic.getViewWidget(skel, name, idx)"
                      :skel="handlerLogic.currentNodeList.state.skellist[idx]"
                      :structure="handlerLogic.currentNodeList.structure"
                      :bonename="name"
                      :idx="idx"
                      :rendered="skel[name]"
                    >
                    </component>
                  </td>
                  <td v-else></td>
                </template>
              </tr>
            </template>

            <template
              v-for="(skel, idx) in handlerLogic.currentlist?.state?.renderedSkellist"
              :key="skel['key']"
            >
              <tr
                data-skeltype="leaf"
                :class="{
                  selected: state.selectedRows.includes(idx) && state.currentSelectionType === 'leaf',
                  'is-hidden': !handlerLogic.filterAction(skel)
                }"
                @dblclick="primaryAction(skel, 'leaf')"
                @click.exact="entrySelected(idx)"
                @click.ctrl="entrySelected(idx, 'append')"
                @click.shift="entrySelected(idx, 'range')"
              >
                <td>
                  <sl-icon
                    style="font-size: 1.1em"
                    :name="listItemMeta(handlerLogic.currentlist.state.skellist[idx], 'leaf').icon"
                    :library="listItemMeta(handlerLogic.currentlist.state.skellist[idx], 'leaf').library"
                  >
                  </sl-icon>
                </td>
                <template v-for="name in state.selectedBones">
                  <td v-if="handlerLogic.currentlist.structure?.[name]">
                    <component
                      :is="handlerLogic.getViewWidget(skel, name, idx)"
                      :skel="handlerLogic.currentlist.state.skellist[idx]"
                      :structure="handlerLogic.currentlist.structure"
                      :bonename="name"
                      :idx="idx"
                      :rendered="skel[name]"
                    >
                    </component>
                  </td>
                </template>
              </tr>
            </template>
          </vue-draggable>
        </table>
        <div
          v-if="
            handlerLogic.currentlist.state.renderedSkellist.length === 0 && handlerLogic.currentlist.state.state > 0
          "
          class="empty-message"
        >
          <sl-alert
            variant="info"
            open
            class="alert"
          >
            <sl-icon
              slot="icon"
              name="exclamation-triangle"
            ></sl-icon>
            <strong>Keine Einträge</strong>
          </sl-alert>
        </div>
      </div>
    </sl-split-panel>
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
  onUpdated,
  onMounted,
  ref,
  watch,
  onActivated,
  onDeactivated,
  unref,
  inject,
  toRaw
} from "vue"
import HandlerBar from "../bars/HandlerBar.vue"
import { ListRequest, boneLogic, Request } from "@viur/vue-utils"
import { useDBStore } from "../stores/db"
import { useMessageStore } from "../stores/message"
import { useModulesStore } from "../stores/modules"
import { useRoute, useRouter } from "vue-router"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import FloatingBar from "../bars/FloatingBar.vue"
import { useContextStore } from "../stores/context"
import { useLocalStore } from "../stores/local"
import WidgetSmall from "../dashboard/WidgetSmall.vue"
import BoneView from "../bones/boneView.vue"
import { useHandlerLogic } from "./handlerLogic"
import treeItem from "../tree/TreeItem.vue"
import Utils from "../utils"
import HandlerContext from "../main/context/HandlerContext.vue"
import { VueDraggable } from 'vue-draggable-plus'

  const props = defineProps({
    module: {
      type: String,
      required: true
    },
    group: String,
    view: null,
    rowselect: {
      default: 2 //0 == disabled, 1==select One, 2: select multiple
    },
    selector: false,
    filter: {},
    noTopbar: false,
    columns: []
  })
  const emit = defineEmits(["currentSelection", "closeSelector"])

    const dbStore = useDBStore()
    const route = useRoute()
    const router = useRouter()
    const messageStore = useMessageStore()
    const modulesStore = useModulesStore()
    const contextStore = useContextStore()
    const localStore = useLocalStore()
    const datatable = ref(null)

    const state = reactive({
      type: "treehandler",
      currentSelectionType: "leaf",
      currentSelection: [],
      selectedRows: [],

      module: computed(() => props.module),
      group: computed(() => props.group),
      view: computed(() => props.view),

      availableRootNodes: [],
      currentRootNode: null,
      currentPath: [],
      needUpdate: true, //performes a full update
      structure: computed(() => handlerLogic.currentlist.structure),
      tabId: route.query?.["_"],
      storeName: computed(() => {
        let name = `module___${props.module}`
        if (props.view) {
          name += `___${props.view}`
        }
        name += `___${route.query["_"]}`

        return name
      }),

      active: false,
      conf: {},

      selectedBones: [],

      sticky: false,
      tableWidth: "150",
      sorting: "",
      filter: null,
      sortindexBonename:null,
      entryUpdate:false,
      skellist:[]
    })
    provide("handlerState", state)

    const handlerLogic = useHandlerLogic(props, state)
    provide("reloadAction", reloadAction)
    provide("setLimit", handlerLogic.limitAction)
    provide("nextpage", handlerLogic.nextPageAction)
    provide("currentlist", handlerLogic.currentlist)
    provide("changeRootNode", handlerLogic.changeRootNode)

    function reloadAction(folderUpdate=false, params={}) {

      if (!folderUpdate){
        state.needUpdate = true
        state.currentSelection = [state.currentRootNode]
        state.currentSelectionType = "node"
      }
      return handlerLogic.reloadAction(params, state.needUpdate)
    }

    watch(
      () => state.currentRootNode,
      (newVal, oldVal) => {
        if (!newVal) return 0
        state.currentPath = [newVal]
        state.currentSelection = [state.currentRootNode]
      }
    )

    watch(
      () => state.currentPath,
      (newVal, oldVal) => {
        if (
          oldVal.length > 0 &&
          (newVal.length !== oldVal.length ||
            newVal[0]["key"] !== oldVal[0]["key"] ||
            newVal[newVal.length - 1]["key"] !== oldVal[oldVal.length - 1]["key"])
        ) {
          handlerLogic
            .reloadAction({ parententry: state.currentPath[state.currentPath.length - 1]["key"] }, state.needUpdate)
            .then((resp) => {
              handlerLogic.setSelectedBones()
            })
        }
      }
    )

    onMounted(() => {
      if (props.columns && props.columns.length > 0) {
        state.selectedBones = props.columns
      }
      handlerLogic.reloadAction().then((resp) => {
        handlerLogic.setSelectedBones()
      })
    })

    onActivated(() => {
      state.active = true
      let tabData = dbStore.getTabById(route.query["_"])

      if (tabData?.["update"]) {
        console.log("activate")
        handlerLogic.reloadAction()
        tabData["update"] = false
      }
    })

    watch(
      () => Object.values(contextStore.state.globalContext),
      (newVal, oldVal) => {
        handlerLogic.reloadAction().then((resp) => {
          handlerLogic.setSelectedBones()
        })
      }
    )

    watch(()=>handlerLogic.currentlist.state.skellist, (oldVal, newVal)=>{
      let newList = handlerLogic.currentlist.state.skellist.map(x =>{
        x["__skeltype"] = "leaf"
        return x
      })
      state.skellist = [...handlerLogic.currentNodeList.state.skellist, ...newList]

    })

    watch(()=>handlerLogic.currentNodeList.state.skellist, (oldVal, newVal)=>{
      let newList = handlerLogic.currentNodeList.state.skellist.map(x =>{
        x["__skeltype"] = "node"
        return x
      })
      state.skellist = [...newList, ...handlerLogic.currentlist.state.skellist]
    })


    onDeactivated(() => {
      state.active = false
    })

    function entrySelected(idx, action = "replace", skelType = "leaf") {
      if (state.currentSelectionType !== skelType) {
        action = "replace"
      }
      if (action === "append" && props.rowselect > 1) {
        if (state.selectedRows.includes(idx)) {
          state.selectedRows.splice(state.selectedRows.indexOf(idx), 1)
        } else {
          state.selectedRows.push(idx)
        }
      } else if (action === "range" && props.rowselect > 1) {
        let lastEntry = state.selectedRows[state.selectedRows.length - 1]
        let end = idx
        let start = lastEntry
        if (lastEntry > idx) {
          //selection is smaller than last number
          start = idx
          end = lastEntry
        }
        state.selectedRows = state.selectedRows.concat(new Array(end + 1 - start).fill().map((d, i) => i + start))
      } else if (props.rowselect > 0) {
        state.selectedRows = [idx]
      }

      let currentHandler = handlerLogic.currentHandlers[skelType]
      state.currentSelectionType = skelType
      state.selectedRows = [...new Set(state.selectedRows)] // remove duplicates and sort

      state.currentSelection = currentHandler.state.skellist.filter((entry, idx) => state.selectedRows.includes(idx))
      if (state.currentSelection.length > 0) {
        dbStore.state["skeldrawer.entry"] = state.currentSelection[0]
        dbStore.state["skeldrawer.structure"] = currentHandler.structure
      }

      emit("currentSelection", state.currentSelection)
    }

    function primaryAction(skel, skelType = "leaf") {
      //fluidpage injection - rework
      if (state.conf["handler"].startsWith("list.fluidpage")) {
        let conf = dbStore.getConf(state.module)
        let module = conf["handler"].split(".").at(-1).replace("/", ".")
        let url = `/db/${module}/fluidpage/${state.module}/${state.currentSelection[0]["key"]}`
        let route = router.resolve(unref(url))
        contextStore.setContext("fluidpage", state.currentSelection[0]["key"], state.tabId)
        dbStore.addOpened(route, module)
        return 0
      }

      if (skelType === "node") {
        goToPath(skel["key"])
      } else {
        handlerLogic.openEditor(null)
      }
    }

    function stickyHeader(e) {
      if (e.target.scrollTop > 10) {
        state.sticky = true
      } else {
        state.sticky = false
      }
    }

    function nodeSelection(e) {
      let newPath = e.detail.path.map((x) => {
        return x["value"]
      })

      state.currentSelectionType = "node"
      state.currentSelection = [e.detail.selection[0]["value"]]
      state.selectedRows = []
      state.currentPath = newPath
    }

    function goToPath(value) {
      let currentIndex = state.currentPath.findIndex((x) => x["key"] === value)
      console.log(currentIndex)
      if (currentIndex === -1) {
        console.log(state.currentSelection[0])
        state.currentPath = state.currentPath.concat([state.currentSelection[0]])
        return 0
      }
      state.currentPath = state.currentPath.splice(0, currentIndex + 1)
    }

    function itemMeta(item, skelType = "leaf") {
      let currentType = skelType

      if (item?.["kind"] && item?.["kind"] !== "-") {
        currentType += `.${item["kind"]}`
      }

      let currentMeta = toRaw(state.conf["kinds"]?.[currentType])
      if (!currentMeta) return 0
      if (Object.keys(state.conf["kinds"]).includes(currentType)) {
        currentMeta = state.conf["kinds"][currentType]
      }
      if (!Object.keys(currentMeta).includes("library")) {
        currentMeta["library"] = "default"
      }

      return currentMeta
    }
    provide("itemMeta", itemMeta)

    function listItemMeta(item, skelType = "leaf") {
      let currentMeta = { ...itemMeta(item, skelType) }
      let mimeBaseMatch = {
        image: "file-earmark-image",
        audio: "file-earmark-music",
        text: "file-earmark-text",
        "application/epub+zip": "file-earmark-text",
        "application/pdf": "file-earmark-pdf",
        "application/vnd.ms-powerpoint": "file-earmark-ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "file-earmark-ppt",
        "application/msword": "file-earmark-word",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "file-earmark-word",
        "application/zip": "file-earmark-zip",
        "application/x-7z-compressed": "file-earmark-zip",
        "application/vnd.rar": "file-earmark-zip",
        "application/x-tar": "file-earmark-zip",
        "application/gzip": "file-earmark-zip",
        "application/vnd.ms-excel": "file-earmark-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "file-earmark-excel",
        video: "file-earmark-play",
        "application/json": "file-earmark-code"
      }

      if (Object.keys(item).includes("mimetype")) {
        if (Object.keys(mimeBaseMatch).includes(item["mimetype"])) {
          currentMeta["icon"] = mimeBaseMatch[item["mimetype"]]
          currentMeta["library"] = "default"
        } else if (Object.keys(mimeBaseMatch).includes(item["mimetype"]?.split("/")?.[0])) {
          currentMeta["icon"] = mimeBaseMatch[item["mimetype"].split("/")[0]]
          currentMeta["library"] = "default"
        } else {
          currentMeta["icon"] = state.conf["kinds"]?.[skelType].icon
          currentMeta["library"] = state.conf["kinds"]?.[skelType].library
        }
      }
      return currentMeta
    }

    function dragChange(event){
      state.entryUpdate=true
      let preIdx = 0
      let nextIdx = 0
      let skeltype = event.item.dataset.skeltype //inject skeltype to determ correct listhandler
      let listhandler = handlerLogic.currentlist?.state


      if (skeltype === "node"){
        listhandler = handlerLogic.currentNodeList?.state
      }

      if (event.newIndex !==0){
        if(state.skellist[event.newIndex-1]["__skeltype"]===skeltype){
          preIdx = state.skellist[event.newIndex-1][state.sortindexBonename]
        }
      }
      if (event.newIndex!==state.skellist.length-1 && state.skellist[event.newIndex+1]["__skeltype"]===skeltype){
        nextIdx = state.skellist[event.newIndex+1][state.sortindexBonename]
      } else{
        nextIdx = new Date().getTime()
      }

      let newsortindex = preIdx + ((nextIdx-preIdx)/2)

      let currentEntry = event.data

      Request.securePost(`/vi/${listhandler.module}/move/${skeltype}/${currentEntry["key"]}`,{dataObj:{
        [state.sortindexBonename]:newsortindex,
        parentNode:currentEntry["parententry"]
        }}).then(async (resp)=>{
          let data = await resp.json()
          state.skellist[event.newIndex][state.sortindexBonename] = data['values'][state.sortindexBonename]
          state.entryUpdate=false

          reloadAction(true)
        }).catch((error)=>{
          state.entryUpdate=false
        })
    }
</script>

<style scoped>
sl-breadcrumb {
  margin: 10px;
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
  position: relative;
  width: 100%;
}

.loader {
  position: absolute;
  width: 100%;
  height: 50%;
}

.ellipsis {
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sort-active {
  opacity: 1 !important;
}

.sort-arrow {
  cursor: pointer;
  width: 100%;
  height: 100%;
  padding: 33%;
  opacity: 0;

  &.sort-down {
    transform: rotate(90deg);
  }

  &.sort-up {
    transform: rotate(-90deg);
  }
}

.sort-arrow-wrap {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 1.5em;
  height: 1.5em;
  position: absolute;
  right: 0.6em;

  &:hover .sort-arrow {
    opacity: 1 !important;
  }
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
      background-color: var(--sl-color-neutral-300);

      td {
        font-weight: 700;
      }
    }
  }

  & thead {
    & th {
      position: relative;
      padding: 0.4em 2.4em 0.4em 0.6em;
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
        .sort-arrow-wrap .sort-arrow {
          opacity: 0.4;
        }

        &:after {
          border-color: transparent transparent var(--sl-color-neutral-700) transparent;
        }
      }
    }
  }
}

.table-wrapper {
  color: var(--vi-foreground-color);
  overflow: auto;
  flex: 1;
  padding-bottom: 80px;

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--sl-color-neutral-400);
    border-radius: 3px;
  }
}
.stick-header {
  position: sticky;
  top: 0;
}

sl-details {
  &::part(prefix) {
    display: none;
  }

  &::part(header) {
    font-weight: bold;
    padding: var(--sl-spacing-small) var(--sl-spacing-medium);
  }

  &::part(content) {
    padding: 0 var(--sl-spacing-medium) var(--sl-spacing-small) var(--sl-spacing-medium);
  }

  &::part(base) {
    font-size: 0.95em;
    border: none;
    border-radius: 0;
    border-bottom: 1px solid var(--vi-border-color);
  }
}

.empty-message {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  overflow: hidden;
  justify-content: center;
  padding: 20px 20px 15px 20px;
}

sl-split-panel {
  --min: 25%;
  --max: 75%;
  --divider-width: 1px;

  &::part(divider){
    background-color: var(--vi-border-color);
   }

  overflow: auto;
}

sl-tree{
  display: flex;
  overflow: auto;

  &::part(base){
    width: 100%;
   }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--sl-color-neutral-400);
    border-radius: 3px;
  }
}

sl-tree-item {
  width: 100%;

  &::part(base) {
    width: 100%;
  }

}

.breadcrumb{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--sl-spacing-medium) 0 0;
  border-bottom: 1px solid var(--vi-border-color);
  font-size: .9em;
}

</style>
