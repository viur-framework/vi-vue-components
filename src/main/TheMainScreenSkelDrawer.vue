<template>
  <sl-drawer
    :label="dbStore.state['skeldrawer.entry']['name']"
    :open="dbStore.state['skeldrawer.opened']"
    @sl-request-close.prevent="dbStore.state['skeldrawer.opened'] = false"
  >
    <div v-if="Object.keys(dbStore.state['skeldrawer.entry']).length === 0" class="no-entry">
      {{ $t("skeldrawer.noentry") }}
    </div>
    <template v-else>
      <div class="image-wrap">
        <img :src="getImageUrl()"
          v-if="
            Object.keys(dbStore.state['skeldrawer.entry']).includes('downloadUrl') &&
            dbStore.state['skeldrawer.entry']['mimetype'].startsWith('image/')
          "/>
        <sl-icon name="file-richtext-fill" v-else></sl-icon>

        <a :href="getDownloadUrl()" target="_blank" :download="dbStore.state['skeldrawer.entry']['name']">
          <sl-button variant="primary" class="image-download-btn">
            {{ $t("actions.download") }}
          </sl-button>
        </a>
      </div>
      <div v-for="(bone, boneName) in dbStore.state['skeldrawer.entry']" class="details">
        <span class="details-headline">
          {{ dbStore.state["skeldrawer.structure"][boneName]?.["descr"] }}:
        </span>
        <span class="details-info">
          {{ getBoneViewer(dbStore.state["skeldrawer.entry"], boneName) }}
        </span>
      </div>
    </template>
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

function getDownloadUrl() {
  return import.meta.env.VITE_API_URL + dbStore.state["skeldrawer.entry"]["downloadUrl"] + '&download=1'
}
</script>

<style scoped>
  sl-drawer{
    &::part(title){
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 700;
    }
  }

  .image-wrap{
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10em;
    margin-bottom: var(--sl-spacing-large);
    background-color: var(--sl-color-neutral-200);
    color: var(--sl-color-neutral-500);
    position: relative;
  }

  .image-download-btn{
    display: flex;
    position: absolute;
    bottom: var(--sl-spacing-small);
    right: var(--sl-spacing-small);
  }

  .details{
    margin: 0 calc(-1 * var(--body-spacing));
    padding: var(--sl-spacing-x-small) var(--sl-spacing-small);

    &:nth-child(even){
      background-color: var(--sl-color-neutral-200);
    }
  }

  .details-headline{
      font-weight: bold;
      display: block;
  }

  .details-info{
    word-break: break-all;
  }

  .no-entry{
    display: flex;
    justify-content: center;
    padding: var(--sl-spacing-small) var(--sl-spacing-small);
    font-weight: 700;
  }
</style>
