<template>
    <sl-input :disabled="state.disabled" placeholder="Suche" clearable @sl-input="search_input" @sl-clear="reset_filter">

      <sl-icon v-if="state.searchType==='database'" name="database" slot="suffix" :title="$t('search.database')"></sl-icon>
      <sl-icon v-else-if="state.searchType==='local'" name="list-ul" slot="suffix" :title="$t('search.local')"></sl-icon>
      <sl-icon v-else name="search" slot="suffix"></sl-icon>
    </sl-input>
</template>

<script lang="ts">

import {reactive, defineComponent, inject, computed} from 'vue'

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const currentlist: any = inject("currentlist")
        const handlerState: any = inject("handlerState")
        const tableReload: any = inject("reloadAction")
        const state = reactive({
          disabled:computed(()=>{
            return false
            let searchableBone=false
            for(const [k,v] of Object.entries(currentlist?.structure)){
              if(Object.keys(v).includes("searchable") && v["searchable"]){
                searchableBone=true
              }
            }

            return false //till core update
            return !searchableBone
          }),
          searchType:computed(()=>{
            return currentlist.state.state===2?'local':'database'
          })
        })

        function search_input(event){
          if (event.target.value===""){
            reset_filter()
          }


          if (state.searchType==='local'){
            handlerState.filter = event.target.value
            try{
              delete currentlist.filter['search']
            }catch(e){}

          }else {
            currentlist.filter({"search": event.target.value}).then(() => {
            })
          }
        }
        function reset_filter(){
          try{
              delete currentlist.filter['search']
            }catch(e){}
          handlerState.filter=null
        }

        return {
            state,
            search_input,
            reset_filter,
            handlerState
        }
    }
})
</script>

<style scoped>

</style>
