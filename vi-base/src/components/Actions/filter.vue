<template>
  <sl-button @click="openFilterDrawer" size="small" :title="$t('actions.filter.text')">
    <sl-icon slot="prefix" name="search"></sl-icon>
    {{ $t("actions.filter.text") }} {{state.opened}}
  </sl-button>

  <teleport v-if="state.opened" to="#dialogs" :disabled="!state.opened">
    <sl-drawer :open="state.opened" @sl-after-hide="closed" :label="$t('actions.filter.text')" style="--size: 30%;" >
      <div v-for="(boneStructure,boneName) in state.structure">
        <label>{{ boneName }}</label>
        <sl-select hoist v-if="hasSelector(boneStructure)" :id="boneName+'-selector'"
                   @sl-change="selectorChange" :disabled="state.disabledSelectorCache[boneName]" defaultValue="eq">
          <sl-option value="eq">==</sl-option> <!--TODO select not work-->
          <sl-option value="gt">&gt;</sl-option>
          <sl-option value="ge">&gt;=</sl-option>
          <sl-option value="lt">&lt;</sl-option>
          <sl-option value="le">&lt;=</sl-option>
          <sl-option value="between" v-if="boneStructure['type']==='date'||boneStructure['type']==='numeric'">between
          </sl-option>
          <sl-option value="startwith" v-if="boneStructure['type']==='str'">startwith</sl-option>
        </sl-select>
        <sl-bone
          :boneName="boneName"
          :boneStructure="boneStructure"
          renderType="edit"
          :id="boneName"
          :disabled="state.disabledCache[boneName]"
          @sl-bone-change="bone_change"
        ></sl-bone>
        <sl-bone
          :boneName="boneName"
          :boneStructure="boneStructure"
          renderType="edit"
          :id="boneName+'-between'"
          :disabled="state.disabledCache[boneName]"
          v-if="boneStructure['type']==='date'"
          v-show="state.between_show[boneName]"
          @sl-bone-change="bone_change"
        ></sl-bone>
      </div>
      <div v-show="Object.keys(state.structure).length===0">{{ $t('actions.filter.nofilter') }}</div>
      <div class="footer" slot="footer">
        <sl-switch size="small" @sl-change="live_change">Live preview</sl-switch>
        <div class="footer-btns">
          <sl-button size="small" outline variant="danger" @click="reset">{{ $t("actions.reset") }}</sl-button>
          <sl-button size="small" variant="success" @click="filter">{{ $t("actions.filter.text") }}</sl-button>
        </div>
      </div>
    </sl-drawer>
  </teleport>

</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed, inject} from 'vue'
import {useDBStore} from "../../stores/db";
import {useRoute} from "vue-router";


export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({
      structure: {},
      disabledCache: {},
      disabledSelectorCache: {},
      between_show: {},
      live_preview:false,
      opened:false
    });
    const dbStore = useDBStore();
    const route = useRoute();
    const conf = dbStore.getConfByRoute(route);
    const currentlist: any = inject("currentlist")

    function openFilterDrawer() {
      state.opened = true
      for (const key in currentlist.structure) {
        const boneStructure = currentlist.structure[key];
        let orderfields = []
        if (currentlist.state.orders !== null) {
          orderfields = currentlist.state.orders.map((order) => order[0]); //returns the names
        }

        if (boneStructure["indexed"]) { // todo && boneStructure["visible"] only filter if visible
          if (["bool", "numeric", "select", "date"].indexOf(boneStructure["type"]) != -1 || boneStructure["type"].startsWith("str") || boneStructure["type"].startsWith("relational")) {
            let canFilter = true;
            for (const name of orderfields) {
              let inIndexes = false;
              if (conf["indexes"] === undefined) {
                conf["indexes"] = []
              }
              for (const index of conf["indexes"]) {
                if (index["properties"].indexOf(name) !== -1 && index["properties"].indexOf(key) !== -1) {
                  inIndexes = true;
                }
              }
              canFilter = inIndexes;

            }

            if (canFilter) {
              state.disabledCache[key] = false;
              state.between_show[key] = false;
              state.disabledSelectorCache[key] = false;
              //enforce readonly = false so we can edit the filter
              boneStructure["readonly"] = false;
              //enforce visible = true so we can edit the filter
              boneStructure["visible"] = true;
              state.structure[key] = boneStructure;
            }

          }

        }
      }
    }

    function filter(close=true) {
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
              } else if (selector.value === "between") {
                const bone2 = document.querySelector(`#${key}-between`);
                filterObj[`${key}$gt`] = bone.getBoneValue;
                filterObj[`${key}$lt`] = bone2.getBoneValue;
              } else if (selector.value === "startwith") {

                filterObj[`${key}$gt`] = bone.getBoneValue;
                //makes  last char +1 like test to  tesu
                filterObj[`${key}$lt`] = bone.getBoneValue.substring(0, bone.getBoneValue.length - 1) + String.fromCharCode(bone.getBoneValue.charCodeAt(bone.getBoneValue.length - 1) + 1);
              } else {
                filterObj[`${key}$${selector.value}`] = bone.getBoneValue;
                notequalFilter = true;
              }


            } else {
              if (boneStructure["type"].startsWith("relational")) {
                filterObj[`${key}.dest.key`] = bone.getBoneValue;
              } else {
                filterObj[key] = bone.getBoneValue;
              }

            }

          }
        }


      }
      currentlist.reset();
      currentlist.filter(filterObj);
      if(close)
      {
         state.opened = false
      }

    }

    function reset() {
      currentlist.reset();
      currentlist.filter({}); //reset filter
      state.opened = false
    }

    function selectorChange(e: Event) {
      const targetName = e.target.id.split("-")[0];
      if (state.disabledCache[targetName] || state.disabledSelectorCache[targetName]) {
        return//is disabled
      }
      state.between_show[targetName] = e.target.value === "between";

      if (e.target.value !== "eq") {

        for (const key of Object.keys(state.disabledCache)) {
          if (key !== targetName) {
            state.disabledSelectorCache[key] = true;
            const selector = document.querySelector(`#${key}-selector`);
            if (selector) {
              selector.value = "eq";
            }
            let allinIndex = false;
            if (conf["indexes"] === undefined) {
              conf["indexes"] = []
            }
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
    function live_change(e)
    {
      state.live_preview=e.target.checked;
    }
    function bone_change()
    {
      console.log("bone change")
      if(state.live_preview)
      {
        filter(false)
      }
    }
    function closed(){
      state.opened = !state.opened
    }

    return {state, openFilterDrawer, filter, reset, selectorChange, hasSelector,live_change,bone_change, closed}
  }
})
</script>

<style scoped lang="less">
.selectfieldswitch {
  display: block;
}

.footer{
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.footer-btns{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  margin-top: var(--sl-spacing-medium);
}

sl-drawer {
  &::part(header) {
    height: 60px;
    align-items: center;
  }

  &::part(header-actions){
    height: 100%;
  }
}

</style>
