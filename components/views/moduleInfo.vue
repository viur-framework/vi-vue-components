<template>
<div class="wrapper">
  <h1 class="headline">Funktionen</h1>
<sl-card v-for="(method, name) in dbStore.getConf(module)['methods']">
  <h2 class="subline">{{ name }} </h2>
  {{ method["docs"] }}

  <sl-details summary="Values">
    <ul>
      <li v-for="(arg,arg_name) in method['args']">
        {{ arg_name }} : {{ arg["type"]?arg["type"]:"" }}
      </li>

    </ul>
  </sl-details>
</sl-card>
</div>
</template>

<script setup>

import { reactive, watch, onBeforeMount } from "vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import utils from "../utils"


const props = defineProps({
  module: {
    type: String,
    required: true
  },
  group: String,
  skelkey: {
    type: String,
    default: ""
  },
  skeltype: String
})

const state = reactive({
})
const dbStore = useDBStore()
const route = useRoute()

watch(
  () => dbStore.state["vi.modules"],
  (newVal, oldVal) => {
    //wait till modules loaded
    if (
      !utils.objectEmpty(newVal) &&
      dbStore.state["handlers.opened"].filter((e) => e["url"] === route.fullPath).length <= 0
    ) {
      dbStore.addOpened(route.fullPath, props.module, route.query?.["view"])
    }
  }
)

</script>

<style scoped>

.wrapper{
  padding:20px;
  display: flex;
  flex-direction: column;
  gap:20px;
  overflow:visible;
  height:1000px;
}

.headline{
  font-weight: bold;
  font-size: 24px;
}

.subline{
  font-weight: bold;
}

sl-details{
  margin-top:20px;
}
</style>
