<template>
  <sl-switch
    size="small"
    :title="$t('actions.edittable')"
    @sl-change="changeeditState"
  >
    <span>{{ $t("actions.edittable") }}</span>
  </sl-switch>
</template>

<script lang="ts">
import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const dbStore = useDBStore()

    function changeeditState(event: any) {
      console.log(event.target.checked)
      handlerState.editableTable = event.target.checked
    }

    return {
      changeeditState
    }
  }
})
</script>

<style scoped>
span {
  font-size: 0.9em;
}
</style>
