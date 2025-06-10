<template>
  <sl-button-group>
    <sl-button size="small" @click="state.open=true" :disabled="handlerState.conf['userFilters']?.length===0">{{state.currentName}}</sl-button>
    <sl-button v-if="state.currentName!==actionName" size="small" @click="removeFilter" :disabled="handlerState.conf['userFilters']?.length===0" variant="danger" outline>x</sl-button>
  </sl-button-group>
  <sl-drawer :open="state.open" @sl-after-hide="state.open=false">
    <p slot="label">Filter</p>
    <sl-details-group>
      <template v-for="f in handlerState.conf['userFilters']">
          <sl-details :summary="f?.name" v-if="f?.name">
            <sl-icon :name="f?.icon" :library="f?.library" slot="prefix"></sl-icon>

            <div v-if="currentlist.structure && Object.keys(currentlist.structure).length>0">

              <template v-for="e in f?.filter">
               <!--x--> <filterBone
                  :is="getBoneWidget('select')"
                  :name="e['bonename']"
                  :structure="currentlist.structure"
                  label="placeholder"
                  @change-internal="updateValue($event,e,f?.name)"
                  :errors="[]"
                >
                </filterBone>
              </template>
              <sl-bar>
                <sl-button slot="right" size="small" variant="success" @click="applyFilter(f?.name)">filtern</sl-button>
              </sl-bar>



            </div>
          </sl-details>
        </template>
    </sl-details-group>

  </sl-drawer>
</template>
<script setup>
import {reactive, inject, onBeforeMount} from 'vue'
import filterBone from '@viur/vue-utils/bones/edit/filterBone.vue'
import {getBoneWidget} from '@viur/vue-utils/bones/edit/index'

const currentlist = inject("currentlist")
const handlerState = inject("handlerState")
const reloadAction = inject("reloadAction")

const actionName = "Filtern"

const state = reactive({
  open:true,
  filter:{},
  originalFilter:null,
  currentName:actionName
})
function removeFilter(){
   handlerState.externfiltered = false
  state.currentName = actionName
  currentlist.state.params = {...state.originalFilter}
  reloadAction()
}
function updateValue(event, entry,filtername){
  let name = filtername.replace(/[^a-zA-Z0-9]/g, '')
  let field = entry['field']?entry['field']:entry['bonename']
  let currentFilter = {}
  let op = ""
  let opMatch={
    ">":"$gt",
    "<":"$lt",
    "<=":"$lte",
    ">=":"$gte"
  }
  if (Object.keys(opMatch).includes(entry['operator'])){
    field +=opMatch[entry['operator']]
  }

  if (event['lang']){
    try{
      delete state.filter[name][field]
      for(const k of Object.keys(state.filter[name])){
        if (k.startsWith(field+'.')){
          delete state.filter[name][k]
        }
      }
    }catch(e){}

    field+=`.${event['lang']}`
  }

  let value = event['value']
  if (Array.isArray(value) && value.length>=1){
    value = value[0]
  }


  if (!Object.keys(state.filter).includes(name)){
    state.filter[name] = {}
  }
 state.filter[name][field]=value
}

function applyFilter(filtername){
  let name = filtername.replace(/[^a-zA-Z0-9]/g, '')
  currentlist.state.params = {...state.originalFilter, ...state.filter[name]}
  reloadAction()
  state.currentName = filtername
  handlerState.externfiltered = true
}


onBeforeMount(()=>{
  state.originalFilter = {...currentlist.state.params}
})
</script>
