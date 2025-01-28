<template>
  <sl-button size="small" :title="$t('actions.filter.text')" @click="openFilterDrawer">
    <sl-icon slot="prefix" name="funnel"></sl-icon>
    {{ $t("actions.filter.text") }}
  </sl-button>
  <template v-if="state.activeFilter.length > 0">
    <sl-select size="small" multiple clearable hoist style="max-width: 200px"
      :value="state.activeFilter?.map((i) => i['key'])" @sl-change="removeFromFilter" @sl-clearable="removeFromFilter">
      <sl-option v-for="filter in state.activeFilter" :value="filter['key']">{{ filter["name"] }}</sl-option>
    </sl-select>
  </template>

  <teleport v-if="state.opened" to="#dialogs" :disabled="!state.opened">
    <sl-dialog :label="$t('actions.filter.text')" open class="filter-dialog" style="--width: 55%" @sl-after-hide="closed">
      <sl-select placeholder="Auswahl" size="small" hoist :value="state.activeBone?.['key']" @sl-change="selectedBone">
        <template v-for="(bone, boneName) in currentlist.structure">
          <sl-option v-if="filterableField(bone)" :value="boneName">
            {{ bone["descr"] }}</sl-option>
        </template>
      </sl-select>
      <template v-if="state.activeBone">
        <h2>Filtereinstellungen</h2>
        <hr />
        <div v-if="state.activeBone?.['type']?.startsWith('bool')">
          <sl-switch @sl-change="setBoolOperator($event)">{{ state.activeBone?.["descr"] }}</sl-switch>
        </div>
        <div v-else-if="state.activeBone?.['type']?.startsWith('str')">
          <sl-input help-text="exakter Vergleich" @sl-change="setStrOperator($event)">{{ state.activeBone?.["descr"]
            }}</sl-input>
        </div>
        <div v-else-if="state.activeBone?.['type']?.startsWith('numeric')">
          <sl-input type="number" help-text="exakter Vergleich" @sl-change="setNumericOperator($event)">{{
            state.activeBone?.["descr"] }}</sl-input>
        </div>
        <div v-else-if="state.activeBone?.['type']?.startsWith('select')">
          <sl-select hoist size="small" @sl-change="setSelectOperator($event)">
            <sl-option v-for="val in state.activeBone['values']" :value="val[0]">{{ val[1] }}</sl-option>
          </sl-select>
        </div>

        <div v-else-if="false">
          <sl-select placeholder="Typ" size="small">
          </sl-select>
        </div>
        <!--
        {{ state.activeBone?.['descr'] }}
        {{ state.activeOperators }}
        {{ state.activeFilter }}
          -->
      </template>
      <sl-button slot="footer" variant="success" size="small" :disabled="!state.addEnabled" @click="addToFilter">
        Filter hinzufügen
      </sl-button>
    </sl-dialog>
  </teleport>
</template>

<script setup>
import { reactive, defineComponent, computed, inject } from "vue"

    const handlerState = inject("handlerState")
    const currentlist = inject("currentlist")
    const state = reactive({
      opened: false,
      activeBone: null,
      activeOperators: [],
      activeFilter: [],
      addEnabled: false
    })

    function filterableField(bone) {
      if (!bone["indexed"]) return false
      if (!bone["visible"]) return false
      if (bone?.params?.filter === "no") return false
      if (!["bool", "numeric", "select", "str"].some((type) => bone["type"].startsWith(type))) return false //todo relational and date

      return true
    }

    function selectedBone(e) {
      state.activeBone = currentlist.structure[e.target.value]
      state.activeBone["key"] = e.target.value
    }

    function openFilterDrawer() {
      state.opened = true
    }

    function closed() {
      state.activeBone = null
      state.opened = !state.opened
    }

    function setBoolOperator(e) {
      state.activeOperators = [{ operator: "=", value: e.target.checked }]
      state.addEnabled = true
    }

    function setStrOperator(e) {
      if (!e.target.value) state.addEnabled = false
      state.activeOperators = [{ operator: "=", value: e.target.value }]
      state.addEnabled = true
    }

    function setNumericOperator(e) {
      if (!e.target.value) state.addEnabled = false
      state.activeOperators = [{ operator: "=", value: e.target.value }]
      state.addEnabled = true
    }
    function setSelectOperator(e) {
      if (!e.target.value) state.addEnabled = false
      state.activeOperators = [{ operator: "=", value: e.target.value }]
      state.addEnabled = true
    }

    function addToFilter() {
      state.activeFilter = state.activeFilter.filter((e) => e["key"] !== state.activeBone["key"])
      for (let i of state.activeOperators) {
        let filterEntry = {
          name: `${state.activeBone["descr"]} (${i["value"]})`,
          key: state.activeBone["key"],
          operator: i["operator"],
          value: i["value"],
          filterKey: i["operator"] === "=" ? `${state.activeBone["key"]}` : `${state.activeBone["key"]}${i["operator"]}`
        }
        state.activeFilter.push(filterEntry)
      }
      for (let i of state.activeFilter) {
        currentlist.state.params[i["filterKey"]] = i["value"]
      }
      currentlist.fetch()
    }

    function removeFromFilter(e) {
      let filter = state.activeFilter.filter((i) => !e.target.value.includes(i["key"]))
      if (e.target.value.length === 0) {
        //remove all
        for (const i of filter) {
          try {
            delete currentlist.state.params[i["filterKey"]]
          } catch (e) {}
        }
        state.activeFilter = []
        currentlist.fetch()
      } else {
        filter = filter[0]
        try {
          delete currentlist.state.params[filter["filterKey"]]
        } catch (e) {}
        state.activeFilter = state.activeFilter.filter((e) => e["key"] !== filter["key"])
        currentlist.fetch()
      }
    }

</script>

<style scoped>
h2 {
  margin: 20px 0 0 0;
}

.filter-dialog {
  &::part(panel) {
    min-height: 300px;
  }
}
</style>
