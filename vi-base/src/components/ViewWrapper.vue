<template>
    <keep-alive :include="viewStore.state.cacheListNames">
        <component :is="viewStore.wrap(component)" :key="route.fullPath"/>
    </keep-alive>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import {useRoute} from "vue-router";
import {useViewStore} from "../stores/views";

export default defineComponent({
    props: {
        component:Object
    },
    components: {},
    setup(props, context) {
        const viewStore = useViewStore()
        const route = useRoute()
        return {
            viewStore,
            route
        }
    }
})
</script>

<style scoped lang="less">

</style>