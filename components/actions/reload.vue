<template>
  <sl-button
    :loading="state.loading"
    size="small"
    :title="$t('actions.reload')"
    @click="reload"
  >
    <sl-icon
      slot="prefix"
      name="arrow-repeat"
    ></sl-icon>
    <!--{{ $t("actions.reload") }}-->
  </sl-button>
</template>

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject } from "vue"
import { useDBStore } from "../stores/db"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const tableReload: any = inject("reloadAction")

    const state = reactive({
      loading: false
    })

    function reload() {
      state.loading = true
      tableReload().then(() => {
        state.loading = false
      })
    }

    return {
      state,
      reload
    }
  }
})
</script>

<style scoped></style>
