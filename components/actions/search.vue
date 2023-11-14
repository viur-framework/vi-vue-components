<template>
  <sl-button-group>
    <sl-input
      size="small"
      :disabled="state.disabled"
      placeholder="Suche"
      clearable
      @sl-input="search_input"
      @sl-clear="reset_filter"
    >
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
            name="system"
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

<script lang="ts">
import { reactive, defineComponent, inject, computed } from "vue"
import { useMessageStore } from "../stores/message"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const currentlist: any = inject("currentlist")
    const handlerState: any = inject("handlerState")
    const reloadAction: any = inject("reloadAction")
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
      searchTypeAuto: computed(() => {
        return currentlist?.state.state === 2 && state.state.searchValue ? "local" : "database"
      }),
      searchType: "auto",
      searchValue: "",
      searchTypeOpened: false
    })

    function search_input(event) {
      state.searchValue = event.target.value

      let currentSearchType = state.searchType
      if (currentSearchType === "auto") {
        currentSearchType = state.searchTypeAuto
      }

      if (currentSearchType === "local") {
        handlerState.filter = event.target.value
        try {
          delete currentlist.state.params["search"]
        } catch (e) {}
      } else {
        if (event.target.value === "") {
          reset_filter()
        }

        currentlist.state.params["search"] = event.target.value
        currentlist.fetch().catch((error) => {
          messageStore.addMessage("error", `${error.message}`, error.response?.url)
        })
      }
    }
    function reset_filter() {
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
      if (state.searchType === "auto") return "system"
      if (state.searchType === "local") return "list-ul"
      if (state.searchType === "database") return "database"
    }

    return {
      state,
      search_input,
      reset_filter,
      typeSelection,
      searchTypeIcon,
      handlerState
    }
  }
})
</script>

<style scoped>
sl-input::part(base) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
</style>
