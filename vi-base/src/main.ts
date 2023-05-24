import './shoelaceConfig'

console.log("base")
//Vue
import {createApp} from 'vue'
import App from './App.vue'

const app = createApp(App)

import router from './routes'
import {createPinia} from 'pinia'
import {createI18n} from "vue-i18n";
import en from "./translations/en"
import de from "./translations/de"
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
app.use(pinia)

pinia.use(piniaPluginPersistedstate)
app.use(router)

import bone from "./components/Bones/edit/bone.vue";
app.component("bone",bone)

const i18n = createI18n({
    locale: "de",
    fallbackLocale: "en",
    messages: {"en": en, "de": de}
})

app.use(i18n)

app.mount('#app')
