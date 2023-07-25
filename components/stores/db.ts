//@ts-nocheck

import {reactive, computed, Component, getCurrentInstance} from 'vue';
import {defineStore, StoreDefinition} from "pinia";
import {useRoute, useRouter} from "vue-router";
import {useViewStore} from "./views";
import {useUserStore} from "./user";
import { useContextStore } from './context';
import {destroyStore} from "@viur/vue-utils/utils/handlers";
import hierarchyhandler from "../components/handler/HierarchyHandler.vue";
import Element from '../fluidpage/element.vue'


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
            conf["url"] = {"path": `/db/${conf["module"]}/fluidpage`}
            conf["handlerComponent"] = "fluidpagehandler"
        } else if (conf["handler"] === "list.grouped") {
            let group = Object.keys(conf).includes("group") ? conf["group"] : "all"
            conf["url"] = {"path": `/db/${conf["module"]}/list/${group}`}
            conf["handlerComponent"] = "listhandler"
        } else if (conf["handler"] === "list" || conf["handler"].startsWith("list.")) {
            conf["url"] = {"path": `/db/${conf["module"]}/list`}
            conf["handlerComponent"] = "listhandler"
        } else if (conf["handler"] === "tree" ) {
            conf["url"] = {"path": `/db/${conf["module"]}/tree`}
            conf["handlerComponent"] = "treehandler"
        } else if (conf["handler"] === "tree.node" ) {
            conf["url"] = {"path": `/db/${conf["module"]}/tree.node`}
            conf["handlerComponent"] = "hierarchyhandler"
        } else if (conf["handler"] === "tree.simple.file" ) {
            conf["url"] = {"path": `/db/${conf["module"]}/tree`}
            conf["handlerComponent"] = "treehandler"
        } else if (conf["handler"] === "singleton" || conf["handler"].startsWith("singleton.")) {
            conf["url"] = {"path": `/db/${conf["module"]}`}
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

export const useDBStore = defineStore("db", () => {
    const viewStore = useViewStore()
    const router = useRouter()
    const currentRoute = useRoute()
    const contextStore = useContextStore()
    const state = reactive({
        //vi section
        "vi.access.open": ["root", "admin"],
        "vi.modules.groups": {},
        "vi.modules": {},

        //lists
        "list.amount.default": 30,

        //storesMap
        "stores.map": {},

        //actions
        "topbar.actions": [],
        "floatingbar.actions": [],

        //dynamic child buckets
        "handlers.opened": [{"to":{'name': 'home',"fullPath":"/"},"url":"/","name":"Dashboard","icon":"dashboard","closeable":false, "id":0}], // {'url','name','library'}
        "handlers.opened.max":1,
        "handlers.opened.max.modules":{},
        "handlers.active":0, //current active index

        //drawer
        "skeldrawer.opened": false,
        "skeldrawer.entry": {},
        "skeldrawer.structure": {},

        //fluidpage Element
        "fluidpage.element":Element,

        //Tasks
        "tasks": []

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
    if (!conf) return null

    let name: string = `module___${conf.module}`
    if (Object.keys(conf).includes("view_number") && conf.view_number!==null) {
      name += `___${conf.view_number}`
    }
    name+= `___${route.query["_"]}`
    return state["stores.map"][name];

  }

    function addTopBarAction(action: Component) {
        if( !state["topbar.actions"].includes(action)){
            state["topbar.actions"].push(action)
        }
    }

    function addOpened(route, module: string, view = null, name = "", icon = "", library = "", contextInheritance=true, force=false) {
        let currentConf = getConf(module, view)
        let currentModuleConf = getConf(module)
        let moduleIconData = currentConf["icon"].split("___")
        let mode = "view"

        if (!Object.keys(route.query).includes("_")){
          route.query["_"] = new Date().getTime()
        }
        if(contextInheritance){
          contextStore.copyLocalContext( currentRoute.query["_"], route.query["_"] )
        }


        let url = route.fullPath

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
            "id": route.query["_"],
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

        let tabNames = state["handlers.opened"].map(e=>e["url"]).filter(name => name.startsWith(url))
        if(!Object.keys(state["handlers.opened.max.modules"]).includes(module))
        {
          state["handlers.opened.max.modules"][module]=state["handlers.opened.max"]
        }
        if(state["handlers.opened.max.modules"][module]>tabNames.length || force){
            state["handlers.opened"].push(entry)

            state["handlers.active"] = state["handlers.opened"].indexOf(entry)

            router.push(entry["to"])
        }else{
          state["handlers.active"] = state["handlers.opened"].map(e=>e["url"]).indexOf(url)
          router.push(state["handlers.opened"][state["handlers.active"]]["to"])
          return false
        }
        return true
    }

    function removeOpened(route) {
        let url = route.fullPath
        let idx = state["handlers.opened"].findIndex(e=>e["url"]===url)
        console.log(state["handlers.opened"])
        console.log(idx)
        console.log(url)
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

        const conf = getConfByRoute(route)
        if (conf){
            let findStorename = `module___${route.params.module}`
            if (Object.keys(conf).includes("view_number")){
                findStorename +=`___${conf['view_number']}`
            }
            findStorename+= `___${route.query["_"]}`

            if (Object.keys(state["stores.map"]).includes(findStorename)){
                destroyStore(state["stores.map"][findStorename])
            }
        }
    }

    function getActiveTab(){
      if (state["handlers.active"]>=state["handlers.opened"].length) return state["handlers.opened"][0]
      return state["handlers.opened"][state["handlers.active"]]
    }

    function getTabByRoute(route){
      let handlers = state["handlers.opened"].filter((e)=>{
        if (e["to"]?.["fullPath"] === route?.["fullPath"]){
          return true
        }
        return false
      })
      return handlers.length>0?handlers[0]:null
    }

    function getTab(module, group=null){
      let handlers = state["handlers.opened"].filter((e)=>{
        if (e["module"]===module && !group){
            return true
        }else if(e["module"]===module && e["group"]===group){
            return true
        }
        return false
      })
      return handlers.length>0?handlers[0]:null
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
        getTab,
        getTabByRoute,
        updateActiveTabName,
        markHandlersToUpdate
    }
})
