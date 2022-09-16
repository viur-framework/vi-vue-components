<template>
    <div class="wrapper">
        <sl-card style="width:457px">
            <img class="logo" src="/vi/logo.svg">

            <sl-alert v-if="userStore.state['user.loggedin']==='error'" open variant="danger">
                Fehler beim Anmelden
            </sl-alert>

            <sl-spinner class="init-spinner" v-if="state.waitForInit"></sl-spinner>

            <sl-tab-group v-else>
                <sl-tab slot="nav" panel="userpassword"
                        :disabled="userStore.state['user.login.type']!=='user' && userStore.state['user.login.type']!=='no'"
                >
                    Nutzer
                </sl-tab>

                <sl-tab slot="nav" panel="google"
                        :disabled="userStore.state['user.login.type']!=='google' && userStore.state['user.login.type']!=='no'"
                >
                    Google
                </sl-tab>
                <!--<sl-tab slot="nav" panel="sso">Mausbrand-SSO</sl-tab>-->

                <sl-tab-panel name="userpassword">
                    <sl-input type="text" name="name" v-model="state.name" placeholder="username" clearable
                              @sl-clear="state.name=''"></sl-input>
                    <sl-input @keydown.enter="userLogin" type="password" name="password" v-model="state.password"
                              placeholder="password" @sl-clear="state.password=''" toggle-password></sl-input>
                    <br>
                    <sl-button @click="userLogin"
                               v-if="['no', 'loading', 'error'].includes(userStore.state['user.loggedin'])"
                               :disabled="!state.userDataFilled"
                               :loading="userStore.state['user.loggedin']==='loading'"
                    >
                        Login
                    </sl-button>
                    <sl-button @click="logout" v-else>Logout</sl-button>
                </sl-tab-panel>
                <sl-tab-panel name="google">
                    <div id="google_oauth"></div>
                    <sl-button @click="googleLogin"
                               v-if="['no', 'loading', 'error'].includes(userStore.state['user.loggedin'])"
                               :loading="userStore.state['user.loggedin']==='loading'"
                    >
                        Mit Google anmelden
                    </sl-button>
                    <sl-button @click="logout" v-else :loading="state.waitForLogout">Logout</sl-button>
                </sl-tab-panel>
                <!--<sl-tab-panel name="sso">Login with Mausbrand SSO</sl-tab-panel>-->
            </sl-tab-group>
        </sl-card>
    </div>
</template>

<script lang="ts">
import {useUserStore} from "../../stores/user"
import {reactive, computed, onBeforeMount, defineComponent} from 'vue'

export default defineComponent({
    setup() {
        const userStore = useUserStore()

        //@ts-ignore
        const state = reactive({
            name: "",
            password: "",
            userDataFilled: computed(() => state.name && state.password),
            waitForLogout: false,
            waitForInit: true,
        })

        function googleLogin() {
            state.waitForLogout = false
            userStore.googleLogin()
        }

        function logout() {
            state.waitForLogout = true
            userStore.logout()
        }

        function userLogin() {
            state.waitForLogout = false
            userStore.userLogin(state.name, state.password)
        }

        onBeforeMount(() => {
            userStore.updateUser().then(() => {
                state.waitForInit = false
            }).catch((error) => {
                state.waitForInit = false
            })
        })

        return {
            googleLogin,
            logout,
            userStore,
            userLogin,
            state
        }
    }

})
</script>

<style scoped lang="less">

.wrapper {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: url("/vi/login-background.jpg");
    background-position: center center;
    background-size: cover;
}

.wrapper::before {
    content: '';
    opacity: 0.8;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: -webkit-gradient(linear, right top, left top, from(#ff5d36), to(#d00f1c));
    background: linear-gradient(to left, #ff5d36, #d00f1c);
}

.logo {
    height: 160px;
    padding: 30px;
    margin-bottom: 30px;
}

sl-button {
    width: 100%
}

sl-card {
    z-index: 10;

    &::part(body) {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: stretch;
    }
}

.init-spinner {
    display: flex;
    justify-content: center;
}

</style>