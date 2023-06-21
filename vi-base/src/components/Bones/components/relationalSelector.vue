<template>
  <teleport v-if="open" :to="'#view_dialogs_'+tabId" :disabled="!open">
    <sl-dialog open
                :label="'Auswahl: '+name"
                class="relation-popup"
                @sl-after-hide="relationCloseAction()"
                style="--width:85%"
    >

    <component
        :is="handler"
        :module="module"
        @currentSelection="relationUpdateSelection($event)"
        :rowselect="rowselect"
      >

      </component>

      <div class="footer" slot="footer">
          <sl-button @click="relationCloseAction()" variant="danger" size="small" outline>{{ $t("relation.abort") }}</sl-button>
          <sl-button
                      @click="relationApplySelection(bone)"
                      variant="success"
                      size="small">
            {{ $t("relation.select") }}
          </sl-button>
      </div>
    </sl-dialog>
  </teleport>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject} from 'vue'
import { Request } from "@viur/viur-vue-utils"
import handlers from "../../DataHandler/handlers";

export default defineComponent({
  props:{
      open:Boolean,
      name:String,
      handler:Object,
      module:String,
      tabId:String,
      rowselect:{
        default:1
      }
  },
  components: {...handlers},
  emits:["close"],
  setup(props, context) {
      const state = reactive({
        selection:null
      })

      function relationCloseAction(){
        state.selection=null
        context.emit("close")
      }

      function relationApplySelection(){
        context.emit("close",state.selection)
      }

      function relationUpdateSelection(selection){
        if(props.rowselect===1){
          state.selection = selection[0]
        }else{
          state.selection = selection
        }

      }

      return {
          state,
          relationCloseAction,
          relationApplySelection,
          relationUpdateSelection
      }
  }
})
</script>

<style scoped lang="less">
.relation-popup{
  &::part(base) {
    position: absolute;
    height: 100%;
  }

  &::part(panel) {
    height: 100%;
    max-height: calc(100% - 100px);
    margin-bottom: 40px;
  }

  &::part(body){
    display: contents;
  }

  &::part(footer){
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }


  &:deep(.bar sl-button[variant="success"]){
    &::part(base){
      background-color: transparent;
      border: 1px solid @successColor;
      aspect-ratio: 1;
      padding: 0;
    }

    &::part(label){
      display: none;
    }

    &::part(prefix){
      color: @successColor;
    }
  }
}

</style>
