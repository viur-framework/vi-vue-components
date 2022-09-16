<template>
    <nav>
        <the-menubar-group :name="$t('sidebar.workspace')">
            <the-menubar-item v-for="entry in appStore.state['handlers.opened']" closeable
                              :to="entry['to']"
                              :name="entry['name']"
                              :icon="entry['icon']"
                              :library="entry['library']"
            >
            </the-menubar-item>
        </the-menubar-group>

        <the-menubar-group :name="$t('sidebar.administration')">
            <menu-tree :tree="appStore.modulesTree"></menu-tree>
        </the-menubar-group>
    </nav>
</template>

<script lang="ts">
import MenuTree from "../components/TheMenubar/MenuTree.vue";
import {useAppStore} from "../stores/app";
import {computed, defineComponent, reactive} from "vue";
import TheMenubarGroup from "./TheMenubar/TheMenubarGroup.vue";
import TheMenubarItem from "./TheMenubar/TheMenubarItem.vue";

export default defineComponent({
    components: {TheMenubarItem, TheMenubarGroup, MenuTree},
    setup(props, context) {
        const appStore = useAppStore()

        const state = reactive({})
        return {state, appStore}
    }
})
</script>

<style scoped>

</style>