<template>
  <nav>
    <the-menubar-group :name="$t('sidebar.favorites')" v-if="userStore.favoriteModules?.length>0">
      <menu-tree :tree="userStore.favoriteModules"></menu-tree>
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
import {useUserStore} from "../stores/user";

export default defineComponent({
  components: {TheMenubarItem, TheMenubarGroup, MenuTree},
  setup(props, context) {
    const appStore = useAppStore();
    const userStore = useUserStore();

    const state = reactive({})
    return {state, appStore, userStore}
  },

})
</script>

<style scoped>

</style>
