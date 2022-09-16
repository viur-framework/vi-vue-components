import {reactive, computed} from 'vue';
import {defineStore} from "pinia";
import {Request} from "@viur/viur-vue-utils";
import utils from '../utils'

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
    const state = reactive({
        //user related
        "user": null,
        "user.loggedin": "no", // "yes", "no", "loading"
        "user.login.type": "no", // "no","user", "google", "sso"

        //google stuff
        "google.api.loaded": false,
        "google.api.clientid": "",
    })

    function resetLoginInformation() {
        state["user"] = null
        state["user.loggedin"] = "no"
        state["user.login.type"] = "no"
    }

    function googleInit(ClientId: string) {
        return new Promise((resolve, reject) => {
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
            window.google.accounts.id.prompt()
            return 0
            // @ts-ignore
            window.google.accounts.oauth2.initTokenClient({
                client_id: state["google.api.clientid"],
                scope: googleConfig.scopes,
                callback: (response: TokenPopupResponse) => {
                    if (response.access_token) {
                        // @ts-ignore
                        window.google.accounts.id.prompt()
                    } else {
                    }
                },
            }).requestAccessToken();

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
            ).then((resp: Response) => {
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
                        reject(resp);
                    }
                )
            }).catch(
                (error: Error) => {
                    resetLoginInformation()
                    state["user.loggedin"] = "error"
                    reject(error);
                }
            )
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
                    resolve(resp)
                }).catch(
                (error: Error) => {
                    resetLoginInformation()
                    reject(error);
                }
            )


        })

    }

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

    return {
        state,
        userAccess,
        userShortname,
        updateUser,
        googleInit,
        googleLogin,
        userLogin,
        logout
    }
})