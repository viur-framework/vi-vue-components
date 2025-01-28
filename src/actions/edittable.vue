<template>
  <sl-switch
    size="small"
    :title="$t('actions.edittable')"
    @sl-change="changeeditState"
  >
    <span>{{ $t("actions.edittable") }}</span>
  </sl-switch>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"

    const handlerState = inject("handlerState")
    const dbStore = useDBStore()

    function changeeditState(event) {
      console.log(event.target.checked)
      handlerState.editableTable = event.target.checked
    }
</script>

<style scoped>
span {
  font-size: 0.9em;
}
</style>
