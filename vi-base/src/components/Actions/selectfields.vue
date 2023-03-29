<template>
  <sl-button @click="openSelectDialog" size="small">
    <sl-icon slot="prefix" name="list-ul"></sl-icon>
    {{ $t("actions.selectfields") }}
  </sl-button>

  <sl-dialog :label='$t("actions.selectfields")' id="dialog-selectfields">
    <sl-checkbox v-for="(bone,boneName) in state.structure" :checked="bone['visible']"
               @sl-change="visibleChange(boneName)" class="selectfieldswitch">
      {{ bone["descr"] !== "" ? bone["descr"] : boneName }}
    </sl-checkbox>

    <sl-button-group slot="footer">
      <sl-button size="small" @click="selectall">{{ $t("selectfields.selectall") }}</sl-button>
      <sl-button size="small" @click="unselectall">{{ $t("selectfields.unselectall") }}</sl-button>
      <sl-button size="small" @click="invertselect">{{ $t("selectfields.invertselect") }}</sl-button>
    </sl-button-group>
  </sl-dialog>


</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, inject} from 'vue'
import {useAppStore} from "../../stores/app";
import {useRoute} from "vue-router";


export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("state")
    const state = reactive({structure: {}});
    const appStore = useAppStore()
    const route = useRoute();


    function openSelectDialog() {
      let store = appStore.getListStoreByRoute(route);
      const dialog = document.getElementById("dialog-selectfields");
      console.log(store)
      state.structure = store.structure;
      dialog.show();
    }

    function visibleChange(boneName) {
      let tbl = handlerState.tableInst
      let column = tbl._value.tableInstance.getColumns().filter(i=>i["_column"]["field"]===boneName)
      if (column.length >0 ){
        column[0].toggle();
      }
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
  display: flex;
  margin-bottom: 5px;

  &::part(base){
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  &::part(control){
    width: 1em;
    height: 1em;
  }

}

sl-dialog{
  &::part(body){
    padding-top: 0;
  }
}

sl-button-group{
  width: 100%;

  &::part(base){
    width: 100%;
  }

  sl-button{
    flex: 1;
  }
}

</style>
