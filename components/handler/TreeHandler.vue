<template>
    <handler-bar :module="module"></handler-bar>
  <template v-if="state.currentRootNode">
    <file-browser :rootnode="state.currentRootNode"
                  :module="module"
                  :dragging="true"
                  @changed="onSelectionChanged"
    >
      </file-browser>

  </template>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed, provide, onBeforeMount, watch, onActivated, onDeactivated} from 'vue'
import HandlerBar from "../bars/HandlerBar.vue";
import {ListRequest} from '@viur/vue-utils'
import {useDBStore} from '../stores/db'
import {Request} from "@viur/vue-utils";
import FileBrowser from '../tree/FileBrowser.vue';
import {useMessageStore} from "../stores/message";
import {useUserStore} from "../stores/user";
import {useContextStore} from "../stores/context";

export default defineComponent({
    props: {
        module: {
            type: String,
            required: true
        },
        view: null,
        selector:false
    },
    emits:["currentSelection"],
    components: {FileBrowser, HandlerBar},
    setup(props, context) {
        const dbStore = useDBStore()
        const userStore = useUserStore()
        const contextStore = useContextStore()


        const state = reactive({
            type:"treehandler",
            currentRootNodes: [],
            currentRootNode: null,
            module: computed(() => props.module),
            group: null,
            view: computed(() => props.view),
            active:false,
            currentSelection:null,
            currentSelectionType:null,
            selector:computed(()=>props.selector),
            selectedBones:[],
            selectedRows:[],
        })
        provide("handlerState", state) // expose to components

        function fetchRoots() {
            let context = contextStore.getCurrentContext()
            if(Object.keys(context).includes('parentrepo')){
              state.currentRootNode = {"name":"Repo","key":context['parentrepo']}
              state.currentRootNodes = [state.currentRootNode]
              return 0
            }

            return Request.get(`/vi/${props.module}/listRootNodes`).then(async (resp) => {
                let data = await resp.json()
                state.currentRootNodes = data
                state.currentRootNode = data[0]
            }).catch((error)=>{
              if(error.statusCode === 401) userStore.updateUser()
            })
        }

        function fetchInitData() {
            return fetchRoots()
        }

        function reloadAction() {
            state.currentRootNode = null
            return fetchRoots()
        }

        provide("reloadAction", reloadAction)


        onBeforeMount(() => {
            fetchInitData()
        })

        onActivated(()=>{
          state.active = true

          if (dbStore.getActiveTab()["update"]){
            reloadAction()
            dbStore.getActiveTab()["update"]=false
          }

        })

        onDeactivated(()=>{
          state.active = false
        })

        function onSelectionChanged(selection, type){
          if (selection){
            state.currentSelection = [selection]
            state.currentSelectionType = type
          }else{
            state.currentSelection = null
            state.currentSelectionType = null
          }

          context.emit("currentSelection", state.currentSelection)
        }


        function setSelectedBones(){
          let bones = []
          for(const [k,v] of Object.entries(state.structure)){
            if(v["visible"]) bones.push(k)
          }
          state.selectedBones = bones
        }

        return {
            state,
            onSelectionChanged
        }
    }
})
</script>

<style scoped>

sl-split-panel {
    --min: 300px;
    --max: 40%;
    flex: 1;

    &::part(panel){
      display: flex;
      flex-direction: column;
    }
}

sl-table{
  &::part(base){
    margin-top: 0;
    border: none;
    border-radius: 0;
  }
}

</style>