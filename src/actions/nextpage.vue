<template>
  <sl-button-group v-if="!state.disable">
    <sl-button
      size="small"
      disabled
      class=""
    >
      {{ $t("actions.nextpage_stats", {n:handlerState.currentSelection.length, amount: currentlist?.state.skellist.length, selection: handlerState.currentSelection.length}) }}
    </sl-button>
    <sl-button
      :loading="state.loading"
      :disabled="state.disable"
      size="small"
      :title="$t('actions.nextpage', { amount: currentlist?.state.skellist.length })"
      @click="fetchAction"
    >
      <sl-icon
        slot="prefix"
        name="list"
      ></sl-icon>
      {{ $t("actions.nextpage", { amount: currentlist?.state.skellist.length }) }}
    </sl-button>
    <sl-select
      value="1"
      size="small"
      class="sl-button-group__button--last"
      style="width: 70px"
      @sl-change="amountChange"
    >
      <sl-option value="1">1</sl-option>
      <sl-option value="5">5</sl-option>
      <sl-option value="10">10</sl-option>
    </sl-select>
  </sl-button-group>
  <sl-button
    v-else
      size="small"
      disabled
      class=""
    >
      {{ $t("actions.nextpage_stats", {n:handlerState.currentSelection.length, amount: currentlist?.state.skellist.length, selection: handlerState.currentSelection.length}) }}
    </sl-button>
</template>

<script setup>

import { reactive, defineComponent, inject, computed } from "vue"

    const state = reactive({
      disable: computed(() => {
        if (!currentlist) return true
        return currentlist.state.state === 2
      }),
      loading: false,
      fetchamount: 0,
      pageselection: 1
    })

    const nextpage = inject("nextpage")
    const currentlist = inject("currentlist")
    const handlerState = inject("handlerState")

    function loadnextpage() {
      state.loading = true
      try {
        nextpage().then((resp) => {
          state.loading = false
          state.fetchamount = state.fetchamount - 1
          if (state.fetchamount > 0) {
            loadnextpage()
          }
        })
      } catch (e) {
        state.loading = false
      }
    }

    function fetchAction() {
      state.fetchamount = state.pageselection
      loadnextpage()
    }
    function amountChange(e) {
      state.pageselection = parseInt(e.target.value)
      state.fetchamount = state.pageselection
      loadnextpage()
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
sl-select::part(combobox) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
}
</style>
