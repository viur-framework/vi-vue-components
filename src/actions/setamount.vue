<template>
  <sl-select
    :value="localStore.state.listamount"
    :label="$t('actions.setamount') + ':'"
    size="small"
    :title="$t('actions.setamount')"
    @sl-change="amoutChange"
  >
    <sl-option value="30">30</sl-option>
    <sl-option value="60">60</sl-option>
    <sl-option value="99">99</sl-option>
  </sl-select>
</template>

<script setup>
import { reactive, defineComponent, inject, onBeforeMount } from "vue"
import { useLocalStore } from "../stores/local"

    const state = reactive({})
    const localStore = useLocalStore()

    const setLimit = inject("setLimit")
    function amoutChange(e) {
      setLimit(e.target.value)
      localStore.state.listamount = e.target.value
    }

</script>

<style scoped>
sl-select {
  &::part(form-control) {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  &::part(form-control-label) {
    margin-right: 7px;
    margin-bottom: 0;
  }
}
</style>
