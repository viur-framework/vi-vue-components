const routes = []




export default function extensionInfo(){

    function init(){
        console.log("Init Debug")
    }
    return {
        name:"debug",
        routes:routes,
        init:init,
        subhandlers:{
            "list":{
                name:"Debug",
                icon:"bug-fill",
                route:null
            }
        }
    }
}