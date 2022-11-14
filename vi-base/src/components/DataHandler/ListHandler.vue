<template>
  <handler-bar :module="module"></handler-bar>
  <!--<sl-table rowselect moveablecolumns height="800px"
            :structure.prop="currentlist.structure"
            :skellist.prop="currentlist.state.skellist"
            @sl-selectionChanged="entrySelected"
  >

  </sl-table>-->

  <sl-details open summary="Info" v-if="modulesStore.state.loaded && modulesStore.state.modules[module]['help_text']">
    {{modulesStore.state.modules[module]["help_text"]}}
  </sl-details>
  <sl-table moveablecolumns
            :rowselect="true"
            :structure="currentlist.structure"
            :skellist="currentlist.state.skellist"
            :module="module"
            :editabletable="state.editableTable"
            @sl-selectionChanged="entrySelected"
            @sl-dblclick="openEditor"
            height="500px"

  >

  </sl-table>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed, provide, onBeforeMount, onUpdated, onMounted} from 'vue'
import HandlerBar from "../../components/Bars/HandlerBar.vue";
import {ListRequest} from '@viur/viur-vue-utils'
import {useAppStore} from '../../stores/app'
import {useMessageStore} from "../../stores/message";
import router from "../../routes";
import {an} from "vitest/dist/global-d05ffb3f";
import {useModulesStore} from "../../stores/modules";

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    group: String,
    view: null
  },
  components: {HandlerBar},
  setup(props, context) {
    const appStore = useAppStore();
    const messageStore = useMessageStore();
    const modulesStore = useModulesStore();

    const state = reactive({
      storeName: computed(() => {
        let name: string = `module___${props.module}`
        if (props.view) {
          name += `___${props.view}`
        }
        return name
      }),
      currentSelection: null,
      module: computed(() => props.module),
      group: computed(() => props.group),
      view: computed(() => props.view),
      editableTable: false,

    })
    provide("state", state)
    const currentlist = ListRequest(state.storeName, {
      module: props.module,
      params: {},
      group: props.group
    })
    appStore.setListStore(currentlist) //backup access


    function reloadAction() {
      return currentlist.fetch().catch((error) => {
        messageStore.addMessage("error", `${error.message}`, error.response.url)
      }).then((resp) => {
        messageStore.addMessage("success", `Reload`, "Message Test")
      })
    }

    provide("reloadAction", reloadAction);

    function setLimit(limit:any) {
      currentlist.state.params["limit"]=limit;
      currentlist.reset();
      currentlist.fetch();
    }

    provide("setLimit", setLimit)

    onBeforeMount(() => {
      currentlist.fetch().catch((error) => {
        messageStore.addMessage("error", `${error.message}`, error.response.url)
      })
    })


    function entrySelected(e: Event) {
      state.currentSelection = e.detail.data
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
      appStore.addOpened(url, state.module, state.view);
      router.push(url);
    }

    return {
      state,
      currentlist,
      entrySelected,
      openEditor,
      modulesStore

    }
  }
})
</script>

<style scoped lang="less">
sl-table{
  &::part(base){
    margin-top: 0;
    border: none;
    border-radius: 0;
  }
}
</style>
