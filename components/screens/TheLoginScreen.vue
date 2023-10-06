<template>
  <div class="wrapper">
    <div class="background-img">
      <img :src="state.backgroundImage"
            @error="$event.target.src = 's/login-background.jpg'"
      />
    </div>
    <sl-card>
      <img
        class="logo"
        :src="state.logo"
        @error="$event.target.src = 's/logo.svg'"
      />
      <sl-alert
        v-if="userStore.state['user.loggedin'] === 'error'"
        open
        variant="danger"
      >
        Fehler beim Anmelden
      </sl-alert>

      <div
        v-if="state.waitForInit"
        class="init-spinner"
        style="position: relative; height: 40px"
      >
        <loader></loader>
      </div>

      <sl-tab-group v-else>
        <sl-tab
          slot="nav"
          panel="userpassword"
          :disabled="userStore.state['user.login.type'] !== 'user' && userStore.state['user.login.type'] !== 'no'"
        >
          Nutzer
        </sl-tab>

        <sl-tab
          slot="nav"
          panel="google"
          :disabled="userStore.state['user.login.type'] !== 'google' && userStore.state['user.login.type'] !== 'no'"
        >
          Google
        </sl-tab>
        <!--<sl-tab slot="nav" panel="sso">Mausbrand-SSO</sl-tab>-->

        <sl-tab-panel name="userpassword">
          <div v-show="userStore.state['user.loggedin'] === 'no'">
            <sl-input
              v-model="state.name"
              type="text"
              name="name"
              placeholder="E-Mail"
              clearable
              autocomplete="on"
              @sl-clear="state.name = ''"
            ></sl-input>
            <sl-input
              v-model="state.password"
              type="password"
              name="password"
              autocomplete="on"
              placeholder="Passwort"
              toggle-password
              @keydown.enter="userLogin"
              @sl-clear="state.password = ''"
            ></sl-input>
            <sl-button
              v-if="['no', 'loading', 'error'].includes(userStore.state['user.loggedin'])"
              variant="primary"
              :disabled="!state.userDataFilled"
              :loading="userStore.state['user.loggedin'] === 'loading'"
              @click="userLogin"
            >
              Login
            </sl-button>
            <sl-button
              v-else
              @click="logout"
              >Logout</sl-button
            >
          </div>
          <div v-show="userStore.state['user.loggedin'] === 'secound_factor_authenticator_otp'">
            <sl-input
              v-model="state.otp"
              type="text"
              name="otp"
              placeholder="OTP"
              clearable
            ></sl-input>

            <sl-button
              variant="primary"
              :loading="userStore.state['user.loggedin'] === 'loading'"
              @click="userSecondFactor"
            >
              Login
            </sl-button>
          </div>
        </sl-tab-panel>
        <sl-tab-panel name="google">
          <div id="google_oauth"></div>
          <sl-button
            v-if="['no', 'loading', 'error'].includes(userStore.state['user.loggedin'])"
            variant="primary"
            :loading="userStore.state['user.loggedin'] === 'loading'"
            @click="googleLogin"
          >
            Mit Google anmelden
          </sl-button>
          <sl-button
            v-else
            variant="primary"
            :loading="state.waitForLogout"
            @click="logout"
            >Logout</sl-button
          >
        </sl-tab-panel>
        <!--<sl-tab-panel name="sso">Login with Mausbrand SSO</sl-tab-panel>-->
      </sl-tab-group>
    </sl-card>
  </div>
</template>

<script lang="ts">
import { useUserStore } from "../stores/user"
import { reactive, computed, onBeforeMount, defineComponent, ref } from "vue"
import { Request } from "@viur/vue-utils"
import { useAppStore } from "../stores/app"
import Loader from "@viur/vue-utils/generic/Loader.vue"

export default defineComponent({
  components: { Loader },
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
      backgroundImage: computed(() => `${appStore.state["admin.login.background"]}`),
      logo: computed(() => appStore.state["admin.login.logo"]),
      otp: ""
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
      userStore
        .updateUser()
        .then(() => {
          state.waitForInit = false
        })
        .catch((error) => {
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
  }
})
</script>

<style scoped>
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
  background-position: center center;
  background-size: cover;
}

.wrapper::before {
  content: "";
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
  width: 100%;
}

sl-card {
  z-index: 10;
  min-width: 483px;
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

  &[aria-selected="true"] {
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

.background-img{
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: -1;

  img{
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}
</style>
