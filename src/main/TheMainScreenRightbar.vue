<template>
  <div class="right-sidebar">
    <div class="main-group">
      <component
        :is="action"
        v-for="action in dbStore.state['topbar.actions']"
        :title="action['__name']"
      >
      </component>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from "../stores/app"
import { useDBStore } from "../stores/db"
import { defineComponent, reactive, computed } from "vue"
import router from "../routes"

    const appStore = useAppStore()
    const dbStore = useDBStore()
    const state = reactive({})
</script>

<style scoped>
.right-sidebar {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
  align-items: center;
  position: relative;
  text-align: center;
  z-index: 99;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, .2);
}

.main-group {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--sl-spacing-small);
  align-items: center;

  &:deep(sl-avatar){
    display: flex;
    align-items: center;
    justify-content: center;
    height: 45px;
    padding: 0 var(--sl-spacing-x-small);

    &::part(base){
      background-color: var(--sl-color-primary-500);
      color: #fff;
    }

    &::part(initials){
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
}
</style>
