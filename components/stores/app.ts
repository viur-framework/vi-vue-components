// @ts-nocheck
import { reactive } from "vue"
import { defineStore } from "pinia"
import Utils from "../utils"

export const useAppStore = defineStore("appStore", () => {
  const state = reactive({
    debug: true,
    "vi.version": [4, 0, 0],

    //core section
    "core.version": null,
    "core.version.min": [3, 5, 0],
    "core.version.max": [3, 9, 0],

    //settings
    init: false,
    "admin.name": " Administration",
    "admin.logo": Utils.publicAsset("logo-cube.svg"),
    "admin.loader.logo": undefined,
    "admin.loader.color": undefined,
    "admin.login.background": Utils.publicAsset("login-background.jpg"),
    "admin.login.logo": Utils.publicAsset("logo.svg"),
    "admin.color.primary": "",
    "admin.color.secondary": ""
  })

  return { state }
})
