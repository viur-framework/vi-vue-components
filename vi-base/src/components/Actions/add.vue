<template>

    <router-link :to="state.url" custom v-slot="{route}">
        <sl-button  size="small" variant="success" @click="createAndNavigate(route)" :disabled="!state.canAdd"
          :title="$t('actions.add')">

            <sl-icon slot="prefix" name="plus"></sl-icon>
            <template v-if="label">
              {{ $t("actions.add") }}
            </template>
        </sl-button>
    </router-link>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent, inject, computed, h} from 'vue'
import {useRoute} from "vue-router";
import {useDBStore} from "../../stores/db";
import {useUserStore} from "../../stores/user";

export default defineComponent({
    props: {
      label:{
        default:true
      },
      params:{
        default:{}
      }
    },
    components: {},
    setup(props, context) {
        const handlerState: any = inject("state")
        const dbStore = useDBStore();
        const userStore = useUserStore();

        const state = reactive({
            url: computed(() => {
                let url = `/db/${handlerState.module}/add`

                if(handlerState.group){
                  url +=`/db/${handlerState.group}`
                }

                url +="?"+new URLSearchParams({...props.params, "_":new Date().getTime()}).toString()

                return url

            }),
          canAdd: computed(() => {
            if(userStore.state.user.access.indexOf("root") !== -1 )
            {
              return true;
            }
            return userStore.state.user.access.indexOf(`${handlerState.module}-add`)>-1;
          })

        })

        function createAndNavigate(route: any) {
            dbStore.addOpened(route, handlerState["module"], handlerState["view"])
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
