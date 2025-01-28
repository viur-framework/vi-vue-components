<template>
  <template
    v-if="menuState.search === '' || name.toLowerCase().includes(menuState.search.toLowerCase()) || state.slotitems > 0"
  >
    <router-link
      v-if="to"
      v-slot="{ route }"
      :to="to"
      custom
    >
      <div class="item">
        <sl-avatar
          shape="rounded"
          :initials="icon ? '' : state.initials"
          @click="openItem(route)"
        >
          <sl-icon
            v-if="icon && iconType === 'library'"
            slot="icon"
            :name="icon"
            :library="library"
            sprite
          ></sl-icon>
          <sl-icon
            v-if="icon && iconType === 'path'"
            slot="icon"
            :src="icon"
          ></sl-icon>
        </sl-avatar>

        <div
          class="name"
          @click="openItem(route)"
        >
          {{ name }}
        </div>

        <sl-icon
          v-if="closeable"
          sprite
          name="x-lg"
          class="icon-end"
          @click.stop="removeItem"
        >
        </sl-icon>

        <div
          v-if="state.slotitems"
          class="arrow"
          :class="{ 'is-open': state.open }"
          @click.stop="openGroup"
        >
          <sl-icon
            name="chevron-right"
            sprite
          >
          </sl-icon>
        </div>

        <div
          v-else
          class="space"
        ></div>

        <sl-dropdown class="dropdown">
          <sl-icon-button
            slot="trigger"
            name="three-dots"
          >
          </sl-icon-button>
          <sl-menu>
            <!--<sl-menu-item @click="toogleFavItem()">
              <sl-icon
                slot="prefix"
                name="heart"
                sprite
              ></sl-icon>
              Favorisieren
            </sl-menu-item>-->
            <sl-menu-item
              v-if="
                userStore.userAccess.includes('root') ||
                userStore.userAccess.includes(`${moduleInfo?.['module']}-manage`)
              "
              @click="openConfig()"
            >
              <sl-icon
                slot="prefix"
                name="pencil-fill"
                sprite
              ></sl-icon>
              Bearbeiten
            </sl-menu-item>
            <sl-menu-item @click="openInfo">
              <sl-icon
                slot="prefix"
                name="info-circle"
                sprite
              ></sl-icon>
              Module Info
            </sl-menu-item>
            <sl-menu-item @click="openItem(route, true)">
              <sl-icon
                slot="prefix"
                name="plus-lg"
                sprite
              ></sl-icon>
              Öffnen
            </sl-menu-item>
          </sl-menu>
        </sl-dropdown>
      </div>

      <div
        v-show="state.open"
        class="sublist"
      >
        <slot> </slot>
      </div>
    </router-link>
    <a
      v-else-if="href"
      :href="href"
    >
      <div
        class="item"
        @click.stop="openGroup"
      >
        <sl-avatar
          shape="rounded"
          :initials="icon ? '' : state.initials"
        >
          <sl-icon
            v-if="icon"
            slot="icon"
            :name="icon"
            :library="library"
            sprite
          ></sl-icon>
        </sl-avatar>

        <div class="name">
          {{ name }}
        </div>

        <div
          v-if="state.slotitems"
          class="arrow"
          :class="{ 'is-open': state.open }"
          @click.stop="openGroup"
        >
          <sl-icon
            name="chevron-right"
            sprite
          >
          </sl-icon>
        </div>
      </div>

      <div
        v-show="state.open"
        class="sublist"
      >
        <slot> </slot>
      </div>
    </a>
    <div
      v-else
      class="wrapper"
    >
      <div
        class="item"
        @click.stop="openGroup"
      >
        <sl-avatar
          shape="rounded"
          :initials="icon ? '' : state.initials"
        >
          <sl-icon
            v-if="icon"
            slot="icon"
            :name="icon"
            :library="library"
            sprite
          ></sl-icon>
        </sl-avatar>

        <div class="name">
          {{ name }}
        </div>

        <div
          v-if="state.slotitems"
          class="arrow"
          :class="{ 'is-open': state.open }"
          @click.stop="openGroup"
        >
          <sl-icon
            name="chevron-right"
            sprite
          >
          </sl-icon>
        </div>
      </div>

      <div
        v-show="state.open"
        class="sublist"
      >
        <slot> </slot>
      </div>
    </div>
  </template>
</template>

