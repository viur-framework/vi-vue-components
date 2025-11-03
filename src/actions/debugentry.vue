<template>
  <sl-button size="small" variant="danger" outline :title="$t('actions.debug')" @click="debugClicked">
    <sl-icon slot="prefix" name="bug"></sl-icon>
    {{ $t("actions.debug") }}
  </sl-button>

  <teleport v-if="state.opened" to="#dialogs" :disabled="!state.opened">
    <sl-drawer open label="Debuggen" @sl-after-hide="crossClicked">
      <sl-details summary="Struktur">
        <pre>{{ viform.state.structure }}</pre>
      </sl-details>
      <sl-details summary="Eintrag">
        <pre>{{ viform.state.skel }}</pre>
      </sl-details>
    </sl-drawer>
  </teleport>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
//import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"

const handlerState = inject("handlerState")
const viform = inject("viform")
const dbStore = useDBStore()
const userStore = useUserStore()
const route = useRoute()
const state = reactive({
  opened: false,
})

function debugClicked() {
  state.opened = !state.opened
}

function crossClicked() {
  state.opened = !state.opened
}
</script>

<style scoped>
sl-button {
  margin-left: 5px;
}
</style>
