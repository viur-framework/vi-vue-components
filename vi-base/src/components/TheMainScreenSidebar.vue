<template>

  <nav class="nav">
    <the-menubar-group :name="$t('sidebar.favorites')" v-if="userStore.favoriteModules?.length>0">
      <menu-tree :tree="userStore.favoriteModules"></menu-tree>
    </the-menubar-group>
    <the-menubar-group :name="$t('sidebar.administration')">
      <menu-tree :tree="appStore.modulesTree"></menu-tree>
    </the-menubar-group>
    <div class="loader" v-if="appStore.modulesTree.length===0">
      <loader></loader>
    </div>
  </nav>
</template>

<script lang="ts">
import MenuTree from "../components/TheMenubar/MenuTree.vue";
import {useAppStore} from "../stores/app";
import {computed, defineComponent, reactive} from "vue";
import TheMenubarGroup from "./TheMenubar/TheMenubarGroup.vue";
import TheMenubarItem from "./TheMenubar/TheMenubarItem.vue";
import {useUserStore} from "../stores/user";
import Loader from "./Generic/Loader.vue";

export default defineComponent({
  components: {Loader, TheMenubarItem, TheMenubarGroup, MenuTree},
  setup(props, context) {
    const appStore = useAppStore();
    const userStore = useUserStore();

    const state = reactive({
    })
    return {state, appStore, userStore}
  },

})
</script>

<style scoped>
  .loader{
    position:absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(255, 255, 255, 0.8);
  }

  .nav{
    height:100%;
    position:relative;
    background-color: #fff;
  }

</style>
