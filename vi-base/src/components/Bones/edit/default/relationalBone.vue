<template>
    <div class="record">
      <sl-input :value="formatString(state.format,value)"></sl-input>

      <Wrapper_nested
        :value="value"
        :name="name"
        :index="index"
      >

      </Wrapper_nested>
    </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject, computed} from 'vue'
import { Request } from '@viur/viur-vue-utils'
import Wrapper_nested from '../wrapper_nested.vue'

export default defineComponent({
    props:{
        name:String,
        value:Object,
        index:Number,
        lang:String,
        readonly:Boolean,
        params:Object,
    },
    components: {Wrapper_nested},
    emits:["change"],
    setup(props, context) {
        const boneState = inject("boneState")
        const formatString = inject("formatString")
        const state = reactive({
          format:computed(()=>{
            return boneState?.bonestructure['format']
          })

        })

        function changeEvent(event){
            context.emit("change",props.name,event.target.value,props.lang,props.index)
        }

        onMounted(()=>{
            context.emit("change",props.name,props.value,props.lang,props.index) //init
        })

        return {
            state,
            boneState,
            formatString,
            changeEvent
        }
    }
})
</script>

<style scoped lang="less">
    sl-input{
        width:100%;
    }
    .record{
      width: 100%;
    }
</style>
