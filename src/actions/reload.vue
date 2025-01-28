<template>
  <div class="reload-wrapper">
    <sl-button
      :loading="state.loading"
      size="small"
      :title="$t('actions.reload')"
      @click="reload"
    >
      <sl-icon
        slot="prefix"
        name="arrow-repeat"
      ></sl-icon>
    </sl-button>

    <sl-icon-button
      v-if="currentlist?.state?.cached"
      class="cache"
      :title="$t('actions.clear_cache')"
      @click="clearCache"
      name="database-x"
    >
    </sl-icon-button>
  </div>
</template>

<script setup>
import { reactive, defineComponent, inject } from "vue"
import { useDBStore } from "../stores/db"

import { useCachedRequestsStore} from '@viur/vue-utils/utils/request'
import {Request} from '@viur/vue-utils'

const cachedRequestsStore = useCachedRequestsStore()

const tableReload = inject("reloadAction")
const currentlist = inject("currentlist")

const state = reactive({
  loading: false
})

function reload() {
  state.loading = true
  tableReload()
    .then(() => {
      state.loading = false
    })
    .catch(() => {
      state.loading = false
    })
}

function clearCache(){
  cachedRequestsStore.clearCache(Request.buildUrl(`/${currentlist.state.renderer}/${currentlist.state.module}`))
  cachedRequestsStore.clearCache(Request.buildUrl(`/${currentlist.state.renderer}/getStructure/${currentlist.state.module}`))
  reload()
}

</script>

<style scoped>
.cache{
  color: var(--sl-color-success-600);
}
.reload-wrapper{
  display:flex;
  align-items: center;
  background-color: var(--sl-color-neutral-300);
  border-radius: var(--sl-border-radius-medium);
}
.reload-wrapper:hover .cache{

}
</style>
