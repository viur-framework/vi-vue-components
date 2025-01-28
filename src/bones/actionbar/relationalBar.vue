<template>
  <div class="actionbar">
    <sl-button
      v-if="boneState.multiple && !readonly"
      variant="danger"
      :disabled="boneState.isEmpty"
      :title="$t('bone.del')"
      outline
      class="delete-btn"
      @click="removeMultipleEntries(index, lang)"
    >
      <sl-icon
        slot="prefix"
        name="x-lg"
      ></sl-icon>
    </sl-button>

    <sl-combobox
      :source="getList"
      hoist
      @sl-item-select="addMultipleEntry(lang, { dest: state.skels?.[$event.detail.item.value], rel: null })"
      :placeholder="boneState.label==='placeholder'?boneState?.bonestructure?.descr:undefined"
    ></sl-combobox>
    <sl-button
      v-if="boneState.multiple && !readonly"
      variant="success"
      :title="$t('bone.add')"
      outline
      class="add-btn"
      @click="openSelector(lang)"
    >
      <sl-icon
        slot="prefix"
        name="plus-lg"
      ></sl-icon>
      {{ $t("bone.add") }}
    </sl-button>
  </div>
  <relational-selector
    :open="state.openedSelection"
    :name="boneState.bonestructure['descr']"
    :tab-id="handlerState.tabId"
    :handler="state.moduleInfo?.['handlerComponent']"
    :module="boneState?.bonestructure['module']"
    :filter="state.filter"
    :rowselect="2"
    @close="relationCloseAction"
  >
  </relational-selector>
</template>

<script setup>
import { reactive, defineComponent, onMounted, inject, computed } from "vue"
import { Request } from "@viur/vue-utils"
import relationalSelector from "../components/relationalSelector.vue"
import { useDBStore } from "../../stores/db"


const props = defineProps({
    name: String,
    value: Object,
    index: Number,
    lang: String,
    readonly: Boolean,
    params: Object
  })

  const emit = defineEmits(["change", "delete"])

    const boneState = inject("boneState")
    const handlerState = inject("handlerState")
    const addMultipleEntry = inject("addMultipleEntry")
    const removeMultipleEntries = inject("removeMultipleEntries")
    const formatString = inject("formatString")
    const dbStore = useDBStore()
    const state = reactive({
      viform:null,
      skels: {},
      openedSelection: false,
      moduleInfo: computed(() => dbStore.getConf(boneState?.bonestructure["module"])),
      hasUsing: computed(() => boneState?.bonestructure["using"]),
      filter:computed(()=>{
        if(boneState?.bonestructure['params']?.['context'] && state.viform){
          let ret = {}
          for(const [queryparameter, fieldname] of Object.entries(boneState?.bonestructure?.["params"]["context"]) ){
            //ret[queryparameter] = state.viform.state.skel[fieldname]
            //contexts are a mess...
            ret[queryparameter] = fieldname
          }
          return ret
        }
        return {}
      })
    })

    function getList(search) {
      if (!search) return []
      let params = ""
      if (boneState.bonestructure["type"] === "relational.tree.leaf.file") {
        params = "skelType=leaf&"
      } else if (boneState.bonestructure["type"] === "relational.tree.node.file") {
        params = "skelType=node&"
      }
      let filter = `&search=${search.toLowerCase()}`

      if (!search || search.length < 2) {
        filter = ""
      }

      return Request.get(`/vi/${boneState.bonestructure["module"]}/list?${params}limit=99${filter}`).then(
        async (resp) => {
          const data = await resp.json()
          state.skels = data["skellist"].reduce((acc, curr) => ((acc[curr["key"]] = curr), acc), {})

          return data["skellist"]?.map((d) => {
            return { text: formatString(boneState.bonestructure["format"], { dest: d }), value: d.key, data: d }
          })
        }
      )
    }
    function openSelector(lang) {
      state.openedSelection = true
    }

    function relationCloseAction(selection) {
      state.openedSelection = false
      if (selection) {
        for (let entry of selection) {
          let relDefault = null
          if (state.hasUsing) {
            relDefault = undefined
          }
          addMultipleEntry(props.lang, { dest: entry, rel: relDefault })
        }
      }
    }

    onMounted(() => {
      state.viform = inject("viform")
      if (!props.value || props.value.length === 0) {
        emit("change", props.name, [], props.lang) //init
      }
    })
</script>

<style scoped>
.actionbar {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

sl-combobox {
  width: 100%;
}

.delete-btn {
  margin-right: var(--sl-spacing-x-small);
}

.add-btn {
  margin-left: var(--sl-spacing-x-small);
}
</style>
