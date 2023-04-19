<template>

  <div class="main-wrapper">
      <handler-bar :module="module"></handler-bar>

      <sl-details open summary="Modul Info"
                  v-if="modulesStore.state.loaded && modulesStore.state.modules[module]['help_text']">
        {{modulesStore.state.modules[module]["help_text"]}}
      </sl-details>

        <sl-table moveablecolumns
                  :rowselect="rowselect"
                  :structure="currentlist.structure"
                  :skellist="currentlist.state.skellist"
                  :module="module"
                  :editabletable="state.editableTable"
                  @sl-selectionChanged="entrySelected"
                  @sl-dblclick="openEditor"
                  @table-fetchData="nextpage"
                  height="100%"
                  ref="tableInst"

        >

        </sl-table>

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
  unref
} from 'vue'
import HandlerBar from "../../components/Bars/HandlerBar.vue";
import {ListRequest} from '@viur/viur-vue-utils'
import {useAppStore} from '../../stores/app'
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
    const appStore = useAppStore();
    const route = useRoute()
    const messageStore = useMessageStore();
    const modulesStore = useModulesStore();
    const tableInst = ref(null)

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
      currentSelection: null,
      module: computed(() => props.module),
      group: computed(() => props.group),
      view: computed(() => props.view),
      editableTable: false,
      tableInst:computed(()=>tableInst),
      active:false,
      conf:{},
    })
    provide("state", state)
    const currentlist = ListRequest(state.storeName, {
      module: props.module,
      params: {},
      group: props.group,
      renderer:"vi"
    })
    appStore.setListStore(currentlist) //backup access


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
      state.conf = appStore.getConfByRoute(route)
      if(Object.keys(state.conf).indexOf("filter")>-1)
      {
        for (const key in state.conf["filter"])
        {
          currentlist.state.params[key]=state.conf["filter"][key]
        }
      }
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

    function entrySelected(e: Event) {
      state.currentSelection = e.detail.data
      context.emit("currentSelection", state.currentSelection)
      if (e.detail.data.length > 0) {
        appStore.state['skeldrawer.entry'] = e.detail.data[e.detail.data.length - 1]
        appStore.state['skeldrawer.structure'] = currentlist.structure
      } else {
        appStore.state['skeldrawer.entry'] = {}
        appStore.state['skeldrawer.structure'] = {}
      }

    }

    function openEditor(e: Event) {
      const url = `/${state.module}/edit/${e.detail.cell.getRow().getData().key}?_=${new Date().getTime()}`;
      let route = router.resolve(unref(url))

      appStore.addOpened(route, state.module, state.view);
      router.push(url);
    }

    function nextpage(){
      return currentlist.next()
    }
    provide("nextpage", nextpage)
    provide("currentlist", currentlist)

    return {
      state,
      currentlist,
      entrySelected,
      openEditor,
      modulesStore,
      tableInst,
      appStore,
      nextpage,

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

.loader{
    position:absolute;
    width: 100%;
    height:50%
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
