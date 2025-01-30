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

    <div
      class="table-wrapper"
      @scroll="stickyHeader"
    >
      <loader
        v-if="currentlist.state.state === 0"
        size="3"
      ></loader>
      <div style="float: right; margin-right: 10px">
        <div style="display:flex; flex-direction: row; gap:10px; align-items: center">
          <handler-context></handler-context>
        </div>
      </div>

      <table ref="datatable">
        <thead>
          <tr>
            <template v-for="bone in state.selectedBones">
              <th
                v-if="currentlist.structure?.[bone]"
                :class="{ 'stick-header': state.sticky }"
                :style="{ width: '150px' }"
              >
                {{ currentlist.structure?.[bone]?.["descr"] }}
                <div
                  v-if="currentlist.state.state === 2"
                  class="sort-arrow-wrap"
                >
                  <sl-icon
                    v-if="state.sorting === '' || state.sorting !== bone + '$asc'"
                    name="caret-right-fill"
                    class="sort-arrow sort-up"
                    :class="{ 'sort-active': state.sorting === bone + '$desc' }"
                    :title="$t('actions.sortasc')"
                    @click="sorting(bone, 'asc')"
                  ></sl-icon>
                  <sl-icon
                    v-if="state.sorting === bone + '$asc'"
                    name="caret-right-fill"
                    class="sort-arrow sort-down"
                    :class="{ 'sort-active': state.sorting === bone + '$asc' }"
                    :title="$t('actions.sortdesc')"
                    @click="sorting(bone, 'desc')"
                  ></sl-icon>
                </div>
              </th>
            </template>
          </tr>
        </thead>
        <vue-draggable v-model="currentlist.state.skellist" @end="dragChange" tag="tbody" handle=".drag-handler" :disabled="false" direction="vertical">
          <template v-for="(skel, idx) in state.renderedList">
            <tr
              :class="{ selected: state.selectedRows.includes(idx), 'is-hidden': !skel['_visible'] }"
              @dblclick="primaryAction"
              @click.exact="entrySelected(idx)"
              @click.ctrl="entrySelected(idx, 'append')"
              @click.shift="entrySelected(idx, 'range')"
            >
              <template v-for="name in state.selectedBones">
                <td v-if="currentlist.structure?.[name]"
                >
                  <component
                    :is="getWidget(skel, name, idx)"
                    :skel="currentlist.state.skellist[idx]"
                    :structure="currentlist.structure"
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
        v-if="state.emptyList"
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
  inject
} from "vue"
import HandlerBar from "../bars/HandlerBar.vue"
import {ListRequest, boneLogic, Request} from "@viur/vue-utils"
import { useDBStore } from "../stores/db"
import { useAppStore } from "../stores/app"
import { useMessageStore } from "../stores/message"
import { useModulesStore } from "../stores/modules"
import { useRoute, useRouter } from "vue-router"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import FloatingBar from "../bars/FloatingBar.vue"
import { useContextStore } from "../stores/context"
import { useLocalStore } from "../stores/local"
import WidgetSmall from "../dashboard/WidgetSmall.vue"
import BoneView from "../bones/boneView.vue"
import SortindexView from "../bones/sortindexView.vue";
import HandlerContext from "../main/context/HandlerContext.vue"
import { VueDraggable } from 'vue-draggable-plus'
import { useCachedRequestsStore} from '@viur/vue-utils/utils/request'
import Utils from '../utils'

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
    columns: {
      default:undefined
    }
  })
  const emit = defineEmits(["currentSelection", "closeSelector"])

    const dbStore = useDBStore()
    const route = useRoute()
    const router = useRouter()
    const messageStore = useMessageStore()
    const modulesStore = useModulesStore()
    const contextStore = useContextStore()
    const localStore = useLocalStore()
    const appStore = useAppStore()

    const cachedRequestsStore = useCachedRequestsStore()

    const datatable = ref(null)

    const state = reactive({
      type: "listhandler",
      tabId: route.query?.["_"],
      storeName: computed(() => {
        let name = `module___${props.module}`
        if (props.view) {
          name += `___${props.view}`
        }
        name += `___${route.query["_"]}`

        return name
      }),
      currentSelection: [],
      module: computed(() => props.module),
      group: computed(() => props.group),
      view: computed(() => props.view),
      listfilter: computed(()=>props.filter),
      editableTable: false,
      active: false,
      conf: {},

      selectedBones: [],
      selectedRows: [],
      sticky: false,
      tableWidth: "150",
      sorting: "",
      renderedList: computed(() => {
        return currentlist.state.skellist.map((skel) => {
          let vSkel = {}
          for (const [k, v] of Object.entries(skel)) {
            vSkel[k] = getBoneViewer(skel, k).toString()
          }
          vSkel["_visible"] = filter_update(vSkel) ? "true" : ""
          return vSkel
        })
      }),
      filter: null,
      emptyList: computed(()=>{
        if (state.renderedList.length === 0 && currentlist.state.state > 0){
          return true
        }

        if (state.renderedList.filter(x=>x['_visible']).length===0){
          return true
        }
        return false
      }),
      sortindexBonename:null,
      entryUpdate:false
    })
    provide("handlerState", state)
    const currentlist = ListRequest(state.storeName, {
      module: props.module,
      params: {},
      group: props.group,
      renderer: "vi",
      cached:true
    })

    dbStore.setListStore(currentlist) //backup access

    function reloadAction(existsCheck=false) {

      if (existsCheck){
        checkBoneExists()
        return 0
      }

      state.selectedBones = []
      currentlist.reset()
      currentlist.state.params = { ...currentlist.state.params, ...contextStore.getContext(), ...props.filter  }
      return currentlist
        .fetch()
        .catch((error) => {
          setSelectedBones()
          messageStore.addMessage("error", `${error.message}`, error.response?.url)
        })
        .then((resp) => {
          setSelectedBones()
          messageStore.addMessage("success", `Reload`, "Liste neu geladen")
        })
    }

    provide("reloadAction", reloadAction)

    function setLimit(limit) {
      currentlist.state.params["limit"] = limit
      currentlist.reset()
      currentlist.fetch()
    }
    provide("setLimit", setLimit)

    onBeforeMount(()=>{
      setSelectedBones()
    })

    onMounted(() => {
      if (props.columns && props.columns.length > 0) {
        state.selectedBones = props.columns
      }
      state.conf = dbStore.getConf(props.module, props.view)
      if (state.conf) {
        if (Object.keys(state.conf).indexOf("filter") > -1) {
          for (const key in state.conf["filter"]) {
            currentlist.state.params[key] = state.conf["filter"][key]
          }
        }
        if(state.conf?.["context"]){
          for (const key in state.conf["context"]) {
            currentlist.state.params[key] = state.conf["context"][key]
          }
        }
      }

      currentlist.state.params = { ...currentlist.state.params, ...contextStore.getContext(state.tabId), ...props.filter }
      currentlist.state.params["limit"] = localStore.state.listamount
      currentlist
        .fetch()
        .then((resp) => {
          setSelectedBones()
        })
        .catch((error) => {
          setSelectedBones()
          if (error.code !== 20 && typeof(error)!=='string'){
            messageStore.addMessage("error", `${error.message}`, error.response.url)
          }
        })
    })

    onActivated(() => {
      state.active = true
      let tabData = dbStore.getTabById(route.query["_"])

      if (tabData?.["update"]) {
        reloadAction()
        tabData["update"] = false
      }
    })

    watch(
      () => Object.values(contextStore.state.globalContext),
      (newVal, oldVal) => {
        reloadAction()
      }
    )

    onDeactivated(() => {
      state.active = false
    })

    function entrySelected(idx, action = "replace") {
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

      state.selectedRows = [...new Set(state.selectedRows)] // remove duplicates and sort

      state.currentSelection = currentlist.state.skellist.filter((entry, idx) => state.selectedRows.includes(idx))
      if (state.currentSelection.length > 0) {
        dbStore.state["skeldrawer.entry"] = state.currentSelection[0]
        dbStore.state["skeldrawer.structure"] = currentlist.structure
      }

      emit("currentSelection", state.currentSelection)
    }

    function openEditor(e) {
      if (props.selector) {
        emit("closeSelector", state.currentSelection)
        return 0
      }
      let url = `/db/${state.module}/edit/${state.currentSelection[0]["key"]}`
      if (state.group) {
        url = `/db/${state.module}/edit/${state.group}/${state.currentSelection[0]["key"]}`
      }
      let route = router.resolve(unref(url))
      dbStore.addOpened(route, state.module, state.view, Utils.extractNamefromSkel(state.currentSelection[0]))
    }

    function primaryAction(e) {
      if (!props.selector && state.conf["handler"].startsWith("list.fluidpage")) {
        let conf = dbStore.getConf(state.module)
        let module = conf["handler"].split(".").at(-1).replace("/", ".")
        let url = `/db/${module}/fluidpage/${state.module}/${state.currentSelection[0]["key"]}`
        let route = router.resolve(unref(url))
        contextStore.setContext("fluidpage", state.currentSelection[0]["key"], state.tabId)
        dbStore.addOpened(route, module, null,state.currentSelection[0]["name"])
        return 0
      }

      openEditor(e)
    }

    function nextpage() {
      return currentlist.next()
    }
    provide("nextpage", nextpage)
    provide("currentlist", currentlist)

    function getBoneViewer(skel, boneName) {
      const { getBoneValue, bones_state } = boneLogic(skel, currentlist.structure)
      let option = null
      if (currentlist.structure?.[boneName]?.["type"] === "date"){
        if(currentlist.structure[boneName]["date"] && !currentlist.structure[boneName]["time"]){
          option = "date"
        }

        if(currentlist.structure[boneName]["time"] && !currentlist.structure[boneName]["date"]){
          option = "time"
        }
      }

      return getBoneValue(boneName, option, skel)
    }

    function stickyHeader(e) {
      if (e.target.scrollTop > 10) {
        state.sticky = true
      } else {
        state.sticky = false
      }
    }

    function checkBoneExists(){
      for(const b of state.selectedBones){
        if (currentlist.state.skellist.length>0 && !Object.keys(currentlist.state.skellist[0]).includes(b)){
          reloadAction()
          break;
        }
      }
    }



    function setSelectedBones() {
      if (props.columns && props.columns.length > 0) {
        state.selectedBones = props.columns
        if (appStore.state.preflights){
          currentlist.state.headers = {"x-viur-bonelist": state.selectedBones.join(",")}
          checkBoneExists()
        }
        
        return 0
      }
      state.conf = dbStore.getConf(props.module, props.view)
      if (state.conf && state.conf?.["columns"] && state.conf?.["columns"].length > 0) {
        state.selectedBones = state.conf["columns"]
        if (appStore.state.preflights){
          currentlist.state.headers = {"x-viur-bonelist": state.selectedBones.join(",")}
          checkBoneExists()
        }
      } else {
        let bones = []
        for (const [k, v] of Object.entries(currentlist.structure)) {
          if (v["visible"]) bones.push(k)
        }
        state.selectedBones = bones
      }
    }

    function filter_update(skel) {
      if (state.filter === null || state.filter === "") return true
      let wordlist = state.filter ? state.filter.split(" ") : []
      const regexStr = /[^{a-zA-ZÄÖÜßüöä_0-9}]+/gu
      for (const [k, v] of Object.entries(skel)) {
        if (currentlist.structure?.[k]?.["visible"] === false) continue
        for (let word of wordlist) {
          word = word.toLowerCase().replace(regexStr, "") //remove all nun alphanum chars
          if (!word || word.length === 0) {
          } else {
            if (
              v
                .toLowerCase()
                .replace(regexStr, "")
                .includes(word)
            ) {
              return true
            }
          }
        }
      }
      return false
    }

    function sorting(field, direction) {
      if (field + "$" + direction === state.sorting) {
        return 0
      }
      state.sorting = field + "$" + direction
      if (direction === "asc") {
        currentlist.state.skellist.sort((a, b) => {
          let aValue = a[field] || ""
          let bValue = b[field] || ""

          if (typeof aValue !== "string") {
            aValue = aValue.toString()
          }
          if (typeof bValue !== "string") {
            bValue = bValue.toString()
          }
          if (aValue.toLowerCase() > bValue.toLowerCase()) {
            return 1
          } else {
            return -1
          }
        })
      } else {
        currentlist.state.skellist.sort((a, b) => {
          let aValue = a[field] || ""
          let bValue = b[field] || ""

          if (typeof aValue !== "string") {
            aValue = aValue.toString()
          }
          if (typeof bValue !== "string") {
            bValue = bValue.toString()
          }

          if (aValue.toLowerCase() < bValue.toLowerCase()) {
            return 1
          } else {
            return -1
          }
        })
      }
    }

    function getWidget(renderedSkel, name, idx) {
      let bone = currentlist.structure[name]
      if (!bone) return undefined
      let boneType = bone.type



      if (dbStore.state["bones.view"]) {
        if (Object.keys(dbStore.state["bones.view"]).includes(boneType)) {
          //exact match
          return dbStore.state["bones.view"][boneType]
        } else {
          let typeParts = boneType.split(".") //prefix match
          let matchingPrefixes = Object.entries(dbStore.state["bones.view"]).filter((prefix) =>
            prefix[0].startsWith(typeParts[0] + ".")
          )
          if (matchingPrefixes.length > 0) {
            matchingPrefixes.sort((a, b) => b.length - a.length)
            for (let prefix of matchingPrefixes) {
              if (boneType.startsWith(prefix[0])) {
                return dbStore.state["bones.view"][prefix[0]]
              }
            }
          }
        }
      }

      if (boneType==="numeric.sortindex"){
        state.sortindexBonename = name
        return SortindexView
      }

      return BoneView
    }

    function dragChange(event){
      state.entryUpdate = true
      let preIdx = 0
      let nextIdx = 0
      if (event.newIndex !==0){
        preIdx = currentlist.state.skellist[event.newIndex-1][state.sortindexBonename]
      }
      if (event.newIndex!==currentlist.state.skellist.length-1){
        nextIdx = currentlist.state.skellist[event.newIndex+1][state.sortindexBonename]
      } else{
        nextIdx = new Date().getTime()
      }

      let newsortindex = preIdx + ((nextIdx-preIdx)/2)



      Request.edit(currentlist.state.module, event.data["key"],{dataObj:{
        [state.sortindexBonename]:newsortindex
        }}).then(async (resp)=>{
          let data = await resp.json()
          currentlist.state.skellist[event.newIndex][state.sortindexBonename] = data['values'][state.sortindexBonename]
          state.entryUpdate = false
          cachedRequestsStore.clearCache(Request.buildUrl(`/${currentlist.state.renderer}/${currentlist.state.module}`))
        }).catch((error)=>{
          state.entryUpdate = false
        })
    }
</script>

<style scoped>
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
      -webkit-user-select: none; /* For Safari */
      -ms-user-select: none; /* For Internet Explorer */
      user-select: none; /* Standard syntax */

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
</style>
