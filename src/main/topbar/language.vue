<template>
  <sl-select
    v-if="appStore.state.languages && appStore.state.languages?.length > 1"
    size="small"
    :value="appStore.state.language"
    @sl-change="updateLanguage"
  >
    <sl-option v-for="lang in appStore.state.languages" :key="lang" :value="lang">
      {{ getLanguageInfo(lang)?.flag }} {{ getLanguageInfo(lang)?.label }}
    </sl-option>
  </sl-select>
</template>

<script setup>
import { reactive, defineComponent, onMounted, computed } from "vue"
import { Request } from "@viur/vue-utils"
import { useAppStore } from "../../stores/app"
import { i18n } from "../../i18n"

const languageMap = [
  { lang: "en", country: "US", label: "English", flag: "\ud83c\uddfa\ud83c\uddf8" },
  { lang: "de", country: "DE", label: "Deutsch", flag: "\ud83c\udde9\ud83c\uddea" },
  { lang: "fr", country: "FR", label: "Français", flag: "\ud83c\uddeb\ud83c\uddf7" },
  { lang: "es", country: "ES", label: "Español", flag: "\ud83c\uddea\ud83c\uddf8" },
  { lang: "pt", country: "BR", label: "Português", flag: "\ud83c\udde7\ud83c\uddf7" },
  { lang: "it", country: "IT", label: "Italiano", flag: "\ud83c\uddee\ud83c\uddf9" },
  { lang: "nl", country: "NL", label: "Nederlands", flag: "\ud83c\uddf3\ud83c\uddf1" },
  { lang: "pl", country: "PL", label: "Polski", flag: "\ud83c\uddf5\ud83c\uddf1" },
  { lang: "ru", country: "RU", label: "Русский", flag: "\ud83c\uddf7\ud83c\uddfa" },
  { lang: "tr", country: "TR", label: "Türkçe", flag: "\ud83c\uddf9\ud83c\uddf7" },
  { lang: "zh", country: "CN", label: "中文", flag: "\ud83c\udde8\ud83c\uddf3" },
  { lang: "ja", country: "JP", label: "日本語", flag: "\ud83c\uddef\ud83c\uddf5" },
  { lang: "ko", country: "KR", label: "한국어", flag: "\ud83c\uddf0\ud83c\uddf7" },
  { lang: "ar", country: "SA", label: "العربية", flag: "\ud83c\uddf8\ud83c\udde6" },
  { lang: "hi", country: "IN", label: "हिन्दी", flag: "\ud83c\uddee\ud83c\uddf3" },
  { lang: "sv", country: "SE", label: "Svenska", flag: "\ud83c\uddf8\ud83c\uddea" },
  { lang: "no", country: "NO", label: "Norsk", flag: "\ud83c\uddf3\ud83c\uddf4" },
  { lang: "da", country: "DK", label: "Dansk", flag: "\ud83c\udde9\ud83c\uddf0" },
  { lang: "fi", country: "FI", label: "Suomi", flag: "\ud83c\uddeb\ud83c\uddee" },
  { lang: "cs", country: "CZ", label: "Čeština", flag: "\ud83c\udde8\ud83c\uddff" },
]

const appStore = useAppStore()

const state = reactive({})

function getLanguageInfo(lang) {
  return languageMap.filter((x) => x.lang === lang)[0]
}

function requestLanguages() {
  Request.get("/vi/getLanguages")
    .then(async (resp) => {
      let data = await resp.json()
      appStore.languages = data
    })
    .catch((error) => {})
}

function updateLanguage(e) {
  console.log(i18n)

  appStore.state.language = e.target.value
  i18n.global.locale.value = e.target.value
}

onMounted(() => {
  requestLanguages()
})
</script>

<style scoped>
sl-select {
  width: 140px;
}

sl-option::part(label) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
}
</style>
