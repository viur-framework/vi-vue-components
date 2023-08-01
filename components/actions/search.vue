<template>
  <sl-input
    :disabled="state.disabled"
    placeholder="Suche"
    clearable
    @sl-input="search_input"
    @sl-clear="reset_filter"
  >
    <sl-icon
      v-if="state.searchType === 'database'"
      name="database"
      slot="suffix"
      :title="$t('search.database')"
    ></sl-icon>
    <sl-icon
      v-else-if="state.searchType === 'local'"
      name="list-ul"
      slot="suffix"
      :title="$t('search.local')"
    ></sl-icon>
    <sl-icon
      v-else
      name="search"
      slot="suffix"
    ></sl-icon>
  </sl-input>
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
      searchType: computed(() => {
        return currentlist?.state.state === 2 ? "local" : "database"
      })
    })

    function search_input(event) {
      if (state.searchType === "local") {
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
      console.log(currentlist.state.params)
    }

    return {
      state,
      search_input,
      reset_filter,
      handlerState
    }
  }
})
</script>

<style scoped></style>
