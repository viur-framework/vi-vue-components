//@ts-nocheck

import { reactive, computed, getCurrentInstance, unref, markRaw,shallowRef } from "vue"
import { defineStore } from "pinia"
import { useRoute, useRouter } from "vue-router"
import { useViewStore } from "./views"
import { useLocalStore } from "./local"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useContextStore } from "./context"
import { destroyStore } from "@viur/vue-utils/utils/handlers"
import Utils from "../utils"


function adminTreeLayer(itemList, parent) {
  const userStore = useUserStore()

  function module_access(modulename, group=null){
    const userStore = useUserStore()
    if (userStore.userAccess.includes("root")) {
      return true
    }
    if (group) {
      return userStore.userAccess.includes(`${modulename}-${group}-add`) || userStore.userAccess.includes(`${modulename}-${group}-edit`) || userStore.userAccess.includes(`${modulename}-${group}-delete`)
    } else {
      return userStore.userAccess.includes(`${modulename}-add`) || userStore.userAccess.includes(`${modulename}-edit`) || userStore.userAccess.includes(`${modulename}-delete`)
    }
  }


  let listOfNodes = []
  let i = 0

  for (let conf of itemList) {

    if (conf['module']==="script" && userStore.userAccess.includes('scriptor')){
      conf["display"] = "visible"
    }


    if (!Object.keys(conf).includes("display")) {
      conf["display"] = "visible"
    }
    if (conf['handler']){
      if (module_access(conf['module'],conf["group"])){
        conf["hasAccess"] = true
      }else{
        conf["hasAccess"] = false
      }
    }

    if(conf['nodeType'] === "group" && conf["moduleGroups"]?.length === 0){
      conf["display"] = "hidden"
    }
    

    // set index as sortindex if missing
    if (!Object.keys(conf).includes("sortIndex") || conf["sortIndex"] === 0) {
      conf["sortIndex"] = Array.from(conf["name"].substring(0, 3)).map(x=>x.charCodeAt(0).toString().padStart(3,'0')).join("")
    }
    if (!Object.keys(conf).includes("columns")) {
      conf["columns"] = undefined
    }

    // if module is missing (views) update parent with conf
    if (!Object.keys(conf).includes("module")) {
      conf = { ...parent, ...conf }

      // merge some cases manual
      if (Object.keys(parent).includes('context')){
        try {
          let currentContext = conf?.['context']
          if (!currentContext){
            currentContext = {}
          }

          conf['context'] = { ...parent['context'], ...currentContext }
        }catch (e){
          console.log("Error while merging context")
        }
      }

      delete conf["views"] //remove views from parent
      conf["view_number"] = i
    }

    // add parentmodule as parententry... component expects this
    conf["parententry"] = parent["module"]
    conf["parentrepo"] = "root"

    const [icon, iconType, iconname, library] = Utils.iconNormalization(conf["icon"])
    conf["icon"] = icon
    conf["iconType"] = iconType
    // build url by handler
    if (!Object.keys(conf).includes("handler")) {
      conf["url"] = null // if handler is missing, this is a moduleGroup
      conf["handlerComponent"] = null
    } else if (conf["handler"] == "list.fluidpage.content") {
      conf["url"] = { path: `/db/${conf["module"]}/fluidpage` }
      conf["handlerComponent"] = "fluidpagehandler"
    } else if (conf["handler"] === "list.grouped" || conf["handler"].startsWith("list.grouped.")) {
      let group = Object.keys(conf).includes("group") ? conf["group"] : "all"
      conf["url"] = { path: `/db/${conf["module"]}/list/${group}` }
      conf["handlerComponent"] = "listhandler"
    } else if (conf["handler"] === "list" || conf["handler"].startsWith("list.")) {
      conf["url"] = { path: `/db/${conf["module"]}/list` }
      conf["handlerComponent"] = "listhandler"
    } else if (conf["handler"].startsWith("tree.simple.file")) {
      conf["url"] = { path: `/db/${conf["module"]}/tree` }
      conf["handlerComponent"] = "treehandler"

      if (!conf["columns"]){
        conf["columns"] = ['name']
      }
      if (!Object.keys(conf).includes("kinds")) {
        conf["kinds"] = {
          node: { icon: "folder", name: "Ordner", allowedChildren: ["leaf", "node"] },
          leaf: {
            icon: "file-earmark",
            name: "Datei",
            allowedChildren: null
          }
        }
      }
    } else if (conf["handler"] === "tree.node" || conf["handler"].startsWith("tree.node.")) {
      conf["url"] = { path: `/db/${conf["module"]}/tree.node` }
      conf["handlerComponent"] = "hierarchyhandler"
      if (!Object.keys(conf).includes("kinds")) {
        conf["kinds"] = {
          node: { icon: "diagram-2-fill", name: "Knoten", library: "default", allowedChildren: ["node"] }
        }
      }
      if (!Object.keys(conf["kinds"]).includes("node")) {
        conf["kinds"]["node"] = {
          icon: "diagram-2-fill",
          name: "Knoten",
          library: "default",
          allowedChildren: ["node"]
        }
      }
      for (const kind of Object.keys(conf["kinds"])) {
        if (!Object.keys(conf["kinds"][kind]).includes("library")) {
          conf["kinds"][kind]["library"] = "default"
        }
      }
    } else if (conf["handler"] === "tree" || conf["handler"].startsWith("tree.")) {
      conf["url"] = { path: `/db/${conf["module"]}/tree` }
      conf["handlerComponent"] = "treehandler"
      if (!Object.keys(conf).includes("kinds")) {
        if (conf['module']==="script"){
          conf["kinds"] = {
            node: { icon: "folder", name: "Ordner", allowedChildren: ["leaf", "node"] },
            leaf: {
              icon: "file-earmark",
              name: "Skript",
              allowedChildren: null
            }
          }
        }else{
          conf["kinds"] = {
            node: { icon: "archive-fill", name: "Gruppe", library: "default", allowedChildren: ["leaf", "node"] },
            leaf: {
              icon: "card-heading",
              name: "Eintrag",
              library: "default",
              allowedChildren: null
            }
          }
        }
      }
      if (!Object.keys(conf["kinds"]).includes("node")) {
        conf["kinds"]["node"] = {
          icon: "archive-fill",
          name: "Gruppe",
          library: "default",
          allowedChildren: ["leaf", "node"]
        }
      }
      if (!Object.keys(conf["kinds"]).includes("leaf")) {
        conf["kinds"]["leaf"] = {
          icon: "card-heading",
          name: "Eintrag",
          library: "default",
          allowedChildren: null
        }
      }
      for (const kind of Object.keys(conf["kinds"])) {
        if (!Object.keys(conf["kinds"][kind]).includes("library")) {
          conf["kinds"][kind]["library"] = "default"
        }
      }
    } else if (conf["handler"] === "singleton" || conf["handler"].startsWith("singleton.")) {
      conf["url"] = { path: `/db/${conf["module"]}/form` }
      conf["handlerComponent"] = "formhandler"
    }

    if (Object.keys(conf).includes("view_number") && Object.keys(conf).includes("handler") && conf["handler"]) {
      //@ts-ignore
      conf["url"]["query"] = { view: conf["view_number"] }
    }


    if (!Object.keys(conf).includes("children")) {
      conf["children"] = []
    }
    // append children (moduleGroups)
    if (conf["moduleGroups"]?.length > 0) {
      conf["children"] = conf["children"].concat(adminTreeLayer(conf["moduleGroups"], conf))
      let groupVisible = false
      for (let m of conf["children"]){
        if (m["hasAccess"] || m['nodeType']==="group"){
          groupVisible = true
          break
        }
      }
      conf["display"] = groupVisible?"visible":"hidden"
    }

    //append children (views)
    //@ts-ignore
    if (Object.keys(conf).includes("views") && conf["views"]?.length > 0) {
      //@ts-ignore
      conf["children"] = conf["children"].concat(adminTreeLayer(conf["views"], conf))
    }
    listOfNodes.push(conf)
    i += 1
  }
  listOfNodes.sort((a, b) => (a["sortIndex"] > b["sortIndex"] ? 1 : -1))
  return listOfNodes
}

