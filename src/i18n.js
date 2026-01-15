import { de_translations as de_utils_translations, en_translations as en_utils_translations } from "@viur/vue-utils"
import {
  de_translations as de_comp_translations,
  en_translations as en_comp_translations,
} from "@viur/vue-components/translations/translations"

import { createI18n } from "vue-i18n"
import local_de_translations from "@/translations/de.js"
import local_en_translations from "@/translations/en.js"
import { useTranslations } from "@viur/vue-utils/utils/translations.js"
export { languageMap } from "@viur/vue-utils/bones/view/boneLogic"

export const i18n = createI18n({
  legacy: false,
  locale: "de",
  fallbackLocale: "de",
  messages: { de: de_utils_translations, en: en_utils_translations },
  missing: (locale, key, instance, values) => {
    if (key.includes(" ")) {
      //keys haben kein Space, dann einfach so ausgeben
      return key
    }
    console.error(`Missing translation key: "${key}" for locale "${locale}"`)
    return `[[${key}]]`
  },
})

const translate = useTranslations(i18n.global)
translate.updateLocaleMessages("de", de_comp_translations)
translate.updateLocaleMessages("en", en_comp_translations)
translate.updateLocaleMessages("de", local_de_translations)
translate.updateLocaleMessages("en", local_en_translations)
