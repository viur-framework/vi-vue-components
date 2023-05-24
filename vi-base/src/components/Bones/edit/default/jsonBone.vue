<template>
    <div class="box">
      <vue-json-pretty :deep="0" :data="value" @selectedChange="changeEvent"></vue-json-pretty>
    </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject} from 'vue'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

export default defineComponent({
    props:{
        name:String,
        value:Object,
        index:Number,
        lang:String,
        readonly:Boolean,
        params:Object,
    },
    components: {VueJsonPretty},
    emits:["change"],
    setup(props, context) {
        const boneState = inject("boneState")
        const state = reactive({})

        function changeEvent(newVal, oldVal){
            context.emit("change",props.name,newVal,props.lang,props.index)
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
    .box{
      width:100%;
      border: 1px solid var(--sl-color-gray-500);
      border-radius: 5px;
      min-height: 40px;
    }
</style>
