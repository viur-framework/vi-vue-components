<template>
  <sl-button @click="openFilterDrawer" size="small">
    <sl-icon slot="prefix" name="search"></sl-icon>
    {{ $t("actions.filter.text") }}
  </sl-button>
  <sl-drawer :label="$t('actions.filter.text')" id="filter-drawer" style="--size: 30%;">
    <div v-for="(boneStructure,boneName) in state.structure" >
      <label>{{ boneName }}</label>
      <sl-select v-if="hasSelector(boneStructure)" :id="boneName+'-selector'"
                 @sl-change="selectorChange" :disabled="state.disabledSelectorCache[boneName]" defaultValue="eq">
        <sl-menu-item value="eq" selected>==</sl-menu-item> <!--TODO select not work-->
        <sl-menu-item value="gt">&gt;</sl-menu-item>
        <sl-menu-item value="ge">&gt;=</sl-menu-item>
        <sl-menu-item value="lt">&lt;</sl-menu-item>
        <sl-menu-item value="le">&lt;=</sl-menu-item>
      </sl-select>
      <sl-bone
        :boneName="boneName"
        :boneStructure="boneStructure"
        renderType="edit"
        :id="boneName"
        :disabled="state.disabledCache[boneName]"
      ></sl-bone>
    </div>
    <div v-show="Object.keys(state.structure).length===0">{{ $t('actions.filter.nofilter') }}</div>

    <sl-button slot="footer" variant="success" @click="filter">{{ $t("actions.filter.text") }}</sl-button>
    <sl-button slot="footer" variant="danger" @click="reset">{{ $t("actions.reset") }}</sl-button>
  </sl-drawer>


</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed} from 'vue'
import {useAppStore} from "../../stores/app";
import {useRoute} from "vue-router";


export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({structure: {}, openBefore: false, disabledCache: {}, disabledSelectorCache: {}});
    const appStore = useAppStore();
    const route = useRoute();
    const conf = appStore.getConfByRoute(route);

    function openFilterDrawer() {

      const drawer = document.querySelector("#filter-drawer");

      if (!state.openBefore) {
        const listStore = appStore.getListStoreByRoute(route);
        console.log(listStore.structure)
        for (const key in listStore.structure) {
          const boneStructure = listStore.structure[key];
          let orderfields = []
          console.log("Here?")
          if (listStore.state.orders !== null) {
            orderfields = listStore.state.orders.map((order) => order[0]); //returns the names
          }
          console.log("orderfields", orderfields)

          if (boneStructure["indexed"] && boneStructure["visible"]) {
            if (["bool", "numeric", "select", "date"].indexOf(boneStructure["type"]) != -1 || boneStructure["type"].startsWith("str")|| boneStructure["type"].startsWith("relational")) {
              let canFilter = true;
              for (const name of orderfields) {
                let inIndexes = false;
                for (const index of conf["indexes"]) {
                  if (index["properties"].indexOf(name) !== -1 && index["properties"].indexOf(key) !== -1) {
                    inIndexes = true;
                  }
                }
                canFilter = inIndexes;

              }

              if (canFilter) {
                state.disabledCache[key] = false;
                state.disabledSelectorCache[key] = false;
                //enforce readonly === false so we can edit the filter
                boneStructure["readonly"] = false;
                state.structure[key] = boneStructure;
              }

            }

          }
        }
      }

      state.openBefore = true;
      drawer.show();
    }

    function filter() {
      const listStore = appStore.getListStoreByRoute(route);
      const filterObj = {};
      let notequalFilter = false;
      for (const key in state.structure) {
        const bone = document.querySelector(`#${key}`);
        const boneStructure = listStore.structure[key];
        if (state.disabledCache[key]) {
          continue
        }
        if (boneStructure["multiple"]) {
          if (bone.getBoneValue !== undefined && bone.getBoneValue.length > 0) {

            filterObj[key] = bone.getBoneValue;
          }
        } else {
          if (bone.getBoneValue !== undefined && bone.getBoneValue.toString().length > 0) {
            if (hasSelector(boneStructure)) {
              const selector = document.querySelector(`#${key}-selector`);
              if (selector.value === "eq" || notequalFilter) {
                filterObj[key] = bone.getBoneValue;
              } else {
                filterObj[`${key}$${selector.value}`] = bone.getBoneValue;
                notequalFilter = true;
              }


            } else {
              if(boneStructure["type"].startsWith("relational"))
              {
                  filterObj[`${key}.dest.key`] = bone.getBoneValue;
              }
              else
              {
                filterObj[key] = bone.getBoneValue;
              }

            }

          }
        }


      }
      listStore.reset();
      listStore.filter(filterObj);
      const drawer = document.querySelector("#filter-drawer");
      drawer.hide();
    }

    function reset() {
      const drawer = document.querySelector("#filter-drawer");
      state.openBefore = false;
      const listStore = appStore.getListStoreByRoute(route);
      listStore.reset();
      listStore.filter({}); //reset filter
      drawer.hide();
    }

    function selectorChange(e: Event) {
      const targetName = e.target.id.split("-")[0];
      if (state.disabledCache[targetName] || state.disabledSelectorCache[targetName]) {
        return//is disabled
      }
      if (e.target.value !== "eq") {
        for (const key of Object.keys(state.disabledCache)) {
          if (key !== targetName) {
            state.disabledSelectorCache[key] = true;
            const selector = document.querySelector(`#${key}-selector`);
            if (selector) {
              selector.value = "eq";
            }
            let allinIndex = false;
            for (const index of conf["indexes"]) {
              if (index["properties"].indexOf(targetName) !== -1) {
                if (index["properties"].indexOf(key) !== -1) {
                  allinIndex = true;
                }

              }


            }
            if (!allinIndex) {
              console.log("set disabled:", key)
              state.disabledCache[key] = true;

            }


          }
        }
      } else {
        for (const key of Object.keys(state.disabledCache)) {
          state.disabledSelectorCache[key] = false;
          state.disabledCache[key] = false;
          console.log("set enabled:", key)

        }
      }
    }

    function hasSelector(boneStructure) {
      if (['numeric', 'str', "date"].indexOf(boneStructure['type']) > -1) {
        return true
      }
      return boneStructure['type'].startsWith("str");


    }

    return {state, openFilterDrawer, filter, reset, selectorChange, hasSelector}
  }
})
</script>

<style scoped lang="less">
.selectfieldswitch {
  display: block;

}
</style>
