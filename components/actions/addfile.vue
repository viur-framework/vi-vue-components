<template>
  <sl-button
    size="small"
    variant="success"
    :disabled="!state.canAdd"
    :title="$t('actions.addfile')"
    @click="fileUpload"
  >
    <sl-icon
      slot="prefix"
      name="plus-lg"
    ></sl-icon>
    {{ $t("actions.addfile") }}
  </sl-button>
  <input
    ref="fileinput"
    type="file"
    style="display: none"
    @change="fileuploaded"
  />
</template>

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject, computed, ref } from "vue"
import { useDBStore } from "../stores/db"
import { useUserStore } from "../stores/user"
import { useRoute } from "vue-router"
import { Request } from "@viur/vue-utils"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const tableReload: any = inject("reloadAction")
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const route = useRoute()
    const fileinput = ref()

    const state = reactive({
      file: null,
      inputRef: null,
      canAdd: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-add`) > -1
      })
    })

    function fileUpload(e) {
      fileinput.value.click()
      console.log(fileinput)
    }

    function fileuploaded(e) {
      state.file = e.target.files
      let targetnode = handlerState.currentSelection[0]["key"]
      console.log(handlerState.currentSelection)
      if (handlerState.currentSelectionType !== "node") {
        targetnode = handlerState.currentSelection[0]["parententry"]
      }
      console.log(targetnode)

      for (let f of state.file) {
        Request.securePost(`/vi/${handlerState.module}/getUploadURL`, {
          dataObj: {
            fileName: f["name"],
            mimeType: f["type"],
            size: f["size"].toString(),
            node: targetnode
          }
        }).then(async (resp) => {
          let data = await resp.json()
          console.log(data)
          fetch(data["values"]["uploadUrl"], {
            method: "POST",
            body: f,
            mode: "no-cors"
          }).then((resp) => {
            Request.add(handlerState.module, {
              dataObj: {
                key: data["values"]["uploadKey"],
                skelType: "leaf"
              }
            }).then(() => {
              tableReload()
            })
          })
        })
      }
    }

    return {
      state,
      fileUpload,
      fileuploaded,
      fileinput
    }
  }
})
</script>

<style scoped></style>
