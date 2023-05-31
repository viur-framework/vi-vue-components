<template>
  <template v-if="state.access && state.info">
    <sl-button :disabled="state.disabled" size="small" @click="buttonClicked" :title="state.info['name']">
      <sl-icon slot="prefix" :name="state.info['icon'].replace('icon-','')" :library="state.info['library']" sprite
               v-once></sl-icon>
      {{ state.info["name"] }}
    </sl-button>
  </template>
  <teleport v-if="state.confirm" to="#dialogs" :disabled="!state.confirm">
    <sl-dialog :label="state.info?.['name']" open @sl-after-hide="state.confirm=false">
      {{ state.info?.["confirm"] }}

      <sl-button slot="footer"
                 @click="triggerAction"
                 variant="success">
        {{$t('confirm')}}
      </sl-button>
      <sl-button slot="footer" variant="danger"
                 @click="state.confirm=false">
        {{$t('abort')}}
      </sl-button>
    </sl-dialog>
  </teleport>



</template>

<script lang="ts">
import {reactive, defineComponent, computed, inject, unref} from 'vue'
import {useDBStore} from "../../stores/db";
import {useRouter} from "vue-router";
import app from "../../App.vue";
import {useUserStore} from "../../stores/user";
import Logics from "logics-js"
import {Request} from "@viur/viur-vue-utils";

export default defineComponent({
  props: {
    name: String
  },
  components: {},
  setup(props, context) {
    const route = useRouter()
    const router = useRouter()
    const handlerState: any = inject("state")
    const dbStore = useDBStore();
    const userStore = useUserStore()
    const tableReload: any = inject("reloadAction")

    const state = reactive({
      confirm:false,
      info: computed(() => {
        let conf = dbStore.state["vi.modules"][handlerState["module"]]
        if (handlerState["view"]) {
          conf = conf["children"][handlerState["view"]]
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

        if (state.info["enabled"] && handlerState.currentSelection?.length > 0) {
          let ex = new Logics(state.info["enabled"])
          let disabled = true

          for (let selection of handlerState.currentSelection) {
            if (ex.run({
              "skel": selection,
              "additionalEvalData": state.info?.["additionalEvalData"]
            }).toBool()) {
              disabled = false
              break
            }
          }
          return disabled
        }

        return true
      })
    })

    function buttonClicked() {
      if (state.info?.["confirm"]){
        state.confirm=true;
      }else{
        triggerAction()
      }
    }

    function triggerAction() {
      let actions = handlerState.currentSelection
      if (!actions) {
        actions = [null]
      }

      for (let i of actions) {
        if (state.info["action"] === "fetch") {
          handleFetch(i)
        } else if (state.info["action"] === "view") {
          handleView(i)
        } else if (state.info["action"] === "open") {
          handleOpen(i)
        }
      }
    }

    function handleFetch(selection) {
      function triggerServersideAction(url) {
        Request.get(url).then((resp) => {
          if (state.info?.["then"] === "reload-module") {
            tableReload()
          } else if (state.info?.["then"] === "reload-vi") {
            window.location.reload()
          }
          if (state.info?.["success"]){
            //MESSAGE
          }
        })
      }

      if (selection === null) {
        triggerServersideAction(state.info["url"])
        return
      }
    }

    function handleView(selection) {
      if (!state.info?.['url']) return

      if (selection === null) {
        let urlparts = state.info?.['url'].split("/")
        let new_route = router.resolve("/"+state.info?.['url'])
        new_route.query["_"] = new Date().getTime().toString()

        console.log(new_route)
        console.log(urlparts)

        dbStore.addOpened(new_route, urlparts[0])
        return
      }
    }

    function handleOpen(selection) {
      if (selection === null) {
        window.open(state.info["url"], '_blank').focus();
        return
      }
    }


    return {
      state,
      buttonClicked,
      triggerAction
    }
  }
})
</script>

<style scoped lang="less">

</style>
