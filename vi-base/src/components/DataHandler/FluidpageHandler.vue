<template>
  <handler-bar :module="module"></handler-bar>
  <sl-details open summary="Info" v-if="modulesStore.state.loaded && modulesStore.state.modules[module]['help_text']">
    {{modulesStore.state.modules[module]["help_text"]}}
  </sl-details>

  <div class="fluid-wrap">
      <template v-for="grid in state.grids">
          <component v-if="grid[0] && grid[0]['width']==='fullwidth'"
                     v-for="contentSkel in grid"
                     :is="'element'"
                     :skel="contentSkel"
                     :key="contentSkel['key']"
                     @click="entrySelected(contentSkel)"
          >

          </component>

          <div v-else class="fluid-grid">
              <component v-for="contentSkel in grid"
                         :is="'element'"
                         :skel="contentSkel"
                         :key="contentSkel['key']"
                         @click="entrySelected(contentSkel)"
              >

              </component>
          </div>
      </template>
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
  unref
} from 'vue'
import HandlerBar from "../../components/Bars/HandlerBar.vue";
import {ListRequest, Request} from '@viur/viur-vue-utils'
import {useAppStore} from '../../stores/app'
import {useMessageStore} from "../../stores/message";
import router from "../../routes";
import {useModulesStore} from "../../stores/modules";
import {useRoute} from "vue-router";
import Loader from "../Generic/Loader.vue";
import Element from '../Fluidpage/element.vue'

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
  components: {Loader, HandlerBar, Element},
  setup(props, context) {
    const appStore = useAppStore();
    const route = useRoute()
    const messageStore = useMessageStore();
    const modulesStore = useModulesStore();

    const tableInst = ref(null)

    const state = reactive({
      storeName: computed(() => {
        let name: string = `module___${props.module}`
        if (props.view) {
          name += `___${props.view}`
        }
        name+= `___${route.query["_"]}`

        return name
      }),
      currentSelection: null,
      module: computed(() => props.module),
      group: computed(() => props.group),
      view: computed(() => props.view),
      editableTable: false,
      tableInst:computed(()=>tableInst),
      active:false,
      grids:computed(()=>{
          let contentgrids = []
          let currentgrid = []
          if(currentlist.state.skellist.length>0){
            for (const item of currentlist.state.skellist) {
                if (item["width"] === "fullwidth"){
                    contentgrids.push(currentgrid)
                    contentgrids.push([item])
                    currentgrid = []
                }else{
                    currentgrid.push(item)
                }
            }
            //write last grid
            contentgrids.push(currentgrid)
          }
          return contentgrids
      }),
      dragCurrentElement:null,
      draggedKeys:[],
      debounceSave:null
    })
    provide("state", state)
    const currentlist = ListRequest(state.storeName, {
      module: props.module,
      params: {"limit":99},
      group: props.group
    })
    appStore.setListStore(currentlist) //backup access

    function changeOrder(oldkey, newkey){
      state.draggedKeys = [oldkey,newkey]
      let oldidx = currentlist.state.skellist.findIndex(e=>e["key"]===oldkey)
      let newidx = currentlist.state.skellist.findIndex(e=>e["key"]===newkey)

      let element = currentlist.state.skellist[oldidx]
      currentlist.state.skellist.splice(oldidx,1)
      currentlist.state.skellist.splice(newidx,0, element)
    }
    provide("changeOrder",changeOrder)

    function updateDragged(){
      let idx = currentlist.state.skellist.findIndex(e=>e["key"]===state.draggedKeys[0])

      let currentEntry = currentlist.state.skellist[idx]
      if (idx === 0){
        let nextEntry = currentlist.state.skellist[idx+1]
        currentEntry["sortindex"] = nextEntry["sortindex"]-1
      }else if (idx === currentlist.state.skellist.length-1){
        let prevEntry = currentlist.state.skellist[idx-1]
        currentEntry["sortindex"] = prevEntry["sortindex"]+1
      }else{
        let nextEntry = currentlist.state.skellist[idx+1]
        let prevEntry = currentlist.state.skellist[idx-1]
        currentEntry["sortindex"] = prevEntry["sortindex"]+((nextEntry["sortindex"]-prevEntry["sortindex"])/2)
      }

      Request.edit(props.module,currentEntry["key"],{dataObj:{
        "sortindex":currentEntry["sortindex"]
      }}).then((resp)=>{
        messageStore.addMessage("success", `Edit`, "Entry saved successfully");
      })
    }
    provide("updateDragged",updateDragged)

    function updateWidth(key, width){
      let currentidx = currentlist.state.skellist.findIndex(e=>e["key"]===key)
      let newEntry = currentlist.state.skellist[currentidx]
      newEntry["width"] = width
      currentlist.state.skellist[currentidx] = newEntry

      if (state.debounceSave) {
            clearTimeout(state.debounceSave);
        }

        state.debounceSave = setTimeout(() => {
            Request.edit(props.module,key,{dataObj:{
              "width":width
            }}).then((resp)=>{
              messageStore.addMessage("success", `Edit`, "Entry saved successfully");
            })
        }, 500);
    }
    provide("updateWidth",updateWidth)

    function reloadAction() {
      return currentlist.fetch().catch((error) => {
        messageStore.addMessage("error", `${error.message}`, error.response.url)
      }).then((resp) => {
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
      currentlist.fetch().catch((error) => {
        messageStore.addMessage("error", `${error.message}`, error.response.url)
      })
    })

    onActivated(()=>{
      state.active = true

      if (appStore.getActiveTab()["update"]){
        reloadAction()
        appStore.getActiveTab()["update"]=false
      }

    })

    onDeactivated(()=>{
      state.active = false
    })

    function entrySelected(skel) {
      state.currentSelection = [skel]
      context.emit("currentSelection", state.currentSelection)
      appStore.state['skeldrawer.entry'] = skel
      appStore.state['skeldrawer.structure'] = currentlist.structure
    }
     provide("entrySelected", entrySelected);

    function openEditor(e: Event) {
      const url = `/${state.module}/edit/${e.detail.cell.getRow().getData().key}?_=${new Date().getTime()}`;
      let route = router.resolve(unref(url))

      appStore.addOpened(route, state.module, state.view);
      router.push(url);
    }


    return {
      state,
      currentlist,
      entrySelected,
      openEditor,
      modulesStore,
      tableInst,
      appStore

    }
  }
})
</script>

