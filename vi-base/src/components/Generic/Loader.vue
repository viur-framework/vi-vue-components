<template>
    <transition>
        <div class="loading" v-if="active">
            <img src="/loading.svg" class="loader">
        </div>
    </transition>
</template>

<script>
import {reactive, computed} from 'vue'

// Surroundig div musst have position:relative
export default {
    props: {
        size: {
            type: String,
            default: "1em"
        },
        active: {
            type: Boolean,
            default: true
        }
    },
    setup(props,context){
        const state =reactive({
            spinnerSize:computed(()=>{
                return `${props.size}rem`
            }),
            shadowSize:computed(()=>{
                return `0px 0px ${props.size*3}rem ${props.size*3}rem var(--sl-color-neutral-200)`
            })
        })

        return {state}
    }
}
</script>

<style scoped lang="less">


.loader{
  height: 2.5em;
  width: 2.5em;
}

.loading {
    position: absolute;
    width: 100%;
    height: 100%;
    display: inline-grid;
    justify-items: center;
    align-items: center;
}
// transition styles see: https://vuejs.org/guide/built-ins/transition.html#the-transition-component
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

</style>
