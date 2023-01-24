<template>
    <sl-tab slot="nav"
            :closable="closeable"
            :key="to"
            @sl-close="onTabClose"
            :data-id="position"
    >
        <router-link class="link-wrap" :to="to">
            <sl-icon v-if="state.icon"
                     @sl-error="onIconError"
                     :library="library"
                     :name="icon"
                     sprite></sl-icon>
            <slot></slot>
            <sl-icon class="mode-icon" v-if="mode!=='view'"
                     :name="state.modeIcon"
                     sprite></sl-icon>

        </router-link>
    </sl-tab>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent} from 'vue'
import {useAppStore} from "../stores/app";
import {useRouter} from "vue-router";

export default defineComponent({
    props: {
        to: {
            type: Object,
            required: true,
            default: undefined
        },
        name: {
            type: String,
            default: undefined
        },
        icon: {
            type: String,
            default: undefined
        },
        library: {
            type: String,
            default: "default"
        },
        closeable: {
            type: Boolean,
            default: true
        },
        position:{
          type:Number,
          required: true,
        },
        mode:{
          type:String,
          default:"view"
        }
    },
    components: {},
    setup(props, context) {
        const appStore = useAppStore()
        const router = useRouter()
        const state = reactive({
            icon:true,
            modeIcon:computed(()=>{
              if (props.mode ==="add") return "plus"
              if (props.mode ==="edit") return "pencil"
              if (props.mode ==="clone") return "clone"
            })
        })
        function onIconError(){
            state.icon=false
        }

        function onTabClose(){
            // @ts-ignore
            appStore.removeOpened(props.to)
        }

        return {
            state,
            onIconError,
            onTabClose
        }
    }
})
</script>

<style scoped lang="less">

sl-tab{
  &::part(base){
    display: flex;
    padding: 5px 12px;
  }

  &::part(close-button){
    opacity: .5;
    font-size: 1.2em;
    margin: 0 -6px 0 5px;
    transition: all ease .3s;
  }

  &:hover{
    &::part(close-button){
      opacity: 1;
    }

    .link-wrap{
      color: var(--sl-color-primary-500);
    }
  }

  &[aria-selected="true"]{
    background-color: #fff;

    .link-wrap{
      color: var(--sl-color-primary-500);
    }
  }
}

.link-wrap{
  display: flex;
  flex-direction: row;
  align-items: center;
  color: @textColor;
}

sl-icon{
  font-size: .8em;
  margin-right: 10px;
}

.mode-icon{
    font-size: .7em;
    margin-right: 0px;
    margin-left: 3px;
    margin-bottom: 5px;
  }
</style>
