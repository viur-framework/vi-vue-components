<template>
  <div class="actionbar">
      <sl-button variant="success" v-if="boneState.multiple && !readonly" @click="addMultipleEntry(lang)">
        {{$t("bone.add")}}
      </sl-button>
      <sl-button variant="danger" v-if="boneState.multiple && !readonly" @click="removeMultipleEntries(null)">
        {{$t("bone.delete")}}
      </sl-button>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject} from 'vue'

export default defineComponent({
  props:{
      name:String,
      value:Object,
      index:Number,
      lang:String,
      readonly:Boolean,
      params:Object,
  },
  components: {},
  emits:["change"],
  setup(props, context) {
      const boneState = inject("boneState")
      const state = reactive({})
      const addMultipleEntry = inject("addMultipleEntry")
      const removeMultipleEntries = null
      return {
          state,
          boneState,
          addMultipleEntry,
          removeMultipleEntries
      }
  }
})
</script>

<style scoped>
</style>
