//@ts-nocheck

import {reactive, computed, Component, getCurrentInstance} from 'vue';
import {defineStore, StoreDefinition} from "pinia";
import {useRouter} from "vue-router";
import {useViewStore} from "./views";
import {useUserStore} from "./user";
import {destroyStore} from "@viur/viur-vue-utils/utils/handlers";
import hierarchyhandler from "../components/DataHandler/HierarchyHandler.vue";


export interface ModuleInfo {
    name: string,
    display: string,
    sortIndex: number,
    module: string,
    view_number: number,
    parententry: string,
    parentrepo: string,
    icon: string,
    handler: string,
    url: null | Object,
    children: Array<ModuleInfo>,
    views?: Array<ModuleInfo>,
    group?: string
}

function adminTreeLayer(itemList: Array<ModuleInfo>, parent: ModuleInfo): Array<ModuleInfo> {
    let listOfNodes = []
    let i = 0

    for (let conf of itemList) {

        if (!Object.keys(conf).includes("display")){
            conf["display"] = "visible"
        }

        // set index as sortindex if missing
        if (!Object.keys(conf).includes("sortIndex")) {
            conf["sortIndex"] = i
        }
        // if module is missing (views) update parent with conf
        if (!Object.keys(conf).includes("module")) {
            conf = {...parent, ...conf}
            delete conf["views"] //remove views from parent
            conf["view_number"] = i
        }

        // add parentmodule as parententry... component expects this
        conf["parententry"] = parent["module"]
        conf["parentrepo"] = "root"

        // add empty icon if missing or construct library prefixed icon if needed
        if (!Object.keys(conf).includes("icon")) {
            conf["icon"] = ""
        } else if (!conf["icon"].includes("___") && conf["icon"] !== "") {
            let icon = conf["icon"].replace("icon-", "").replace("icons-", "")
            if (icon === "list"){
                icon = "list-ul"
            }
            conf["icon"] = "default___" + icon
        }
        // build url by handler
        if (!Object.keys(conf).includes("handler")) {
            conf["url"] = null // if handler is missing, this is a moduleGroup
            conf["handlerComponent"] = null
        } else if (conf["handler"] == "list.fluidpage.content") {
            conf["url"] = {"path": `/${conf["module"]}/fluidpage`}
            conf["handlerComponent"] = "fluidpagehandler"
        } else if (conf["handler"] === "list.grouped") {
            let group = Object.keys(conf).includes("group") ? conf["group"] : "all"
            conf["url"] = {"path": `/${conf["module"]}/list/${group}`}
            conf["handlerComponent"] = "listhandler"
        } else if (conf["handler"] === "list" || conf["handler"].startsWith("list.")) {
            conf["url"] = {"path": `/${conf["module"]}/list`}
            conf["handlerComponent"] = "listhandler"
        } else if (conf["handler"] === "tree" ) {
            conf["url"] = {"path": `/${conf["module"]}/tree`}
            conf["handlerComponent"] = "treehandler"
        } else if (conf["handler"] === "tree.node" ) {
            conf["url"] = {"path": `/${conf["module"]}/tree.node`}
            conf["handlerComponent"] = "hierarchyhandler"
        } else if (conf["handler"] === "tree.simple.file" ) {
            conf["url"] = {"path": `/${conf["module"]}/tree`}
            conf["handlerComponent"] = "treehandler"
        } else if (conf["handler"] === "singleton" || conf["handler"].startsWith("singleton.")) {
            conf["url"] = {"path": `/${conf["module"]}`}
            conf["handlerComponent"] = "formhandler"
        }

        if (Object.keys(conf).includes("view_number") && Object.keys(conf).includes("handler") && conf["handler"]) {
            //@ts-ignore
            conf["url"]["query"] = {"view": conf["view_number"]}
        }

        // append children (moduleGroups)
        if (!Object.keys(conf).includes("children")) {
            conf["children"] = []
        } else if (conf["children"].length > 0) {
            conf["children"].concat(adminTreeLayer(conf["children"], conf))
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
        Object.assign(flattened, {[modname]: mod})
    }

    return flattened
}

export const useAppStore = defineStore("app", () => {
    const viewStore = useViewStore()
    const router = useRouter()
    const state = reactive({
        //vi section
        "vi.version": [3, 5, 0],
        "vi.access.open": ["root", "admin"],
        //requested with /vi/config
        "vi.name": "Administration",
        "vi.modules.groups": {},
        "vi.modules": {},


        //core section
        "core.version": null,
        "core.version.min": [3, 0, 0],
        "core.version.max": [3, 2, 0],

        //lists
        "list.amount.default": 30,

        //storesMap
        "stores.map": {},

        //handlers
        "handlers": {},

        //topactions
        "topbar.actions": [],

        //dynamic child buckets
        "handlers.opened": [{"to":{'name': 'home'},"url":"/","name":"Dashboard","icon":"dashboard","closeable":false}], // {'url','name','library'}
        "handlers.opened.max":5,
        "handlers.active":0, //current active index

        //drawer
        "skeldrawer.opened": false,
        "skeldrawer.entry": {},
        "skeldrawer.structure": {},

		//settings
		  "admin.name":" Administartion",
    	"admin.logo":"",
    	"admin.login.background":"/vi/login-background.jpg",
    	"admin.login.logo":"/vi/logo.svg",
    	"admin.color.primary":"",
    	"admin.color.secondary":"",


    })
    const modulesTree = computed(() => {
        let groups = {}
        for (let moduleGroup in state["vi.modules.groups"]) {
            let groupconf = state["vi.modules.groups"][moduleGroup]
            groupconf["module"] = moduleGroup
            groups[moduleGroup] = groupconf
        }

        let itemList = []
        for (let modulename in state["vi.modules"]) {
            let moduleconf = state["vi.modules"][modulename]
            moduleconf["module"] = modulename

            if (Object.keys(moduleconf).includes("moduleGroup") && groups[moduleconf["moduleGroup"]]) {
                if (Object.keys(groups[moduleconf["moduleGroup"]]).includes("children")) {
                    groups[moduleconf["moduleGroup"]]["children"].push(moduleconf)
                } else {
                    groups[moduleconf["moduleGroup"]]["children"] = [moduleconf]
                }
            } else {
                itemList.push(moduleconf)
            }
        }
        for (let group in groups) {
            itemList.push(groups[group])
        }
        //@ts-ignore
        let adminInfoTree: Array<ModuleInfo> = adminTreeLayer(itemList, {"module": "start"})
        console.log(adminInfoTree)
        return adminInfoTree
    })

    const modulesList = computed(() => {
        return flattenTree(modulesTree.value)
    })

    function getConfByRoute(route): ModuleInfo | null {
        //ts-ignore
        return getConf(route.params.module, Object.keys(route.query).includes("view") ? route.query['view'] : null)
    }

    function getConf(module: string, view = null) {
        let conf = null
        let name = module
        if (view)
            name += "_" + view
        conf = modulesList.value?.[name]
        console.log(modulesTree)
        console.log(modulesList.value)
        return conf
    }

    function setListStore(store: StoreDefinition) {
        state["stores.map"][store.$id] = store
    }

    function getListStoreByRoute(route): ModuleInfo | null {
    //ts-ignore

    const conf = getConfByRoute(route)
    if (!conf) return null

    let name: string = `module___${conf.module}`
    if (conf.view) {
      name += `___${conf.view}`
    }
    name+= `___${route.query["_"]}`
    return state["stores.map"][name];

  }

    function addTopBarAction(action: Component) {
        if( !state["topbar.actions"].includes(action)){
            state["topbar.actions"].push(action)
        }

    }

    function addOpened(route, module: string, view = null, name = "", icon = "", library = "") {
        let currentConf = getConf(module, view)
        let currentModuleConf = getConf(module)
        let moduleIconData = currentConf["icon"].split("___")
        let url = route.fullPath

        let mode = "view"

        if (url){
          if (url.includes("/add")){
            mode = "add"
          }else if (url.includes("/edit/")){
            mode = "edit"
          }else if (url.includes("/clone/")){
            mode = "clone"
          }
        }

        if (!name){
            name = currentConf["name"]
            if (currentConf["name"]!==currentModuleConf["name"]){
                name = `${currentModuleConf["name"]} / ${currentConf["name"]}`
            }
        }

        let entry = {
            "to": route,
            "url": url,
            "icon": icon ? icon : moduleIconData[1],
            "library": library ? library : moduleIconData[2],
            "name": name,
            "_name": name,
            "module":module,
            "group":currentConf["group"],
            "mode":mode,
            "moduleDescr":currentConf["name"],
            "closeable":true,
            "update":false
        }

        let tabNames = state["handlers.opened"].map(e=>e["url"]).filter(name => name.startsWith(route.path+"?_="))

        if(state["handlers.opened.max"]>tabNames.length){
            state["handlers.opened"].push(entry)

            state["handlers.active"] = state["handlers.opened"].indexOf(entry)

            router.push(entry["to"])
        }else{
            return false
        }
        return true
    }

    function removeOpened(route) {
        let url = route.fullPath
        let idx = state["handlers.opened"].findIndex(e=>e["url"]===url)
        if(idx===state["handlers.active"]){
             router.push(state["handlers.opened"][idx-1]["to"]).then(() => {
                 console.log(state["handlers.opened"])
                state["handlers.opened"].splice(idx, 1)
                viewStore.destroy(url)
                state["handlers.active"] = idx-1
            })
        }else if (idx<state["handlers.active"]){
            state["handlers.opened"].splice(idx, 1)
            viewStore.destroy(url)
            state["handlers.active"] = state["handlers.active"]-1 //update to new idx
        }else if (idx>state["handlers.active"]){
            state["handlers.opened"].splice(idx, 1)
            viewStore.destroy(url)
        }

        const conf = getConfByRoute(route)
        if (conf){
            let findStorename = `module___${route.params.module}`
            if (Object.keys(conf).includes("view_number")){
                findStorename +=`___${conf['view_number']}`
            }
            findStorename+= `___${route.query["_"]}`
            console.log(findStorename)
            if (Object.keys(state["stores.map"]).includes(findStorename)){
                destroyStore(state["stores.map"][findStorename])
            }
        }
    }

    function getActiveTab(){
      return state["handlers.opened"][state["handlers.active"]]
    }

    function updateActiveTabName(detail){
        let tabinfo = getActiveTab()
        tabinfo["name"] = `${tabinfo["_name"]} : ${detail}`
    }

    function markHandlersToUpdate(module, group=null){
        let handlers = state["handlers.opened"].filter((e)=>{
            if (e["mode"]==="view" && e["module"]===module && !group){
                return true
            }else if(e["mode"]==="view" && e["module"]===module && e["group"]===group){
                return true
            }

            return false
        })
        for(let e of handlers){
            e["update"]=true
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
        updateActiveTabName,
        markHandlersToUpdate
    }
})
