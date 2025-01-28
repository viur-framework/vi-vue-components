<template>
  <template v-if="state.access && state.info">
    <template v-if="state.info['action'] === 'component'">
      <component
        :is="dbStore.state['handlerbar.actions'][state.info['component']]"
        :info="state.info"
      >
      </component>
    </template>
    <template v-else>
      <sl-button
        :disabled="state.disabled"
        size="small"
        :variant="state.variantInfo"
        :outline="state.outlineInfo"
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
        <template v-if="state.showLabelInfo">
          {{ state.info["name"] }}
        </template>
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

    <teleport
      v-if="state.actionSkelPopup"
      :to="'#view_dialogs_' + handlerState['tabId']"
      :disabled="!state.actionSkelPopup"
    >
      <sl-dialog
        :label="state.info?.['name']"
        style="--width: 85%"
        class="actionskel-popup"
        open
        @sl-after-hide="state.actionSkelPopup = false"
      >
        <action-handler
          :module="state.urlInfo[0].replace('.', '/')"
          :view="null"
          :group="''"
          :action="state.urlInfo[1]"
          :skelkey="null"
          :skeltype="''"
        >
        </action-handler>
      </sl-dialog>
    </teleport>

  </template>
</template>

<script setup>
import { reactive, defineComponent, computed, inject, unref } from "vue"
import { useDBStore } from "../stores/db"
import { useAppStore } from "../stores/app"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useContextStore } from "../stores/context"
import Logics from "logics-js"
import { Request } from "@viur/vue-utils"
import Utils from "../utils"


  const props = defineProps({
    name: String
  })

    const route = useRoute()
    const router = useRouter()
    const handlerState = inject("handlerState")
    const dbStore = useDBStore()
    const contextStore = useContextStore()
    const appStore = useAppStore()
    const userStore = useUserStore()
    const tableReload = inject("reloadAction")

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
            let current_access = buildUrl(i)
            if (userStore.state.user?.access.includes(current_access)) {
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
        const [icon, iconType, iconname, library] = Utils.iconNormalization(state.info?.["icon"])
        return [library, iconname]
      }),
      variantInfo: computed(() => {
        if (!state.info["variant"]) return "default"
        return state.info["variant"]
      }),
      outlineInfo: computed(() => {
        if (!state.info["outline"]) return false
        return state.info["outline"]
      }),
      showLabelInfo: computed(() => {
        if (!Object.keys(state.info).includes("show_label")) return true
        return state.info["show_label"]
      }),
      actionSkelPopup:false,
      urlInfo: computed(()=>buildUrl(state.info?.["url"],null).replace(/^\/+/, '').split("/"))
    })

    function buildUrl(url, selection) {
      url = url.replace("{{module}}", handlerState.module)
      if (handlerState.group) {
        url = url.replace("{{group}}", handlerState.group)
      }else{
        url = url.replace("{{group}}", 'all')
      }

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
          //call server url
          handleFetch(i)
        } else if (state.info["action"] === "view") {
          // open an admin internal url as tab
          handleView(i)
        } else if (state.info["action"] === "open") {
          // open external url
          handleOpen(i)
        } else if (state.info["action"] === "route") {
          // open an vue router route as tab
          routeOpen(i)
        } else if (state.info["action"] === "component") {
          // replace the whole button with a custom component, only access with be evaluated
        }
      }

      if (state.info["action"] === "action"){
        // open actionSkel
        handleAction(actions)
      }

      state.confirm = false
      if (state.info["action"] === "action" && state.info["target"] === "popup"){
        state.actionSkelPopup = true
      }
    }

    function routeOpen(i) {
      let route = router.resolve(unref(state.info["url"]))
      contextStore.setContext("selection", i, route.query["_"])
      dbStore.addOpened(route, "", null, state.info["name"], state.info["icon"], state.info["library"])
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
        if (url.startsWith("http") || url.startsWith("//")) {
          return false
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

            if (k === "rootNode") {
              akey = "parentrepo"
              contextStore.setContext(akey, selection[akey], route.query["_"])
            } else {
              contextStore.setContext(akey, buildUrl(v, selection), route.query["_"])
            }
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

    function handleAction(selection){
      if (!state.info?.["url"]) return
      let urlparts = buildUrl(state.info["url"],null).replace(/^\/+/, '').split("/")
      if (selection.length>0 && selection[0]!==null){
        let selectionKeys = selection.map(x=>x['key'])
        contextStore.setContext("@viur_selected_keys", selectionKeys, route.query["_"])
      }

      if (state.info?.["target"] === "popup"){

      }else{
        let route = router.resolve(`/db/${urlparts[0]}/action/${urlparts[1]}`)
        dbStore.addOpened(route, urlparts[0], null, state.info["name"], state.info["icon"], state.info["library"])
      }
    }

</script>

<style scoped>
.actionskel-popup{
  &::part(base) {
    position: absolute;
  }

  &::part(panel) {
    max-height: calc(100% - 100px);
    margin-bottom: 40px;
  }

  &::part(body) {
    display: contents;
  }

  &::part(footer) {
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }
}

</style>
