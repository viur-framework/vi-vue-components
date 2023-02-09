<template>
  <sl-button variant="danger" size="small" :disabled="!state.active || !state.canDelete" @click="openDeletePopup">
    <sl-icon slot="prefix" name="trash"></sl-icon>
    {{ $t("actions.delete") }}
  </sl-button>

  <sl-dialog :label='$t("actions.delete")' id="dialog-delete">
    {{ `Do you want to delete these ${state.count} entries` }}<!--TODO Translate-->
    <sl-button slot="footer" variant="primary" @click="deleteEntries">{{ $t("actions.delete") }}</sl-button>
  </sl-dialog>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'
import {Request} from "@viur/viur-vue-utils";
import {useMessageStore} from "../../stores/message";
import {useAppStore} from "../../stores/app";
import {useRoute} from "vue-router";
import {useUserStore} from "../../stores/user";

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("state");
    const messageStore = useMessageStore();
    const userStore = useUserStore();
    const route = useRoute();
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      count: computed(() => {
        if (handlerState.currentSelection) {
          return handlerState.currentSelection.length;
        }
        return 0
      }),
      canDelete: computed(() => {
       if(userStore.state.user.access.indexOf("root") !== -1 )
       {
         return true;
       }
       return userStore.state.user.access.indexOf(`${handlerState.module}-delete`)>-1;
      })
    })

    async function deleteEntries() {
      const dialog = document.getElementById("dialog-delete");
      if (dialog !== null) {
        dialog.hide();
      }

      for (const entry of handlerState.currentSelection) {
        let url = `/vi/${handlerState.module}/delete`
        await Request.securePost(url, {dataObj: {key: entry.key}}).then(async (resp: object) => {
          //TODO Error handling
          messageStore.addMessage("success", `Delete`, "Entry deleted successfully");
        })

      }
    }

    function openDeletePopup() {
      const dialog = document.getElementById("dialog-delete");
      if (dialog !== null) {
        dialog.show();
      }


    }

    return {state, deleteEntries, openDeletePopup}
  }
})
</script>

<style scoped lang="less">

</style>
