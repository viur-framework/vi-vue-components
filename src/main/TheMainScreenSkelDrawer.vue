<template>
  <sl-drawer
    label="Details"
    :open="dbStore.state['skeldrawer.opened']"
    @sl-request-close.prevent="dbStore.state['skeldrawer.opened'] = false"
  >
    <span v-if="Object.keys(dbStore.state['skeldrawer.entry']).length === 0">{{ $t("skeldrawer.noentry") }}</span>
    <div
      v-if="
        Object.keys(dbStore.state['skeldrawer.entry']).includes('downloadUrl') &&
        dbStore.state['skeldrawer.entry']['mimetype'].startsWith('image/')
      "
    >
      <img :src="getImageUrl()" />
    </div>
    <div v-for="(bone, boneName) in dbStore.state['skeldrawer.entry']">
      <span style="font-weight: bold; display: block"
        >{{ dbStore.state["skeldrawer.structure"][boneName]?.["descr"] }}:</span
      >
      <span>{{ getBoneViewer(dbStore.state["skeldrawer.entry"], boneName) }}</span>
    </div>
  </sl-drawer>
</template>

<script setup>
import { reactive, defineComponent } from "vue"
import { useDBStore } from "../stores/db"
import { boneLogic } from "@viur/vue-utils"

    const state = reactive({})
    const dbStore = useDBStore()

    function getBoneViewer(skel, boneName) {
      const { getBoneValue, bones_state } = boneLogic(skel, dbStore.state["skeldrawer.structure"])
      return getBoneValue(boneName, (skel = skel))
    }

    function getImageUrl() {
      return import.meta.env.VITE_API_URL + dbStore.state["skeldrawer.entry"]["downloadUrl"]
    }

</script>

<style scoped></style>
