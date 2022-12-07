import {reactive, computed} from 'vue';
import {defineStore} from "pinia";
import {Request} from "@viur/viur-vue-utils";
import utils from '../utils'
import {useAppStore} from "./app";
import {useRoute} from "vue-router";

const googleConfig = {
  library: "https://accounts.google.com/gsi/client",
  defaultButtonConfig: {theme: "outline", size: "large"},
  scopes: "email"
}


interface CredentialPopupResponse {
  clientId: string;
  /** JWT credential string */
  credential: string;
  /** This field shows how the credential is selected */
  select_by:
    | "auto"
    | "user"
    | "user_1tap"
    | "user_2tap"
    | "btn"
    | "btn_confirm"
    | "brn_add_session"
    | "btn_confirm_add_session";
}

interface TokenPopupResponse {
  /** The access token of a successful token response. */
  access_token: string;
  authuser: string;
  /** The lifetime in seconds of the access token. */
  expires_in: string;
  /** Type of prompt presented to the user */
  prompt: string;
  /** A space-delimited list of scopes that are approved by the user. */
  scope: string;
  /** The type of the token issued. */
  token_type: string;
}

export const useUserStore = defineStore("user", () => {
  const route = useRoute();

  const state = reactive({
    //user related
    "user": null,
    "user.loggedin": "no", // "yes", "no", "loading"
    "user.login.type": "no", // "no","user", "google", "sso"
    "favoriteModules": [],
    "lastActions": [],
    "syncedlastActions": [],
    "lastSynced": new Date().getTime(),


    //google stuff
    "google.api.loaded": false,
    "google.api.clientid": "",
    "google.api.renderButton": true,


  })

  function resetLoginInformation() {
    state["user"] = null
    state["user.loggedin"] = "no"
    state["user.login.type"] = "no"
  }

  function googleInit(ClientId: string) {
    return new Promise((resolve, reject) => {
      if (!ClientId) {
        reject("missing clientid");
        return;
      }

      state["google.api.clientid"] = ClientId
      if (!state["google.api.loaded"]) {
        const script = document.createElement("script");
        script.addEventListener("load", () => {
          state["google.api.loaded"] = true
          // @ts-ignore
          window.google.accounts.id.initialize({
            client_id: state["google.api.clientid"],
            scope: googleConfig.scopes,
            ux_mode: "popup",
            prompt_parent_id: "google_oauth",
            callback: (response: CredentialPopupResponse) => {
              if (response.credential) {
                Request.securePost("/json/user/auth_googleaccount/login", {
                  dataObj: {"token": response.credential}
                }).then((resp: Response) => {
                  Request.get("/json/user/view/self").then(
                    async (resp: Response) => {
                      let data = await resp.json()
                      state["user.loggedin"] = "yes"
                      state["user"] = data.values
                      state["user.login.type"] = "google"
                      resolve(response);
                    }).catch(
                    (error: Error) => {
                      resetLoginInformation()
                      state["user.loggedin"] = "error"
                      reject(response);
                    })
                }).catch(
                  (error: Error) => {
                    resetLoginInformation()
                    state["user.loggedin"] = "error"
                    reject(response);
                  })
              } else {
                resetLoginInformation()
                state["user.loggedin"] = "error"
                reject(response);
              }
            }
          })
          // @ts-ignore
          resolve(window.google)

        });
        script.src = googleConfig.library
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
    })
  }

  function googleLogin() {
    return new Promise((resolve, reject) => {
      state["user.loggedin"] = "loading"
      // @ts-ignore
      console.log(window.google.accounts)
      window.google.accounts.id.prompt((notification) => {
        if (["suppressed_by_user", "opt_out_or_no_session", "undefined"].includes(notification.getNotDisplayedReason())) {
          console.log("Please delete the g_state cookie")
          let div = document.getElementById("google_oauth")
          window.google.accounts.id.renderButton(div, {theme: 'outline', size: 'large'})

        }
      })
    });
  }

  function userLogin(name: string, password: string) {
    return new Promise((resolve, reject) => {
      state["user.loggedin"] = "loading"
      Request.securePost("/json/user/auth_userpassword/login",
        {
          dataObj: {
            "name": name,
            "password": password
          }
        }
      ).then(async (respLogin: Response) => {
        const logindata = await respLogin.json()
        if (logindata === "OKAY") {
          Request.get("/json/user/view/self").then(
            async (resp: Response) => {
              let data = await resp.json()
              state["user.loggedin"] = "yes"
              state["user"] = data.values
              state["user.login.type"] = "user"
            }).catch(
            (error: Error) => {
              resetLoginInformation()
              state["user.loggedin"] = "error"
              reject(respLogin);
            }
          )
        } else if (logindata["action"] === "authenticatorOTP")//We have a second factor
        {
          state["user.loggedin"] = "secound_factor_authenticator_otp"
          state["user.login.type"] = logindata["action"].toLowerCase()

        }


      }).catch(
        (error: Error) => {
          resetLoginInformation()
          state["user.loggedin"] = "error"
          reject(error);
        }
      )
    })
  }

  function userSecondFactor(otp: string) {
    return new Promise((resolve, reject) => {
      state["user.loggedin"] = "loading"
      Request.securePost(`/json/user/f2_${state["user.login.type"]}/verify`, {dataObj: {"otp": otp}})
        .then((resp) => {
          Request.get("/json/user/view/self").then(
            async (resp: Response) => {
              let data = await resp.json()
              state["user.loggedin"] = "yes"
              state["user"] = data.values
              state["user.login.type"] = "user"
            }).catch(
            (error: Error) => {
              resetLoginInformation()
              state["user.loggedin"] = "error"
              reject(respLogin);
            }
          )
        })
    })
  }

  function logout() {
    state["user.loggedin"] = "loading"
    if (state["user.login.type"] === "google") {
      //@ts-ignore
      //window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.revoke();
    }
    Request.securePost("/json/user/logout").then((resp: Response) => {
        resetLoginInformation()
      }
    ).catch(
      (error: Error) => {
        resetLoginInformation()
        state["user.loggedin"] = "error"
      }
    )
  }

  function updateUser() {
    return new Promise((resolve, reject) => {

      Request.get("/json/user/view/self").then(
        async (resp: Response) => {
          let data = await resp.json()
          state["user.loggedin"] = "yes"
          state["user"] = data.values
          state["user.login.type"] = "user"
          if (data.values["adminconfig"]) {
            const obj = JSON.parse(data.values["adminconfig"]);
            if (obj !== null) {
              for (const key in obj["lastActions"])//back to array
              {
                state.lastActions.push(obj["lastActions"][key]);
                state.syncedlastActions.push(obj["lastActions"][key]);
              }

            }
          }
          resolve(resp)
        }).catch(
        (error: Error) => {
          resetLoginInformation()
          reject(error);
        }
      )


    })

  }

  function addAction() {
    if (!state.user["adminconfig"]) {
      return
    }
    if (route) {
      const appStore = useAppStore();
      const conf = appStore.getConfByRoute(route);
      if (!conf) return;
      const action = {
        "url": route.fullPath,
        "module": conf["module"],
        "time": new Date().getTime(),
        "icon": conf["icon"],
        "name": conf["name"]
      }
      if (state.lastActions.length == 5) {
        state.lastActions.pop();
      }
      for (const lastaction of state.lastActions) {
        if (lastaction["url"] === action["url"]) // we have a duplicate
        {
          console.log("we have a duplicate")
          return;
        }
      }

      state.lastActions.unshift(action)
      let configObj = JSON.parse(state.user["adminconfig"]);
      if (configObj === null) {
        configObj = {"lastActions": state.lastActions};
      } else {
        configObj["lastActions"] = state.lastActions
      }
      state.user["adminconfig"] = JSON.stringify(configObj)
      if (new Date().getTime() - state.lastSynced > 30 * 1000) { // trigger sync only when the last sync is older than 30 sec
        synclastActions();
      }

    }

  }

  function synclastActions() {
    if (!state.user["adminconfig"]) {
      return
    }
    if (JSON.stringify(state.lastActions) !== JSON.stringify(state.syncedlastActions)) {
      state.syncedlastActions = JSON.parse(JSON.stringify(state.lastActions));// Delete referenc
      state.lastSynced = new Date().getTime();
      Request.securePost("/json/user/edit", {
        dataObj: {
          "key": state.user.key,
          "adminconfig": state.user["adminconfig"]
        }
      }).then(() => {
        console.log("sync success")
      })
    } else {
      console.log("nothing to sync")
    }

  }

  setInterval(synclastActions, 1000 * 30)//30 sec
  //TODO SYNC when close


  const getUser = computed(() => {
    if (state["user.loggedin"] === 'no') { //destroy userinfos
      state["user"] = null
      return false
    }

    return state["user"]
  })

  const userAccess = computed(() => {
    if (!state.user) return []

    return state.user["access"]
  })

  const userShortname = computed(() => {
    if (!state.user) return "-"

    if (state.user["firstname"]) {
      return `${state.user["firstname"][0]}. ${state.user["lastname"]}`
    } else {
      return state.user["lastname"]
    }
  })
  const favoriteModules = computed(() => {
    //return the modules
    const appStore = useAppStore();
    if (!state.user["adminconfig"]) return;
    let configObj = JSON.parse(state.user["adminconfig"]); //maybe we can use the
    if (configObj === null) {
      configObj = {"favoriteModules": []};
    }
    state.favoriteModules = [];

    for (const module of appStore.modulesTree) {
      if (configObj["favoriteModules"].indexOf(module["module"]) > -1) {
        state.favoriteModules.push(module);

      }
    }

    return state.favoriteModules;
  })
  const favoriteModules_keys = computed(() => {
    //return the names
    const obj = [];
    for (const module of state.favoriteModules) {
      obj.push(module["module"]);
    }

    return obj;
  })


  return {
    state,
    userAccess,
    userShortname,
    updateUser,
    googleInit,
    googleLogin,
    userLogin,
    userSecondFactor,
    logout,
    favoriteModules,
    favoriteModules_keys,
    addAction
  }
})
