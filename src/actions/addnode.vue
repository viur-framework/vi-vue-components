<template>
  <sl-button-group>
    <router-link
      v-slot="{ route }"
      :to="state.url"
      custom
    >
      <sl-button
        size="small"
        variant="success"
        outline
        :disabled="state.disabled"
        :title="$t('actions.addnode')"
        @click="createAndNavigate(route)"
      >
        <sl-icon
          slot="prefix"
          :name="itemMeta(null, 'node').icon"
        ></sl-icon>
        {{ itemMeta(null, "node").name }} {{ $t("actions.add") }}
      </sl-button>
    </router-link>
    <sl-dropdown
      v-if="handlerState.conf?.['kinds'] && Object.keys(handlerState.conf['kinds']).length > 2"
      placement="bottom-end"
    >
      <sl-button
        slot="trigger"
        :disabled="state.disabled"
        variant="success"
        size="small"
        caret
        outline
      ></sl-button>
      <sl-menu>
        <template
          v-for="(kind, type) in handlerState.conf?.['kinds']"
          :key="type"
        >
          <sl-menu-item
            v-if="type.startsWith('node.')"
            :disabled="typeDisabled(type)"
            @click="openEdit(type)"
          >
            <sl-icon
              slot="prefix"
              :name="kind.icon"
              :library="kind.library"
            ></sl-icon>
            {{ kind["name"] }} {{ $t("actions.add") }}
          </sl-menu-item>
        </template>
      </sl-menu>
    </sl-dropdown>
  </sl-button-group>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useContextStore } from "../stores/context"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useRoute, useRouter } from "vue-router"

    const handlerState = inject("handlerState")
    const itemMeta = inject("itemMeta")
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const contextStore = useContextStore()
    const route = useRoute()
    const router = useRouter()

    const state = reactive({
      url: computed(() => {
        if (handlerState && handlerState["currentSelection"] && handlerState["currentSelection"][0]) {
          return `/db/${handlerState.module}/add/node/${handlerState["currentSelection"][0]["key"]}`
        }
        if (handlerState && handlerState["currentRootNode"]) {
          return `/db/${handlerState.module}/add/node/${handlerState["currentRootNode"]["key"]}`
        }
        return ""
      }),
      canAdd: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-add`) > -1
      }),
      disabled: computed(() => {
        if (handlerState.currentSelection.length !== 1) {
          return true
        }
        if (!state.canAdd) {
          return true
        }

        let entry = handlerState.currentSelection[0]
        let type = "node"
        if (entry?.["kind"]) {
          type += `.${entry["kind"]}`
        }

        if (
          handlerState.conf?.["kinds"] && (!Object.keys(handlerState.conf["kinds"]).includes(type) && !handlerState.conf["kinds"]['node']["allowedChildren"].map((x) => x.split(".")[0]).includes("node") ) &&
          !handlerState.conf["kinds"][type]["allowedChildren"].map((x) => x.split(".")[0]).includes("node")
        ) {
          return true
        }

        return false
      })
    })

    function createAndNavigate(route) {
      dbStore.addOpened(route, handlerState["module"], handlerState["view"])
    }

    function openEdit(kind = null) {
      let newRoute = router.resolve(state.url)
      if (kind) {
        newRoute.query = { kind: kind.split(".")[1] }
      }
      dbStore.addOpened(newRoute, handlerState["module"], handlerState["view"])
    }

    function typeDisabled(currentType) {
      let entry = handlerState.currentSelection[0]
      let type = "node"
      if (entry?.["kind"]) {
        type += `.${entry["kind"]}`
      }
      let currentAllowedKinds = handlerState.conf["kinds"][type]["allowedChildren"]
      if (
        currentAllowedKinds.includes(currentType) ||
        (currentType.startsWith("node.") && currentAllowedKinds.includes("node"))
      ) {
        return false
      }
      return true
    }

</script>

<style scoped></style>
