import { useRoute} from "vue-router";
import AdminLayout from "./AdminLayout.vue";
import ScriptorLayout from "./ScriptorLayout.vue";

export function registerLayouts(app){
    app.component("AdminLayout",AdminLayout)
    app.component("ScriptorLayout",ScriptorLayout)
}

export function getLayout(layout= null){
    let _layout = "AdminLayout"
    if (!layout){
        const route = useRoute()
        if (route.meta?.layout){
            _layout = route.meta.layout
        }
    }

  return _layout

}
