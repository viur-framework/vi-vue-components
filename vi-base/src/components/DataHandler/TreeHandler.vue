<template>
    <handler-bar :module="module"></handler-bar>
  <template v-if="state.currentRootNode">
    <file-browser :rootnode="state.currentRootNode" :module="module"
        :dragging="true"></file-browser>
  </template>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed, provide, onBeforeMount, watch, onActivated, onDeactivated} from 'vue'
import HandlerBar from "../../components/Bars/HandlerBar.vue";
import {ListRequest} from '@viur/viur-vue-utils'
import {useAppStore} from '../../stores/app'
import {Request} from "@viur/viur-vue-utils";
import FileBrowser from '../../components/Tree/FileBrowser.vue';

export default defineComponent({
    props: {
        module: {
            type: String,
            required: true
        },
        view: null
    },
    components: {FileBrowser, HandlerBar},
    setup(props, context) {
        const appStore = useAppStore()

        const state = reactive({
            currentRootNodes: [],
            currentRootNode: null,
            module: computed(() => props.module),
            group: null,
            view: computed(() => props.view),
            active:false
        })
        provide("state", state) // expose to components

        function fetchRoots() {
            return Request.get(`/vi/${props.module}/listRootNodes`).then(async (resp) => {
                let data = await resp.json()
                state.currentRootNodes = data
                state.currentRootNode = data[0]
            })
        }

        function fetchInitData() {
            return fetchRoots().then(() => {
            })
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

          if (appStore.getActiveTab()["update"]){
            reloadAction()
            appStore.getActiveTab()["update"]=false
          }

        })

        onDeactivated(()=>{
          state.active = false
        })


        return {
            state,
        }
    }
})
</script>

<style scoped lang="less">

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
