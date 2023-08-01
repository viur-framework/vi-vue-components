<template>
  <sl-tab-group
    size="small"
    variant="flap"
    @sl-tab-show="onTabShown"
  >
    <the-main-screen-tabbar-item
      v-for="(entry, idx) in dbStore.state['handlers.opened']"
      :to="entry['to']"
      :icon="entry['icon']"
      :library="entry['library']"
      :active="dbStore.state['handlers.active'] === idx"
      :closeable="entry['closeable']"
      :position="idx"
      :mode="entry['mode']"
      :name="entry['name']"
    >
      {{ entry["name"] }}
    </the-main-screen-tabbar-item>
  </sl-tab-group>
</template>

<script lang="ts">
import { reactive, defineComponent } from "vue"
import { useDBStore } from "../stores/db"
import TheMainScreenTabbarItem from "./TheMainScreenTabbarItem.vue"

export default defineComponent({
  props: {},
  components: { TheMainScreenTabbarItem },
  setup(props, context) {
    const dbStore = useDBStore()

    const state = reactive({})

    function onTabShown(e) {
      dbStore.state["handlers.active"] = parseInt(e.target.activeTab.dataset.id)
    }

    return {
      state,
      dbStore,
      onTabShown
    }
  }
})
</script>

<style scoped>
sl-tab-group {
  --tab-flap-background-color: var(--vi-tab-background-color);
  z-index: 2;
}
</style>
