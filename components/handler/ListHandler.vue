<template>

  <div class="main-wrapper">
      <handler-bar :module="module"></handler-bar>

      <sl-details open summary="Modul Info"
                  v-if="modulesStore.state.loaded && modulesStore.state.modules[module]['help_text']">
        <div v-html="modulesStore.state.modules[module]['help_text']"></div>
      </sl-details>

      <div class="table-wrapper" @scroll="stickyHeader">
        <table ref="datatable">
          <thead>
            <tr>
              <th v-for="bone in state.selectedBones"
                :class="{'stick-header':state.sticky}"
                :style="{width: '150px'}"
              >
                {{ currentlist.structure?.[bone]?.["descr"] }}
                <div v-if="currentlist.state.state===2">
                  <sl-icon name="chevron-up" @click="sorting(bone,'asc')" class="sort-arrow" :class="{'sort-active':state.sorting===bone+'$asc'}"></sl-icon>
                  <sl-icon name="chevron-down" @click="sorting(bone,'desc')" class="sort-arrow" :class="{'sort-active':state.sorting===bone+'$desc'}"></sl-icon>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(skel,idx) in state.renderedList">
              <tr
                  :class="{'selected':state.selectedRows.includes(idx),
                           'is-hidden':!filter_update(skel)
                          }"
                  @dblclick="openEditor"
                  @click.exact="entrySelected(idx)"
                  @click.ctrl="entrySelected(idx,'append')"
                  @click.shift="entrySelected(idx,'range')"

              >
                <td v-for="(name) in state.selectedBones">
                  <div class="ellipsis">
                    {{skel[name]}}
                  </div>
                </td>
              </tr>
            </template>
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
import HandlerBar from "../bars/HandlerBar.vue";
import {ListRequest, boneLogic} from '@viur/vue-utils'
import {useDBStore} from '../stores/db'
import {useMessageStore} from "../stores/message";
import router from "../routes";
import {useModulesStore} from "../stores/modules";
import {useRoute} from "vue-router";
import Loader from "@viur/vue-utils/generic/Loader.vue";
import FloatingBar from "../bars/FloatingBar.vue";

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    group: String,
    view: null,
    rowselect:{
      default:2 //0 == disabled, 1==select One, 2: select multiple
    },
    selector:false
  },
  emits:['currentSelection','closeSelector'],
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
      tableWidth: "150",
      sorting:"",
      renderedList:computed(()=>{
        return currentlist.state.skellist.map(skel => {
          let vSkel = {}
          for(const [k,v] of Object.entries(skel)){
            vSkel[k] = getBoneViewer(skel,k).toString()
          }
          return vSkel
        })
      }),
      filter:null
    })
    provide("handlerState", state)
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

      if(action === "append" && props.rowselect>1){
        if(state.selectedRows.includes(idx)){
          state.selectedRows.splice(state.selectedRows.indexOf(idx),1)
        }else{
          state.selectedRows.push(idx)
        }
      }else if (action === "range" && props.rowselect>1){
        let lastEntry = state.selectedRows[state.selectedRows.length -1]
        let end = idx
        let start = lastEntry
        if (lastEntry>idx){ //selection is smaller than last number
          start = idx
          end = lastEntry
        }
        state.selectedRows = state.selectedRows.concat(new Array(end+1 - start).fill().map((d, i) => i + start))

      }else if( props.rowselect>0 ){
        state.selectedRows = [idx]
      }

      state.selectedRows = [...new Set(state.selectedRows)] // remove duplicates and sort

      state.currentSelection = currentlist.state.skellist.filter((entry,idx)=> state.selectedRows.includes(idx))
      if (state.currentSelection.length>0){
        dbStore.state['skeldrawer.entry'] = state.currentSelection[0]
        dbStore.state['skeldrawer.structure'] = currentlist.structure
      }

      context.emit("currentSelection", state.currentSelection)
    }

    function openEditor(e: Event) {
      if(props.selector){
        context.emit("closeSelector")
        return 0
      }
      const url = `/db/${state.module}/edit/${state.currentSelection[0]['key']}`;
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
      state.conf = dbStore.getConfByRoute(route)
      if (state.conf && state.conf?.['columns']) {
        state.selectedBones = state.conf['columns']
      }else{
        let bones = []
        for(const [k,v] of Object.entries(currentlist.structure)){
          if(v["visible"]) bones.push(k)
        }
        state.selectedBones = bones
      }
    }

    function filter_update(skel) {
        if (state.filter===null) return true
        let wordlist = state.filter ? state.filter.split(" ") : []
        for(const [k,v] of Object.entries(skel)){
          for (let word of wordlist) {
            word = word.toLowerCase().replace(/[\W_]+/g, ""); //remove all nun alphanum chars

            if (!word || word.length === 0) {

            } else {
                if(v.includes(word)){
                  return true
                }
            }
          }
        }
        return false
    }

    function sorting(field, direction) {
      if (field+"$"+direction === state.sorting){
        return 0
      }
      state.sorting = field+"$"+direction
      if (direction === "asc") {
        currentlist.state.skellist.sort((a, b) => {

          let aValue = a[field] || ''
          let bValue = b[field] || ''


          if(typeof aValue !== 'string'){
            aValue = aValue.toString()
          }
          if(typeof bValue !== 'string'){
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
          let aValue = a[field] || ''
          let bValue = b[field] || ''

          if(typeof aValue !== 'string'){
            aValue = aValue.toString()
          }
          if(typeof bValue !== 'string'){
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


    /*
    computed(()=>{
        if(state.selectedBones.length>0){
          let val = Math.round(parseInt(datatable.value.clientWidth) / state.selectedBones.length)
          if (val<150){
            return "150"
          }
          return Math.round(parseInt(datatable.value.clientWidth) / state.selectedBones.length)
        }
        return "150"
      })*/


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
      datatable,
      sorting,
      filter_update
    }
  }
})
</script>

<style scoped>
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

.ellipsis{
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sort-active{
  color: var(--sl-color-primary-500);
}

.sort-arrow{
  cursor: pointer;
}

table{
  width: 100%;
  table-layout: fixed;

  & tbody{
    & tr{
      cursor: pointer;
      transition: all ease .3s;

      & td{
        padding: .4em .6em;
        overflow: hidden;
        word-wrap: break-word;
        border-right: 1px solid var(--sl-color-neutral-300);
        border-bottom: 1px solid var(--sl-color-neutral-300);


        &:last-child{
          border-right: 0;
        }
      }

      &:nth-child(even){
        background-color: var(--sl-color-neutral-100);
      }

      &:hover{
        background-color: var(--sl-color-neutral-200);
      }
    }

    & tr.selected{
      background-color: var(--sl-color-neutral-300);

      td{
        font-weight: 700;
      }
    }
  }

  & thead{
    & th {
      position: relative;
      padding: .4em .6em;
      resize: horizontal;
      overflow: hidden;
      background: linear-gradient( var(--vi-background-color) 0%, var(--vi-background-color) calc(100% - 2px), var(--sl-color-neutral-700) 100% );
      font-weight: 700;
      border-right: 1px solid var(--sl-color-neutral-300);
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
  color: var(--vi-foreground-color);
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
</style>
