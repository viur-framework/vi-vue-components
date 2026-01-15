<template>
  <sl-dropdown hoist>
    <sl-button slot="trigger" size="small" caret>
      <span slot="prefix">{{ getLanguageInfo(appStore.state.language)?.flag }}</span>
      {{ getLanguageInfo(appStore.state.language)?.label }}
    </sl-button>
    <sl-menu @sl-select="updateLanguage">
      <sl-menu-item disabled>{{ $t("topbar.language.ui") }}</sl-menu-item>
      <sl-menu-item
        v-for="lang in appStore.state.languages"
        :key="lang"
        type="checkbox"
        :checked="appStore.state.language === lang"
        :data-lang="lang"
      >
        <span slot="prefix">{{ getLanguageInfo(lang)?.flag }}</span>
        {{ getLanguageInfo(lang)?.label }}
      </sl-menu-item>
      <sl-divider></sl-divider>
      <sl-menu-item disabled>
        <div style="display: flex; align-items: center; gap: 0.5rem">
          {{ $t("topbar.language.data.label") }}
          <sl-tooltip hoist :content="$t('topbar.language.data.descr')" placement="left">
            <sl-icon name="info-circle"></sl-icon>
          </sl-tooltip>
        </div>
      </sl-menu-item>

      <sl-menu-item type="checkbox" :checked="appStore.state.datalanguage === 'all'" data-datalanguage="all">
        {{ $t("topbar.language.data.all") }}
      </sl-menu-item>
      <sl-menu-item type="checkbox" :checked="appStore.state.datalanguage === 'selected'" data-datalanguage="selected">
        {{ $t("topbar.language.data.selected") }}
      </sl-menu-item>
    </sl-menu>
  </sl-dropdown>
</template>

<script setup>
import { reactive, defineComponent, onMounted, computed } from "vue"
import { Request } from "@viur/vue-utils"
import { useAppStore } from "../../stores/app"
import { useLocalStore } from "../../stores/local"
import { i18n, languageMap } from "../../i18n"

const appStore = useAppStore()
const localStore = useLocalStore()

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
  const { lang, datalanguage } = e.detail.item.dataset
  if (lang) {
    appStore.state.language = lang
    i18n.global.locale.value = lang
    localStore.state.language = lang
  }
  if (datalanguage) {
    appStore.state.datalanguage = datalanguage
    localStore.state.datalanguage = datalanguage
  }
}

onMounted(() => {
  if (localStore.state.language) {
    appStore.state.language = localStore.state.language
    i18n.global.locale.value = localStore.state.language
  } else {
    localStore.state.language = appStore.state.language
  }
  if (localStore.state.datalanguage) {
    appStore.state.datalanguage = localStore.state.datalanguage
  } else {
    localStore.state.datalanguage = appStore.state.datalanguage
  }
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
