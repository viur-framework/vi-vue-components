<template>
    <Wrapper_nested
      :value="value"
      :name="name"
      :index="index"
    >

    </Wrapper_nested>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted} from 'vue'
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
    components: { Wrapper_nested },
    emits:["change"],
    setup(props, context) {
        const state = reactive({})

        function changeEvent(event){
            context.emit("change",props.name,event.target.value,props.lang,props.index)
        }

        onMounted(()=>{
            context.emit("change",props.name,props.value,props.lang,props.index) //init
        })

        return {
            state,
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