<style scoped lang="less">
.loader{
    position:absolute;
    width: 100%;
    height:50%
  }


.fluid-wrap {
  display: grid;
  grid-template-columns: [full-start] minmax(20px, 1fr) [main-start] minmax(0, 1200px) [main-end] minmax(20px, 1fr) [full-end];
  grid-gap: 20px 0;
  //margin: 0 -20px;
}

.fluid-grid {
  display: grid;
  grid-column: main;
  grid-template-columns: repeat(12, minmax(0, 100px) );
  grid-gap: 20px;

  .mq-print({
    padding: 0;
    margin: 0;
    display: block;
    flex: none;
    max-width: 210mm;
  });
}

@fluidHeightSmall: 100px;
@fluidHeightMedium: 125px;
@fluidHeightLarge: 150px;


@iterations: 12;
  .width-loop (@i) when (@i > 0) {
      &.fluid-width-@{i}{
        grid-column: ~"span @{i}";

        .mq-max(@breakMedium,{
            grid-column: span 6;
        });

        .mq-max(@breakSmall,{
            grid-column: span 12;
        });
      }
      .width-loop(@i - 1);
  }
  .width-loop (@iterations);

  &.fluid-width-fullwidth {
    grid-column: full;
  }

  &.fluid-height-small {
    height: @fluidHeightSmall;
    overflow-y: hidden;
  }
  &.fluid-height-medium {
    height: @fluidHeightMedium;
    overflow-y: hidden;
  }
  &.fluid-height-large {
    height: @fluidHeightLarge;
    overflow-y: hidden;
  }
  &.fluid-height-100 {
    height: 100vh;
    overflow-y: hidden;
  }

  &.fluid-height-1-1 {
    aspect-ratio: 1;
  }

  &.fluid-height-16-9 {
    aspect-ratio: 1.7777;
  }

  &.fluid-height-16-10 {
    aspect-ratio: 1.6;
  }

  &.fluid-height-4-3 {
    aspect-ratio: 1.3333;
  }


</style>
