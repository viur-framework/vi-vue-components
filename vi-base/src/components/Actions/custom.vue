<template>
  <template v-if="state.access && state.info">
    <sl-button :disabled="state.disabled" size="small" @click="buttonClicked">
      <sl-icon slot="prefix" :name="state.info['icon'].replace('icon-','')" :library="state.info['library']" sprite
               v-once></sl-icon>
      {{ state.info["name"] }}
    </sl-button>
  </template>
</template>

<script lang="ts">
import {reactive, defineComponent, computed, inject} from 'vue'
import {useAppStore} from "../../stores/app";
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
    const handlerState: any = inject("state")
    const appStore = useAppStore();
    const userStore = useUserStore()
    const tableReload: any = inject("reloadAction")

    const state = reactive({
      info: computed(() => {
        let conf = appStore.state["vi.modules"][handlerState["module"]]
        if (handlerState["view"]) {
          conf = conf["children"][handlerState["view"]]
        }
        return conf["customActions"]?.[props.name]
      }),
      access: computed(() => {
        let access = false
        if (state.info) {
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

        if (state.info["enabled"] && handlerState.currentSelection.length > 0) {
          let ex = new Logics(state.info["enabled"])
          let valid = true
          for (let i of handlerState.currentSelection) {
            if (!ex.run({
              "skel": handlerState.currentSelection[i],
              "additionalEvalData": state.info?.["additionalEvalData"]
            }).toBool()) {
              valid = false
              break
            }
          }
          return valid
        }

        return true
      })
    })

    function buttonClicked() {
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
        })
      }

      if (selection === null) {
        triggerServersideAction(state.info["url"])
        return
      }
    }

    function handleView(selection) {
      if (selection === null) {

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
      buttonClicked
    }
  }
})
</script>

<style scoped lang="less">

</style>