function flattenTree(tree) {
  const flattened = {}
  for (let mod of tree) {
    if (mod["children"]?.length > 0) {
      Object.assign(flattened, flattenTree(mod["children"]))
    }

    let modname = mod["module"]
    if (Object.keys(mod).includes("view_number")) {
      modname += `_${mod["view_number"]}`
    }
    Object.assign(flattened, { [modname]: mod })
  }

  return flattened
}

export const useDBStore = defineStore("db", () => {
  const viewStore = useViewStore()
  const router = useRouter()
  const localStore = useLocalStore()
  const currentRoute = useRoute()
  const contextStore = useContextStore()
  const state = reactive({
    //vi section
    "vi.access.open": ["root", "admin"],
    "vi.modules.groups": {},
    "vi.modules": {},
    "vi.moduleTree": [],

    //lists
    "list.amount.default": 30,

    //storesMap
    "stores.map": {},

    //actions
    "handlerbar.actions": markRaw({}),
    "topbar.actions": markRaw([]),
    "floatingbar.actions": markRaw([]),

    //boneViewer
    "bones.view": shallowRef({}),

    //dynamic child buckets
    "handlers.opened": [
      {
        to: { name: "home", fullPath: "/" },
        url: "/",
        name: "Dashboard",
        icon: "grid-3x3-gap-fill",
        closeable: false,
        id: 0
      }
    ], // {'url','name','library'}
    "handlers.active": 0, //current active index

    //drawer
    "skeldrawer.opened": false,
    "skeldrawer.entry": {},
    "skeldrawer.structure": {},

    //fluidpage Element
    "fluidpage.element": "FluidpageElement",

    //Tasks
    tasks: []
  })


  function module_access(modulename, group=null){
    const userStore = useUserStore()
    if (userStore.userAccess.includes("root")) {
      return true
    }
    if (group) {
      return userStore.userAccess.includes(`${modulename}-${group}-add`) || userStore.userAccess.includes(`${modulename}-${group}-edit`) || userStore.userAccess.includes(`${modulename}-${group}-delete`)
    } else {
      return userStore.userAccess.includes(`${modulename}-add`) || userStore.userAccess.includes(`${modulename}-edit`) || userStore.userAccess.includes(`${modulename}-delete`)
    }
  }

  function modulesTree() {

    let groups = {}
    let nestedGroups = []
    for (let moduleGroup in state["vi.modules.groups"]) {
      let groupconf = state["vi.modules.groups"][moduleGroup]
      let prefixed_group = `moduleGroup___${moduleGroup}`
      groupconf["module"] = prefixed_group
      groupconf['nodeType'] = "group"
      groupconf['moduleGroups'] = [...Object.values(state["vi.modules.groups"]).filter((i)=>i['moduleGroup']===moduleGroup ), ...Object.values(state["vi.modules"]).filter((i)=>i['moduleGroup']===moduleGroup )]
      if(!groupconf['moduleGroup']){
        groups[prefixed_group] = groupconf
      }else{
        nestedGroups.push(prefixed_group)
      }
      
    }

    let itemList = []

    for (let modulename in state["vi.modules"]) {
      let moduleconf = state["vi.modules"][modulename]
      moduleconf["module"] = modulename
      moduleconf["baseModule"] = modulename.split("/").length>1?modulename.split("/")[modulename.split("/").length-1]:modulename
      moduleconf["nodeType"] = 'module'

      if (Object.keys(moduleconf).includes("moduleGroup") && (groups[`moduleGroup___${moduleconf["moduleGroup"]}`])) {
      }else if (nestedGroups.includes(`moduleGroup___${moduleconf["moduleGroup"]}`) ){
      } else {
        itemList.push(moduleconf)
      }
    }

    for (let group in groups) {
      itemList.push(groups[group])
    }
    let adminInfoTree = adminTreeLayer(itemList, { module: "start" })
    return adminInfoTree
  }

  const modulesList = computed(() => {
    return flattenTree(state['vi.moduleTree'])
  })

  function getConfByRoute(route) {
    //ts-ignore
    return getConf(route.params.module, Object.keys(route.query).includes("view") ? route.query["view"] : null)
  }

  function getConf(module, view = null) {
    let conf = null
    if (!module) return null
    let name = module.replace(".", "/")
    if (typeof view === "string" && isNaN(parseFloat(view))) {
      view = modulesList.value?.[module.replace(".", "/")]?.["views"].findIndex((x) => x["group"] === view)
    }
    if (view) name += "_" + view
    conf = modulesList.value?.[name]
    return conf
  }

  function setListStore(store) {
    state["stores.map"][store.$id] = store
  }

  function getListStoreByRoute(route) {
    //ts-ignore

    const conf = getConfByRoute(route)
    if (!conf) return null

    let name = `module___${conf.module}`
    if (Object.keys(conf).includes("view_number") && conf.view_number !== null) {
      name += `___${conf.view_number}`
    }
    name += `___${route.query["_"]}`
    return state["stores.map"][name]
  }

  function addTopBarAction(action) {
    if (!state["topbar.actions"].includes(action)) {
      state["topbar.actions"].push(action)
    }
  }

  function addOpened(
    route,
    module = null,
    view = null,
    name = "",
    icon = "",
    library = "",
    contextInheritance = true,
    force = false,
    keep = false
  ) {
    let currentConf = {}
    let currentModuleConf = {}
    let moduleIconData = []
    if (module) {
      currentConf = getConf(module, view)
      currentModuleConf = getConf(module)
      moduleIconData = currentConf?.["icon"]?.split("___")
    }

    let mode = "view"

    let url = route.fullPath
    if (module && module.includes("/")) {
      // in case of nested modules like shop/cart replace in url with . to shop.cart
      url = url.replace(module, module.replace("/", "."))

      let dotted_module = module.replace("/", ".")
      let raw_route = url.replace(module, dotted_module)
      route = router.resolve(unref(raw_route))
    }

    if (!Object.keys(route.query).includes("_")) {
      route.query["_"] = new Date().getTime()
    }
    if (contextInheritance) {
      contextStore.copyLocalContext(currentRoute.query["_"], route.query["_"])
      if(currentConf?.["context"]){
        for(const [k,v] of Object.entries(currentConf?.["context"])){
          contextStore.setContext(k,v,route.query["_"])
        }
      }

      //merge route on top
      for (const [boneName, value] of Object.entries(route.query)){
        if( !boneName.startsWith("_")){
          contextStore.setContext(boneName,value,route.query["_"])
        }
      }

    }

    if (url) {
      if (url.includes("/add")) {
        mode = "add"
      } else if (url.includes("/edit/")) {
        mode = "edit"
      } else if (url.includes("/clone/")) {
        mode = "clone"
      }
    }

    if (!name) {
      name = currentConf?.["name"]
      if (currentConf?.["name"] !== currentModuleConf?.["name"]) {
        name = `${currentModuleConf["name"]} / ${currentConf?.["name"]}`
      }
    }
    let group = currentConf?.["group"]
    if (!group && route.params['group']) {
      group = route.params['group']
    }
    let entry = {
      to: route,
      id: route.query["_"],
      url: url,
      icon: icon ? icon : moduleIconData?.[1],
      library: library ? library : moduleIconData?.[0],
      name: name,
      _name: name,
      module: module,
      group: group,
      view: view,
      mode: mode,
      moduleDescr: currentConf?.["name"],
      currentConf: currentConf,
      closeable: true,
      update: false,
      keep: keep //always render and keep open, use v-show while navigation
    }

    function uniqueTabname(url,view){
      if (!view) return url
      return `${url}___${view}`
    }

    let tabNames = state["handlers.opened"].map((e) => uniqueTabname(e["url"],e['view'])).filter((name) => name === uniqueTabname(entry['url'],entry['view']))
    if (tabNames.length===0 || force){
      state["handlers.opened"].push(entry) //add to tablist
      state["handlers.active"] = state["handlers.opened"].indexOf(entry) //mark as active
      router.push(entry["to"]) //change route
    } else {
      state["handlers.active"] = state["handlers.opened"].map((e) => uniqueTabname(e["url"],e['view'])).indexOf(uniqueTabname(entry['url'],entry['view']))
      router.push(state["handlers.opened"][state["handlers.active"]]["to"])
      return false
    }
    return true
  }

  function removeOpened(route) {
    let url = route.fullPath

    let idx = state["handlers.opened"].findIndex((e) => e["url"] === url)
    if (idx === -1){
      idx = state["handlers.opened"].findIndex((e) => e["id"] === parseInt(route.query?.["_"])) //use id fallback
      if (idx === -1) return
    }
    if (idx === 0){
      return 0
    } else if (idx === state["handlers.active"]) {
      router.push(state["handlers.opened"][idx - 1]["to"]).then(() => {
        state["handlers.opened"].splice(idx, 1)
        viewStore.destroy(url)
        state["handlers.active"] = idx - 1
      })
    } else if (idx < state["handlers.active"]) {
      router.push(state["handlers.opened"][state["handlers.active"] - 1]["to"]).then(() => {
        state["handlers.opened"].splice(idx, 1)
        viewStore.destroy(url)
        state["handlers.active"] = state["handlers.active"] - 1 //update to new idx
      })
    } else if (idx > state["handlers.active"]) {
      state["handlers.opened"].splice(idx, 1)
      viewStore.destroy(url)
    }

    const conf = getConfByRoute(route)
    if (conf) {
      let findStorename = `module___${route.params.module.replace(".", "/")}`
      if (Object.keys(conf).includes("view_number")) {
        findStorename += `___${conf["view_number"]}`
      }
      findStorename += `___${route.query["_"]}`

      if (Object.keys(state["stores.map"]).includes(findStorename)) {
        destroyStore(state["stores.map"][findStorename])
      }
    }
  }

  function getActiveTab() {
    if (state["handlers.active"] >= state["handlers.opened"].length) return state["handlers.opened"][0]
    return state["handlers.opened"][state["handlers.active"]]
  }

  function getTabByRoute(route) {
    let handlers = state["handlers.opened"].filter((e) => {
      if (e["to"]?.["fullPath"] === route?.["fullPath"]) {
        return true
      }
      return false
    })
    return handlers.length > 0 ? handlers[0] : null
  }

  function getTabs(module, group = null) {
    let handlers = state["handlers.opened"].filter((e) => {
      if (e["module"] === module && !group) {
        return true
      } else if (e["module"] === module && e["group"] === group) {
        return true
      }
      return false
    })
    return handlers
  }

  function getTabById(id) {
    let handlers = state["handlers.opened"].filter((e) => {
      if (parseInt(e["id"]) === parseInt(id)) {
        return true
      }
      return false
    })
    return handlers.length > 0 ? handlers[0] : null
  }

  function updateActiveTabName(detail) {
    let tabinfo = getActiveTab()
    tabinfo["name"] = `${detail}`
  }

  function markHandlersToUpdate(module, group = null) {
    let handlers = state["handlers.opened"].filter((e) => {
      if (e["mode"] === "view" && e["module"] === module && !group) {
        return true
      } else if (e["mode"] === "view" && e["module"] === module && e["group"] === group) {
        return true
      }

      return false
    })
    for (let e of handlers) {
      e["update"] = true
    }
  }

  return {
    state,
    modulesTree,
    modulesList,
    getConf,
    getConfByRoute,
    setListStore,
    getListStoreByRoute,
    addTopBarAction,
    addOpened,
    removeOpened,
    getActiveTab,
    getTabById,
    getTabs,
    getTabByRoute,
    updateActiveTabName,
    markHandlersToUpdate,
    module_access
  }
})
