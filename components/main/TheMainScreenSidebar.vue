<template>

  <nav class="nav">
    <the-menubar-group :name="$t('sidebar.favorites')" v-if="userStore.favoriteModules?.length>0">
      <menu-tree :tree="userStore.favoriteModules"></menu-tree>
    </the-menubar-group>
    <the-menubar-group :name="$t('sidebar.administration')">
      <menu-tree :tree="dbStore.modulesTree"></menu-tree>
    </the-menubar-group>
    <div class="loader" v-if="dbStore.modulesTree.length===0">
      <loader></loader>
    </div>
  </nav>
</template>

<script lang="ts">
import MenuTree from "./menubar/MenuTree.vue";
import {useDBStore} from "../stores/db";
import {computed, defineComponent, reactive} from "vue";
import TheMenubarGroup from "./menubar/TheMenubarGroup.vue";
import TheMenubarItem from "./menubar/TheMenubarItem.vue";
import {useUserStore} from "../stores/user";
import Loader from "@viur/vue-utils/generic/Loader.vue";

export default defineComponent({
  components: {Loader, TheMenubarItem, TheMenubarGroup, MenuTree},
  setup(props, context) {
    const dbStore = useDBStore();
    const userStore = useUserStore();

    const state = reactive({
    })
    return {state, dbStore, userStore}
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
  }

</style>
