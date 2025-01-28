<template>
  <div class="record">
    <div class="single-entry">
      <sl-button-group v-if="state.selection?.['dest']">
        <sl-input
          class="entry-input"
          :disabled="true"
          :value="value ? formatString(state.format, state.selection) : ''"
        ></sl-input>
        <sl-button
          v-if="!boneState.isEmpty"
          variant="info"
          outline
          class="square-btn"
          @click="editSelection"
        >
          <sl-icon name="pencil-fill"></sl-icon>
        </sl-button>
      </sl-button-group>
      <sl-combobox
        v-else
        :disabled="bone.readonly"
        :source="getList"
        hoist
        @sl-item-select="changeEvent"
        :placeholder="boneState.label==='placeholder'?boneState?.bonestructure?.descr:undefined"
      >
      </sl-combobox>

      <sl-button
        class="square-btn"
        :disabled="bone.readonly"
        @click="openRelationalSelection"
      >
        <sl-icon name="list-ul"></sl-icon>
      </sl-button>

      <sl-button
        v-if="!bone.multiple && !boneState.isEmpty"
        :disabled="bone.readonly"
        variant="danger"
        outline
        :title="$t('bone.del')"
        class="delete-btn square-btn"
        @click="
          () => {
            $emit('change', name, '', lang, index)
            state.selection = null
          }
        "
      >
        <sl-icon
          slot="prefix"
          name="x-lg"
        ></sl-icon>
      </sl-button>
    </div>

    <Wrapper_nested
      v-if="bone['using']"
      :value="value?.['rel']"
      :name="name"
      :index="index"
      :lang="lang"
      :bone="bone"
      :disabled="bone['readonly']"
      @change="changeEventNested"
    >
    </Wrapper_nested>
  </div>
  <relational-selector
    :open="state.openedSelection"
    :name="boneState.bonestructure['descr']"
    :tab-id="handlerState.tabId"
    :filter="state.filter"
    :handler="state.moduleInfo['handlerComponent']"
    :module="boneState?.bonestructure['module']"
    @close="relationCloseAction"
  >
  </relational-selector>
</template>

<script setup>
import { reactive, defineComponent, onMounted, inject, computed, unref, watch } from "vue"
import { Request } from "@viur/vue-utils"
import Wrapper_nested from "@viur/vue-utils/bones/edit/wrapper_nested.vue"
import { useRoute, useRouter } from "vue-router"
import { useDBStore } from "../stores/db"
import handlers from "../handler/handlers"
import relationalSelector from "./components/relationalSelector.vue"

defineOptions({
    inheritAttrs: false
  })

const props = defineProps({
    name: String,
    value: [Object, String, Number, Boolean, Array],
    index: Number,
    lang: String,
    bone:Object,
    autofocus: Boolean
  })
  const emit = defineEmits( ["change"])

    const boneState = inject("boneState")
    const handlerState = inject("handlerState")
    const formatString = inject("formatString")
    const route = useRoute()
    const router = useRouter()
    const dbStore = useDBStore()

    const state = reactive({
      viform:null,
      format: computed(() => {
        return props.bone["format"]
      }),
      openedSelection: false,
      moduleInfo: computed(() => dbStore.getConf(props.bone["module"])),
      selection: null,
      entry: computed(() => {
        if (typeof props.value !== "object") {
          return { dest: props.value, rel: null }
        }
        return props.value
      }),
      skellistdata: null,
      filter:computed(()=>{
        if(props.bone['params']?.['context'] && state.viform){
          let ret = {}
          for(const [queryparameter, fieldname] of Object.entries(props.bone["params"]["context"]) ){
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
      if (props.bone["type"] === "relational.tree.leaf.file") {
        params = "skelType=leaf&"
      } else if (props.bone["type"] === "relational.tree.node.file") {
        params = "skelType=node&"
      }

      if (props.bone["context"]){
        for(const [queryparameter, fieldname] of Object.entries(props.bone["context"]) ){
          params+=`${queryparameter}=${fieldname}&`
        }
      }
      return Request.get(`/vi/${props.bone["module"]}/list?${params}limit=99`).then(async (resp) => {
        //?viurTags$lk=${search.toLowerCase()
        const data = await resp.json()
        state.skellistdata = {}
        for (let e of data["skellist"]) {
          state.skellistdata[e["key"]] = e
        }

        return data["skellist"]?.map((d) => {
          return { text: formatString(props.bone["format"], { dest: d }), value: d.key, data: d }
        })
      })
    }

    function changeEventNested(data) {
      if (state.selection?.dest){ // only send a change if we have a valid target
        state.selection = {...state.selection, "rel":data["value"]}
        emit("change", data["name"], state.selection , data["lang"], data["index"])
      }
    }

    function changeEvent(event) {
      state.selection = { dest: state.skellistdata[event.detail.item.value] }
      emit("change", props.name, state.selection, props.lang, props.index)
    }

    onMounted(() => {
      state.viform = inject("formState")
      state.selection = props.value
      emit("change", props.name, props.value, props.lang, props.index) //init
    })

    function openRelationalSelection() {
      state.openedSelection = true
    }

    function relationCloseAction(selection) {
      state.openedSelection = false
      if (selection) {
        if (state.selection) {
          state.selection["dest"] = selection
        } else {
          state.selection = { dest: selection }
        }
        emit("change", props.name, state.selection, props.lang, props.index)
      }
    }

    function editSelection() {
      const mod = props.bone["module"]

      let url = `/db/${mod}/edit`
      if (props.bone['type'].startsWith("relational.tree.leaf")){
        url += "/leaf"
      } else if (props.bone['type'].startsWith("relational.tree.node")){
        url += "/node"
      }

      url+=`/${props.value["dest"]["key"]}`
      let route = router.resolve(unref(url))
      dbStore.addOpened(route, mod)
    }
</script>

<style scoped>
.single-entry {
  display: flex;
  gap: var(--sl-spacing-x-small);

  :deep(sl-combobox) {
    &::part(input__base) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }

  sl-button-group{
    sl-button{
      margin-left: var(--sl-spacing-x-small);
    }
  }

}

sl-input {
  width: 100%;

  &::part(base) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  &::part(base) {
    background-color: var(--sl-color-neutral-0);
  }
}

sl-combobox {
  width: 100%;

  &::part(input) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}

.square-btn {
  &::part(base) {
    aspect-ratio: 1;
  }
}

.record {
  :deep(.form) {
    margin-top: var(--sl-spacing-x-small);
  }
}

sl-button-group {
  width: 100%;
}

.entry-input::part(base) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
</style>
