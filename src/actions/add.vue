<template>
  <router-link
    v-slot="{ route }"
    :to="state.url"
    custom
  >
    <sl-button
      size="small"
      variant="success"
      :disabled="!state.canAdd"
      :title="$t('actions.add')"
      @click="createAndNavigate(route)"
    >
      <sl-icon
        slot="prefix"
        name="plus-lg"
      ></sl-icon>
      <template v-if="label"> {{ $t("actions.add") }}</template>
    </sl-button>
  </router-link>
</template>

<script setup>
import { reactive, defineComponent, inject, computed, h } from "vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import { useUserStore } from "@viur/vue-utils/login/stores/user"


  const props = defineProps({
    label: {
      default: true
    },
    params: {
      default: {}
    }
  })

    const handlerState = inject("handlerState")
    const dbStore = useDBStore()
    const userStore = useUserStore()

    const state = reactive({
      url: computed(() => {
        let url = `/db/${handlerState.module}/add`

        if (handlerState.group) {
          url += `/${handlerState.group}`
        }

        url += "?" + new URLSearchParams(props.params).toString()

        return url
      }),
      canAdd: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        if (handlerState.group) {
          return userStore.state.user.access.indexOf(`${handlerState.module}-${handlerState.group}-add`) > -1
        } else {
          return userStore.state.user.access.indexOf(`${handlerState.module}-add`) > -1
        }
      })
    })

    function createAndNavigate(route) {
      dbStore.addOpened(route, handlerState["module"], handlerState["view"])
    }
</script>

<style scoped></style>
