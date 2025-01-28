<template>
  <sl-button
    size="small"
    variant="default"
    @click="openScriptor"
  >
    <sl-icon
      slot="prefix"
      name="code-square"
      sprite
    ></sl-icon>
  </sl-button>
</template>

<script setup>
import { reactive, defineComponent } from "vue"
import { useDBStore } from "../../stores/db";
import { useRouter } from "vue-router";
const router = useRouter()
const dbStore = useDBStore()
const state = reactive({})

function openScriptor() {
  let new_route = router.resolve("/scriptor/app")
  dbStore.addOpened(new_route, "", null, "Scriptor","code-square")
}

</script>

<style scoped></style>
