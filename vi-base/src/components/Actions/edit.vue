<template>
  <router-link :to="state.url" custom v-slot="{route}">
    <sl-button size="small"
               variant="info"
               :disabled="!state.active || !state.canEdit"
               @click="createAndNavigate(route)"
               :title="$t('actions.edit')"
    >
      <sl-icon slot="prefix" name="pencil"></sl-icon>
    </sl-button>
  </router-link>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute} from "vue-router";
import {useDBStore} from "../../stores/db";
import {useUserStore} from "../../stores/user";

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("state")
    const dbStore = useDBStore();
    const userStore = useUserStore();
    const route = useRoute()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      url: computed(() => {
        if (!state.active) return ""
        if(handlerState.type=="hierarchyhandler")
        {
          return `/db/${handlerState.module}/edit/node/${handlerState.currentSelection[0]["key"]}?_=${new Date().getTime()}`
        }

        if(handlerState.type=="treehandler")
        {
          return `/db/${handlerState.module}/edit/${handlerState?.currentSelectionType}/${handlerState.currentSelection[0]["key"]}?_=${new Date().getTime()}`
        }

        if(handlerState.group){
          return `/db/${handlerState.module}/edit/${handlerState.group}/${handlerState.currentSelection[0]["key"]}?_=${new Date().getTime()}`
        }else{
          return `/db/${handlerState.module}/edit/${handlerState.currentSelection[0]["key"]}?_=${new Date().getTime()}`
        }


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
      dbStore.addOpened(route, handlerState["module"], handlerState["view"])
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
