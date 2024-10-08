<template>
  <sl-button
    variant="success"
    size="small"
    :loading="state.loading"
    title="$t(name)"
    :outline="name === 'actions.save_next' || name === 'actions.save_close'"
    @click="save"
  >
    <sl-icon
      slot="prefix"
      :name="icon"
    ></sl-icon>
    {{ $t(name) }}
  </sl-button>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDBStore } from "../stores/db"
import { useAppStore } from "../stores/app"
import { Request } from "@viur/vue-utils"
import { useMessageStore } from "../stores/message"
import { useContextStore } from "../stores/context"
export default defineComponent({
  props: {
    close: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      default: "actions.save"
    },
    icon: {
      type: String,
      default: "check"
    }
  },
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const router = useRouter()
    const route = useRoute()
    const dbStore = useDBStore()
    const contextStore = useContextStore()
    const appStore = useAppStore()
    const viform = inject("viform")
    const state = reactive({
      loading: false
    })
    const messageStore = useMessageStore()

    function save() {
      state.loading = true
      let url = ""
      let obj = contextStore.getContext(handlerState.tabId)
      if (
        appStore.state["core.version"] &&
        appStore.state["core.version"]?.[0] >= 3 &&
        appStore.state["core.version"]?.[1] >= 6
      ) {
        url = `/${handlerState.renderer}/${handlerState.module}/${handlerState.action}`
      } else {
        url = `/${handlerState.renderer}/${handlerState.module}/${
          handlerState.action === "clone" ? "add" : handlerState.action
        }`
      }

      if (handlerState.skeltype === "node" || handlerState.skeltype === "leaf") {
        url += `/${handlerState.skeltype}`

        if (handlerState.action === "clone") {
          obj["node"] = handlerState.skel["parententry"]
        } else {
          obj["node"] = handlerState.skelkey
        }
      }

      if (handlerState.group) {
        url += `/${handlerState.group}`
      }

      if (
        handlerState.action === "edit" ||
        (appStore.state["core.version"] &&
          appStore.state["core.version"]?.[0] >= 3 &&
          appStore.state["core.version"]?.[1] >= 6 &&
          handlerState.action === "clone")
      ) {
        url += `/${handlerState.skelkey}`
      }

      viform.value.sendData(url, obj).then(async (resp: Response) => {
          let responsedata = await resp.json()

          if (resp.status !== 200) {
            messageStore.addMessage("error", `Error on Save`, "Error on Save")
            state.loading = false
            return 0
          }

          if (handlerState.action === "edit") {
            if (responsedata["action"] === "edit" || responsedata["action"] === "clone") {
              //Something went wrong we must thorw (show) errors
              state.loading = false
              messageStore.addMessage("error", `Error on Save`, "Error on Save")
            } else {

              messageStore.addMessage("success", `Edit`, "Entry edited successfully")
              dbStore.markHandlersToUpdate(handlerState.module, handlerState.group)
              state.loading = false
              if (props.close) {
                dbStore.removeOpened(route)
              }
            }
          }
          if (handlerState.action === "add" || handlerState.action === "clone") {
            if (responsedata["action"] === "add" || responsedata["action"] === "clone") {
              //Something went wrong we must thorw (show) errors
              state.loading = false
              messageStore.addMessage("error", `Error on Save`, "Error on Save")
            } else {
              messageStore.addMessage("success", `Add`, "Entry added successfully")
              state.loading = false
              dbStore.markHandlersToUpdate(handlerState.module, handlerState.group)
              if (props.name !== "actions.save_next") {
                dbStore.removeOpened(route)
                if (!props.close) {
                  let new_route = router.resolve(`/db/${handlerState.module}/edit/${responsedata["values"]["key"]}`)
                  if (handlerState.skeltype === "node") {
                    new_route = router.resolve(`/db/${handlerState.module}/edit/node/${responsedata["values"]["key"]}`)
                  } else if (handlerState.skeltype === "leaf") {
                    new_route = router.resolve(`/db/${handlerState.module}/edit/leaf/${responsedata["values"]["key"]}`)
                  } else if (handlerState.skel['listgroup']){
                    new_route = router.resolve(`/db/${handlerState.module}/edit/${handlerState.skel['listgroup']}/${responsedata["values"]["key"]}`)
                  }else if (handlerState.group) {
                    new_route = router.resolve(`/db/${handlerState.module}/edit/${handlerState.group}/${responsedata["values"]["key"]}`)
                  }
                  dbStore.addOpened(new_route, handlerState.module, handlerState.group)
                }
              }
            }
          }
          if (responsedata["action"] !== handlerState.action+"Success"){
            state.loading = false
            messageStore.addMessage("error", `Error on Save`, "Error on Save")
          }else{
            state.loading = false
            messageStore.addMessage("success", `Add`, "Entry added successfully")
            dbStore.markHandlersToUpdate(handlerState.module, handlerState.group)
            if (props.close) {
              dbStore.removeOpened(route)
            }
          }

        })
        .catch((error) => {
          console.log(error)
          messageStore.addMessage("error", `Error on Save`, "Error on Save")
        })
    }

    return {
      state,
      save,
      handlerState,
      route
    }
  }
})
</script>

<style scoped></style>
