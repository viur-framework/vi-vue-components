<template>
  <sl-card >
    <div slot="header">
      {{ entry.data["title"] }}
    </div>

    <p class="paragraph">
      {{  entry.data["text"] }}
    </p>

    <div v-if="!state.isMultiple">
      <sl-button
            :variant="state.selectedOptions.includes(option) ? 'success' : 'default'"
            :disabled="state.isDisabled"
						v-for="option in Object.keys(entry.data['choices'])"
						:key="option"
            @click="selectOption($event,option)"
            >
            {{ option }}
        </sl-button>
    </div>

    <div v-else>
      <sl-checkbox
        :disabled="state.isDisabled"
        v-for="option in Object.keys(entry.data['choices'])"
        :checked="state.selectedOptions.includes(option)"
        :key="option"
        @sl-change="selectOption($event, option)">
          {{ option }}
      </sl-checkbox>
    </div>

    <div slot="footer" v-if="state.isMultiple">
		  <sl-button
				 size="small"
				 variant="success"
				 @click="sendSelection">
			  {{ "send" }}
		  </sl-button>
		</div>
  </sl-card>
  {{state.isDisabled}}
</template>

<script setup>
import {reactive, computed, unref} from 'vue'
import {useScriptorStore} from "../../store/scriptor"

const scriptorStore = useScriptorStore()

const props = defineProps({
  entry:{
    type:Object
  }
})

const state = reactive({
  selectedOptions:[],
  isMultiple:computed(()=>props.entry.data['multiple']),
  isDisabled:false

})

function selectOption(event, option){
  if (state.isMultiple){

    if (event.target.checked)
      state.selectedOptions.push(option)
    else {
      const idx = state.selectedOptions.indexOf(option)
      if (idx !== -1) {
        state.selectedOptions.splice(idx, 1)
      }
    }
  }else{
    state.selectedOptions = [option]
    sendSelection()
  }
}

async function sendSelection(){
  let value = state.selectedOptions[0]

  if (state.isMultiple){
    value = [...state.selectedOptions]
  }

  await scriptorStore.sendResult("select", value).then(()=>{})
  state.isDisabled = true
}


</script>
