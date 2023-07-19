<template>
  <div class="actionbar">
     <sl-button variant="danger"
                :disabled="boneState.isEmpty"
                 v-if="boneState.multiple && !readonly"
                 @click="removeMultipleEntries(index,lang)"
                :title='$t("bone.del")'
                 outline
                 class="delete-btn">
         <sl-icon name="x"></sl-icon>
      </sl-button>

      <sl-combobox :source="getList" hoist
      @sl-item-select="addMultipleEntry(lang, {'dest':state.skels?.[$event.detail.item.value],'rel':null})"></sl-combobox>
      <sl-button variant="success"
                 v-if="boneState.multiple && !readonly"
                 @click="openSelector(lang)"
                  :title='$t("bone.add")'
                 outline
                 class="add-btn">
        <sl-icon name="menu"></sl-icon> {{$t("bone.add")}}
      </sl-button>
  </div>

  <relational-selector
      :open="state.openedSelection"
      :name="boneState.bonestructure['descr']"
      :tab-id="handlerState.tabId"
      :handler="state.moduleInfo['handlerComponent']"
      :module="boneState?.bonestructure['module']"
      :rowselect="2"
      @close="relationCloseAction"
    >

    </relational-selector>

</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject, computed} from 'vue'
import { Request } from "@viur/vue-utils"
import relationalSelector from '../components/relationalSelector.vue'
import { useDBStore } from '../../stores/db'

export default defineComponent({
  props:{
      name:String,
      value:Object,
      index:Number,
      lang:String,
      readonly:Boolean,
      params:Object,
  },
  components: {relationalSelector},
  emits:["change","delete"],
  setup(props, context) {
      const boneState = inject("boneState")
      const handlerState = inject("handlerState")
      const addMultipleEntry = inject("addMultipleEntry")
      const removeMultipleEntries = inject("removeMultipleEntries")
      const formatString = inject("formatString")
      const dbStore = useDBStore()
      const state = reactive({
        skels:{},
        openedSelection:false,
        moduleInfo:computed(()=>dbStore.getConf(boneState?.bonestructure['module'])),
      })

      function getList(search:String){
        let params = ""
        if(boneState.bonestructure["type"]==="relational.tree.leaf.file"){
          params = "skelType=leaf&"
        }else if (boneState.bonestructure["type"]==="relational.tree.node.file"){
          params = "skelType=node&"
        }
        return Request.get(`/json/${boneState.bonestructure["module"]}/list?${params}limit=99`).then(async(resp)=>{ //?viurTags$lk=${search.toLowerCase()}
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
      function openSelector(lang){
        state.openedSelection=true
      }

      function relationCloseAction(selection){
        state.openedSelection=false
        if(selection){
          for(let entry of selection){
            addMultipleEntry(props.lang, {'dest':entry,'rel':null})
          }
        }
      }


      return {
          state,
          boneState,
          handlerState,
          addMultipleEntry,
          removeMultipleEntries,
          openSelector,
          getList,
          relationCloseAction
      }
  }
})
</script>

<style scoped>
.actionbar{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

sl-combobox{
  width:100%
}

.delete-btn{
  margin-right: var(--sl-spacing-x-small);

  &::part(base){
    aspect-ratio: 1;
  }
}

.add-btn{
  margin-left: var(--sl-spacing-x-small);

  & sl-icon{
    margin-right: var(--sl-spacing-x-small);
  }
}


</style>