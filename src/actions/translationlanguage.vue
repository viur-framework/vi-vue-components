<template>
  <sl-select
    v-if="state.selectableLanguages.length > 0"
    :value="state.selectedLanguage"
    size="small"
    hoist
    :placeholder="$t('actions.translate_language_placeholder')"
    style="width: 180px"
    @sl-change="onChange"
  >
    <sl-option v-for="lang in state.selectableLanguages" :key="lang" :value="lang">
      {{ languageLabel(lang) }}
    </sl-option>
  </sl-select>
  <sl-button v-else size="small" @click="openTranslationTab">
    <sl-icon slot="prefix" name="translate"></sl-icon>
    {{ $t("actions.translate") }}
  </sl-button>
</template>

<script setup>
import { reactive, computed, inject } from "vue"
import { useRouter } from "vue-router"
import { useDBStore } from "../stores/db"

const handlerState = inject("handlerState")
const dbStore = useDBStore()
const router = useRouter()

const state = reactive({
  selectableLanguages: computed(() => handlerState?.selectableLanguages || []),
  availableLanguages: computed(() => handlerState?.availableLanguages || []),
  selectedLanguage: computed({
    get() {
      return handlerState?.selectedLanguage
    },
    set(val) {
      if (handlerState) handlerState.selectedLanguage = val
    },
  }),
})

function onChange(event) {
  state.selectedLanguage = event.target.value
}

function languageLabel(lang) {
  if (!lang) return ""
  return lang.toUpperCase()
}

function openTranslationTab() {
  const route = router.resolve("/db/_translation/translation")
  dbStore.addOpened(route, "_translation", null, route.name || "Translation")
}
</script>
