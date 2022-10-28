<template>
    <sl-tab-group size="small">
        <the-main-screen-tabbar-item
            slot="nav"
            icon="dashboard"
            :to="{'name': 'home'}"
            :closeable="false">
            Dashboard
        </the-main-screen-tabbar-item>

        <the-main-screen-tabbar-item
            v-for="entry in appStore.state['handlers.opened']"
            :to="entry['to']"
            :icon="entry['icon']"
            :library="entry['library']"
        >
            {{ entry['name'] }}
        </the-main-screen-tabbar-item>
    </sl-tab-group>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'
import {useAppStore} from "../stores/app";
import TheMainScreenTabbarItem from "./TheMainScreenTabbarItem.vue";

export default defineComponent({
    props: {},
    components: {TheMainScreenTabbarItem},
    setup(props, context) {
        const appStore = useAppStore()

        const state = reactive({})
        return {state, appStore}
    }
})
</script>

<style scoped lang="less">

</style>