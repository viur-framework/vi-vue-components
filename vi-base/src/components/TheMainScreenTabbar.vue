<template>
    <sl-tab-group size="small" variant="flap"
                  @sl-tab-show="onTabShown"
    >
        <the-main-screen-tabbar-item
            v-for="(entry,idx) in appStore.state['handlers.opened']"
            :to="entry['to']"
            :icon="entry['icon']"
            :library="entry['library']"
            :active="appStore.state['handlers.active']===idx"
            :closeable="entry['closeable']"
            :position="idx"
            :mode="entry['mode']"
            :name="entry['name']"
        >
            {{ entry['name'] }}
        </the-main-screen-tabbar-item>
    </sl-tab-group>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'
import {useAppStore} from "../stores/app";
import TheMainScreenTabbarItem from "./TheMainScreenTabbarItem.vue";

export default defineComponent({
    props: {},
    components: {TheMainScreenTabbarItem},
    setup(props, context) {
        const appStore = useAppStore()

        const state = reactive({})

        function onTabShown(e){
          appStore.state['handlers.active'] = parseInt(e.target.activeTab.dataset.id)
        }

        return {
          state,
          appStore,
          onTabShown
        }
    }
})
</script>

<style scoped lang="less">
sl-tab-group {
  --tab-flap-background-color: var(--vi-tab-background-color);
}

</style>
