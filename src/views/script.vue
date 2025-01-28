<template>
  <iframe
    style="height: 100%"
    :src="url()"
  >
  </iframe>
</template>

<script setup>
import { reactive, defineComponent, onDeactivated, watch, getCurrentInstance, computed, ref } from "vue"
import FormHandler from "../handler/FormHandler.vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import { useAppStore } from "../stores/app"
import utils from "../utils"

    const frame = ref()
    const appStore = useAppStore()
    const dbStore = useDBStore()
    const route = useRoute()
    const state = reactive({})

    function url() {
      let url = `${import.meta.env.VITE_API_URL}${appStore.state["admin.scriptor.url"]}#/runner/${
        route["params"]["key"]
      }`
      if (Object.keys(route.query).length > 0) {
        url += `?scriptor_params=${JSON.stringify(route.query)}`
      }
      return url
    }
</script>

<style scoped></style>
