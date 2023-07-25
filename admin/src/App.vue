<template>
  <the-loading-screen v-if="!appStore.state['init']"></the-loading-screen>
  <the-main-screen v-else-if="userStore.state['user.loggedin']==='yes'"></the-main-screen>
  <the-login-screen v-else></the-login-screen>
</template>
<script lang="ts">
// @ts-nocheck
import TheLoginScreen from "@viur/vi-components/screens/TheLoginScreen.vue"
import TheMainScreen from "@viur/vi-components/screens/TheMainScreen.vue"
import TheLoadingScreen from "@viur/vi-components/screens/TheLoadingScreen.vue"
import {useUserStore} from "@viur/vi-components/stores/user"
import {computed, defineComponent, onBeforeMount, onMounted} from "vue"
import {Request} from "@viur/vue-utils";
import { useAppStore } from "@viur/vi-components/stores/app";
import {useDBStore} from "@viur/vi-components/stores/db";
import {useColorStore} from "@viur/vi-components/stores/color";
import {useModulesStore} from "@viur/vi-components/stores/modules";


export default defineComponent({
  components: {TheLoginScreen,TheMainScreen,TheLoadingScreen},
  setup() {
    const userStore = useUserStore();
    const dbStore = useDBStore();
    const colorStore = useColorStore();
    const appStore = useAppStore()

    onMounted(()=>{

    })

    function getPrimaryColor(lightness) {
      return colorStore.getPrimaryColor(lightness);
    }

    function getSecondaryColor(lightness) {
      return colorStore.getSecondaryColor(lightness);
    }

    return {
      userStore,
      appStore,
      getPrimaryColor,
      getSecondaryColor
    }
  }
})
</script>
<style>
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
</style>
