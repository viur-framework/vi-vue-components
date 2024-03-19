<template>
  <nav class="nav">
    <the-menubar-group
      v-if="userStore.favoriteModules?.length > 0"
      :name="$t('sidebar.favorites')"
    >
      <menu-tree :tree="userStore.favoriteModules"></menu-tree>
    </the-menubar-group>
    <the-menubar-group :name="$t('sidebar.administration')">
      <sl-input v-model="state.search" size="small" placeholder="Suche" class="modulesearch" clearable @sl-clear="state.search=''">
        <sl-icon name="search" slot="prefix"></sl-icon>
      </sl-input>
      <menu-tree :tree="dbStore.state['vi.moduleTree']"></menu-tree>
    </the-menubar-group>
    <div
      v-if="dbStore.state['vi.moduleTree'].length === 0"
      class="loader"
    >
      <loader></loader>
    </div>
  </nav>
</template>

<script lang="ts">
// @ts-nocheck
import MenuTree from "./menubar/MenuTree.vue"
import { useDBStore } from "../stores/db"
import { computed, defineComponent, reactive, provide } from "vue"
import TheMenubarGroup from "./menubar/TheMenubarGroup.vue"
import TheMenubarItem from "./menubar/TheMenubarItem.vue"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import Loader from "@viur/vue-utils/generic/Loader.vue"

export default defineComponent({
  components: { Loader, TheMenubarItem, TheMenubarGroup, MenuTree },
  setup(props, context) {
    const dbStore = useDBStore()
    const userStore = useUserStore()

    const state = reactive({
      search: ""
    })
    provide("menuState", state)
    return { state, dbStore, userStore }
  }
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


.modulesearch::part(base){
  border-radius:0px;
}
</style>
