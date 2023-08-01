<template>
  <div
    class="bar"
    style="z-index: 50"
  >
    <reloadentry v-if="!['add'].includes(handlerState.action)"></reloadentry>

    <template v-if="appStore.state.debug">
      <debugentry></debugentry>
    </template>
    <save
      :module="module"
      :action="action"
      name="actions.save_next"
      v-if="['clone', 'add'].includes(handlerState.action)"
    ></save>
    <save
      :module="module"
      :action="action"
    ></save>
    <!--<save
      name="actions.save_close"
      icon="check-all"
      :close="true"
      :module="module" :action="action"
    ></save>-->
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, inject } from "vue"
import Save from "../actions/save.vue"
import Debugentry from "../actions/debugentry.vue"
import Reloadentry from "../actions/reloadentry.vue"
import { useAppStore } from "../stores/app"

export default defineComponent({
  props: {},
  components: { Debugentry, Save, Reloadentry },
  setup(props, context) {
    const appStore = useAppStore()
    const state = reactive({})
    const handlerState: any = inject("handlerState")
    return { state, handlerState, appStore }
  }
})
</script>

<style scoped>
.bar {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-left: 10px;
}

sl-button {
  margin-left: 5px;
}
</style>
