<template>
  <div class="record">
    <div class="single-entry">
      <sl-button-group v-if="state.selection">
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
        :disabled="boneState.readonly"
        :source="getList"
        hoist
        @sl-item-select="changeEvent"
      >
      </sl-combobox>

      <sl-button
        class="square-btn"
        :disabled="boneState.readonly"
        @click="openRelationalSelection"
      >
        <sl-icon name="list-ul"></sl-icon>
      </sl-button>

      <sl-button
        v-if="!boneState.multiple && !boneState.isEmpty"
        :disabled="boneState.readonly"
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
      v-if="boneState?.bonestructure['using']"
      :value="value?.['rel']"
      :name="name"
      :index="index"
      :disabled="boneState.bonestructure['readonly']"
      @change="changeEventNested"
    >
    </Wrapper_nested>
  </div>

  <relational-selector
    :open="state.openedSelection"
    :name="boneState.bonestructure['descr']"
    :tab-id="handlerState.tabId"
    :handler="state.moduleInfo['handlerComponent']"
    :module="boneState?.bonestructure['module']"
    @close="relationCloseAction"
  >
  </relational-selector>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, onMounted, inject, computed, unref, watch } from "vue"
import { Request } from "@viur/vue-utils"
import Wrapper_nested from "@viur/vue-utils/bones/edit/wrapper_nested.vue"
import { useRoute, useRouter } from "vue-router"
import { useDBStore } from "../stores/db"
import handlers from "../handler/handlers"
import relationalSelector from "./components/relationalSelector.vue"

export default defineComponent({
  inheritAttrs: false,
  props: {
    name: String,
    value: Object,
    index: Number,
    lang: String
  },
  components: { Wrapper_nested, ...handlers, relationalSelector },
  emits: ["change"],
  setup(props, context) {
    const boneState = inject("boneState")
    const handlerState = inject("handlerState")
    const formatString = inject("formatString")
    const route = useRoute()
    const router = useRouter()
    const dbStore = useDBStore()
    const state = reactive({
      format: computed(() => {
        return boneState?.bonestructure["format"]
      }),
      openedSelection: false,
      moduleInfo: computed(() => dbStore.getConf(boneState?.bonestructure["module"])),
      selection: null,
      entry: computed(() => {
        if (typeof props.value !== "object") {
          return { dest: props.value, rel: null }
        }
        return props.value
      }),
      skellistdata: null
    })

    function getList(search: String) {
      let params = ""
      if (boneState.bonestructure["type"] === "relational.tree.leaf.file") {
        params = "skelType=leaf&"
      } else if (boneState.bonestructure["type"] === "relational.tree.node.file") {
        params = "skelType=node&"
      }

      return Request.get(`/vi/${boneState.bonestructure["module"]}/list?${params}limit=99`).then(async (resp) => {
        //?viurTags$lk=${search.toLowerCase()
        const data = await resp.json()
        state.skellistdata = {}
        for (let e of data["skellist"]) {
          state.skellistdata[e["key"]] = e
        }

        return data["skellist"]?.map((d: any) => {
          return { text: formatString(boneState.bonestructure["format"], { dest: d }), value: d.key, data: d }
        })
      })
    }

    function changeEventNested(val) {
      if (!state.selection) state.selection = {}

      if (!state.selection["rel"]?.[val.name]) {
        if (!state.selection["rel"]) {
          state.selection["rel"] = { [val.name]: null }
        } else {
          state.selection["rel"][val.name] = null
        }
      }

      let currentBone = state.selection["rel"][val.name]
      if (val.lang) {
        if (currentBone === null) currentBone = {}
        if (Object.keys(currentBone).includes(val.lang) && val.index !== null) {
          currentBone[val.lang][val.index] = val.value
        } else {
          currentBone[val.lang] = val.value
        }
      } else if (val.index !== null) {
        if (currentBone === null) currentBone = []
        currentBone[val.index] = val.value
      } else {
        currentBone = val.value
      }

      if (Object.keys(state.selection).includes("rel") && state.selection["rel"]) {
        state.selection["rel"][val.name] = currentBone
      } else {
        state.selection["rel"] = { [val.name]: currentBone }
      }

      if (!Object.keys(state.selection).includes("dest")) return
      context.emit("change", props.name, state.selection, props.lang, props.index)
    }

    function changeEvent(event) {
      state.selection = { dest: state.skellistdata[event.detail.item.value] }
      context.emit("change", props.name, state.selection, props.lang, props.index)
    }

    onMounted(() => {
      state.selection = props.value
      context.emit("change", props.name, props.value, props.lang, props.index) //init
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
        context.emit("change", props.name, state.selection, props.lang, props.index)
      }
    }

    function editSelection() {
      const mod = boneState.bonestructure["module"]
      const url = `/db/${mod}/edit/${props.value["dest"]["key"]}`
      let route = router.resolve(unref(url))
      dbStore.addOpened(route, mod)
    }

    watch(
      () => props.value,
      (newVal, oldVal) => {
        state.selection = newVal
      }
    )

    return {
      state,
      boneState,
      handlerState,
      dbStore,
      formatString,
      changeEvent,
      changeEventNested,
      getList,
      openRelationalSelection,
      relationCloseAction,
      editSelection
    }
  }
})
</script>

<style scoped>
.single-entry {
  display: flex;
  gap: 10px;

  :deep(sl-combobox) {
    &::part(input__base) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
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
