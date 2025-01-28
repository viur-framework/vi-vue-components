import { useRoute} from "vue-router";

export function registerLayouts(app){
    const layouts = import.meta.glob("./*.vue", { eager: true })
    Object.entries(layouts).forEach(([path,layout])=>{
        const componentName = path.split("/").pop().replace(/\.\w+$/, "")
        app.component(componentName, layout?.default)
    })
}

export function getLayout(layout= null){
    let _layout = "AdminLayout"
    if (!layout){
        const route = useRoute()
        if (route.meta?.layout){
            _layout = route.meta.layout
        }
        console.log(_layout)
    }

  return _layout

}
