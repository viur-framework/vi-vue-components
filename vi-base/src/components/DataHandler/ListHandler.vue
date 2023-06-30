<template>

  <div class="main-wrapper">
      <handler-bar :module="module"></handler-bar>


      <div class="table-wrapper" @scroll="stickyHeader">
        <sl-details open summary="Modul Info"
                  v-if="modulesStore.state.loaded && modulesStore.state.modules[module]['help_text']">
          <div v-html="modulesStore.state.modules[module]['help_text']"></div>
        </sl-details>
        <table ref="datatable">
          <thead>
            <tr>
              <th v-for="bone in state.selectedBones"
                  :class="{'stick-header':state.sticky}"
                  :style="{width: state.tableWidth+'px'}"
              >
                {{ currentlist.structure?.[bone]?.["descr"] }}
              </th>
            </tr>
          </thead>
          <tbody>
              <tr v-for="(skel,idx) in currentlist.state.skellist"
                  :class="{'selected':state.selectedRows.includes(idx)
                          }"
                  @click.exact="entrySelected(idx)"
                  @click.ctrl="entrySelected(idx,'append')"
                  @click.shift="entrySelected(idx,'range')"
              >
                <td v-for="(name) in state.selectedBones">
                  <div class="ellipsis">
                    {{ getBoneViewer(skel,name) }}
                  </div>
                </td>
              </tr>
          </tbody>
        </table>
      </div>
      <floating-bar></floating-bar>
    </div>

</template>

<script lang="ts">
//@ts-nocheck
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
  unref, inject
} from 'vue'
import HandlerBar from "../../components/Bars/HandlerBar.vue";
import {ListRequest, boneLogic} from '@viur/viur-vue-utils'
import {useDBStore} from '../../stores/db'
import {useMessageStore} from "../../stores/message";
import router from "../../routes";
import {useModulesStore} from "../../stores/modules";
import {useRoute} from "vue-router";
import Loader from "../Generic/Loader.vue";
import FloatingBar from "../Bars/FloatingBar.vue";

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    group: String,
    view: null,
    rowselect:{
      default:true
    }
  },
  emits:['currentSelection'],
  components: {FloatingBar, Loader, HandlerBar},
  setup(props, context) {
    const dbStore = useDBStore();
    const route = useRoute()
    const messageStore = useMessageStore();
    const modulesStore = useModulesStore();
    const datatable = ref(null)

    const state = reactive({
      type:"listhandler",
      storeName: computed(() => {
        let name: string = `module___${props.module}`
        if (props.view) {
          name += `___${props.view}`
        }
        name+= `___${route.query["_"]}`

        return name
      }),
      currentSelection: [],
      module: computed(() => props.module),
      group: computed(() => props.group),
      view: computed(() => props.view),
      editableTable: false,
      active:false,
      conf:{},

      selectedBones:[],
      selectedRows:[],
      sticky:false,
      tableWidth:computed(()=>{
        if(state.selectedBones.length>0){
          return Math.round(parseInt(datatable.value.clientWidth) / state.selectedBones.length)
        }
        return "150px"
      })
    })
    provide("state", state)
    const currentlist = ListRequest(state.storeName, {
      module: props.module,
      params: {},
      group: props.group,
      renderer:"vi"
    })

    dbStore.setListStore(currentlist) //backup access


    function reloadAction() {
      state.selectedBones = []
      currentlist.reset();
      return currentlist.fetch().catch((error) => {
        messageStore.addMessage("error", `${error.message}`, error.response?.url)
      }).then((resp) => {
        setSelectedBones()
        messageStore.addMessage("success", `Reload`, "Liste neu geladen")
      })
    }

    provide("reloadAction", reloadAction);

    function setLimit(limit:any) {
      currentlist.state.params["limit"]=limit;
      currentlist.reset();
      currentlist.fetch();
    }
    provide("setLimit", setLimit)

    onMounted(() => {
      state.conf = dbStore.getConfByRoute(route)
      if (state.conf) {
        if (Object.keys(state.conf).indexOf("filter") > -1) {
          for (const key in state.conf["filter"]) {
            currentlist.state.params[key] = state.conf["filter"][key]
          }
        }
      }

      currentlist.fetch().then((resp)=>{
        setSelectedBones()

      }).catch((error) => {
        messageStore.addMessage("error", `${error.message}`, error.response.url)
      })
    })

    onActivated(()=>{
      state.active = true
      if (dbStore.getActiveTab()["update"]){
        reloadAction()
        dbStore.getActiveTab()["update"]=false
      }

    })


    watch(()=>dbStore.getActiveTab()["update"],(newVal, oldVal)=>{
      const currentUpdate = dbStore.getActiveTab()
      if(currentlist.state.module===currentUpdate['module'] && newVal){
        reloadAction()
        dbStore.getActiveTab()["update"]=false
      }
    })

    onDeactivated(()=>{
      state.active = false
    })

    function entrySelected(idx, action='replace') {

      if(action === "append"){
        if(state.selectedRows.includes(idx)){
          state.selectedRows.splice(state.selectedRows.indexOf(idx),1)
        }else{
          state.selectedRows.push(idx)
        }
      }else if (action === "range"){
        let lastEntry = state.selectedRows[state.selectedRows.length -1]
        let end = idx
        let start = lastEntry
        if (lastEntry>idx){ //selection is smaller than last number
          start = idx
          end = lastEntry
        }
        state.selectedRows = state.selectedRows.concat(new Array(end+1 - start).fill().map((d, i) => i + start))

      }else{
        state.selectedRows = [idx]
      }

      state.selectedRows = [...new Set(state.selectedRows)] // remove duplicates and sort

      state.currentSelection = currentlist.state.skellist.filter((entry,idx)=> state.selectedRows.includes(idx))

      context.emit("currentSelection", state.currentSelection)
    }

    function openEditor(e: Event) {
      const url = `/db/${state.module}/edit/${e.detail.cell.getRow().getData().key}?_=${new Date().getTime()}`;
      let route = router.resolve(unref(url))
      dbStore.addOpened(route, state.module, state.view);
      router.push(url);
    }

    function nextpage() {
      return currentlist.next();
    }
    provide("nextpage", nextpage)
    provide("currentlist", currentlist)

    function getBoneViewer(skel, boneName){
      const {getBoneValue, bones_state} = boneLogic(skel, currentlist.structure)
      return getBoneValue(boneName, skel=skel)
    }

    function stickyHeader(e){
      if (e.target.scrollTop > 10){
        state.sticky=true
      }else{
        state.sticky=false
      }
    }

    function setSelectedBones(){
      let bones = []
      for(const [k,v] of Object.entries(currentlist.structure)){
        if(v["visible"]) bones.push(k)
      }


      state.selectedBones = bones
    }

    return {
      state,
      currentlist,
      entrySelected,
      openEditor,
      modulesStore,
      dbStore,
      nextpage,
      getBoneViewer,
      stickyHeader,
      datatable
    }
  }
})
</script>

