<template>
    <sl-button size="small" variant="danger" outline @click="debugClicked">
      <sl-icon slot="prefix" name="bug"></sl-icon>
      {{ $t("actions.debug") }}
    </sl-button>

  <teleport v-if="state.opened" to="#dialogs" :disabled="!state.opened">
    <sl-drawer open @sl-after-hide="crossClicked">
      <vue-json-pretty :data="handlerState.skel"></vue-json-pretty>
    </sl-drawer>
  </teleport>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute} from "vue-router";
import {useAppStore} from "../../stores/app";
import {useUserStore} from "../../stores/user";
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

export default defineComponent({
  props: {},
  components: {VueJsonPretty},
  setup(props, context) {
    const handlerState: any = inject("state")
    const appStore = useAppStore();
    const userStore = useUserStore();
    const route = useRoute()
    const state = reactive({
      opened:false
    })

    function debugClicked(){
      state.opened = !state.opened
    }

    function crossClicked(){
      state.opened = !state.opened
    }
    return {
      state,
      handlerState,
      debugClicked,
      crossClicked
    }
  }
})
</script>

<style scoped lang="less">

</style>
