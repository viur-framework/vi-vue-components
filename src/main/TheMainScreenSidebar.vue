<template>
  <nav class="nav">
    <the-menubar-group
      v-if="userStore.favoriteModules?.length > 0"
      :name="$t('sidebar.favorites')"
    >
      <menu-tree :tree="userStore.favoriteModules"></menu-tree>
    </the-menubar-group>
    <the-menubar-group :name="$t('sidebar.administration')">
      <menu-tree :tree="dbStore.state['vi.moduleTree']"></menu-tree>
    </the-menubar-group>
    <div
      v-if="dbStore.state['vi.moduleTree'].length === 0"
      class="loader"
    >
      <vi-loader></vi-loader>
    </div>
  </nav>
</template>

<script setup>
import MenuTree from "./menubar/MenuTree.vue"
import { useDBStore } from "../stores/db"
import { computed, defineComponent, reactive, provide } from "vue"
import TheMenubarGroup from "./menubar/TheMenubarGroup.vue"
import TheMenubarItem from "./menubar/TheMenubarItem.vue"
import { useUserStore, ViLoader } from "@viur/vue-utils"
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const state = reactive({
    })
</script>

<style scoped>
.loader {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.8);
}

.nav {
  height: 100%;
  position: relative;
}


</style>
