<template>
  <sl-button-group>
    <sl-input
      size="small"
      :disabled="state.disabled"
      placeholder="Suche"
      clearable
      :value="state.searchValue"
      @sl-input="debouncedSearch"
      @sl-clear="reset_filter"
    >
      <sl-spinner-viur
        v-if="state.loading"
        slot="suffix"
      ></sl-spinner-viur>
    </sl-input>

    <sl-dropdown
      :open="state.searchTypeOpened"
      hoist
      @sl-after-show="state.searchTypeOpened = true"
      @sl-after-hide="state.searchTypeOpened = false"
    >
      <sl-button
        slot="trigger"
        size="small"
        caret
      >
        <sl-icon
          slot="prefix"
          :name="searchTypeIcon()"
        ></sl-icon>
      </sl-button>
      <sl-menu @sl-select="typeSelection">
        <sl-menu-item
          title="Wenn alle Einträge geladen wurden wird lokal gesucht"
          value="auto"
        >
          <sl-icon
            slot="prefix"
            name="robot"
          ></sl-icon>
          Automatisch
        </sl-menu-item>

        <sl-menu-item
          :title="$t('search.local')"
          value="local"
          ><sl-icon
            slot="prefix"
            name="list-ul"
          ></sl-icon>
          Lokale Suche
        </sl-menu-item>

        <sl-menu-item
          :title="$t('search.database')"
          value="database"
          ><sl-icon
            slot="prefix"
            name="database"
          ></sl-icon>
          Datenbank Suche
        </sl-menu-item>
      </sl-menu>
    </sl-dropdown>
  </sl-button-group>
</template>

<script setup>

import { reactive, defineComponent, inject, computed, watch, onMounted } from "vue"
import { useMessageStore } from "../stores/message"
import { useDebounceFn } from "@vueuse/core"

    const currentlist = inject("currentlist")
    const handlerState = inject("handlerState")
    const reloadAction = inject("reloadAction")
    const messageStore = useMessageStore()
    const state = reactive({
      disabled: computed(() => {
        return false
        let searchableBone = false
        for (const [k, v] of Object.entries(currentlist?.structure)) {
          if (Object.keys(v).includes("searchable") && v["searchable"]) {
            searchableBone = true
          }
        }

        return false //till core update
        return !searchableBone
      }),
      searchTypeAuto: "database",
      searchType: "auto",
      searchValue: "",
      searchTypeOpened: false,
      loading: false,
      isLarge: false
    })

    watch(
      () => currentlist?.state.state,
      (newVal, oldVal) => {
        if (newVal === 1) {
          state.isLarge = true
          state.searchTypeAuto = "database"
        }

        if (!state.isLarge && newVal === 2) {
          state.searchTypeAuto = "local"
        }
      }
    )

    onMounted(()=>{
      if(handlerState.filter){
        state.searchValue = handlerState.filter
      }
      if(currentlist.state.params?.["search"]){
        state.searchValue = currentlist.state.params?.["search"]
      }
    })

    const debouncedSearch = useDebounceFn((event) => {
      state.loading = true
      search_input(event)
    }, 500)

    function search_input(event) {
      state.loading = true
      state.searchValue = event.target.value

      let currentSearchType = state.searchType
      if (currentSearchType === "auto") {
        currentSearchType = state.searchTypeAuto
      }

      if (currentSearchType === "local") {
        handlerState.filter = event.target.value
        state.loading = false
        try {
          delete currentlist.state.params["search"]
        } catch (e) {}
      } else {
        if (event.target.value === "" || event.target.value.length === 1) {
          reset_filter()
          state.loading = false
          return 0
        }

        currentlist.state.params["search"] = event.target.value
        currentlist
          .fetch()
          .catch((error) => {
            state.loading = false
            messageStore.addMessage("error", `${error.message}`, error.response?.url)
          })
          .then((resp) => {
            state.loading = false
          })
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
