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

export default defineComponent({
    components: {TheLoginScreen, TheMainScreen},
    setup() {
        const userStore = useUserStore();
        const appStore = useAppStore();
		//const mainColor=computed(()=>appStore.state["admin.color.primary"]);
		const mainColor="#ff00ff";
		Request.get("/vi/settings").then(
		async (resp: Response) => {
		  let data = await resp.json();
		  for(const key in data)
		  {
			  appStore.state[key]=data[key];
		  }
		  document.title = data["admin.name"];


		}
	)
        onBeforeMount(() => {
            //userStore.googleInit("") //please provide googel clientid
        })
        return {
            userStore,
			mainColor
        }
    }
})
</script>
<style lang="less">
@import "./style/app.less";
@mainColor: v-bind(mainColor);
@basic-linkHoverColor: darken(@mainColor, 10%);

</style>
