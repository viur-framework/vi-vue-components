<template>
  <sl-button variant="danger" :disabled="!state.active" @click="deleteEntries">
    <sl-icon slot="prefix" name="trash"></sl-icon>
    {{ $t("actions.delete") }}
  </sl-button>
</template>

<script lang="ts">
import {reactive, defineComponent, inject, computed} from 'vue'
import {Request} from "@viur/viur-vue-utils";
import {useMessageStore} from "../../stores/message";

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("state");
    const messageStore = useMessageStore();
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      })
    })

    async function deleteEntries() {
      //TODO Ask the user for persission

      for (const entry of handlerState.currentSelection) {
        let url = `/vi/${handlerState.module}/delete`
        await Request.securePost(url, {dataObj: {key: entry.key}}).then(async (resp: object) => {
           messageStore.addMessage("success", `Delete`, "Entry deleted successfully");
        })

      }
    }

    return {state, deleteEntries}
  }
})
</script>

<style scoped lang="less">

</style>
