<template>
  <router-link :to="state.url" custom v-slot="{route}">
    <sl-button variant="info" :disabled="!state.active || !state.canEdit" @click="createAndNavigate(route)">
      <sl-icon slot="prefix" name="pencil"></sl-icon>
      {{ $t("actions.edit") }}
    </sl-button>
  </router-link>
</template>

<script lang="ts">
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute} from "vue-router";
import {useAppStore} from "../../stores/app";

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("state")
    const appStore = useAppStore()
    const route = useRoute()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      url: computed(() => {
        if (!state.active) return ""
        return `/${route.params.module}/edit/${handlerState.currentSelection[0]["key"]}?_=${new Date().getTime()}`
      }),
      canEdit: computed(() => {
        if (appStore.getConfByRoute(route)) {
          return appStore.getConfByRoute(route)['canEdit']
        }
        return true;
      })
    })

    function createAndNavigate(route: any) {
      appStore.addOpened(route, handlerState["module"], handlerState["view"])
    }

    return {
      state,
      handlerState,
      createAndNavigate
    }
  }
})
</script>

<style scoped lang="less">

</style>
