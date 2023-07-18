<template>
  <keep-alive :include="viewStore.state.cacheListNames">
    <component :is="viewStore.wrap(component)" :key="route.fullPath"/>
  </keep-alive>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import {useRoute} from "vue-router";
import { useDBStore } from '../stores/db';
import {useViewStore} from "../stores/views";

export default defineComponent({
    props: {
        component:Object
    },
    components: {},
    setup(props, context) {
        const viewStore = useViewStore()
        const route = useRoute()
        const dbStore = useDBStore()

        return {
            viewStore,
            route,
            dbStore
        }
    }
})
</script>

<style scoped>

</style>
