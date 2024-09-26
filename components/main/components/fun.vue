<template>
  <sl-tooltip :content="state.fest.message">
    <div style="display:inline-block;" @mouseover="state.play=true" @mouseleave="state.play=false">
    <template v-if="state.fest">
      <sl-animation name="jello" easing="ease-in-out" :duration="2000"  :play="state.play" >
        <div style="display:inline-block;">
          <div style="" v-html="state.fest.svg">
          </div>
        </div>
      </sl-animation>
    </template>
      </div>
    </sl-tooltip>
</template>

<script setup>
  import { reactive, computed } from 'vue'
  const dates = [
    {
      "start":new Date(new Date().getFullYear(),9,31),
      "end":new Date(new Date().getFullYear(),9,31,23,59,59),
      "name":"Halloween",
      "message":"Happy Halloween!",
      "svg":'<svg  xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 1.999l.041 .002l.208 .003a8 8 0 0 1 7.747 7.747l.003 .248l.177 .006a3 3 0 0 1 2.819 2.819l.005 .176a3 3 0 0 1 -3 3l-.001 1.696l1.833 2.75a1 1 0 0 1 -.72 1.548l-.112 .006h-10c-3.445 .002 -6.327 -2.49 -6.901 -5.824l-.028 -.178l-.071 .001a3 3 0 0 1 -2.995 -2.824l-.005 -.175a3 3 0 0 1 3 -3l.004 -.25a8 8 0 0 1 7.996 -7.75zm0 10.001a2 2 0 0 0 -2 2a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1a2 2 0 0 0 -2 -2zm-1.99 -4l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993zm4 0l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993z" /></svg>'
    }
  ]

  const state = reactive({
    fest:computed(()=>{
      for(let d of dates){
        if(d.start <= new Date() && d.end >= new Date()){
          return d
        }
      }

      return null
    }),
    play:false
  })
</script>

<style scoped>
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 var(--sl-color-primary-500);
  }

  70% {
      box-shadow: transparent 0px 0px 0px 0.5rem;
  }

  100% {
      box-shadow: transparent 0px 0px 0px 0px;
  }
}
</style>
