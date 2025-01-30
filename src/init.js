import { onBeforeMount } from "vue"
import { Request } from "@viur/vue-utils"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useAppStore } from "./stores/app"
import { useColorStore } from "./stores/color"
import { useModulesStore } from "./stores/modules"
import { useRoute } from "vue-router"
import Utils from "./utils"
// custom Bones

import { addBoneWidget, addBoneActionbar } from "@viur/vue-utils/bones/edit/index"

import selectaccessBone from "./bones/selectaccessBone.vue"
import relationalBone from "./bones/relationalBone.vue"
import fileBone from "./bones/fileBone.vue"
import fileBar from "./bones/actionbar/fileBar.vue"
import relationalBar from "./bones/actionbar/relationalBar.vue"
import { useExtensionsStore } from "./stores/extensions"

export function useInitConnection() {
  const userStore = useUserStore()
  const appStore = useAppStore()
  const colorStore = useColorStore()
  const extensionStore = useExtensionsStore()
  const route = useRoute()
  useModulesStore().setmodules()

  onBeforeMount(() => {
    initBones() // init CustomBones
    initExtensions() // init Extensions
    Request.get("/vi/settings")
      .then(async (resp) => {
        let data = await resp.json()

        for (const key in data) {
          if (data[key] !== undefined || data[key] !== null) {
            if (data[key].length > 0) {
              if ((key.endsWith(".logo") || key.endsWith(".background")) && !key.startsWith("/")) {
                appStore.state[key] = Utils.publicAsset(data[key])
                continue
              }
              appStore.state[key] = data[key]
            }
            if (key === "admin.color.primary") {
              colorStore.state.primaryColor = appStore.state[key]
            }
            if (key === "admin.color.secondary") {
              colorStore.state.secondaryColor = appStore.state[key]
            }
          }
        }

        document.title = data["admin.name"] ? data["admin.name"] : "ViUR Administration"

        if( data["admin.user.google.clientID"] ){
          userStore.googleInit(data["admin.user.google.clientID"]).catch(() => {
            throw new Error("clientId is required since the plugin is not initialized with a Client Id")
          })
        }
        if (route.query?.debug){
          appStore.state["debug"] = true
        }
        appStore.state["init"] = true
      })
      .catch(() => {
        appStore.state["failed"] = true
        console.log("Viur settings not Found")
      })

    function initBones() {
      addBoneWidget("select.access", selectaccessBone) //add Bone to store
      addBoneWidget("relational.tree.leaf.file.file", fileBone) //add Bone to store
      addBoneWidget("relational.", relationalBone) //add Bone to store

      addBoneActionbar("relational.tree.leaf.file.file", fileBar) //add custom multiple acionbar
      addBoneActionbar("relational.", relationalBar) //add custom multiple acionbar
    }

    function initExtensions() {
      extensionStore.initExtensions()
      // call init extension
      for (const [name, extension] of Object.entries(extensionStore.state.extensions)) {
        if (extension?.["init"]) {
          extension["init"]()
        }
      }
    }

    //check access on reactivation
    document.addEventListener("visibilitychange", () => {
      userStore.updateUser()
    })
  })
}
