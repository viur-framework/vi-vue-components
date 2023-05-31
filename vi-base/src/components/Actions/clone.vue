<template>
  <router-link :to="state.url" custom v-slot="{route}">
    <sl-button :disabled="!state.active"
               @click="createAndNavigate(route)"
               size="small"
               :title="$t('actions.clone')"
    >
      <sl-icon slot="prefix" name="clone"></sl-icon>
    </sl-button>
  </router-link>
</template>

<script lang="ts">
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute} from "vue-router";
import {useDBStore} from "../../stores/db";

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("state");
    const dbStore = useDBStore();
    const route = useRoute();
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      url: computed(() => {
        if (!state.active) return ""
        if(handlerState.group){
          return `/db/${handlerState.module}/clone/${handlerState.group}/${handlerState.currentSelection[0]["key"]}?_=${new Date().getTime()}`
        }else{
          return `/db/${handlerState.module}/clone/${handlerState.currentSelection[0]["key"]}?_=${new Date().getTime()}`
        }
      })
    })

    function createAndNavigate(route: any) {
      dbStore.addOpened(route, handlerState["module"], handlerState["view"])
    }

    return {state, createAndNavigate}
  }
})
</script>

<style scoped lang="less">

</style>
