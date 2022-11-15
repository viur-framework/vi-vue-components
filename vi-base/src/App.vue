<template>
  <the-main-screen v-if="userStore.state['user.loggedin']==='yes'"></the-main-screen>
  <the-login-screen v-else></the-login-screen>
</template>
<script lang="ts">
import TheLoginScreen from "./components/Screens/TheLoginScreen.vue"
import TheMainScreen from "./components/Screens/TheMainScreen.vue"
import {useUserStore} from "./stores/user"
import {defineComponent, onBeforeMount} from "vue"

export default defineComponent({
  components: {TheLoginScreen, TheMainScreen},
  setup() {
    const userStore = useUserStore()
    onBeforeMount(() => {
      userStore.googleInit("").catch(() => {
        throw new Error(
          "clientId is required since the plugin is not initialized with a Client Id"
        );
      })

    })
    return {
      userStore
    }
  }
})
</script>
<style lang="less">
@import "./style/app.less";
</style>
