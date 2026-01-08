<template>
  <sl-button-group>
    <sl-input
      ref="searchinput"
      size="small"
      :disabled="state.disabled || state.loading"
      placeholder="Suche"
      clearable
      :value="state.searchValue"
      @sl-input="debouncedSearch"
      @sl-clear="reset_filter"
      @keydown.enter="search_input"
    >
      <sl-spinner-viur v-if="state.loading" slot="suffix"></sl-spinner-viur>
    </sl-input>

    <sl-dropdown
      :open="state.searchTypeOpened"
      hoist
      @sl-after-show="state.searchTypeOpened = true"
      @sl-after-hide="state.searchTypeOpened = false"
    >
      <sl-button slot="trigger" :disabled="state.disabled" size="small" caret>
        <sl-icon slot="prefix" :name="searchTypeIcon()"></sl-icon>
      </sl-button>
      <sl-menu @sl-select="typeSelection">
        <sl-menu-item title="Wenn alle Einträge geladen wurden wird lokal gesucht" value="auto">
          <sl-icon slot="prefix" name="robot"></sl-icon>
          Automatisch
        </sl-menu-item>

        <sl-menu-item :title="$t('search.local')" value="local">
          <sl-icon slot="prefix" name="list-ul"></sl-icon>
          Lokale Suche
        </sl-menu-item>

        <sl-menu-item :title="$t('search.database')" value="database">
          <sl-icon slot="prefix" name="database"></sl-icon>
          Datenbank Suche
        </sl-menu-item>
      </sl-menu>
    </sl-dropdown>
  </sl-button-group>
</template>

<script setup>
import { reactive, defineComponent, inject, computed, watch, onMounted, ref } from "vue"
import { useMessageStore } from "../stores/message"
import { useDebounceFn } from "@vueuse/core"
const searchinput = ref()

const handlerState = inject("handlerState")
const reloadAction = inject("reloadAction")
const messageStore = useMessageStore()
const state = reactive({
  disabled: computed(() => {
    return handlerState.externfiltered

  }),
  searchTypeAuto: "database",
  searchType: "auto",
  searchValue: "",
  searchTypeOpened: false,
  loading: false,
  isLarge: false,
})

onMounted(() => {
  if (handlerState.filter) {
    state.searchValue = handlerState.filter
  }

})

const debouncedSearch = useDebounceFn((event) => {
  state.loading = true
  search_input(event)
}, 2000)

function search_input(event) {
  //state.loading = true //todo insert later
  state.searchValue = event.target.value
  console.log("handler",handlerState)
  console.log("search",state.searchValue)

  if (handlerState.type === "treehandler") {
    reloadAction(false, {"search": state.searchValue,})
  } else {
    handlerState.params["search"] = state.searchValue
    reloadAction()
  }
  return

  //todo auto and database ?
  let currentSearchType = state.searchType
  if (currentSearchType === "auto") {
    currentSearchType = state.searchTypeAuto
  }

  if (currentSearchType === "local") {
    handlerState.filter = event.target.value
    state.loading = false
    setTimeout(() => searchinput.value.focus(), 500)
    try {
      //delete currentlist.state.params["search"]
    } catch (e) {}
  } else {
    if (event.target.value === "" || event.target.value.length === 1) {
      reset_filter()
      state.loading = false
      setTimeout(() => searchinput.value.focus(), 500)

      return 0
    }
/*
    currentlist.state.params["search"] = event.target.value
    currentlist
      .fetch()
      .catch((error) => {
        state.loading = false
        setTimeout(() => searchinput.value.focus(), 500)
        if (error.statusCode && typeof error !== "string") {
          messageStore.addMessage("error", `${error.message}`, error.response.url)
        }
      })
      .then((resp) => {
        state.loading = false
        setTimeout(() => searchinput.value.focus(), 500)
      })

 */
  }
}
function reset_filter() {
  state.loading = false
  try {
    delete currentlist.state.params["search"]
  } catch (e) {}
  handlerState.filter = null
  reloadAction()
}

function typeSelection(event) {
  state.searchType = event.detail.item.value
  state.searchTypeOpened = false
}

function searchTypeIcon() {
  if (state.searchType === "auto") return "robot"
  if (state.searchType === "local") return "list-ul"
  if (state.searchType === "database") return "database"
}
</script>

<style scoped>
sl-input::part(base) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
</style>
