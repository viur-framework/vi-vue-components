<template>
    <sl-drawer label="System Nachrichten"
               :open="messageStore.state['opened']"
               @sl-request-close="messageStore.state['opened']=false"
    >
        <message v-for="message in messageStore.state.messages"
                 :key="message['time']"
                 :variant="message['variant']"
                 :icon="message['icon']"
                 :time="message['time']"
                 :headline="message['headline']"
        >
            {{ message['body'] }}
        </message>
    </sl-drawer>

    <div class="messages_target">
        <message v-for="message in messageStore.state.messages.slice(0,3)"
                 :key="message['time']"
                 :variant="message['variant']"
                 :icon="message['icon']"
                 :headline="message['headline']"
                 :time="message['time']"
                 :duration="3000"
        > {{ message['body'] }}
        </message>
    </div>

</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent} from 'vue'
import Message from "./Message.vue"
import {useMessageStore} from "../../stores/message";
import {useDBStore} from "../../stores/db";

export default defineComponent({
    props: {},
    components: {Message},
    setup(props, context) {
        const messageStore = useMessageStore()
        const dbStore = useDBStore()
        const state = reactive({})

        return {
            state,
            messageStore,
            dbStore
        }
    }
})
</script>

<style scoped lang="less">

.messages_target{
  position: absolute;
  width: 500px;
  right: 25px;
  bottom: 25px;
  z-index: 99;
}


</style>
