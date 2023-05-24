<template>
    <Wrapper_nested
      :value="value"
      :name="name"
      :index="index"
      :disabled="boneState.bonestructure['readonly']"
      @change="changeEvent"
    >

    </Wrapper_nested>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject} from 'vue'
import Wrapper_nested from '../wrapper_nested.vue'

export default defineComponent({
    props:{
        name:String,
        value:Object,
        index:Number,
        lang:String
    },
    components: { Wrapper_nested },
    emits:["change"],
    setup(props, context) {
        const boneState = inject("boneState")
        const state = reactive({
          value:{}
        })

        function changeEvent(data){
            state.value[data.name]=data.value
            context.emit("change",props.name,state.value,props.lang,props.index,true)
        }

        onMounted(()=>{
            context.emit("change",props.name,state.value,props.lang,props.index) //init
        })

        return {
            state,
            boneState,
            changeEvent
        }
    }
})
</script>

<style scoped lang="less">
    sl-input{
        width:100%;
    }
</style>
