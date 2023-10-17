<template>
  <sl-button
    size="small"
    :title="$t('actions.selectfields')"
    @click="openSelectDialog"
  >
    <sl-icon
      slot="prefix"
      name="list-ul"
    ></sl-icon>
    {{ $t("actions.selectfields") }}
  </sl-button>

  <sl-dialog
    id="dialog-selectfields"
    :label="$t('actions.selectfields')"
  >
    <sl-checkbox
      v-for="(bone, boneName) in state.structure"
      :key="boneName"
      :checked="state.active.includes(boneName)"
      class="selectfieldswitch"
      @sl-change="visibleChange(boneName)"
    >
      {{ bone["descr"] !== "" ? bone["descr"] : boneName }}
    </sl-checkbox>

    <sl-button-group slot="footer">
      <sl-button
        size="small"
        @click="selectall"
        >{{ $t("selectfields.selectall") }}</sl-button
      >
      <sl-button
        size="small"
        @click="unselectall"
        >{{ $t("selectfields.unselectall") }}</sl-button
      >
      <sl-button
        size="small"
        @click="invertselect"
        >{{ $t("selectfields.invertselect") }}</sl-button
      >
    </sl-button-group>
  </sl-dialog>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, inject, onMounted } from "vue"
import { useDBStore } from "../stores/db"
import { useRoute } from "vue-router"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const currentlist: any = inject("currentlist")
    const state = reactive({
      structure: {},
      active: []
    })
    const dbStore = useDBStore()
    const route = useRoute()

    function openSelectDialog() {
      if (handlerState.structure) {
        state.structure = handlerState.structure
      } else if (currentlist) {
        state.structure = currentlist.structure
      }

      let conf = dbStore.getConf(handlerState.module)
      if (conf && conf?.["columns"]) {
        state.active = conf["columns"]
      } else {
        state.active = Object.keys(Object.fromEntries(Object.entries(state.structure).filter(([, v]) => v["visible"])))
      }
      handlerState.selectedBones = state.active
      const dialog = document.getElementById("dialog-selectfields")
      dialog.show()
    }

    function visibleChange(boneName) {
      if (handlerState.selectedBones.includes(boneName)) {
        console.log(handlerState.selectedBones)
        handlerState.selectedBones.splice(handlerState.selectedBones.indexOf(boneName), 1)
      } else {
        handlerState.selectedBones.unshift(boneName)
      }
    }

    function selectall() {
      handlerState.selectedBones = Object.keys(state.structure)
      state.active = Object.keys(state.structure)
    }

    function unselectall() {
      handlerState.selectedBones = []
      state.active = []
    }

    function invertselect() {
      state.active = Object.keys(state.structure).filter((i) => !state.active.includes(i))
      handlerState.selectedBones = state.active
    }

    return { state, openSelectDialog, visibleChange, selectall, unselectall, invertselect }
  }
})
</script>

<style scoped>
.selectfieldswitch {
  display: flex;
  margin-bottom: 5px;

  &::part(base) {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  &::part(control) {
    width: 1em;
    height: 1em;
  }
}

sl-button-group {
  width: 100%;

  &::part(base) {
    width: 100%;
  }

  & sl-button {
    flex: 1;
  }
}

sl-checkbox{
  &::part(control){
   position: relative;
   }

  &::part(checked-icon){
    height: 0;

    &:after{
      content: '\2714';
      font-family: Segoe UI Symbol;
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      line-height: 1;
      font-size: .8em;
     }
  }
}

</style>
