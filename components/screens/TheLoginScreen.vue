<template>
  <div class="wrapper">
    <sl-card>
      <img
        class="logo"
        :src="state.logo"
      />
      <sl-alert
        v-if="userStore.state['user.loggedin'] === 'error'"
        open
        variant="danger"
      >
        Fehler beim Anmelden
      </sl-alert>

      <div
        v-if="state.waitFor === 'init'"
        class="init-spinner"
        style="position: relative; height: 40px"
      >
        <loader></loader>
      </div>

      <sl-tab-group v-else-if="state.waitFor === 'login'">
        <sl-tab
          slot="nav"
          panel="userpassword"
          :disabled="state.userPasswordLoginActivated"
        >
          Nutzer
        </sl-tab>

        <sl-tab
          slot="nav"
          panel="google"
          :disabled="state.userGoogleLoginActivated"
        >
          Google
        </sl-tab>
        <!--<sl-tab slot="nav" panel="sso">Mausbrand-SSO</sl-tab>-->

        <sl-tab-panel name="userpassword">
          <div v-show="['no', 'error'].includes(userStore.state['user.loggedin'])">
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

      <div v-else-if="userStore.state['user.loggedin'] === 'secound_factor_choice'">
        <div v-for="choice in userStore.state['user.login.secound_factor_choice']">
          <sl-button @click="userSecondFactorStart(choice)">
            {{ choice["name"] }}
          </sl-button>
        </div>
      </div>
      <div v-else-if="userStore.state['user.loggedin'] === 'secound_factor_input'">
        <template v-for="boneName in Object.keys(userStore.state['user.login.secound_factor']['structure'])">
          <bone
            :is="getBoneWidget(userStore.state['user.login.secound_factor']['structure'][boneName]['type'])"
            v-show="userStore.state['user.login.secound_factor']['structure'][boneName]['visible']"
            :name="boneName"
            :structure="userStore.state['user.login.secound_factor']['structure']"
            :errors="userStore.state['user.login.secound_factor_errors']"
            @change="updateValue"
          >
          </bone>
        </template>
        <sl-button
          variant="primary"
          @click="secondFactorSend"
        >
          Send
        </sl-button>
      </div>
    </sl-card>
  </div>
</template>

<script lang="ts">
import { useUserStore } from "../stores/user"
import { reactive, computed, onBeforeMount, defineComponent } from "vue"
import { useAppStore } from "../stores/app"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import bone from "@viur/vue-utils/bones/edit/bone.vue"
import { getBoneWidget } from "@viur/vue-utils/bones/edit/index"

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
      waitFor: "init",
      backgroundImage: computed(() => `url('${appStore.state["admin.login.background"]}')`),
      logo: computed(() => appStore.state["admin.login.logo"]),
      otp: "",
      userPasswordLoginActivated: computed(() => {
        return (
          (userStore.state["user.login.type"] !== "user" && userStore.state["user.login.type"] !== "no") ||
          !userStore.state.primaryAuthMethods.has("X-VIUR-AUTH-User-Password")
        )
      }),
      userGoogleLoginActivated: computed(() => {
        return (
          (userStore.state["user.login.type"] !== "google" && userStore.state["user.login.type"] !== "no") ||
          !userStore.state.primaryAuthMethods.has("X-VIUR-AUTH-Google-Account")
        )
      }),
      secondFactorFormdata: {}
    })
    console.log(state.userPasswordLoginActivated)
    console.log(state.userGoogleLoginActivated)

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
      state.waitFor = "" //FIXME
      userStore
        .userLogin(state.name, state.password)
        .then(() => {})
        .catch((e) => {
          state.waitFor = "login"
        })
    }
    function userSecondFactor() {
      state.waitForLogout = false
      userStore.userSecondFactor(state.otp)
    }
    function userSecondFactorStart(choice) {
      userStore.userSecondFactorStart(choice)
      console.log(choice)
    }
    function updateValue(data) {
      console.log(data.value)
      state.secondFactorFormdata[data.name] = data.value[0][data.name] //Fixme can this broke
    }
    function secondFactorSend() {
      console.log("send", state.secondFactorFormdata)
      userStore
        .secondFactorSend(state.secondFactorFormdata)
        .then(() => {})
        .catch((err) => {})
    }
    onBeforeMount(() => {
      userStore.getAuthMethods()

      userStore
        .updateUser()
        .then(() => {
          state.waitFor = "login"
        })
        .catch((error) => {
          state.waitFor = "login"
        })
    })

    return {
      googleLogin,
      logout,
      userStore,
      userLogin,
      state,
      userSecondFactor,
      userSecondFactorStart,
      getBoneWidget,
      updateValue,
      secondFactorSend
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
  background-image: v-bind("state.backgroundImage");
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
</style>
