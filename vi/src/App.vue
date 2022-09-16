<template>
    <the-main-screen v-if="userStore.state['user.loggedin']==='yes'"></the-main-screen>
    <the-login-screen v-else></the-login-screen>
</template>
<script lang="ts">
import TheLoginScreen from "vi-base/src/components/Screens/TheLoginScreen.vue"
import TheMainScreen from "vi-base/src/components/Screens/TheMainScreen.vue"
import {useUserStore} from "vi-base/src/stores/user"
import {useAppStore} from "vi-base/src/stores/app"
import {defineComponent, getCurrentInstance, onBeforeMount, onMounted, watch} from "vue"
import test from '@/components/test.vue'


export default defineComponent({
    components: {TheLoginScreen, TheMainScreen},
    setup() {
        const userStore = useUserStore()
        const appStore = useAppStore()

        onBeforeMount(() => {
            //userStore.googleInit("") //please provide googel clientid
        })

        onMounted(() => {
            appStore.addTopBarAction(test)
        })

        return {
            userStore
        }
    }
})

</script>
<style lang="less">
@import "vi-base/src/style/app.less";
</style>
