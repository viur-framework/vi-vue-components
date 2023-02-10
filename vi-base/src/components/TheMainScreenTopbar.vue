<template>
    <header>
        <router-link to="/" class="head">
            <div class="logo">
                <sl-icon src="logo-cube.svg"></sl-icon>
            </div>
            <h1 class="main-headline">
                {{ appStore.state["vi.name"] }}
            </h1>
        </router-link>

        <div id="main-group">
            <sl-button-group>
                <component v-for="action in appStore.state['topbar.actions']" :is="action">

                </component>
            </sl-button-group>

        </div>
    </header>
</template>

<script lang="ts">
import {useUserStore} from "../stores/user";
import {useAppStore} from "../stores/app";
import {defineComponent} from "vue";

export default defineComponent({
    setup(props, context) {
        const userStore = useUserStore()
        const appStore = useAppStore()

        return {
            userStore,
            appStore
        }
    }
})
</script>

<style scoped lang="less">
header {
    height: 60px;
    border-bottom: 2px solid var(--sl-color-primary-500);
    display: flex;
    flex-direction: row;
    font-size: .9rem;
    align-items: center;
    min-height: 35px;
    position: relative;
    text-align: center;
    justify-content: space-between;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    z-index: 99;
}

.head {
    height: 100%;
    display: flex;
    align-items: center;

    h1 {
        margin-left: 10px;
        font-size: 1.2em;
        font-weight: 700;
        color: var(--sl-color-primary-500);
    }

    .logo {
        background: var(--sl-color-primary-500);
        height: 100%;
        color: var(--sl-color-neutral-0);
        width: calc(2.5rem + 2 * 1.25 * 3px);
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: stretch;

        sl-icon {
            width: 75%;
            height: 75%;
        }
    }
}

sl-button-group {
    margin-right: 10px;
}
</style>
