// @ts-nocheck
import {reactive} from "vue";
import {defineStore} from "pinia";


export const useAppStore = defineStore("appStore", () => {
  const state = reactive({
    "vi.version": [4, 0, 0],

    //core section
    "core.version": null,
    "core.version.min": [3, 5, 0],
    "core.version.max": [3, 9, 0],

    //settings
    "init":false,
    "admin.name":" Administration",
    "admin.logo":"s/logo-cube.svg",
    "admin.login.background":"/vi/s/login-background.jpg",
    "admin.login.logo":"/vi/s/logo.svg",
    "admin.color.primary":"",
    "admin.color.secondary":"",
  })


  return {state}
})
