import {onBeforeMount} from "vue";
import {Request} from "@viur/viur-vue-utils";
import {useUserStore} from "./stores/user";
import {useAppStore} from "./stores/app";
import {useColorStore} from "./stores/color";
import {useModulesStore} from "./stores/modules";

export function useInitConnection(){
    const userStore = useUserStore();
    const appStore = useAppStore();
    const colorStore = useColorStore();
    useModulesStore().setmodules();

    onBeforeMount(() => {
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

      //check access on reactivation
      document.addEventListener("visibilitychange",()=>{
        userStore.updateUser()
      })
    })
}

