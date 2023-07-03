<template>
    <picture v-if="srcset">
        <source type="image/webp" :srcset="srcset"/>

        <img class="image"
             draggable="false"
             :title="alt?alt:null"
             :alt="alt?alt:null"
             :src="state.image"
             @error="onError"
        />
    </picture>

    <img v-else
         draggable="false"
         :title="alt?alt:null"
         :alt="alt?alt:null"
         :src="state.image"
         @load="updateLoading(false)"
         class="image has-preview"
         @click="state.opened=!state.opened"
         @error="onError"
    />


    <sl-dialog v-if="popup"
               label="Preview"
               :open="state.opened">
        <img
         draggable="false"
         :title="alt?alt:null"
         :alt="alt?alt:null"
         :src="state.image"
         @load="updateLoading(false)"

    />
      <div class="" slot="header-actions">
        <sl-button :download="alt+'.jpg'"
                   :href="src" variant="primary"
                   target="_blank"
                   class="download-btn"
                   size="small"
        >Download</sl-button>
      </div>

    </sl-dialog>

</template>

<script>
/**
 * Image wrapper mit fallback
 * **/

import {reactive, inject,computed} from 'vue'

export default {
    components: {},
    props: {
        src: {
            type: String
        },
        alt: {
            type: String
        },
        srcset: {
            default: null
        },
        fallback: {
            type: String,
            default: 'logo.svg'
        },
        popup:{
            type:Boolean,
            default:false
        }
    },

    setup(props, context) {
        const state = reactive({
            loading: true,
            background:computed(()=>{
                /*if(Object.keys(global.state).includes("fallback_image")){
                    return `url(${global.state.fallback_image})`
                }*/
                return ""
            }),
            opened:false,
            image: computed(()=>props.src?props.src:props.fallback)
        })

        function updateLoading(loading) {
            state.loading = loading
        }

        function onError(e){
          state.image = props.fallback
        }

        return {updateLoading, state, onError}
    }
}
</script>

<style scoped lang="less">

img.is-loading {
    filter: blur(4px);
}

.image {
    width: 100%;
    height: 100%;
    background-image: /* tint image */
                    linear-gradient(to right, rgba(255, 255, 255, 0.87), rgba(255, 255, 255, 0.87)),
                    /* checkered effect */
                    linear-gradient(to right, black 50%, white 50%),
                    linear-gradient(to bottom, black 50%, white 50%);
    background-blend-mode: normal, difference, normal;
    background-size: .65em .65em;

  &.has-preview{
    cursor: pointer;
  }
}


.image:hover{
  object-fit: cover;
}

sl-dialog::part(panel){
  width:100%;
}


sl-dialog{
  &::part(panel){
    width: auto;
    max-width: 1200px;
  }

  &::part(body){
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: /* tint image */
                  linear-gradient(to right, rgba(255, 255, 255, 0.87), rgba(255, 255, 255, 0.87)),
                  /* checkered effect */
                  linear-gradient(to right, black 50%, white 50%),
                  linear-gradient(to bottom, black 50%, white 50%);
    background-blend-mode: normal, difference, normal;
    background-size: 1.2em 1.2em;
    padding: 0;
    position: relative;
  }

  &::part(header-actions){
    display: flex;
    flex-direction: row;
    align-items: center;

  }

  img{
    width: auto;
    height: auto;
  }
}

.download-btn{
  margin-right: var(--sl-spacing-x-small);
}
</style>
