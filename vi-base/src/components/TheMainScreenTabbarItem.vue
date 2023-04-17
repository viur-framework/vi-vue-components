<template>
    <sl-tab slot="nav"
            :closable="closeable"
            :key="to"
            @sl-close="onTabClose"
            :data-id="position"
    >
        <router-link class="link-wrap" :to="to" :title="name">
          <sl-avatar label="Rounded avatar">
            <sl-icon class="mode-icon" v-if="mode!=='view'"
                     :name="state.modeIcon"
                     slot="icon"
                     sprite></sl-icon>
            <sl-icon v-else-if="state.icon"
                     @sl-error="onIconError"
                     :library="library"
                     :name="icon"
                     slot="icon"
                     sprite></sl-icon>
          </sl-avatar>
            <span class="name"><slot></slot></span>
        </router-link>
    </sl-tab>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent, computed} from 'vue'
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
    font-size: .9em;
    margin: 0 -6px 0 5px;
    transition: all ease .3s;
    color: var(--vi-foreground-color);
  }

  .link-wrap{
      color: var(--vi-foreground-color);
      opacity: .5;
    }

  sl-avatar {
    &::part(base) {
      background-color: var(--vi-foreground-color);
    }
  }

  &:hover{
    &::part(close-button){
      opacity: 1;
    }

    .link-wrap{
      color: var(--vi-foreground-color);;
      opacity: .9;
    }

    sl-avatar {
      &::part(base) {
        background-color: var(--vi-foreground-color);;
      }

    }
  }

  &[aria-selected="true"]{
    background-color: var(--vi-background-color);

    .link-wrap{
      color: var(--vi-foreground-color);
      opacity: 1;
    }

    sl-avatar{
      &::part(base){
        background-color: var(--vi-foreground-color);
      }
    }
  }

}

.link-wrap{
  display: flex;
  flex-direction: row;
  align-items: center;
  color: @textColor;
  max-width: 200px;
}

.name{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

sl-avatar{
  --size: 1.6em;
  margin-right: var(--sl-spacing-x-small);
  border-radius: 2px;
  align-self: center;

  sl-icon{
    font-size: .8em;
  }

  &::part(icon){
    color: var(--vi-background-color);
  }

  &::part(base){
    transition: all ease .3s;
    margin-top: -2px;
    border-radius: 3px;
    background-color: var(--sl-color-neutral-900);
  }
}
</style>
