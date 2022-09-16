import {reactive} from "vue";
import {defineStore} from "pinia";

interface MessageType {
    icon: String,
    variant: String
}

interface Message {
    icon: String,
    variant: String,
    headline: String,
    body: String,
    time: Date
}

interface State {
    opened: Boolean,
    messages: Message[],
    maxMessages: Number
}

const types: { [key: string]: MessageType } = {
    "error": {"icon": "exclamation-octagon", "variant": "danger"},
    "warning": {"icon": "exclamation-triangle", "variant": "warning"},
    "info": {"icon": "info-circle", "variant": "info"},
    "success": {"icon": "check", "variant": "success"},
}

export const useMessageStore = defineStore("messageStore", () => {
    const state: State = reactive({
        opened: false,
        messages: [],
        maxMessages: 15
    })

    function addMessage(type: string, headline: string, body: string) {
        state.messages.unshift({...types[type], headline, body, ...{"time": new Date()}})

        if (state.messages.length > state.maxMessages) {
            state.messages.pop()
        }
    }


    return {state, addMessage}
})