<style scoped lang="less">
.main-wrapper{
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
  position: relative;
  width: 100%;
}

.loader{
    position:absolute;
    width: 100%;
    height:50%
  }

table{
  width: 100%;
  table-layout: fixed;

  tbody{
    tr{
      cursor: pointer;
      transition: all ease .3s;

      td{
        padding: .4em .6em;
        overflow: hidden;
        word-wrap: break-word;
        border-right: 1px solid var(--sl-color-gray-300);
        border-bottom: 1px solid var(--sl-color-gray-300);

        &:last-child{
          border-right: 0;
        }
      }

      &:nth-child(even){
        background-color: var(--sl-color-gray-100);
      }

      &:hover{
        background-color: var(--sl-color-gray-200);
      }
    }

    tr.selected{
      background-color: var(--sl-color-primary-50);

      td{
        font-weight: 700;
      }
    }
  }

  thead{
    th {
      position: relative;
      padding: .4em .6em;
      resize: horizontal;
      overflow: hidden;
      background: linear-gradient( var(--vi-background-color) 0%, var(--vi-background-color) calc(100% - 2px), var(--sl-color-neutral-700) 100% );
      font-weight: 700;
      border-right: 1px solid var(--sl-color-gray-300);
      text-overflow: ellipsis;

        &:last-child{
          border-right: 0;
        }


      &::-webkit-resizer {
        border-color: transparent;
        display: block;
      }

      &:after {
        content:"";
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

.table-wrapper{
  overflow:scroll;
  flex: 1;
}
.stick-header{
  position:sticky;
  top:0;
}


sl-details{
  &::part(prefix){
    display: none;
  }

  &::part(header){
    font-weight: bold;
    padding: var(--sl-spacing-small) var(--sl-spacing-medium);
  }

  &::part(content){
    padding: 0 var(--sl-spacing-medium) var(--sl-spacing-small) var(--sl-spacing-medium);
  }

  &::part(base){
    font-size: .95em;
    border: none;
    border-radius: 0;
    border-bottom: 1px solid var(--vi-border-color);
  }
}

.ellipsis{
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
