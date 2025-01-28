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
      :title="title ? title : name"
    >
      <sl-avatar label="Rounded avatar">
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
import { useRouter } from "vue-router"

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
    const router = useRouter()
    const state = reactive({
      icon: true,
      modeIcon: computed(() => {
        if (props.mode === "add") return "plus-lg"
        if (props.mode === "edit") return "pencil-fill"
        if (props.mode === "clone") return "copy"
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
    }
</script>

<style scoped>
sl-tab {
  &::part(base) {
    display: flex;
    padding: 5px 12px;
  }

  &::part(close-button) {
    opacity: 0.5;
    font-size: 0.9em;
    margin: 0 -6px 0 5px;
    transition: all ease 0.3s;
    color: var(--vi-foreground-color);
  }

  & .link-wrap {
    color: var(--vi-foreground-color);
    opacity: 0.5;
  }

  & sl-avatar {
    &::part(base) {
      background-color: var(--vi-foreground-color);
    }
  }

  &:hover {
    &::part(close-button) {
      opacity: 1;
    }

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

    & .link-wrap {
      color: var(--vi-foreground-color);
      opacity: 1;
    }

    & sl-avatar {
      &::part(base) {
        background-color: var(--vi-foreground-color);
      }
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
