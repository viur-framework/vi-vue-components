<template>
  <div class="wrapper">

    <div class="background-img">
      <img
        :src="state.backgroundImage"
        @error="$event.target.src = Utils.publicAsset('login-background.jpg')"
      />
    </div>
    <div class="card">
      <img
        class="logo"
        :src="state.logo"
        @error="$event.target.src = Utils.publicAsset('logo.svg')"
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

      <form
        v-show="['no', 'error'].includes(userStore.state['user.loggedin'])"
        autocomplete="on"
      >
        <input
          v-model="state.name"
          class="input"
          :placeholder="$t('login.email')"
          name="username"
          autocomplete="username"
        />

        <input
          v-model="state.password"
          class="input"
          :placeholder="$t('login.password')"
          name="password"
          type="password"
          autocomplete="current-password"
        />
        <sl-button
          v-if="['no', 'loading', 'error'].includes(userStore.state['user.loggedin'])"
          variant="primary"
          :disabled="!state.userDataFilled"
          :loading="userStore.state['user.loggedin'] === 'loading'"
          @click="userLogin"
        >
          {{ $t("login.login") }}
        </sl-button>
        <sl-button
          v-else
          @click="logout"
          >{{ $t("login.logout") }}
        </sl-button>
      </form>

      <div
        v-if="['no', 'error'].includes(userStore.state['user.loggedin'])"
        class="or">
        {{ $t("login.or") }}
      </div>

      <div v-if="['no', 'loading', 'error'].includes(userStore.state['user.loggedin'])">
        <sl-button
          :loading="userStore.state['user.loggedin'] === 'loading'"
          class="more-login-btn"
          @click="googleLogin"
        >
          <sl-icon
            slot="prefix"
            library="bootstrap"
            name="google"
            class="google-icon"
          ></sl-icon>
          {{ $t("login.with_google") }}
        </sl-button>
        <div id="google_oauth"></div>
      </div>
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
    </div>
  </div>
</template>

<script setup>

import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { reactive, computed, onBeforeMount, defineComponent } from "vue"
import { useAppStore } from "../stores/app"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import Utils from "../utils"

import { getBoneWidget } from "@viur/vue-utils/bones/edit/index"

    const userStore = useUserStore()
    const appStore = useAppStore()


    const state = reactive({
      name: "",
      password: "",
      userDataFilled: computed(() => state.name && state.password),
      waitForLogout: false,
      waitFor: "init",
      backgroundImage: computed(() => `${appStore.state["admin.login.background"]}`),
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

</script>

<style scoped>
#google_oauth {
  display: flex;
  justify-content: center;
}


sl-button.more-login-btn:has(+ #google_oauth > *) {
  display: none;
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
  background: linear-gradient(to top left, var(--sl-color-primary-700), var(--sl-color-primary-500));
}

.background-img {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: -1;

  img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.logo {
  height: 140px;
  padding: 20px;
  margin-bottom: 30px;
}

sl-button {
  width: 100%;

  &[disabled] {
    &::part(base) {
      opacity: 1;
    }
  }

  &.more-login-btn {
    &::part(base) {
      font-weight: 400;
    }
  }
}

.card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  z-index: 10;
  min-width: 483px;
  max-width: 500px;
  background-color: var(--vi-background-color);
  width: 30vw;
  padding: var(--sl-spacing-large);
  border-radius: var(--sl-border-radius-medium);
}

.input {
  flex: 1 1 auto;
  display: inline-flex;
  align-items: stretch;
  justify-content: start;
  position: relative;
  width: 100%;
  font-family: var(--sl-input-font-family);
  font-weight: var(--sl-input-font-weight);
  letter-spacing: var(--sl-input-letter-spacing);
  vertical-align: middle;
  overflow: hidden;
  cursor: text;
  border: solid var(--sl-input-border-width) var(--sl-input-border-color);
  border-radius: var(--sl-input-border-radius-medium);
  font-size: var(--sl-input-font-size-medium);
  box-shadow: none;
  color: var(--vi-foreground-color);
  background-color: var(--vi-background-color);
  border-color: var(--vi-border-color);
  height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
  padding: 0 var(--sl-input-spacing-medium);
  margin: 0 0 var(--sl-spacing-x-small) 0;
}

.or {
  opacity: 0.5;
  padding: var(--sl-spacing-small) 0;
  margin: 0 auto;
  text-align: center;
  font-size: 0.9em;
}

.init-spinner {
  display: flex;
  justify-content: center;
}

sl-tab-group {
  --indicator-color: var(--vi-foreground-color);
  --track-color: transparent;
}

sl-input {
  margin-bottom: 10px;
}

.background-img {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: -1;

  img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

sl-alert{
  margin-bottom: var(--sl-spacing-x-small);

  &::part(message){
      font-weight: 700;
      color: var(--sl-color-danger-500);
      padding: var(--sl-spacing-x-small) var(--sl-spacing-medium)
   }
}

</style>
