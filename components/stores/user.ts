// @ts-nocheck
import {computed, reactive} from "vue"
import {defineStore} from "pinia"
import {Request} from "@viur/vue-utils"
import {useDBStore} from "./db"
import {useRoute} from "vue-router"

const googleConfig = {
  library: "https://accounts.google.com/gsi/client",
  defaultButtonConfig: {theme: "outline", size: "large"},
  scopes: "email"
}

interface CredentialPopupResponse {
  clientId: string
  /** JWT credential string */
  credential: string
  /** This field shows how the credential is selected */
  select_by:
    | "auto"
    | "user"
    | "user_1tap"
    | "user_2tap"
    | "btn"
    | "btn_confirm"
    | "brn_add_session"
    | "btn_confirm_add_session"
}

interface TokenPopupResponse {
  /** The access token of a successful token response. */
  access_token: string
  authuser: string
  /** The lifetime in seconds of the access token. */
  expires_in: string
  /** Type of prompt presented to the user */
  prompt: string
  /** A space-delimited list of scopes that are approved by the user. */
  scope: string
  /** The type of the token issued. */
  token_type: string
}

export const useUserStore = defineStore("user", () => {
  const route = useRoute()

  const state = reactive({
    //user related
    user: null,
    "user.loggedin": "no", // "yes", "no", "loading"
    "user.login.type": "no", // "no","user", "google", "sso"
    favoriteModules: [],
    lastActions: [],
    syncedlastActions: [],
    lastSynced: new Date().getTime(),

    //google stuff
    "google.api.loaded": false,
    "google.api.clientid": "",
    "google.api.renderButton": true,

    //auth methos
    primaryAuthMethods: new Set(),
    secondFactors: new Set(),
    "user.login.secound_factor_choice": [],
    "user.login.secound_factor": {},
    "user.login.secound_factor_errors": []
  })

  function resetLoginInformation() {
    state["user"] = null
    state["user.loggedin"] = "no"
    state["user.login.type"] = "no"
  }

  function googleInit(ClientId: string) {
    return new Promise((resolve, reject) => {
      if (!ClientId) {
        reject("missing clientid")
        return
      }

      state["google.api.clientid"] = ClientId
      if (!state["google.api.loaded"]) {
        const script = document.createElement("script")
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
                Request.securePost("/vi/user/auth_googleaccount/login", {
                  dataObj: {token: response.credential, "@vi-admin": 1},
                  amount: 1
                })
                  .then((resp: Response) => {
                    Request.get("/vi/user/view/self")
                      .then(async (resp: Response) => {
                        let data = await resp.json()
                        state["user.loggedin"] = "yes"
                        state["user"] = data.values
                        state["user.login.type"] = "google"
                        resolve(response)
                      })
                      .catch((error: Error) => {
                        console.log("DDD")
                        resetLoginInformation()
                        state["user.loggedin"] = "error"
                        reject(response)
                      })
                  })
                  .catch((error: Error) => {
                    console.log(error)
                    resetLoginInformation()
                    state["user.loggedin"] = "error"
                    reject(response)
                  })
              } else {
                resetLoginInformation()
                state["user.loggedin"] = "error"
                reject(response)
              }
            }
          })
          // @ts-ignore
          resolve(window.google)
        })
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
        if (
          ["suppressed_by_user", "opt_out_or_no_session", "undefined"].includes(notification.getNotDisplayedReason())
        ) {
          console.log("Please delete the g_state cookie")
          let div = document.getElementById("google_oauth")
          window.google.accounts.id.renderButton(div, {theme: "outline", size: "large"})
        }
      })
    })
  }

  function userLogin(name: string, password: string) {
    return new Promise((resolve, reject) => {
      state["user.loggedin"] = "loading"
      Request.securePost("/vi/user/auth_userpassword/login", {
        dataObj: {
          name: name,
          password: password,
          "@vi-admin": 1
        },
        amount: 1
      })
        .then(async (respLogin: Response) => {
          try {
            const loginResponse = await respLogin.json()

            if (loginResponse === "OKAY") {
              Request.get("/vi/user/view/self")
                .then(async (resp: Response) => {
                  let data = await resp.json()
                  state["user.loggedin"] = "yes"
                  state["user"] = data.values
                  state["user.login.type"] = "user"
                })
                .catch((error: Error) => {
                  resetLoginInformation()
                  state["user.loggedin"] = "error"
                  reject(respLogin)
                })
            } else if (Array.isArray(loginResponse)) {
              //We can choose a secondfactor
              //We have a second factor
              state["user.loggedin"] = "secound_factor_choice"
              state["user.login.secound_factor_choice"] = loginResponse
            } else if (typeof loginResponse === "object" && loginResponse["values"] !== undefined) {
              loginResponse["structure"] = structureToDict(loginResponse["structure"])
              state["user.login.secound_factor"] = loginResponse
              console.log(state["user.login.secound_factor"]["structure"] ,"HEst ?")
              state["user.loggedin"] = "secound_factor_input"
            } else if (loginResponse === "FAILURE") {
              state["user.loggedin"] = "error"
              reject(respLogin)
            }
          } catch (error: Error) {
            Request.get("/vi/user/view/self")
              .then(async (resp: Response) => {
                let data = await resp.json()
                state["user.loggedin"] = "yes"
                state["user"] = data.values
                state["user.login.type"] = "user"
              })
              .catch((error: Error) => {
                resetLoginInformation()
                state["user.loggedin"] = "error"
                reject(respLogin)
              })
          }
        })
        .catch((error: Error) => {
          resetLoginInformation()
          state["user.loggedin"] = "error"
          reject(error)
        })
    })
  }

  function userSecondFactor(otp: string) {
    return new Promise((resolve, reject) => {
      state["user.loggedin"] = "loading"
      Request.securePost(`/vi/user/f2_${state["user.login.type"]}/verify`, {dataObj: {otp: otp}}).then(
        async (resp) => {
          const opt_data = await resp.json()
          if (opt_data.errors) {
            if (opt_data.errors.length > 0) {
              state["user.loggedin"] = "error"
              return
            }
          }
          Request.get("/vi/user/view/self")
            .then(async (resp: Response) => {
              let data = await resp.json()

              state["user.loggedin"] = "yes"
              state["user"] = data.values
              state["user.login.type"] = "user"
            })
            .catch((error: Error) => {
              resetLoginInformation()
              state["user.loggedin"] = "error"
              reject(resp)
            })
        }
      )
    })
  }

  function logout() {
    state["user.loggedin"] = "loading"
    if (state["user.login.type"] === "google") {
      //@ts-ignore
      //window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.revoke()
    }
    return Request.securePost("/vi/user/logout")
      .then((resp: Response) => {
        Request.resetState()
        resetLoginInformation()
      })
      .catch((error: Error) => {
        Request.resetState()
        resetLoginInformation()
        state["user.loggedin"] = "error"
      })
  }

  function updateUser() {
    return new Promise((resolve, reject) => {
      Request.get("/vi/user/view/self")
        .then(async (resp: Response) => {
          let data = await resp.json()
          state["user.loggedin"] = "yes"
          state["user"] = data.values
          state["user.login.type"] = "user"
          if (data.values["admin_config"]) {
            const obj = data.values["admin_config"]
            if (obj !== null) {
              for (const key in obj["lastActions"]) {
                //back to array
                state.lastActions.push(obj["lastActions"][key])
                state.syncedlastActions.push(obj["lastActions"][key])
              }
            }
          }
          resolve(resp)
        })
        .catch((error: Error) => {
          resetLoginInformation()
          reject(error)
        })
    })
  }

  function addAction() {
    if (state.user === null) {
      return
    }
    if (!state?.user?.["admin_config"]) {
      return
    }
    if (route) {
      const dbStore = useDBStore()
      const conf = dbStore.getConfByRoute(route)
      if (!conf) return
      const action = {
        url: route.fullPath,
        module: conf["module"],
        time: new Date().getTime(),
        icon: conf["icon"],
        name: conf["name"]
      }
      if (state.lastActions.length == 5) {
        state.lastActions.pop()
      }
      for (const lastaction of state.lastActions) {
        if (lastaction["url"] === action["url"]) {
          // we have a duplicate
          console.log("we have a duplicate")
          return
        }
      }

      state.lastActions.unshift(action)
      let configObj = state.user["admin_config"]
      if (configObj === null) {
        configObj = {lastActions: state.lastActions}
      } else {
        configObj["lastActions"] = state.lastActions
      }
      state.user["admin_config"] = configObj
      if (new Date().getTime() - state.lastSynced > 30 * 1000) {
        // trigger sync only when the last sync is older than 30 sec
        synclastActions()
      }
    }
  }

  function synclastActions() {
    if (!state?.user?.["admin_config"]) {
      return
    }
    if (JSON.stringify(state.lastActions) !== JSON.stringify(state.syncedlastActions)) {
      state.syncedlastActions = JSON.parse(JSON.stringify(state.lastActions)) // Delete reference
      state.lastSynced = new Date().getTime()
      state.user["admin_config"]["lastActions"] = state.lastActions
      Request.securePost("/vi/user/edit", {
        dataObj: {
          key: state.user.key,
          admin_config: JSON.stringify(state.user["admin_config"])
        }
      }).then(() => {
        console.log("sync success")
      })
    } else {
      console.log("nothing to sync")
    }
  }

  function getAuthMethods() {
    return new Promise((resolve, reject) => {
      Request.get(`/vi/user/getAuthMethods`).then(async (resp) => {
        const authMethods = await resp.json()
        for (const method of authMethods) {
          state.primaryAuthMethods.add(method[0])
          state.secondFactors.add(method[1])
        }
        resolve()
      })
    })
  }

  function userSecondFactorStart(choice) {
    return new Promise((resolve, reject) => {
      Request.get(choice["start_url"]).then(async (resp) => {
        const answ = await resp.json()
        answ["structure"] = structureToDict(answ["structure"])
        state["user.login.secound_factor"] = answ
        //console.log(state["user.login.secound_factor"]["structure"])
        state["user.loggedin"] = "secound_factor_input"
        resolve()
      })
    })
  }

  function structureToDict(structure: object) {
    if (Array.isArray(structure)) {
      let struct = {}
      for (const idx in structure) {
        struct[structure[idx][0]] = structure[idx][1]
      }
      return struct
    } else {
      return structure
    }
  }

  function userSecondFactor() {
    state["user.loggedin"] = "secound_factor_choice"
  }

  function secondFactorSend(data: object) {
    return new Promise((resolve, reject) => {
      Request.securePost(state["user.login.secound_factor"]["params"]["action_url"], {dataObj: data, amount: 1}).then(
        async (resp) => {
          try {
            // json resp we have an error
            const answ = await resp.json()
            if (answ["errors"]) {
              state["user.login.secound_factor_errors"] = answ["errors"]
            }
          } catch (e) {
            Request.get("/vi/user/view/self")
              .then(async (resp: Response) => {
                let data = await resp.json()
                state["user.loggedin"] = "yes"
                state["user"] = data.values
                state["user.login.type"] = "user"
              })
              .catch((error: Error) => {
                resetLoginInformation()
                state["user.loggedin"] = "error"
                reject(respLogin)
              })
          }
        }
      )
    })
  }

  //setInterval(synclastActions, 1000 * 30) //30 sec
  //TODO SYNC when close

  const getUser = computed(() => {
    if (state["user.loggedin"] === "no") {
      //destroy userinfos
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
    const dbStore = useDBStore()
    if (!state?.user?.["admin_config"]) return
    let configObj = state.user["admin_config"] //maybe we can use the
    if (configObj === null) {
      configObj = {favoriteModules: []}
    }
    state.favoriteModules = []

    for (const module of dbStore.modulesTree) {
      if (configObj["favoriteModules"].indexOf(module["module"]) > -1) {
        state.favoriteModules.push(module)
      }
    }

    return state.favoriteModules
  })
  const favoriteModules_keys = computed(() => {
    //return the names
    const obj = []
    for (const module of state.favoriteModules) {
      obj.push(module["module"])
    }

    return obj
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
    addAction,
    getAuthMethods,
    userSecondFactorStart,
    secondFactorSend
  }
})
