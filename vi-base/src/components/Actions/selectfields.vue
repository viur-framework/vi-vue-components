<template>
  <sl-button @click="openSelectDialog" size="small">
    <sl-icon slot="prefix" name="list-ul"></sl-icon>
    {{ $t("actions.selectfields") }}
  </sl-button>

  <sl-dialog :label='$t("actions.selectfields")' id="dialog-selectfields">
    <sl-switch v-for="(bone,boneName) in state.structure" :checked="bone['visible']"
               @sl-change="visibleChange(boneName)" class="selectfieldswitch">
      {{ bone["descr"] !== "" ? bone["descr"] : boneName }}
    </sl-switch>

    <sl-button @click="selectall">{{ $t("selectfields.selectall") }}</sl-button>
    <sl-button @click="unselectall">{{ $t("selectfields.unselectall") }}</sl-button>
    <sl-button @click="invertselect">{{ $t("selectfields.invertselect") }}</sl-button>

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
      const dialog = document.getElementById("dialog-selectfields");
      state.structure = store.structure;
      dialog.show();
    }

    function visibleChange(boneName) {

      //state.structure[[boneName]]["visible"] = !state.structure[[boneName]]["visible"];//TODO Comunicate with the list
    }

    function selectall() {
      document.querySelectorAll(".selectfieldswitch").forEach(switchElement => switchElement.checked = true)
    }

    function unselectall() {
      document.querySelectorAll(".selectfieldswitch").forEach(switchElement => switchElement.checked = false);
    }

    function invertselect() {
      document.querySelectorAll(".selectfieldswitch").forEach(switchElement => switchElement.checked = !switchElement.checked);
    }

    return {state, openSelectDialog, visibleChange, selectall, unselectall,invertselect}
  }
})
</script>

<style scoped lang="less">
.selectfieldswitch {
  display: block;

}
</style>
