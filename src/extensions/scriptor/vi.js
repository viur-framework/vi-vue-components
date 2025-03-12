import { useDBStore } from "../../stores/db"


import TopBarWidget from "./TopBarWidget.vue"
import ScriptorEditor from "./ScriptorEditor.vue"


export const appRoutes = [
  {
    path: "/scriptor/view",
    name: "ScriptorView",
    component: ScriptorEditor
  }
]


export default function application() {
  const dbStore = useDBStore()
  function topbar(){
    dbStore.state["topbar.actions"].push(TopBarWidget)
  }

  function register(){
    topbar()
  }
  return {
    register
  }
}