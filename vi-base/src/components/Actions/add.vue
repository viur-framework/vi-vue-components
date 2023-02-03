<template>

    <router-link :to="state.url" custom v-slot="{route}">
        <sl-button  size="small" variant="success" @click="createAndNavigate(route)" :disabled="!state.canAdd">

            <sl-icon slot="prefix" name="plus"></sl-icon>
            {{ $t("actions.add") }}
        </sl-button>
    </router-link>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent, inject, computed, h} from 'vue'
import {useRoute} from "vue-router";
import {useAppStore} from "../../stores/app";
import {useUserStore} from "../../stores/user";

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const handlerState: any = inject("state")
        const appStore = useAppStore();
        const userStore = useUserStore();

        const route = useRoute()
        const state = reactive({
            url: computed(() => {
                if(handlerState.group){
                  return `/${route.params.module}/add/${handlerState.group}?_=${new Date().getTime()}`
                }else{
                  return `/${route.params.module}/add?_=${new Date().getTime()}`
                }
            }),
          canAdd: computed(() => {
            if(userStore.state.user.access.indexOf("root") !== -1 )
            {
              return true;
            }
            return userStore.state.user.access.indexOf(`${route.params.module}-add`)>-1;
          })

        })

        function createAndNavigate(route: any) {
            appStore.addOpened(route, handlerState["module"], handlerState["view"])
        }

        return {
            state,
            createAndNavigate,
        }
    }
})
</script>

<style scoped lang="less">

</style>
