<template>
  <sl-button size="small" :title="$t('actions.selectfields')" @click="openSelectDialog">
    <sl-icon slot="prefix" name="list-ul"></sl-icon>
    {{ $t("actions.selectfields") }}
  </sl-button>

  <sl-dialog id="dialog-selectfields" :label="$t('actions.selectfields')" @sl-hide="saveConfig">
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
      <sl-button size="small" @click="selectall">{{ $t("selectfields.selectall") }}</sl-button>
      <sl-button size="small" @click="unselectall">{{ $t("selectfields.unselectall") }}</sl-button>
      <sl-button size="small" @click="invertselect">{{ $t("selectfields.invertselect") }}</sl-button>
    </sl-button-group>
  </sl-dialog>
</template>

<script setup>
import { reactive, inject } from "vue"
import { useDBStore } from "../stores/db"
const handlerState = inject("handlerState")
const currentlist = inject("currentlist")
const updateAction = inject("updateAction")
const reloadAction = inject("reloadAction")
const state = reactive({
  structure: {},
  active: [],
})
const dbStore = useDBStore()

function openSelectDialog() {
  if (handlerState.structure) {
    state.structure = handlerState.structure
  } else {
    state.structure = currentlist.structure
  }

  const conf = dbStore.getConf(handlerState.module)
  const selectedBones = localStorage.getItem(handlerState.module + "__selectedBones")
  if (selectedBones) {
    state.active = JSON.parse(selectedBones)
  } else if (conf && conf?.["columns"]) {
    state.active = conf["columns"]
  } else {
    state.active = Object.keys(Object.fromEntries(Object.entries(state.structure).filter(([, v]) => v["visible"])))
  }
  const dialog = document.getElementById("dialog-selectfields")
  dialog.show()
}

function visibleChange(boneName) {
  if (state.active.includes(boneName)) {
    state.active.splice(state.active.indexOf(boneName), 1)
  } else {
    state.active.push(boneName)
  }
  const selectedBones = []
  const struct = Object.keys(state.structure)
  for (const name of struct) {
    if (state.active.includes(name)) {
      selectedBones.push(name)
    }
  }
}

function selectall() {
  state.active = Object.keys(state.structure)
}

function unselectall() {
  state.active = []
}

function invertselect() {
  state.active = Object.keys(state.structure).filter((i) => !state.active.includes(i))
}
function saveConfig() {

  const conf = dbStore.getConf(handlerState.module)
  handlerState.selectedBones = state.active
  conf["columns"] = handlerState.selectedBones
  localStorage.setItem(handlerState.module + "__selectedBones", JSON.stringify(handlerState.selectedBones))
  if (!updateAction) {
    reloadAction(true)
    return
  }
  updateAction()
}
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

sl-checkbox {
  &::part(control) {
    position: relative;
  }
}
</style>
