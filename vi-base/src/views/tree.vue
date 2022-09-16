<template>
    <tree-handler
        :module="module"
        :node="node"
    >

    </tree-handler>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed} from 'vue'
import TreeHandler from "../components/DataHandler/TreeHandler.vue";
import {useRoute} from "vue-router";

export default defineComponent({
    props: {
        module: {
            type: String,
            required: true
        }
    },
    components: {TreeHandler},
    setup(props, context) {
        const route = useRoute()

        const state = reactive({
            view: computed(() => {
                if (Object.keys(route.query).includes("view")) {
                    return route.query["view"]
                }
                return null
            })
        })
        return {state}
    }
})
</script>

<style scoped lang="less">

</style>