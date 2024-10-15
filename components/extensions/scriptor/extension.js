import TopBarWidget from "./TopBarWidget.vue";
import {useDBStore} from "../../stores/db";
import { useRouter} from "vue-router";

const routes = [
    {
        path: "/scriptor/application",
        name: "ScriptorApplication",
        component: () => import("./ScriptorApplication.vue")
    },
    {
        path: "/scriptor/edit",
        name: "ScriptorEditor",
        component: () => import("./ScriptorEditor.vue")
    }
]

export default function extensionInfo(){
    const dbStore = useDBStore()
    const router = useRouter()
    function init(){
        console.log("Init Scriptor")
        addSubRoute()
        topbar()
    }

    function topbar(){
        dbStore.state["topbar.actions"].push(TopBarWidget)
    }

    function addSubRoute(){
        router.addRoute("editnode",{
        path: "scriptor/edit",
        name: "ScriptorEditor",
        component: () => import("./ScriptorEditor.vue")
    })
    }

    return {
        name:"scriptor",
        routes:routes,
        init:init,
        subhandlers:{
            "editor":{
                routeMatches:{
                    "module":"script",
                    "action":"edit"
                },
                name:"Scriptor",
                icon:"code-square",
                route:null
            }
        }
    }
}