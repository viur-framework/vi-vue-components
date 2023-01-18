//@ts-nocheck

import {reactive, computed, Component} from 'vue';
import {defineStore, StoreDefinition} from "pinia";
import {useRouter} from "vue-router";
import {useViewStore} from "./views";

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
        // hide hidden
        if (Object.keys(conf).includes("display") && conf["display"] === "hidden") {
            continue
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
            conf["icon"] = "default___" + conf["icon"].replace("icon-", "").replace("icons-", "")
        }
        // build url by handler
        if (!Object.keys(conf).includes("handler")) {
            conf["url"] = null // if handler is missing, this is a moduleGroup
        } else if (conf["handler"] === "list.grouped") {
            let group = Object.keys(conf).includes("group") ? conf["group"] : "all"
            conf["url"] = {"path": `/${conf["module"]}/list/${group}`}
        } else if (conf["handler"] === "list" || conf["handler"].startsWith("list.")) {
            conf["url"] = {"path": `/${conf["module"]}/list`}
        } else if (conf["handler"] === "tree" || conf["handler"].startsWith("tree.")) {
            conf["url"] = {"path": `/${conf["module"]}/tree`}
        } else if (conf["handler"] === "singleton" || conf["handler"].startsWith("singleton.")) {
            conf["url"] = {"path": `/${conf["module"]}`}
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
    	"admin.login.background":"vi/login-background.jpg",
    	"admin.login.logo":"vi/logo.svg",
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
        return conf
    }

    function setListStore(store: StoreDefinition) {
        state["stores.map"][store.$id] = store
    }

  function getListStoreByRoute(route): ModuleInfo | null {
    //ts-ignore

    const conf = getConfByRoute(route)

    let name: string = `module___${conf.module}`
    if (conf.view) {
      name += `___${conf.view}`
    }
    return state["stores.map"][name];

  }
    function addTopBarAction(action: Component) {
        if( !state["topbar.actions"].includes(action)){
            state["topbar.actions"].push(action)
        }

    }

    function addOpened(route, module: string, view = null, name = "", icon = "", library = "") {
        let currentConf = getConf(module, view)
        let moduleIconData = currentConf["icon"].split("___")
        let url = route.fullPath

        let entry = {
            "to": route,
            "url": url,
            "icon": icon ? icon : moduleIconData[1],
            "library": library ? library : moduleIconData[2],
            "name": name ? name : currentConf["name"],
            "closeable":true
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
        removeOpened
    }
})
