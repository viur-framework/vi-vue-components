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
      :checked="setChecked(boneName)"
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
import { reactive, defineComponent, inject } from "vue"
import { useDBStore } from "../stores/db"
import { useRoute } from "vue-router"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const currentlist: any = inject("currentlist")
    const state = reactive({ structure: {} })
    const dbStore = useDBStore()
    const route = useRoute()

    function openSelectDialog() {
      if (handlerState.structure) {
        state.structure = handlerState.structure
      } else if (currentlist) {
        state.structure = currentlist.structure
      }
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
      document.querySelectorAll(".selectfieldswitch").forEach((switchElement) => (switchElement.checked = true))
    }

    function unselectall() {
      document.querySelectorAll(".selectfieldswitch").forEach((switchElement) => (switchElement.checked = false))
    }

    function invertselect() {
      document
        .querySelectorAll(".selectfieldswitch")
        .forEach((switchElement) => (switchElement.checked = !switchElement.checked))
    }

    function setChecked(boneName) {
      let conf = dbStore.getConf(props.module)
      if (conf && conf?.["columns"]) {
        if (conf["columns"].includes(boneName)) {
          return true
        }
      } else {
        return state.structure[boneName]["visible"]
      }
    }

    return { state, openSelectDialog, visibleChange, selectall, unselectall, invertselect, setChecked }
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

sl-dialog {
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
</style>
