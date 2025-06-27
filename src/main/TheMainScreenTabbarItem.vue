<template>
  <sl-tab
    slot="nav"
    :key="to"
    :closable="closeable"
    :data-id="position"
    :active="active"
    @sl-close="onTabClose"
    @auxclick="clickEvent"
    @click="forceUpdate"
  >
    <router-link
      class="link-wrap"
      :to="to"
      :title="state.title"
    >
      <sl-avatar label="Rounded avatar" :initials="state.modeIcon||icon ? '' : name[0]">
        <sl-icon
          v-if="mode !== 'view'"
          slot="icon"
          class="mode-icon"
          :name="state.modeIcon"

          sprite
        ></sl-icon>
        <sl-icon
          v-else-if="state.icon"
          slot="icon"
          :library="library"
          :name="icon"
          sprite
          @sl-error="onIconError"
        ></sl-icon>
      </sl-avatar>
      <span class="name"><slot></slot></span>
    </router-link>
  </sl-tab>
</template>

<script setup>
import { reactive, defineComponent, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useAppStore } from "../stores/app"
import Utils from "../utils.js"
import { useRouter } from "vue-router"
import {useTitle} from '@vueuse/core'

  const props = defineProps({
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
    position: {
      type: Number,
      required: true
    },
    mode: {
      type: String,
      default: "view"
    },
    active: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ""
    }
  })
    const dbStore = useDBStore()
    const appStore = useAppStore()
    const router = useRouter()
    const state = reactive({
      icon: true,
      modeIcon: computed(() => {
        if (props.mode === "add") return "plus-lg"
        if (props.mode === "edit") return "pencil-fill"
        if (props.mode === "clone") return "copy"
        return false
      }),
      title:computed(()=>{
        let title = ""
        if (props.to?.params?.module){
          title = props.to.params.module + ": "
        }

        title += props.title ? props.title : props.name

        return title
      })
    })
    function onIconError() {
      state.icon = false
    }

    function onTabClose() {
      // @ts-ignore
      dbStore.removeOpened(props.to)
    }
    //close tab with middel mouse click.
    function clickEvent(e) {
      e.preventDefault()
      onTabClose()
      return false
    }
    function forceUpdate() {
      dbStore.state["handlers.active"] = props.position
      const appStore = useAppStore()
      const title = useTitle()
      title.value = appStore.state["title"]+" | "+ Utils.unescape(props.name)
    }
</script>

<style scoped>
sl-tab {
  position: relative;
  box-shadow: inset 0px -10px 10px -10px rgba(0, 0, 0, .2);

  &:before{
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 10px;
    width: 1px;
    border-left: 1px solid var(--sl-color-neutral-400);
  }

  &::part(base) {
    display: flex;
    padding: var(--sl-spacing-x-small) var(--sl-spacing-medium);
    height: 45px;
  }

  &::part(close-button) {
    display: none;
    font-size: 0.9em;
    margin: 0 -3px 0 10px;
    transition: all ease 0.3s;
    color: var(--vi-foreground-color);
  }

  & .link-wrap {
    color: var(--vi-foreground-color);
    opacity: 0.5;
  }

  & sl-avatar {
    font-size: 1.2em;

    &::part(base) {
      background-color: var(--vi-foreground-color);
    }

  }

  &:hover {
    & .link-wrap {
      color: var(--vi-foreground-color);
      opacity: 0.9;
    }

    & sl-avatar {
      &::part(base) {
        background-color: var(--vi-foreground-color);
      }
    }
  }

  &[aria-selected="true"] {
    background-color: var(--vi-background-color);
    box-shadow: none;

    &:before{
      display: none;
    }

    & + sl-tab{
      &:before{
        display: none;
      }
    }

    &::part(close-button) {
      display: flex;
    }

    & .link-wrap {
      color: var(--vi-foreground-color);
      opacity: 1;
    }

    & sl-avatar {
      &::part(base) {
        background-color: var(--sl-color-primary-500);
      }

      sl-icon{
        @supports (color: oklch(from red l c h)) {
          --l: clamp(0, (l / 0.623 - 1) * -infinity, 1);
          color: oklch(from var(--sl-color-primary-500) var(--l) 0 h);
          text-shadow: none;
        }

        @supports (color: contrast-color(red)) {
          color: contrast-color(var(--sl-color-primary-500));
          text-shadow: none;
        }
      }
    }
  }


  &:first-child{
    &:before{
      display: none;
    }

    sl-avatar{
      margin-right: 0;
    }

    .name{
      display: none;
    }
  }
}

.link-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  color: var(--sl-color-neutral-900);
  max-width: 200px;
}

.name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

sl-avatar {
  --size: 1.6em;
  margin-right: var(--sl-spacing-x-small);
  border-radius: 2px;
  align-self: center;

  & sl-icon {
    font-size: 0.8em;
  }

  &::part(icon) {
    color: var(--vi-background-color);
  }

  &::part(base) {
    transition: all ease 0.3s;
    margin-top: -2px;
    border-radius: 3px;
    background-color: var(--sl-color-neutral-900);
  }
}
</style>
