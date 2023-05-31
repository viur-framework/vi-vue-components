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
import CKEditor from '@ckeditor/ckeditor5-vue';

app.use(CKEditor)

const pinia = createPinia()
app.use(pinia)

pinia.use(piniaPluginPersistedstate)
app.use(router)
// @ts-ignore
import {bone, de_translations, en_translations} from "@viur/viur-vue-utils";
import { useDBStore } from './stores/db'
app.component("bone",bone)


const i18n = createI18n({
    locale: "de",
    fallbackLocale: "en",
    messages: {"en": {...en_translations, ...en}, "de": {...de_translations, ...de}}
})

app.use(i18n)

app.mount('#app')



