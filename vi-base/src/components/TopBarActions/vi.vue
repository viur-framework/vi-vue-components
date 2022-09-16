<template>
    <sl-dropdown>
        <sl-button variant="default" size="small" slot="trigger" caret>
            {{ userStore.userShortname }}
        </sl-button>

        <sl-menu>
            <sl-menu-item>
                Version 4.0.0
            </sl-menu-item>
            <sl-divider></sl-divider>
            <sl-menu-item @click="logout">
                Logout
            </sl-menu-item>
        </sl-menu>
    </sl-dropdown>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'
import {useUserStore} from "../../stores/user";

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const userStore = useUserStore()
        const state = reactive({})

        function logout() {
            userStore.logout()
        }

        return {
            state,
            userStore,
            logout
        }
    }
})
</script>

<style scoped lang="less">

</style>