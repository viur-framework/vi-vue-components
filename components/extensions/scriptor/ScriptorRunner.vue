<template>
  <sl-button
        v-if="canAccess"
        size="small"
        :disabled="!active && !state.scriptReady"
        :title="current['rel']['name']"
        @click="startScriptor"
      >
        <sl-icon
          v-if="current['rel']['icon']"
          slot="prefix"
          :name="iconInfo[1]"
          :library="iconInfo[0]"
        ></sl-icon>
        <template v-else>
          {{ current["rel"]["name"] }}

        </template>

        <div v-show="state.scriptStatus">
          <status :id="state.id" ref="scriptorAction"></status>
        </div>
      </sl-button>


      <teleport
        v-if="state.opened"
        :to="`#view_dialogs_${handlerState.tabId}`"
        :disabled="!state.opened"
      >
        <sl-dialog
          style="--width:85%"
          class="tabpopup"
          id="dialog-delete"
          :open="state.opened"
          :label="current['rel']['name']"
          @sl-after-hide="state.opened=false"
        >
        <status-bar :id="state.id" :filename="current['dest']['name']"></status-bar>
        <widget-list :id="state.id"></widget-list>

        </sl-dialog>
      </teleport>
</template>

<script setup>
  import {onBeforeMount, reactive, ref, computed, inject} from 'vue';
  import WidgetList from './components/WidgetList.vue';
  import StatusBar from './components/StatusBar.vue';
  import Status from './components/Status.vue';
  import {useScriptorStore} from "./store/scriptor"
  import { Request } from '@viur/vue-utils';
  import Utils from '../../utils';

  const scriptorAction = ref(null)

  const handlerState = inject("handlerState")

  const props = defineProps({
    canAccess:{
      type:Boolean
    },
    current:{
      type:Object
    },
    iconInfo:{
      type:Array
    },
    active:{
      type:Boolean
    }
  })



  const scriptorStore = useScriptorStore()
  const state = reactive({
    id:null,
    scriptStatus:computed(()=>{
      return scriptorAction.value?.state?.userStatus?.pulse
    }),
    opened: false,
    scriptor: computed(() => {
      return scriptorStore.state.instances[state.id]
    }),
    scriptReady:false,
  })

  onBeforeMount(()=>{
    state.id = scriptorStore.createNewInstance()
    Request.view("script",props.current?.['dest']?.['key'],{group:"leaf"}).then(async(resp)=>{
      let data = await resp.json()
      state.scriptor.scriptCode = data["values"]["script"].replace(/\/\/n/g, "\n")
      state.scriptReady = true
    })

  })

  function startScriptor(){
    state.opened = true
    scriptorAction.value.executeScript()
  }

</script>

<style scoped>
.tabpopup {
  &::part(base) {
    position: absolute;
    height: 100%;
  }

  &::part(panel) {
    height: 100%;
    max-height: calc(100% - 100px);
    margin-bottom: 40px;
  }

  &::part(body) {
    display: contents;
  }

  &::part(footer) {
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }

  &:deep(.bar sl-button[variant="success"]) {
    &::part(base) {
      background-color: transparent;
      border: 1px solid var(--sl-color-success-500);
      aspect-ratio: 1;
      padding: 0;
    }

    &::part(label) {
      display: none;
    }

    &::part(prefix) {
      color: var(--sl-color-success-500);
    }
  }
}
</style>
