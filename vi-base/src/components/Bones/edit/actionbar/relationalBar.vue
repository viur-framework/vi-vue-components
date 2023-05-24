<template>
  <div class="actionbar">
      <sl-combobox :source="getList" hoist
      @sl-item-select="addMultipleEntry(lang, {'dest':state.skels?.[$event.detail.item.value],'rel':null})"></sl-combobox>
      <sl-button variant="success" v-if="boneState.multiple && !readonly" @click="addMultipleEntry(lang)">
        {{$t("bone.list")}}
      </sl-button>
      <sl-button variant="danger" v-if="boneState.multiple && !readonly" @click="openSelector()">
        {{$t("bone.delete")}}
      </sl-button>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject} from 'vue'
import { Request } from '@viur/viur-vue-utils'

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
      const addMultipleEntry = inject("addMultipleEntry")
      const formatString = inject("formatString")
      const removeMultipleEntries = null
      const state = reactive({
        skels:{}
      })

      function getList(search:String){
        return Request.get(`/json/${boneState.bonestructure["module"]}/list?limit=99`).then(async(resp)=>{ //?viurTags$lk=${search.toLowerCase()}
          const data = await resp.json()
          state.skels = data["skellist"].reduce((acc,curr)=> (acc[curr["key"]]=curr,acc),{});

          return data["skellist"]?.map((d:any)=>{
            return {text: formatString(boneState.bonestructure["format"], {dest:d}),
                  value:d.key,
                  data:d
          }
          })
        })
      }

      function openSelector(){

      }


      return {
          state,
          boneState,
          addMultipleEntry,
          removeMultipleEntries,
          getList
      }
  }
})
</script>

<style scoped lang="less">
.actionbar{
  display: flex;

}
sl-combobox{
  width:100%
}
</style>
