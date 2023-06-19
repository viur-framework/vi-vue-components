import {onBeforeMount} from "vue";
import {Request} from "@viur/viur-vue-utils";
import {useUserStore} from "./stores/user";
import {useAppStore} from "./stores/app";
import {useColorStore} from "./stores/color";
import {useModulesStore} from "./stores/modules";
// custom Bones
import {addBoneWidget, addBoneActionbar } from '@viur/viur-vue-utils'
import selectaccessBone from './components/Bones/selectaccessBone.vue';
import relationalBone from './components/Bones/relationalBone.vue';
import fileBone from './components/Bones/fileBone.vue';

import fileBar from "./components/Bones/actionbar/fileBar.vue"
import relationalBar from "./components/Bones/actionbar/relationalBar.vue"

export function useInitConnection(){
    const userStore = useUserStore();
    const appStore = useAppStore();
    const colorStore = useColorStore();
    useModulesStore().setmodules();


    onBeforeMount(() => {
      initBones() // init CustomBones
      Request.get("/vi/settings").then(
        async (resp: Response) => {
          let data = await resp.json();

          for (const key in data) {
            if (data[key] !== undefined || data[key] !== null) {
              if (data[key].length > 0) {
                appStore.state[key] = data[key];
              }
              if (key === "admin.color.primary") {
                colorStore.state.primaryColor = appStore.state[key];
              }
              if (key === "admin.color.secondary") {
                colorStore.state.secondaryColor = appStore.state[key];
              }
            }
          }
          document.title = data["admin.name"];

          userStore.googleInit(data["admin.user.google.clientID"]).catch(() => {
            throw new Error(
              "clientId is required since the plugin is not initialized with a Client Id"
            );
          })
        }
      ).catch(()=>{
        console.log("Viur settings not Found")
      })


      function initBones(){
        addBoneWidget("select.access", selectaccessBone) //add Bone to store
        addBoneWidget("relational.tree.leaf.file.file", fileBone) //add Bone to store
        addBoneWidget("relational.", relationalBone) //add Bone to store

        addBoneActionbar("relational.tree.leaf.file.file", fileBar) //add custom multiple acionbar
        addBoneActionbar("relational.", relationalBar) //add custom multiple acionbar

      }

      //check access on reactivation
      document.addEventListener("visibilitychange",()=>{
        userStore.updateUser()
      })
    })
}

