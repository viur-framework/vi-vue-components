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



/*

#### scriptor ####

async def main():
    Dialog.print("This a a simple print...")
    print("... and this is the same print:")
    print(f"""{(Dialog.print == print) = }""")

    await Dialog.alert("This a an alert.")

    options = {
        "Option A": 1,
        "Option B": 2,
        "Option C": "ein string..."
    }
    select = await Dialog.select(options)
    print(f"""{select = }""")
    print(f"""{type(select) = }""")
    print(f"""{repr(select) = }""")

*/
