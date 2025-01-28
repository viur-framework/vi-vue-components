<template>
  <sl-input
    class="search"
    clearable
    @sl-input="state.filter = $event.target.value"
  >
    <sl-icon
      slot="suffix"
      name="funnel"
    ></sl-icon>
  </sl-input>
  <template v-for="(mod, modname) in state.moduleActions['flags']">
    <sl-button-group v-if="modname.includes(state.filter)">
      <div class="access-name">{{ modname }}</div>
      <sl-button
        v-for="right in mod"
        :title="right['name']"
        :disabled="bone.readonly"
        :variant="state.values.includes(right['key']) ? 'success' : 'default'"
        @click="toggleAccessRight(right['key'])"
      >
        <sl-icon
          slot="prefix"
          :name="right['icon']"
        ></sl-icon>
      </sl-button>
    </sl-button-group>
  </template>

  <template v-for="(mod, modname) in state.moduleActions['modules']">
    <sl-button-group v-if="modname.includes(state.filter)">
      <div
        class="access-name"
        :title="modname"
      >
        {{ renderModuleName(modname)}}
      </div>
      <sl-button
        v-for="right in mod"
        :title="right['name']"
        :disabled="bone.readonly"
        :variant="state.values.includes(right['key']) ? 'success' : 'default'"
        @click="toggleAccessRight(right['key'])"
      >
        <sl-icon
          slot="prefix"
          :name="right['icon']"
        ></sl-icon>
      </sl-button>
    </sl-button-group>
  </template>
</template>

<script setup>
import { reactive, defineComponent, onMounted, inject, computed } from "vue"
import { useDBStore } from "../stores/db"


const props = defineProps({
    name: String,
    value: Object,
    index: Number,
    lang: String,
    bone: Object
  })

  const emit = defineEmits(["change"])

    const boneState = inject("boneState")
    const dbStore = useDBStore()
    const state = reactive({
      moduleActions: computed(() => {
        const actionmap = { add: 2, view: 0, edit: 1, delete: 3, manage: 4 }
        let mods = { flags: {}, modules: {} }
        let struct = boneState["bonestructure"]["values"]
        if (!Array.isArray(boneState["bonestructure"]["values"])){
          struct = Object.entries(boneState["bonestructure"]["values"])
        }

        for (const [k, v] of struct) {
          let parts = k.split("-")
          let name = parts[parts.length - 1]
          let icon = "eye"
          if (name === "edit") {
            icon = "pencil-fill"
          } else if (name === "delete") {
            icon = "trash-fill"
          } else if (name === "manage") {
            icon = "gear"
          } else if (name === "add") {
            icon = "plus-lg"
          }

          //if (parts[0].startsWith("_")) continue

          let element = { key: k, icon: icon, name: name, module: parts[0], view: parts?.[1] }
          let namegroup = parts.slice(0, -1).join("-")

          if (Object.keys(mods["modules"]).includes(namegroup)) {
            mods["modules"][namegroup] = { ...mods["modules"][namegroup], ...{ [actionmap[name]]: element } }
          } else {
            if ((!actionmap[name] && actionmap[name] !== 0) || 
              (
                !Object.keys(dbStore.state['vi.modules']).includes(namegroup) &&
                !Object.entries(dbStore.state['vi.modules']).map(x=>x[1]['baseModule']).includes(namegroup)
              )
            ) {
              //flags
              element["icon"] = "check"
              mods["flags"][k] = { [k]: element }
            } else {
              mods["modules"][namegroup] = { [actionmap[name]]: element }
            }
          }
        }

        return mods
      }),
      values: props.value || [],
      filter: ""
    })

    onMounted(() => {
      emit("change", props.name, props.value, props.lang, props.index) //init
    })

    function toggleAccessRight(key) {
      if (state.values.includes(key)) {
        state.values.splice(state.values.indexOf(key), 1)
      } else {
        state.values.push(key)
      }
      emit("change", props.name, state.values, props.lang, props.index)
    }

    function renderModuleName(modname){
      if (dbStore.getConf(modname)){
        return dbStore.getConf(modname).name // module found
      }
      if (Object.entries(dbStore.state['vi.modules']).map(x=>x[1]['baseModule']).includes(modname)){
        let newModule = Object.entries(dbStore.state['vi.modules']).filter(x=>x[1]['baseModule']===modname)[0]
        return newModule[1].name // basemodule found, needed for shop module
      }
      let moduleName = dbStore.getConf(modname.split("-")[0])?.name // split and try to find
      if (modname.split('-')?.[1]){ //try to append group
        moduleName +=` / ${dbStore.getConf(modname.split("-")[0], modname.split("-")?.[1])?.name}`
      }
      return moduleName
    }
</script>

<style scoped>
.search {
  &::part(base) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}

sl-button-group {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  width: 100%;
  margin-top: var(--sl-spacing-x-small);

  &::part(base) {
    width: 100%;
  }

  & sl-button {
    & sl-icon {
      color: var(--sl-color-neutral-500);
    }

    &:hover {
      sl-icon {
        color: var(--sl-color-neutral-700);
      }
    }

    &[variant="success"] {
      sl-icon {
        color: #fff;
      }
    }
  }
}

.access-name {
  display: flex;
  align-items: center;
  padding: 0 var(--sl-spacing-small);
  flex: 1;
  border: 1px solid var(--sl-color-neutral-500);
  border-top-left-radius: var(--sl-border-radius-medium);
  border-bottom-left-radius: var(--sl-border-radius-medium);
}
</style>
