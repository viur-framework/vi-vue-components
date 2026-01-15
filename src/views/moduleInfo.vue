<template>
  <div class="main-wrapper">
    <div style="height: 100%; padding: 20px">
      <h1 class="headline">{{ $t("moduleinfo.label") }} {{ dbStore.getConf(module)["name"] }}</h1>
      <sl-details :summary="$t('moduleinfo.model')">
        <div class="wrapper">
          <div v-for="(bone, boneName) in state.skels[Object.keys(state.skels)[0]]" class="model-wrap">
            <div class="model-entry">
              <span>{{ bone["descr"] }} ( {{ boneName }} )</span>
              <span>Typ: {{ bone["type"] }}</span>
            </div>
            <vue-json-pretty :deep="2" :data="bone" />
          </div>

          <sl-details v-for="(data, name) in state.skels" :summary="$t('moduleinfo.model') + ': ' + name">
            <vue-json-pretty :deep="1" :data="data" />
          </sl-details>
        </div>
      </sl-details>

      <sl-details :summary="$t('moduleinfo.functions')" open>
        <div class="wrapper">
          <sl-card v-for="(method, name) in dbStore.getConf(module)['methods']">
            <h2 class="subline">{{ $t("moduleinfo.endpoint") }}: {{ name }}</h2>
            <span class="doc" v-html="optimizeText(method['docs'])"></span>
            <sl-details :summary="$t('moduleinfo.parameter')" open>
              <ul>
                <li v-for="(arg, arg_name) in method['args']">
                  <template v-if="!arg['type']">
                    <b>{{ arg_name }}</b>
                  </template>
                  <template v-else>
                    <b>{{ arg_name }}</b>
                    : {{ arg["type"] }}
                  </template>
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
import { Request } from "@viur/vue-utils"

import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"

const props = defineProps({
  module: {
    type: String,
    required: true,
  },
  group: String,
  skelkey: {
    type: String,
    default: "",
  },
  skeltype: String,
})

const state = reactive({
  skels: {},
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

function optimizeText(txt) {
  if (!txt) return txt
  txt = txt.replace(/(exc)/g, "&nbsp;&nbsp;$1")
  txt = txt.replace(/`(.*?)`/g, "<i>$1</i>")
  txt = txt.replace(/::/, "<hr>")
  txt = txt.replace(/:(.*?):/g, "<br><span>$1: </span>")

  return txt
}

onBeforeMount(() => {
  Request.getStructure(props.module).then(async (resp) => {
    let data = await resp.json()
    state.skels = data
  })
})
</script>

<style scoped>
.wrapper {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: visible;
}

.headline {
  font-weight: bold;
  font-size: 24px;
}

.subline {
  font-weight: bold;
  color: var(--sl-color-neutral-800);
  font-size: 24px;
}

sl-details {
  margin-top: 20px;

  &::part(summary) {
    font-weight: bold;
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
  position: relative;
  overflow: scroll;
}
:deep(span.doc) > span {
  font-weight: bold;
}

.model-wrap {
  margin-bottom: 20px;
  background-color: var(--sl-color-neutral-200);
  padding: 10px;
  border-radius: 10px;
}

.model-entry {
  font-size: 18px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--sl-color-neutral-700);
  font-weight: bold;
  margin-bottom: 10px;
}
</style>