<script setup>
import { computed, reactive, onMounted, onUpdated, defineComponent, unref, inject, watch } from "vue"
import Utils from "../../utils"
import { useDBStore } from "../../stores/db"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { Request } from "@viur/vue-utils"

  const props = defineProps({
    to: {
      type: Object,
      default: undefined
    },
    href: {
      type: String,
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
    iconType: {
      type: String,
      default: "library"
    },
    layer: {
      type: Number,
      default: 0
    },
    closed: {
      type: Boolean,
      default: false
    },
    closeable: {
      type: Boolean,
      default: false
    },
    moduleInfo: {
      type: Object,
      default: undefined
    }
  })
  const slots = defineSlots()
    const dbStore = useDBStore()
    const router = useRouter()
    const userStore = useUserStore()
    const menuState = inject("menuState")
    const state = reactive({
      open: !props.closed,
      slotitems: 0,
      initials: computed(() => Utils.nameToInitials(props.name)),
      cssFontSize: computed(() => {
        let layer = props.layer
        if (props.layer > 2) {
          layer = 2
        }
        return (1 - layer * 0.1).toString() + "em"
      }),
      maxtabsReached: false,
      padding: computed(() => {
        let layer = props.layer
        return `calc(var(--sl-spacing-medium) * ${layer})`
      }),
      visible: true
    })

    function openGroup() {
      state.open = !state.open
    }

    function removeItem() {
      dbStore.removeOpened(props.to)
    }

    function openItem(route, force = false) {
      if (props.moduleInfo["display"] === "group" && !force) {
        openGroup()
        return
      }
      let new_route = router.resolve(unref(route))
      state.maxtabsReached = !dbStore.addOpened(
        new_route,
        props.moduleInfo["module"],
        route.query["view"],
        "",
        "",
        "",
        false,
        force
      )
    }

    function openConfig() {
      let new_route = router.resolve(unref(`/db/_moduleconf/edit/${props.moduleInfo["module"]}`))
      dbStore.addOpened(new_route, props.moduleInfo["module"], null, "", "", "", false)
    }

    function openInfo(){
      let new_route = router.resolve(unref(`/db/${props.moduleInfo["module"]}/info`))
      dbStore.addOpened(new_route, props.moduleInfo["module"], null, "", "", "", false)
    }

    function toogleFavItem() {
      let configObj = null
      if (userStore.state.user["adminconfig"]) {
        configObj = JSON.parse(userStore.state.user["adminconfig"])
      }
      if (configObj === null) {
        configObj = { favoriteModules: [] }
      }

      const index = configObj["favoriteModules"].indexOf(props.moduleInfo["module"])
      if (index > -1) {
        configObj["favoriteModules"].splice(index, 1)
      } else {
        configObj["favoriteModules"].push(props.moduleInfo["module"])
      }

      userStore.state.user["adminconfig"] = JSON.stringify(configObj)
      Request.securePost("/vi/user/edit", {
        dataObj: {
          key: userStore.state.user.key,
          admin_config: userStore.state.user["adminconfig"]
        }
      }).then((resp) => {
        console.log("Update Userconfig Succesfully")
      })
    }
    function handleMaxTabOpen(route) {
      state.maxtabsReached = false
      dbStore.state["handlers.opened.max.modules"][props.moduleInfo["module"]] += 1
      openItem(route)
    }
    onMounted(() => {
      state.slotitems = Utils.getSlotLength(slots.default)
    })

    onUpdated(() => {
      state.slotitems = Utils.getSlotLength(slots.default)
    })

    watch(
      () => menuState.search,
      (newVal, oldVal) => {
        if (newVal) {
          state.open = true
        } else {
          state.open = false
        }
      }
    )

</script>

<style scoped>
.router-link-exact-active {
  & .item {
    background-color: rgba(22, 155, 167, 0.3);
  }
}

.wrapper {
  width: 100%;
  font-size: v-bind("state.cssFontSize");
}

.item {
  cursor: pointer;
  user-select: none;
  border: 0;
  text-align: left;
  padding: 5px 0;
  align-items: center;
  align-self: stretch;
  min-height: 35px;
  min-width: 41px;
  justify-content: space-between;
  display: grid;
  grid-template-columns: 37px minmax(0, 1fr) auto auto;
  grid-template-rows: 1fr;
  justify-items: center;
  transition: all ease 0.3s;

  & sl-avatar {
    --size: 1.85em;

    &::part(icon) {
      padding: 25%;
    }

    &::part(base) {
      border: 1px solid var(--vi-border-color);
      background-color: transparent;
      color: var(--vi-border-color);
    }
  }

  &:hover {
    background-color: var(--sl-color-neutral-200);

    & .dropdown sl-icon-button {
      opacity: 1;
    }

    & .arrow {
      opacity: 1;
    }

    & sl-avatar {
      &::part(base) {
        border: 1px solid var(--vi-foreground-color);
        background-color: transparent;
        color: var(--vi-foreground-color);
      }
    }
  }

  & .icon-end {
    font-size: 0.75em;
    padding-right: 10px;
  }
}

.name {
  width: 100%;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  display: -webkit-box;
  color: var(--vi-foreground-color);
  margin-left: 13px;

  & a {
    color: var(--vi-foreground-color);
  }
}

sl-icon {
  font-size: 1.5em;
  transition: all ease 0.3s;
}

.arrow {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 var(--sl-spacing-small);
  font-size: 0.5em;
  opacity: 0.3;
  color: var(--vi-foreground-color);

  &.is-open sl-icon {
    transform: rotate(90deg);
  }
}

.icon-wrapper {
  width: 41px;
}

.dropdown {
  & sl-icon-button {
    transition: all ease 0.3s;
    opacity: 0.3;
    rotate: 90deg;
    color: var(--vi-foreground-color);

    &:hover {
      &::part(base) {
        color: var(--vi-foreground-color) !important;
      }
    }
  }

  & sl-menu {
    padding: 0;
  }

  & sl-menu-item {
    & sl-icon {
      font-size: 0.9em;
      margin-right: var(--sl-spacing-small);
      color: var(--vi-foreground-color);
    }

    &::part(base) {
      padding: var(--sl-spacing-x-small) var(--sl-spacing-medium);
      color: var(--vi-foreground-color);
      font-size: 0.9em;
    }

    &::part(checked-icon) {
      display: none;
    }

    & :deep(.menu-item__chevron) {
      display: none;
    }
  }
}

.sublist {
  & .item {
    padding-left: v-bind("state.padding");
  }
}
</style>
