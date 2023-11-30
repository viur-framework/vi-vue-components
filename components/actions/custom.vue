<template>
  <template v-if="state.access && state.info">
    <sl-button
      :disabled="state.disabled"
      size="small"
      :title="state.info['name']"
      @click="buttonClicked"
    >
      <sl-icon
        v-once
        slot="prefix"
        :name="state.iconInfo[1]"
        :library="state.iconInfo[0]"
        sprite
      ></sl-icon>
      {{ state.info["name"] }}
    </sl-button>
  </template>
  <teleport
    v-if="state.confirm"
    to="#dialogs"
    :disabled="!state.confirm"
  >
    <sl-dialog
      :label="state.info?.['name']"
      open
      @sl-after-hide="state.confirm = false"
    >
      {{ state.info?.["confirm"] }}

      <sl-button
        slot="footer"
        variant="success"
        @click="triggerAction"
      >
        {{ $t("confirm") }}
      </sl-button>
      <sl-button
        slot="footer"
        variant="danger"
        @click="state.confirm = false"
      >
        {{ $t("abort") }}
      </sl-button>
    </sl-dialog>
  </teleport>
</template>

<script lang="ts">
import { reactive, defineComponent, computed, inject, unref } from "vue"
import { useDBStore } from "../stores/db"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "../stores/user"
import { useContextStore } from "../stores/context"
import Logics from "logics-js"
import { Request } from "@viur/vue-utils"

export default defineComponent({
  props: {
    name: String
  },
  components: {},
  setup(props, context) {
    const route = useRoute()
    const router = useRouter()
    const handlerState: any = inject("handlerState")
    const dbStore = useDBStore()
    const contextStore = useContextStore()
    const userStore = useUserStore()
    const tableReload: any = inject("reloadAction")

    const state = reactive({
      confirm: false,
      info: computed(() => {
        let conf = dbStore.state["vi.modules"][handlerState["module"]]
        if (handlerState["view"]) {
          conf = conf["children"].filter((i) => i["view_number"] === parseInt(handlerState["view"]))?.[0]
        }
        return conf?.["customActions"]?.[props.name]
      }),
      access: computed(() => {
        let access = false
        if (state.info && state.info["access"]) {
          for (let i of state.info["access"]) {
            if (userStore.state.user?.access.includes(i)) {
              access = true
            }
          }
        }
        return access
      }),
      disabled: computed(() => {
        if (state.info["enabled"] === "True") {
          return false
        }

        if (handlerState.currentSelection?.length > 0) {
          if (!state.info["enabled"]) return false

          let ex = new Logics(state.info["enabled"])
          let disabled = true

          for (let selection of handlerState.currentSelection) {
            if (
              ex
                .run({
                  skel: selection,
                  additionalEvalData: state.info?.["additionalEvalData"]
                })
                .toBool()
            ) {
              disabled = false
              break
            }
          }
          return disabled
        }

        return true
      }),
      iconInfo: computed(() => {
        let lib = "default"
        let icon = ""
        const icondata = state.info?.["icon"].split("___")
        if (icondata.length === 2) {
          lib = icondata[0]
          icon = icondata[1]
        } else {
          icon = icondata[0]
        }
        return [lib, icon]
      })
    })

    function buildUrl(url, selection) {
      url = url.replace("{{module}}", handlerState.module)

      if (selection) {
        for (const [k, v] of Object.entries(selection)) {
          url = url.replace(`{{${k}}}`, v)
        }
      }

      return url
    }

    function buttonClicked() {
      if (state.info?.["confirm"]) {
        state.confirm = true
      } else {
        triggerAction()
      }
    }

    function triggerAction() {
      let actions = handlerState.currentSelection
      if (actions.length === 0) {
        actions = [null]
      }

      for (let i of actions) {
        if (state.info["action"] === "fetch") {
          handleFetch(i)
        } else if (state.info["action"] === "view") {
          handleView(i)
        } else if (state.info["action"] === "open") {
          handleOpen(i)
        } else if (state.info["action"] === "route") {
          routeOpen(i)
        }
      }
      state.confirm = false
    }

    function routeOpen(i) {
      let route = router.resolve(unref(state.info["url"]))
      dbStore.addOpened(route, null, null, state.info["name"], state.info["icon"], state.info["icon"])
    }

    function handleFetch(selection) {
      function triggerServersideAction(url) {
        url = buildUrl(url, selection)
        let request = Request.get
        for (const skey of ["?skey={{skey}}", "&skey={{skey}}"]) {
          if (url.includes(skey)) {
            url = url.replace(skey, "")
            request = Request.securePost
          }
        }

        request(url).then((resp) => {
          if (state.info?.["then"] === "reload-module") {
            tableReload()
          } else if (state.info?.["then"] === "reload-vi") {
            window.location.reload()
          }
          if (state.info?.["success"]) {
            //MESSAGE
          }
        })
      }

      triggerServersideAction(state.info["url"])
    }

    function handleView(selection) {
      if (!state.info?.["url"]) return
      if (selection === null) {
        let urlparts = state.info?.["url"].split("/")
        let new_route = router.resolve("/db/" + state.info?.["url"])
        dbStore.addOpened(new_route, urlparts[0])
        return
      } else {
        let searchParams = ""
        if (state.info?.["params"]) {
          let params = state.info?.["params"]
          for (const [k, v] of Object.entries(params)) {
            let akey = k
            if (k === "rootNode") akey = "parentrepo"
            contextStore.setContext(akey, selection[akey], route.query["_"])
          }
        }
        let urlparts = state.info?.["url"].split("/")
        let new_route = router.resolve("/db/" + state.info?.["url"])
        dbStore.addOpened(new_route, urlparts[0])
      }
    }

    function handleOpen(selection) {
      window.open(buildUrl(state.info["url"], selection), "_blank").focus()
    }

    return {
      state,
      buttonClicked,
      triggerAction
    }
  }
})
</script>

<style scoped></style>
