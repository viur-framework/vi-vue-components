<template>
  <sl-card>
    <table>
      <thead>
        <th v-if="entry.data.select && entry.data.multiple">
          <sl-checkbox
            :disabled="state.dataSent"
            :checked="state.all_selected"
            @sl-change="toggleSelectAll"
          ></sl-checkbox>
        </th>
        <th v-if="entry.data.select && !entry.data.multiple"></th>
        <th
          v-for="(h, index) in entry.data.header"
          :key="index"
        >
          {{ h }}
        </th>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in state.rowdata"
          :key="index"
        >
          <td v-if="entry.data.select">
            <sl-checkbox
              :disabled="state.dataSent"
              :checked="row.selected"
              @sl-input="toggleSelectOne(row)"
            ></sl-checkbox>
          </td>
          <td
            v-for="(cell, index) in row.row"
            :key="index"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
    <sl-button
      v-if="entry.data.select"
      :disabled="state.dataSent || (!entry.data.multiple && !state.atLeastOneSelected)"
      @click="sendButtonClick"
    >
      send
    </sl-button>
  </sl-card>
</template>

<script setup>
import { reactive, onMounted } from "vue"
import { useScriptorStore } from "../../store/scriptor"

const scriptorStore = useScriptorStore()

const props = defineProps({
  entry: {
    type: Object
  }
})

async function sendButtonClick() {
  state.dataSent = true
  let selected = []
  let index = -1
  for (const irow of state.rowdata) {
    index++
    if (irow.selected) {
      selected.push(index)
    }
  }
  await scriptorStore.sendResult("tableResult", selected)
}

function toggleSelectAll() {
  state.all_selected = !state.all_selected
  for (const row of state.rowdata) {
    row.selected = state.all_selected
  }
  state.atLeastOneSelected = state.all_selected
}

function toggleSelectOne(row) {
  if (props.entry.data.multiple) {
    row.selected = !row.selected
    let all_selected = true
    let any_selected = false
    for (const irow of state.rowdata) {
      if (irow.selected) {
        any_selected = true
      } else {
        all_selected = false
      }
    }
    state.all_selected = all_selected
    state.atLeastOneSelected = any_selected
  } else {
    let newrowval = !row.selected
    if (newrowval) {
      for (const irow of state.rowdata) {
        irow.selected = false
      }
    }
    row.selected = newrowval
    state.atLeastOneSelected = newrowval
  }
}

onMounted(() => {
  let rd = []
  for (const row of props.entry.data.rows) {
    let nrd = { row: row, selected: false }
    rd.push(nrd)
  }
  state.rowdata = rd
})

const state = reactive({
  rowdata: [],
  all_selected: false,
  dataSent: false,
  atLeastOneSelected: false
})
</script>

<style scoped>
.wrap {
  max-height: 200px; /* Set the maximum height of the wrapper */
  max-width: 100%;
  overflow-y: auto; /* Add a vertical scrollbar when the content overflows */
}

.interaction-img {
  margin: -10px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(100% + 20px);
  height: 200px;
  margin-bottom: 20px;
  background-color: var(--sl-color-neutral-100);

  img {
    object-fit: contain;
    height: 100%;
  }
}

.container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

sl-table-wrapper {
  overflow-y: auto;
  max-height: auto;
}
sl-table {
  overflow-y: auto;
}
table {
  overflow-y: auto;
  max-height: auto;
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  text-align: left;
  padding: 8px;
  border: 1px solid #ddd;
}

th {
  background-color: #f2f2f2;
}

tr:nth-child(even) {
  background-color: #f2f2f2;
}

tr:hover {
  background-color: #ddd;
}

tbody {
  max-height: 200px; /* Setze die maximale Höhe für den Body-Container */
  overflow-y: auto; /* Füge eine Scrollbar hinzu */
}

.sl-checkbox {
  margin: 0;
}
</style>
