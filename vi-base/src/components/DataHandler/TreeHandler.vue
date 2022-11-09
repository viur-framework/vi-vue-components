<template>
    <handler-bar :module="module"></handler-bar>
    <sl-split-panel position-in-pixels="300" snap="300px">
        <sl-tree slot="start"
                 v-if="state.currentRootNode"
                 @sl-selection-change="changeParentEntry">

            <tree-layer :module="module" :nodes="[state.currentRootNode]"></tree-layer>
        </sl-tree>

        <sl-table slot="end"
                  rowselect moveablecolumns moveablerows height="100%"
                  :structure.prop="currentlistleafs.structure"
                  :skellist.prop="currentlistleafs.state.skellist"
                  @sl-selectionChanged="entrySelected"
        >

        </sl-table>
    </sl-split-panel>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed, provide, onBeforeMount, watch} from 'vue'
import HandlerBar from "../../components/Bars/HandlerBar.vue";
import {ListRequest} from '@viur/viur-vue-utils'
import {useAppStore} from '../../stores/app'
import {Request} from "@viur/viur-vue-utils";
import TreeLayer from "../../components/Tree/TreeLayer.vue";

export default defineComponent({
    props: {
        module: {
            type: String,
            required: true
        },
        view: null
    },
    components: {TreeLayer, HandlerBar},
    setup(props, context) {
        const appStore = useAppStore()

        const state = reactive({
            storeName: computed(() => {
                let name: string = `module___${props.module}`
                if (props.view) {
                    name += `___${props.view}`
                }
                return name
            }),
            currentSelection: null,
            currentRootNodes: [],
            currentRootNode: null,
            currentNode: null,
            nodes: [],
            module: computed(() => props.module),
            group: null,
            view: computed(() => props.view),
        })
        provide("state", state) // expose to components

        const currentlistleafs = ListRequest(state.storeName + "_leaf", {
            module: props.module,
            params: {
                "skelType": "leaf",
            }
        })
        appStore.setListStore(currentlistleafs)

        function fetchRoots() {
            return Request.get(`/vi/${props.module}/listRootNodes`).then(async (resp) => {
                let data = await resp.json()
                state.currentRootNodes = data
                state.currentRootNode = data[0]
                state.currentNode = data[0]
            })
        }

        function fetchInitData() {
            return fetchRoots().then(() => {
                currentlistleafs.filter({...currentlistleafs.state.params, ...{"parententry": state.currentNode["key"]}})
            })
        }

        function reloadAction() {
            return new Promise((resolve, reject) => {
                currentlistleafs.fetch().then(() => {
                    resolve()
                }).catch(() => {
                    reject()
                })
            })
        }

        provide("reloadAction", reloadAction)


        onBeforeMount(() => {
            fetchInitData()
        })

        function entrySelected(e) {
            state.currentSelection = e.detail.data
        }

        function changeParentEntry(event) {
            console.log(event)
            state.currentNode = {
                "name": event.detail.selection[0]["dataset"]["name"],
                "key": event.detail.selection[0]["dataset"]["key"]
            }
            currentlistleafs.filter({...currentlistleafs.state.params, ...{"parententry": state.currentNode["key"]}})
        }

        return {
            state,
            currentlistleafs,
            entrySelected,
            changeParentEntry
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
