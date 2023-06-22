<template>
    <sl-input :disabled="state.disabled" placeholder="Suche" clearable @sl-input="search_input" @sl-clear="reset_filter">
      <sl-icon name="search" slot="suffix"></sl-icon>
    </sl-input>
</template>

<script lang="ts">

import {reactive, defineComponent, inject, computed} from 'vue'

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const currentlist: any = inject("currentlist")
        const state = reactive({
          disabled:computed(()=>{
            let searchableBone=false
            for(const [k,v] of Object.entries(currentlist.structure)){
              console.log(v)
              if(Object.keys(v).includes("searchable") && v["searchable"]){
                searchableBone=true
              }
            }

            return false //till core update
            return !searchableBone
          })
        })

        function search_input(event){
          currentlist.filter({"search":event.target.value}).then(()=>{

          })
        }
        function reset_filter(){
          currentlist.filter({})
        }

        return {
            state,
            search_input,
            reset_filter
        }
    }
})
</script>

<style scoped lang="less">

</style>
