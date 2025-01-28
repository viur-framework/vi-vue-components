import { reactive } from "vue"
import { defineStore } from "pinia"
import Utils from "../utils"

export const useAppStore = defineStore("appStore", () => {
  const state = reactive({
    debug: false,
    "vi.version": [4, 0, 7],
    "language":"de",
    //core section
    "core.version": null,
    "core.version.min": [3, 5, 0],
    "core.version.max": [3, 9, 0],

    //settings
    init: false,
    failed: false,
    "admin.name": "Administration",
    "admin.logo": Utils.publicAsset("logo-cube.svg"),
    "admin.loader.logo": undefined,
    "admin.loader.color": undefined,
    "admin.login.background": Utils.publicAsset("login-background.jpg"),
    "admin.login.logo": Utils.publicAsset("logo-center.svg"),
    "admin.color.primary": "",
    "admin.color.secondary": "",
    "admin.scriptor.url": "/scriptor/index.html",

    oldicons: {
      "file-system": "folder-fill",
      users: "people-fill",
      user: "person-fill",
      dashboard: "grid-3x3-gap-fill",
      trash: "trash-fill",
      interface: "shuffle",
      hierarchy: "diagram-2-fill",
      "icon-settings": "gear-fill",
      "icon-hashtag": "hash",
      "icon-list": "list-ul"
    },
    preflights:false //allow headers for requests (currently only lists use this feature: x-viur-bonelist)
  })

  return { state }
})
