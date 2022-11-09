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

            <sl-icon v-if="state.slotitems"
                     sprite
                     name="chevron-left"
                     class="arrow"
                     @click.stop="openGroup"
                     :class="{'is-open':state.open}">
            </sl-icon>

        </div>

        <div v-show="state.open" class="list">
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

            <sl-icon v-if="state.slotitems"
                     name="chevron-left"
                     class="arrow"
                     @click.stop="openGroup"
                     :class="{'is-open':state.open}" sprite>
            </sl-icon>

        </div>

        <div v-show="state.open" class="list">
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

            <sl-icon v-if="state.slotitems"
                     name="chevron-left"
                     class="arrow"
                     @click.stop="openGroup"
                     :class="{'is-open':state.open}" sprite>
            </sl-icon>

        </div>

        <div v-show="state.open" class="list">
            <slot>
            </slot>
        </div>
    </div>



</template>

<script lang="ts">
import {computed, reactive, onMounted, onUpdated, defineComponent, unref} from "vue";
import Utils from '../../utils';
import {useAppStore} from "../../stores/app";
import {useRoute, useRouter } from "vue-router";

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
        }
    },
    setup(props, context) {
        const appStore = useAppStore()
        const router = useRouter()

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
          maxtabsReached:false
        });

        function getRoute(){
          return {...props.to, "query":{...props.to?.query, "_":new Date().getTime()}}
        }

        function openGroup() {
            state.open = !state.open;
        }

        function removeItem() {
            // @ts-ignore
            router.push({"name": "home"}).then(()=>{
                appStore.removeOpened(props.to)
            })
        }

        function openItem(route){
          route.query["_"]=new Date().getTime()
          let new_route = router.resolve(unref(route))

          state.maxtabsReached = !appStore.addOpened(new_route, route.params["module"], route.query["view"])
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
            getRoute
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
    padding: 3px 3.75px;
    align-items: center;
    align-self: stretch;
    min-height: 35px;
    min-width: 41px;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid var(--sl-color-neutral-300);
    display: grid;
    grid-template-columns: 41px 1fr auto;
    grid-template-rows: 1fr;
    grid-column-gap: 10px 0;
    justify-items: center;
    transition: all ease .3s;

    &:hover {
        background-color: #fff;

        .name {
            color: var(--sl-color-primary-500);
        }
    }

    .icon-end{
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
    color: @textColor;

    a {
        color: @textColor;
    }
}

sl-icon {
    font-size: 1.5em;

    &.arrow {
        &.is-open {
            transform: rotate(-90deg);
        }
    }
}

sl-avatar {
    --size: 2.2em;
}

.icon-wrapper {
    width: 41px;
}

sl-avatar::part(base) {
    background-color: var(--sl-color-primary-500)
}

</style>
