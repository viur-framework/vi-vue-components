<template>
  <the-main-screen v-if="userStore.state['user.loggedin']==='yes'"></the-main-screen>
  <the-login-screen v-else></the-login-screen>
</template>
<script lang="ts">
import TheLoginScreen from "./components/Screens/TheLoginScreen.vue"
import TheMainScreen from "./components/Screens/TheMainScreen.vue"
import {useUserStore} from "./stores/user"
import {computed, defineComponent, onBeforeMount} from "vue"
import {Request} from "@viur/viur-vue-utils";
import {useAppStore} from "./stores/app";
import {useColorStore} from "./stores/color";
import {useModulesStore} from "./stores/modules";

export default defineComponent({
  components: {TheLoginScreen, TheMainScreen},
  setup() {
    const userStore = useUserStore();
    const appStore = useAppStore();
    const colorStore = useColorStore();
    useModulesStore().setmodules();

    Request.get("/vi/settings").then(
      async (resp: Response) => {
        let data = await resp.json();
        console.log(data)
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


      }
    ).catch(()=>{
      console.log("Viur settings not Found")
    })
    onBeforeMount(() => {
     userStore.googleInit("").catch(() => {
        throw new Error(
          "clientId is required since the plugin is not initialized with a Client Id"
        );
      })
    })

    function getPrimaryColor(lightness) {
      return colorStore.getPrimaryColor(lightness);
    }

    function getSecondaryColor(lightness) {
      return colorStore.getSecondaryColor(lightness);
    }

    return {
      userStore,
      getPrimaryColor,
      getSecondaryColor
    }
  }
})
</script>
<style lang="less">
@import "./style/app.less";

* {

  --sl-color-primary-50: v-bind(getPrimaryColor(83));
  --sl-color-primary-100: v-bind(getPrimaryColor(78));
  --sl-color-primary-200: v-bind(getPrimaryColor(68));
  --sl-color-primary-300: v-bind(getPrimaryColor(58));
  --sl-color-primary-400: v-bind(getPrimaryColor(48));
  --sl-color-primary-500: v-bind(getPrimaryColor(43));
  --sl-color-primary-600: v-bind(getPrimaryColor(38));
  --sl-color-primary-700: v-bind(getPrimaryColor(28));
  --sl-color-primary-800: v-bind(getPrimaryColor(18));
  --sl-color-primary-900: v-bind(getPrimaryColor(8));
  --sl-color-primary-950: v-bind(getPrimaryColor(3));


  --sl-color-secondary-50: v-bind(getSecondaryColor(60));
  --sl-color-secondary-100: v-bind(getSecondaryColor(55));
  --sl-color-secondary-200: v-bind(getSecondaryColor(45));
  --sl-color-secondary-300: v-bind(getSecondaryColor(35));
  --sl-color-secondary-400: v-bind(getSecondaryColor(25));
  --sl-color-secondary-500: v-bind(getSecondaryColor(20));
  --sl-color-secondary-600: v-bind(getSecondaryColor(15));
  --sl-color-secondary-700: v-bind(getSecondaryColor(5));
  --sl-color-secondary-800: v-bind(getSecondaryColor(0));
  --sl-color-secondary-900: v-bind(getSecondaryColor(0));
  --sl-color-secondary-950: v-bind(getSecondaryColor(0));

}

/*
    --sl-color-primary-50: hsla(355.95854922 86.5470852% 83.7254902% / 100%);
  --sl-color-primary-100: hsla(355.95854922 86.5470852% 78.7254902% / 100%);
  --sl-color-primary-200: hsla(355.95854922 86.5470852% 68.7254902% / 100%);
  --sl-color-primary-300: hsla(355.95854922 86.5470852% 58.7254902% / 100%);
  --sl-color-primary-400: hsla(355.95854922 86.5470852% 48.7254902% / 100%);
  --sl-color-primary-500: hsla(355.95854922 86.5470852% 43.7254902% / 100%);
  --sl-color-primary-600: hsla(355.95854922 86.5470852% 38.7254902% / 100%);
  --sl-color-primary-700: hsla(355.95854922 86.5470852% 28.7254902% / 100%);
  --sl-color-primary-800: hsla(355.95854922 86.5470852% 18.7254902% / 100%);
  --sl-color-primary-900: hsla(355.95854922 86.5470852% 8.7254902% / 100%);
  --sl-color-primary-950: hsla(355.95854922 86.5470852% 3.7254902% / 100%);
  */


</style>
