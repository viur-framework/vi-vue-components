<template>
  <sl-button-group v-if="!state.disable">
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
    {{ $t("actions.nextpage_finish", { amount: currentlist?.state.skellist.length }) }}
  </sl-button>
</template>

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({
      disable: computed(() => {
        if (!currentlist) return true
        return currentlist.state.state === 2
      }),
      loading: false,
      fetchamount: 0,
      pageselection: 1
    })

    const nextpage: any = inject("nextpage")
    const currentlist: any = inject("currentlist")

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

    return { state, loadnextpage, currentlist, amountChange, fetchAction }
  }
})
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
