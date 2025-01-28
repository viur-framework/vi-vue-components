<template>
  <sl-button
    size="small"
    :loading="state.loading"
    title="$t(name)"
    @click="handleClick"
  >
    <sl-icon
      slot="prefix"
      :name="icon"
    ></sl-icon>
    <sl-spinner-viur
      v-if="handlerState.loading"
      slot="suffix"
    ></sl-spinner-viur>
    {{ $t(name) }}
  </sl-button>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDBStore } from "../stores/db"
import { Request } from "@viur/vue-utils"
import { useMessageStore } from "../stores/message"

  const props = defineProps( {
    close: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      default: "actions.reload"
    },
    icon: {
      type: String,
      default: "arrow-repeat"
    }
  })

    const handlerState = inject("handlerState")
    const reloadAction = inject("reloadAction")
    const viform = inject("viform")
    const router = useRouter()
    const route = useRoute()
    const dbStore = useDBStore()
    const state = reactive({
      loading: false
    })
    const messageStore = useMessageStore()

    function handleClick() {
      state.loading=true
      reloadAction().then(async (resp)=>{
        state.loading=false
      })
    }
</script>

<style scoped></style>
