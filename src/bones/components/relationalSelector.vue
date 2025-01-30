<template>
  <teleport
    v-if="open"
    :to="'#view_dialogs_' + tabId"
    :disabled="!open"
  >
    <sl-dialog
      open
      :label="'Auswahl: ' + name"
      class="relation-popup"
      style="--width: 85%"
      @sl-after-hide="relationCloseAction()"
    >
      <component
        :is="currentHandler(handler)"
        :module="module"
        :rowselect="rowselect"
        :selector="true"
        :filter="filter"
        @currentSelection="relationUpdateSelection($event)"
        @closeSelector="relationApplySelection()"
      >
      </component>

      <div
        slot="footer"
        class="footer"
      >
        <sl-button
          variant="danger"
          size="small"
          outline
          @click="relationCloseAction()"
          >{{ $t("relation.abort") }}</sl-button
        >
        <sl-button
          variant="success"
          size="small"
          @click="relationApplySelection()"
        >
          {{ $t("relation.select") }}
        </sl-button>
      </div>
    </sl-dialog>
  </teleport>
</template>

<script setup>

import { reactive, defineComponent, onMounted, inject } from "vue"
import { Request } from "@viur/vue-utils"
import handlers from "../../handler/handlers"

function currentHandler(name){
  return handlers?.[name]?handlers[name]:name
}

const props = defineProps({
    open: Boolean,
    name: String,
    handler: [Object, String],
    module: String,
    tabId: String,
    filter:Object,
    rowselect: {
      default: 1
    }
  })

  const emit = defineEmits(["close"])

    const state = reactive({
      selection: null
    })

    function relationCloseAction() {
      state.selection = null
      emit("close")
    }

    function relationApplySelection() {
      emit("close", state.selection)
    }

    function relationUpdateSelection(selection) {
      if (props.rowselect === 1) {
        state.selection = selection?.[0]
      } else {
        state.selection = selection
      }
    }
</script>

<style scoped>
.relation-popup {
  &::part(base) {
    position: absolute;
    height: 100%;
  }

  &::part(panel) {
    height: 100%;
    max-height: calc(100% - 100px);
    margin-bottom: 40px;
  }

  &::part(body) {
    display: contents;
  }

  &::part(footer) {
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }

  &:deep(.bar sl-button[variant="success"]) {
    &::part(base) {
      background-color: transparent;
      border: 1px solid var(--sl-color-success-500);
      aspect-ratio: 1;
      padding: 0;
    }

    &::part(label) {
      display: none;
    }

    &::part(prefix) {
      color: var(--sl-color-success-500);
    }
  }
}

.footer {
  display: flex;
  justify-content: space-between;
}
</style>
