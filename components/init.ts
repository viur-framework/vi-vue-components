import {onBeforeMount} from "vue";
import {Request} from "@viur/vue-utils";
import {useUserStore} from "./stores/user";
import {useAppStore} from "./stores/app";
import {useColorStore} from "./stores/color";
import {useModulesStore} from "./stores/modules";
import {userRequestStore} from "@viur/vue-utils/"
// custom Bones
//@ts-ignore
import {addBoneWidget, addBoneActionbar } from '@viur/vue-utils'
import selectaccessBone from './bones/selectaccessBone.vue';
import relationalBone from './bones/relationalBone.vue';
import fileBone from './bones/fileBone.vue';

import fileBar from "./bones/actionbar/fileBar.vue"
import relationalBar from "./bones/actionbar/relationalBar.vue"

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
        //addBoneWidget("select.access", selectaccessBone) //add Bone to store
        //addBoneWidget("relational.tree.leaf.file.file", fileBone) //add Bone to store
        //addBoneWidget("relational.", relationalBone) //add Bone to store

        //addBoneActionbar("relational.tree.leaf.file.file", fileBar) //add custom multiple acionbar
        //addBoneActionbar("relational.", relationalBar) //add custom multiple acionbar

      }

      //check access on reactivation
      document.addEventListener("visibilitychange",()=>{
        userStore.updateUser()
      })
    })
}

