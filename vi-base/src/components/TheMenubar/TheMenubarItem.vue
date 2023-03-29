<template>
  <router-link v-if="to" :to="to" custom v-slot="{route}">
    <div class="item">

      <sl-avatar shape="rounded" @click="openItem(route)"
                 :initials="icon?'':state.initials">
        <sl-icon slot="icon" v-if="icon" :name="icon" :library="library" sprite></sl-icon>
      </sl-avatar>

      <div class="name" @click="openItem(route)">
        {{ name }}
      </div>

      <sl-icon v-if="closeable"
               sprite
               name="x"
               class="icon-end"
               @click.stop="removeItem">
      </sl-icon>


      <div v-if="state.slotitems"
           class="arrow"
           @click.stop="openGroup"
            :class="{'is-open':state.open}">
          <sl-icon name="chevron-right" sprite>
          </sl-icon>
      </div>

      <div class="space" v-else></div>

      <sl-dropdown class="dropdown">
        <sl-icon-button slot="trigger" name="three-dots">

        </sl-icon-button>
        <sl-menu>
          <sl-menu-item @click="toogleFavItem()">
            <sl-icon slot="prefix" name="heart" sprite></sl-icon>
            Favorisieren
          </sl-menu-item>
          <sl-menu-item @click="openConfig()">
            <sl-icon slot="prefix" name="pencil" sprite></sl-icon>
            Berarbeiten
          </sl-menu-item>
        </sl-menu>
      </sl-dropdown>

    </div>

    <div v-show="state.open" class="sublist">
      <slot>
      </slot>
    </div>

    <teleport v-if="state.maxtabsReached" to="#dialogs" :disabled="!state.maxtabsReached">
      <sl-dialog open label="Max tabs">
        {{ $t("tab.amount_warning") }}
        <sl-button slot="footer" @click="openItem(route)">öffnen</sl-button>
      </sl-dialog>
    </teleport>

  </router-link>
  <a v-else-if="href" :href="href">
    <div class="item" @click.stop="openGroup">

      <sl-avatar shape="rounded"
                 :initials="icon?'':state.initials">
        <sl-icon slot="icon" v-if="icon" :name="icon" :library="library" sprite></sl-icon>
      </sl-avatar>

      <div class="name">
        {{ name }}
      </div>

      <div v-if="state.slotitems"
           class="arrow"
           @click.stop="openGroup"
            :class="{'is-open':state.open}">
          <sl-icon name="chevron-right" sprite>
          </sl-icon>
      </div>

    </div>

    <div v-show="state.open" class="sublist">
      <slot>
      </slot>
    </div>
  </a>
  <div class="wrapper" v-else>
    <div class="item" @click.stop="openGroup">

      <sl-avatar shape="rounded"
                 :initials="icon?'':state.initials">
        <sl-icon slot="icon" v-if="icon" :name="icon" :library="library" sprite></sl-icon>
      </sl-avatar>

      <div class="name">
        {{ name }}
      </div>

      <div v-if="state.slotitems"
           class="arrow"
           @click.stop="openGroup"
            :class="{'is-open':state.open}">
          <sl-icon name="chevron-right" sprite>
          </sl-icon>
      </div>


    </div>

    <div v-show="state.open" class="sublist">
      <slot>
      </slot>
    </div>
  </div>


</template>

<script lang="ts">
// @ts-nocheck
import {computed, reactive, onMounted, onUpdated, defineComponent, unref} from "vue";
import Utils from '../../utils';
import {useAppStore} from "../../stores/app";
import {useRoute, useRouter} from "vue-router";
import {useUserStore} from "../../stores/user";
import {Request} from "@viur/viur-vue-utils";

