<template>
    <div>
        <handler-bar :module="module"></handler-bar>
        <sl-split-panel position-in-pixels="300" snap="300px">
            <sl-tree slot="start"
                     v-if="state.currentRootNode"
                     @sl-selection-change="changeParentEntry">

                <tree-layer :module="module" :nodes="[state.currentRootNode]"></tree-layer>
            </sl-tree>

            <sl-table slot="end"
                      rowselect moveablecolumns moveablerows height="800px"
                      :structure.prop="currentlistleafs.structure"
                      :skellist.prop="currentlistleafs.state.skellist"
                      @sl-selectionChanged="entrySelected"
            >

            </sl-table>
        </sl-split-panel>
    </div>
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
.table {
    width: 100%;
    table-layout: fixed;

    tbody tr {
        position: relative;
        transition: all ease .3s;

        &:nth-child(odd) {
            background-color: #f3f3f3;
        }

        &:hover {
            background-color: rgba(22, 159, 172, .25);
        }
    }
}

thead {
    background-color: var(--sl-color-primary-500);
    color: #fff;

    th {
        padding: 10px 15px;
        resize: horizontal;
        overflow: hidden;

        &::-webkit-resizer {
            border-style: solid;
            border-width: 0 0px 100px 100px;
            border-color: transparent transparent rgba(255, 255, 255, .2) transparent;
            display: block;
            transition: all ease .3s;
        }

        &:hover {
            &::-webkit-resizer {
                border-color: transparent transparent rgba(255, 255, 255, .9) transparent;
            }
        }

        :deep(sl-icon) {
            height: .5em;
            padding-top: .5em;
            float: right;
        }

    }
}

sl-table-wrapper {
    width: 100%;
}

img {
    width: 4em;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    object-position: center;
    background-color: var(--sl-color-neutral-200);

    &:hover {
        object-fit: contain;
    }
}

.cell-wrap {
    display: flex;
    flex-direction: row;
    padding-bottom: 20px;
    height: 100%;
    width: 100%;
}

.info-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 7px 15px;

    .headline {
        font-size: 1.2em;
        line-height: 1.2;
    }

    sl-tag {
        margin-bottom: 10px;
    }
}


td {
    height: 1px;
    max-width: 5px;
    overflow: hidden;
    word-wrap: break-word;
}

th {
    cursor: pointer;

    &.thimg {
        width: 4em;
    }

    &.thbutton {
        width: 91px;
    }

    .th-inner {
        float: left;
        max-width: calc(100% - 1.3em);
    }

    sl-icon {
        height: 1em;
        font-size: .7em;
        margin-left: 0.8em;
    }

}

.dataset-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.padding-cell {
    padding: 10px 15px;
    vertical-align: middle;
}
</style>