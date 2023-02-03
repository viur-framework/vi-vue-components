<template>
    <sl-tree-item
        :data-key="item['key']"
        :data-name="item['name']"
        :lazy="!item?.['_children'] || item['_children']?.length===0"
        v-for="(item,index) in state.nodes"
        @sl-lazy-load="requestChilds($event,item,index)"
    >
        <sl-icon name="folder" sprite></sl-icon>
        {{ item["name"] }}
        <tree-layer v-if="item?.['_children'] && item['_children']?.length>0" :module="module" :nodes="item['_children']"></tree-layer>
    </sl-tree-item>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, inject, onBeforeMount, watch, computed} from 'vue'
import {Request} from "@viur/viur-vue-utils";

export default defineComponent({
    props: {
        module: {
            type: String,
            required: true
        },
        nodes: []
    },
    components: {},
    setup(props, context) {
        const state = reactive({
            nodes : []
        })

        const treeState = inject("state")

        function requestChilds(event,currentItem,index=0) {
            Request.get(`/vi/${props.module}/list`, {
                dataObj: {
                    "skelType": "node",
                    "parententry": currentItem["key"]
                }
            }).then(async (resp) => {
                let data = await resp.json()
                state.nodes[index]["_children"]= data["skellist"]
                event.target.loading=false
            })
        }

        onBeforeMount(() => {
            if (props.nodes) {
                state.nodes = props.nodes
            }
        })

        return {
            state, treeState,
            requestChilds
        }
    }
})
</script>

<style scoped lang="less">

</style>