export default defineComponent({
  name: "TheMenubarItem",
  props: {

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
  },
  setup(props, context) {
    const appStore = useAppStore();
    const router = useRouter();
    const userStore = useUserStore();

    const state = reactive({
      open: !props.closed,
      slotitems: 0,
      initials: computed(() => Utils.nameToInitials(props.name)),
      cssFontSize: computed(() => {
        let layer = props.layer
        if (props.layer > 2) {
          layer = 2
        }
        return (1 - (layer * 0.1)).toString() + "em"
      }),
      maxtabsReached: false,
    });

    function getRoute() {
      return {...props.to, "query": {...props.to?.query, "_": new Date().getTime()}}
    }

    function openGroup() {
      state.open = !state.open;
    }

    function removeItem() {
      // @ts-ignore
      appStore.removeOpened(props.to)
    }

    function openItem(route) {
      route.query["_"] = new Date().getTime()
      let new_route = router.resolve(unref(route))

      state.maxtabsReached = !appStore.addOpened(new_route, route.params["module"], route.query["view"])
    }

    function openConfig(){
      let new_route = router.resolve(unref(`/_moduleconf/edit/${props.moduleInfo["module"]}`))
      appStore.addOpened(new_route, props.moduleInfo["module"])
    }

    function toogleFavItem() {
      let configObj = null
      if (userStore.state.user["adminconfig"]){
        configObj = JSON.parse(userStore.state.user["adminconfig"]);
      }
      if (configObj === null) {
        configObj = {"favoriteModules": []};
      }


      const index = configObj["favoriteModules"].indexOf(props.moduleInfo["module"]);
      if (index > -1) {
        configObj["favoriteModules"].splice(index, 1);
      } else {
        configObj["favoriteModules"].push(props.moduleInfo["module"]);
      }


      userStore.state.user["adminconfig"] = JSON.stringify(configObj);
      Request.securePost("/vi/user/edit", {
        dataObj: {
          "key": userStore.state.user.key,
          "admin_config": userStore.state.user["adminconfig"]
        }
      }).then((resp: object) => {
          console.log("Update Userconfig Succesfully")
        })


    }

    onMounted(() => {
      state.slotitems = Utils.getSlotLength(context.slots.default)
    })

    onUpdated(() => {
      state.slotitems = Utils.getSlotLength(context.slots.default)
    })




    return {
      state,
      openGroup,
      appStore,
      removeItem,
      openItem,
      getRoute,
      toogleFavItem,
      userStore,
      openConfig
    }
  }
})
</script>

<style scoped lang="less">

.router-link-exact-active {
  .item {
    background-color: rgba(22, 155, 167, .3);
  }
}

.wrapper {
  width: 100%;
  font-size: v-bind('state.cssFontSize');
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
  transition: all ease .3s;

  sl-avatar {
    --size: 1.85em;

    &::part(icon){
      padding: 25%;
    }

    &::part(base){
      border: 1px solid var(--sl-border-color);
      background-color: transparent;
      color: var(--sl-border-color);
    }
  }

  &:hover {
    background-color: var(--sl-hover-color);

    .dropdown sl-icon-button{
      opacity: 1;
    }

    .arrow{
      opacity: 1;
    }

    sl-avatar {
      &::part(base){
        border: 1px solid var(--sl-foreground-color);
        background-color: transparent;
        color: var(--sl-foreground-color);
      }
    }
  }

  .icon-end {
    font-size: .75em;
    padding-right: 10px;
  }
}

.name {
  width: 100%;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  display: -webkit-box;
  color: var(--sl-foreground-color);
  margin-left: 13px;

  a {
    color: var(--sl-foreground-color);
  }
}

sl-icon {
  font-size: 1.5em;
  transition: all ease .3s;
}

.arrow {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 var(--sl-spacing-small) ;
  font-size: .5em;
  opacity: .3;
  color: var(--sl-foreground-color);

  &.is-open sl-icon{
    transform: rotate(90deg);
  }
}

.icon-wrapper {
  width: 41px;
}


.dropdown{
  sl-icon-button{
    transition: all ease .3s;
    opacity: .3;
    rotate:90deg;
    color: var(--sl-foreground-color);

    &:hover{

      &::part(base){
        color: var(--sl-foreground-color) !important;
      }

    }
  }

  sl-menu{
    padding: 0;
  }

  sl-menu-item{
    sl-icon{
      font-size: .9em;
      margin-right: var(--sl-spacing-small);
      color: var(--sl-foreground-color);
    }

    &::part(base){
      padding: var(--sl-spacing-x-small) var(--sl-spacing-medium);
      color: var(--sl-foreground-color);
      font-size: .9em;
    }

    &::part(checked-icon){
      display: none;
    }

    :deep(.menu-item__chevron){
      display: none;
    }
  }
}

.sublist{
  .item {
    padding-left: var(--sl-spacing-medium);
  }
}

</style>
