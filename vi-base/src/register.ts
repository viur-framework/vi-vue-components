import './shoelaceConfig'

import router from './routes'
import {createPinia} from 'pinia'
import {createI18n} from "vue-i18n";
import en from "./translations/en"
import de from "./translations/de"
import {createApp} from 'vue'

function createInstance(App:any){
    const app = createApp(App)
    app.use(router)

    const pinia = createPinia()
    app.use(pinia)

    const i18n = createI18n({
        locale: "de",
        fallbackLocale: "en",
        messages: {"en": en, "de": de}
    })

    app.use(i18n)

    app.mount('#app')
    return app
}
export {
    createInstance
}