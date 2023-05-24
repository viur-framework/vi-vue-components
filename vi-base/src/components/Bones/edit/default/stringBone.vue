<template>
    <sl-input :disabled="boneState.readonly" :value="value" @sl-change="changeEvent"></sl-input>
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
    },
    components: {},
    emits:["change"],
    setup(props, context) {
      const boneState = inject("boneState")
        const state = reactive({})

        function changeEvent(event){
            context.emit("change",props.name,event.target.value,props.lang,props.index)
        }

        onMounted(()=>{
            context.emit("change",props.name,props.value,props.lang,props.index) //init
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
