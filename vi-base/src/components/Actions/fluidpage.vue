<template>
  <router-link :to="state.url" custom v-slot="{route}">
    <sl-button size="small" outline variant="info" :disabled="!state.active || !state.canEdit"
               @click="createAndNavigate(route)"
               :title="$t('actions.fluidpage.edit')"
    >
      <sl-icon slot="prefix" name="press"></sl-icon>
    </sl-button>
  </router-link>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute} from "vue-router";
import {useAppStore} from "../../stores/app";
import {useUserStore} from "../../stores/user";

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("state")
    const appStore = useAppStore();
    const userStore = useUserStore();
    const route = useRoute()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      url: computed(() => {
        if (!state.active) return ""

        let conf = appStore.getConfByRoute(route);
        let module = conf["handler"].split(".").at(-1)
        return `/${module}/fluidpage/${handlerState.currentSelection[0]["key"]}?_=${new Date().getTime()}`
      }),
      canEdit: computed(() => {
       if(userStore.state.user.access.indexOf("root") !== -1 )
       {
         return true;
       }
       return userStore.state.user.access.indexOf(`${handlerState.module}-edit`)>-1;
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
