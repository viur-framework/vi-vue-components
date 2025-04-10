<template>
  <div
      class="head"
    >
      <div class="logo">
        <img
          :src="appStore.state['admin.logo']"
        >
      </div>
      <sl-tooltip :content="appStore.state['admin.name']">
        <sl-icon class="info-icon" name="info-circle"></sl-icon>
      </sl-tooltip>
      <fun></fun>
      <sl-button
            size="small"
            class="sidebar-toggle"
            title="Seitenleiste einklappen"
            @click="toggleSidebar()">
        <sl-icon name="list"></sl-icon>
      </sl-button>
  </div>
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
      <loader></loader>
    </div>
  </nav>
</template>

<script setup>
import { useAppStore } from "../stores/app"
import MenuTree from "./menubar/MenuTree.vue"
import { useDBStore } from "../stores/db"
import { computed, defineComponent, reactive, provide } from "vue"
import TheMenubarGroup from "./menubar/TheMenubarGroup.vue"
import TheMenubarItem from "./menubar/TheMenubarItem.vue"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import fun from './components/fun.vue'

    const emit = defineEmits(["toggleSidebar"])
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const appStore = useAppStore()
    const state = reactive({
    })

    function toggleSidebar() {
      emit("toggleSidebar")
    }

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
  display: flex;
  flex-direction: column;
  height: 1px;
  flex: 1;
  position: relative;
}

.head {
  display: flex;
  align-items: center;
  height: 45px;
  background-color: var(--sl-color-primary-500);
}

h1 {
  margin-left: var(--sl-spacing-2x-small);
  font-weight: 700;
  color: var(--sl-color-neutral-0);
}

.logo {
  height: 100%;
  color: var(--sl-color-neutral-0);
  padding: var(--sl-spacing-x-small);
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  margin-right: var(--sl-spacing-x-small);
  transition: all ease .3s;
  max-width: 300px;

  img{
    height: 100%;
  }
}

.info-icon{
  margin-left: auto;
  transition: all ease .3s;

  @supports (color: oklch(from red l c h)) {
    --l: clamp(0, (l / 0.623 - 1) * -infinity, 1);
    color: oklch(from var(--sl-color-primary-500) var(--l) 0 h);
    text-shadow: none;
  }

  @supports (color: contrast-color(red)) {
    color: contrast-color(var(--sl-color-primary-500));
    text-shadow: none;
  }
}

.sidebar-toggle{
  margin: 0 var(--sl-spacing-x-small);

  &:hover{
    &::part(base){
    }
  }

  &::part(base){
    border: none;
    aspect-ratio: 1;
    background-color: transparent !important;
  }

  &::part(label){
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 2em;

    @supports (color: oklch(from red l c h)) {
      --l: clamp(0, (l / 0.623 - 1) * -infinity, 1);
      color: oklch(from var(--sl-color-primary-500) var(--l) 0 h);
      text-shadow: none;
    }

    @supports (color: contrast-color(red)) {
      color: contrast-color(var(--sl-color-primary-500));
      text-shadow: none;
    }

  }
}

</style>
