<template>
  <div class="wrapper">
    <sl-card>
      <img class="logo" :src="state.logo">

      <sl-alert v-if="userStore.state['user.loggedin']==='error'" open variant="danger">
        Fehler beim Anmelden
      </sl-alert>

      <div class="init-spinner"  style="position: relative;height:40px"  v-if="state.waitForInit">
        <loader></loader>
      </div>

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
          <div v-show="userStore.state['user.loggedin']==='no'">

            <sl-input type="text" name="name" v-model="state.name" placeholder="username" clearable
                      @sl-clear="state.name=''"></sl-input>
            <sl-input @keydown.enter="userLogin" type="password" name="password" v-model="state.password"
                      placeholder="password" @sl-clear="state.password=''" toggle-password></sl-input>
            <sl-button @click="userLogin" variant="primary"
                       v-if="['no', 'loading', 'error'].includes(userStore.state['user.loggedin'])"
                       :disabled="!state.userDataFilled"
                       :loading="userStore.state['user.loggedin']==='loading'"
            >
              Login

            </sl-button>
            <sl-button @click="logout" v-else>Logout</sl-button>
          </div>
           <div v-show="userStore.state['user.loggedin']==='secound_factor_authenticator_otp'">

            <sl-input type="text" name="otp" v-model="state.otp" placeholder="OTP" clearable></sl-input>

            <sl-button @click="userSecondFactor" variant="primary"
                       :loading="userStore.state['user.loggedin']==='loading'">
              Login
            </sl-button>

          </div>


        </sl-tab-panel>
        <sl-tab-panel name="google">
          <div id="google_oauth"></div>
          <sl-button @click="googleLogin" variant="primary"
                     v-if="['no', 'loading', 'error'].includes(userStore.state['user.loggedin'])"
                     :loading="userStore.state['user.loggedin']==='loading'"
          >
            Mit Google anmelden
          </sl-button>
          <sl-button @click="logout" variant="primary" v-else :loading="state.waitForLogout">Logout</sl-button>
        </sl-tab-panel>
        <!--<sl-tab-panel name="sso">Login with Mausbrand SSO</sl-tab-panel>-->
      </sl-tab-group>
    </sl-card>
  </div>

</template>

<script lang="ts">
import {useUserStore} from "../../stores/user"
import {reactive, computed, onBeforeMount, defineComponent, ref} from 'vue'
import {Request} from "@viur/viur-vue-utils";
import {useAppStore} from "../../stores/app";
import Loader from "../Generic/Loader.vue";

export default defineComponent({
  components: {Loader},
  setup() {

    //We must load the Vi settings

    const userStore = useUserStore()
    const appStore = useAppStore()

    //@ts-ignore
    const state = reactive({
      name: "",
      password: "",
      userDataFilled: computed(() => state.name && state.password),
      waitForLogout: false,
      waitForInit: true,
      backgroundImage:computed(() => `url('${appStore.state["admin.login.background"]}'`),
      logo:computed(() => appStore.state["admin.login.logo"]),
      otp:"",
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
    function userSecondFactor() {
      state.waitForLogout = false
      userStore.userSecondFactor(state.otp)
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
      state,
      userSecondFactor
    }
  },


})
</script>

<style scoped lang="less">

#google_oauth {
  display: flex;
  justify-content: center;
  padding-bottom: 20px;
}

.wrapper {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: v-bind("state.backgroundImage");
  background-position: center center;
  background-size: cover;
}

.wrapper::before {
  content: '';
  opacity: 0.7;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to left, var(--sl-color-primary-300), var(--sl-color-primary-500));
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
  min-width: 300px;
  max-width: 500px;
  width: 30vw;

  &::part(base) {
    background-color: var(--vi-background-color);
    border: none;
  }

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

sl-tab-group {
  --indicator-color: var(--vi-foreground-color);
  --track-color: transparent;
}

sl-tab {
  &::part(base) {
    padding: 10px 20px;
  }

  &[aria-selected="true"]{
    &::part(base) {
      color: var(--vi-foreground-color);
    }
  }
}

sl-tab-panel {
  &::part(base) {
    padding: 20px 0 0 0;
    border: none;
  }
}

sl-input {
  margin-bottom: 10px;
}
</style>
