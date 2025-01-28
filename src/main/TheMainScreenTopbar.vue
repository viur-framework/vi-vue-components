<template>
  <header>
    <router-link
      to="/"
      class="head"
    >
      <div class="logo">
        <sl-icon
          v-once
          :src="appStore.state['admin.logo']"
        ></sl-icon>
      </div>
      <h1 class="main-headline">
        {{ appStore.state["admin.name"] }}
        <fun></fun>
      </h1>
    </router-link>

    <div class="main-group">
      <component
        :is="action"
        v-for="action in dbStore.state['topbar.actions']"
      >
      </component>
    </div>
  </header>
</template>

<script setup>
import { useAppStore } from "../stores/app"
import { useDBStore } from "../stores/db"
import fun from './components/fun.vue'
import { defineComponent, reactive, computed } from "vue"
import router from "../routes"

    const appStore = useAppStore()
    const dbStore = useDBStore()
    const state = reactive({})
</script>

<style scoped>
header {
  height: 60px;
  border-bottom: 2px solid var(--sl-color-primary-500);
  display: flex;
  flex-direction: row;
  font-size: 0.9rem;
  align-items: center;
  min-height: 35px;
  position: relative;
  text-align: center;
  justify-content: space-between;
  /*box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);*/
  z-index: 99;
}

.head {
  height: 100%;
  display: flex;
  align-items: center;

  & h1 {
    margin-left: 15px;
    font-size: 1.2em;
    font-weight: 700;
    color: var(--vi-foreground-color);
  }

  & .logo {
    background: var(--sl-color-primary-500);
    height: 100%;
    color: var(--sl-color-neutral-0);
    width: calc(2.5rem + 2 * 1.25 * 3px);
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;

    & sl-icon {
      width: 75%;
      height: 75%;
    }
  }
}

.main-group {
  margin-right: 15px;
  display: flex;
  gap: var(--sl-spacing-small);
  align-items: center;
}
</style>
