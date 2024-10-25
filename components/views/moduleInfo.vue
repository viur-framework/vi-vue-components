<template>
<div class="main-wrapper">

  <div style="height:100%;padding:20px;">
    <h1 class="headline">Modulebeschreibung {{dbStore.getConf(module)['name']}}</h1>
  <sl-details summary="Datenmodel">
    <div class="wrapper">
      <sl-details :summary="name" v-for="(data, name) in state.skels">
        <vue-json-pretty :deep="1" :data="data" />
      </sl-details>
    </div>
  </sl-details>

  <sl-details summary="Funktionen">
    <div class="wrapper">
      <sl-card v-for="(method, name) in dbStore.getConf(module)['methods']">
        <h2 class="subline">{{ name }} </h2>
        <span class="doc" v-html="method['docs']?.replace(/(:.*?:)/g,'<br><span>$1</span>')"></span>
        <sl-details summary="Parameter">
          <ul>
            <li v-for="(arg,arg_name) in method['args']">
              {{ arg_name }} : {{ arg["type"]?arg["type"]:"" }}
            </li>

          </ul>
        </sl-details>
      </sl-card>
    </div>
  </sl-details>
  </div>
</div>
</template>

<script setup>

import { reactive, watch, onBeforeMount } from "vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import utils from "../utils"
import {Request} from "@viur/vue-utils";

import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

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
  skels:{}
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

onBeforeMount(()=>{
  Request.getStructure(props.module).then(async (resp)=>{
    let data = await resp.json()
    state.skels = data
  })
})


</script>

<style scoped>

.wrapper{
  padding:10px;
  display: flex;
  flex-direction: column;
  gap:10px;
  overflow:visible;
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

  &::part(summary){
  font-weight: bold;
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
  position: relative;
  overflow:scroll;
}
:deep(span.doc) > span {
  font-weight: bold;
}
</style>
