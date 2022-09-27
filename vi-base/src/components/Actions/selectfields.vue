<template>
  <sl-button @click="openSelectDialog">
    <sl-icon slot="prefix" name="list-ul"></sl-icon>
    {{ $t("actions.selectfields") }}
  </sl-button>

  <sl-dialog :label='$t("actions.selectfields")' id="dialog">
    <sl-switch v-for="(bone,boneName) in state.structure" :checked="bone['visible']" @sl-change="visibleChange(boneName)">
      {{ bone["descr"] !== "" ? bone["descr"] : boneName }}
    </sl-switch>
    <sl-button slot="footer" variant="primary">Close</sl-button>
  </sl-dialog>


</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent} from 'vue'
import {useAppStore} from "../../stores/app";
import {useRoute} from "vue-router";

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({structure: {}});
    const appStore = useAppStore()
    const route = useRoute();


    function openSelectDialog() {
      let store = appStore.getListStoreByRoute(route);
      const dialog = document.getElementById("dialog");
      state.structure = store.structure;
      dialog.show();
    }

    function visibleChange(boneName) {

      state.structure[[boneName]]["visible"]=!state.structure[[boneName]]["visible"];//TODO Comunicate with the list
    }

    return {state, openSelectDialog, visibleChange}
  }
})
</script>

<style scoped lang="less">

</style>
