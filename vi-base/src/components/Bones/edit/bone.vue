<template>

  <div class="bone-wrapper">
    <bone-label>
      {{ state.bonestructure['descr'] }}
    </bone-label>
    <div class="bone-inner-wrap">
      <!--Language chooser -->
      <sl-tab-group v-if="state.multilanguage" placement="bottom">
          <template v-for="lang in state.languages" :key="lang+'_tab'">
              <sl-tab slot="nav" :panel="'lang_'+lang">
                  {{ $t(lang) }}
              </sl-tab>

              <sl-tab-panel :name="'lang_'+lang">
                  <!--Bone rendering for multiple bones-->
                  <template v-if="state.multiple && !BoneHasMultipleHandling(state.bonestructure['type'])">

                      <!--multilang and multiple-->
                      <div v-if="state.bonevalue?.[lang]" v-for="(val, index) in state.bonevalue?.[lang]" :key="index">
                          <wrapper-multiple :readonly="!state.readonly" @delete="removeMultipleEntry(index,lang)">
                              <component :is="is" :value="val" :index="index" :lang="lang" :name="name"
                                        @change="updateValue"></component>
                          </wrapper-multiple>
                      </div>
                      <!--Bone Buttonbar -->
                      <component v-if="!state.readonly" :is="state.actionbar" :lang="lang"></component>
                  </template>
                  <!--Bone rendering for normal bones-->
                  <component v-else :is="is" :value="state.bonevalue?.[lang]" :index="null" :lang="lang" :name="name"
                            @change="updateValue"></component>
              </sl-tab-panel>
          </template>

      </sl-tab-group>

      <template v-else>
          <!--Bone rendering for multiple bones-->
          <template v-if="state.multiple && !BoneHasMultipleHandling(state.bonestructure['type'])">

              <div v-if="state.bonevalue" v-for="(val, index) in state.bonevalue" :key="index">
                  <wrapper-multiple :readonly="!state.readonly" @delete="removeMultipleEntry(index)">
                      <component :is="is" :value="val" :index="index" :name="name" @change="updateValue"></component>
                  </wrapper-multiple>
              </div>
              <!--Bone Buttonbar -->
              <component v-if="!state.readonly" :is="state.actionbar"></component>
          </template>
          <!--Bone rendering for normal bones-->
          <component v-else :is="is" :value="state.bonevalue" :name="name" :index="null" @change="updateValue"></component>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed, onBeforeMount, provide, getCurrentInstance, onMounted} from 'vue'
import wrapperMultiple from "../../../components/Bones/edit/wrapper_multiple.vue";
import bones from '../../../components/Bones/edit/index';
import BoneLabel from './boneLabel.vue';
import defaultBar from './actionbar/defaultBar.vue';
import relationalBar from './actionbar/relationalBar.vue';
import {BoneHasMultipleHandling} from "../../../components/Bones/edit/index.ts"

export default defineComponent({
    components: { wrapperMultiple, ...bones, BoneLabel, defaultBar, relationalBar },
    props: {
        is: {
            type: Object,
            default: bones.raw
        },
        name: {
            type:String,
            required:true
        },
        languages: Array,
        multiple: Boolean,
        readonly: Boolean,
        required: Boolean,
        params: Object,
        value: Object,
        structure: {
            type:Object,
            required:true
        },
        skel: {
            type:Object,
            required:true
        },
        errors: Object,
    },
    emits: ['change'],
    setup(props, context) {
        const state:any = reactive({
            bonestructure: computed(() => {
                return props.structure?.[props.name]
            }),
            bonevalue: null,
            multilanguage: computed(() => state.languages?.length && state.languages.length > 0),
            languages: computed(() => {
                if (props.languages) {
                    return props.languages
                }
                return state.bonestructure && Object.keys(state.bonestructure).includes("languages") ? state.bonestructure["languages"] : []
            }),
            readonly: computed(() => {
                if (props.readonly) {
                    return props.readonly
                }
                return state.bonestructure && Object.keys(state.bonestructure).includes("readonly") ? state.bonestructure["readonly"] : false
            }),
            required: computed(() => {
                if (props.required) {
                    return props.required
                }
                return state.bonestructure && Object.keys(state.bonestructure).includes("required") ? state.bonestructure["required"] : false
            }),
            multiple: computed(() => {
                if (props.multiple) {
                    return props.multiple
                }
                return state.bonestructure && Object.keys(state.bonestructure).includes("multiple") ? state.bonestructure["multiple"] : false
            }),
            params: computed(() => {
                if (props.params) {
                    return props.params
                }
                return state.bonestructure && Object.keys(state.bonestructure).includes("params") ? state.bonestructure["params"] : {}
            }),
            actionbar:computed(()=>{
              if(state.bonestructure?.["type"].startsWith("relational.")){
                return relationalBar
              }
              return defaultBar
            })
        })
        provide("boneState",state)

        function updateValue(name:string, val:any, lang:(string|null) = null, index:number = 0) {
            if (lang) {
              console.log(index)
                if (Object.keys(state.bonevalue).includes(lang) && index!==null) {
                    state.bonevalue[lang][index] = val
                } else {
                    state.bonevalue[lang] = val
                }

            } else if(index!==null){
                state.bonevalue[index] = val
            }else{
                state.bonevalue = val
            }
            if (state.readonly) return false

            context.emit("change", name, toFormValue())
        }

        function toFormValue() {
            function rewriteData(val:any, key:(string|null) = null):Array<Object> {
                let ret = []
                if (Array.isArray(val)) {
                    if (Object.values(val).length > 0) {
                        for (const [i, v] of val.entries()) {
                            ret.push(rewriteData(v, key + "." + i))
                        }
                    } else {
                        for (const [i, v] of val.entries()) {
                            ret.push(rewriteData(v, key))

                        }
                    }
                } else if (val === Object(val)) {
                    for (const [k, v] of Object.entries(val)) {
                        if (key) {
                            ret.push(rewriteData(v, key + "." + k))
                        }else{
                            ret.push(rewriteData(v, k))
                        }

                    }
                }else{
                    if(val === null){
                        val = ""
                    }
                    if (key !== null){
                        ret.push({[key]:val})
                    }

                }

                return ret
            }
            let value = rewriteData(state.bonevalue, props.name)
            value = value.flat(10)
            return value
        }

        function addMultipleEntry(lang = null, data='') {
            if (lang) {
                if (Object.keys(state.bonevalue).includes(lang)) {
                    state.bonevalue[lang].push(data)
                } else {
                    state.bonevalue[lang] = [data]
                }
            } else {
                if (state.bonevalue) {
                    state.bonevalue.push(data)
                } else {
                    state.bonevalue = [data]
                }
            }
        }
        provide("addMultipleEntry",addMultipleEntry)

        function removeMultipleEntry(index:number, lang = null) {
            if (lang) {
                state.bonevalue?.[lang].splice(index, 1)
            } else {
                state.bonevalue.splice(index, 1)
            }
        }

        function formatString(formatstr: string, boneValue: object | Array<object>) {
          function getpathListFromFormatstring(formatstr) {
            let output = [];
            let formatList = [];
            let regstr = /\$\((.*?)\)/g;

            while (formatList) {
                formatList = regstr.exec(formatstr);
                if (!formatList) {
                    formatList = false;
                    continue
                }

                output.push(formatList[1]);
            }

            return output
            }


            let pathlist = getpathListFromFormatstring(formatstr);

            let finalStrList = [];
            if (!Array.isArray(boneValue)) {
            boneValue = [boneValue]
            }
            for (let avalue of boneValue) {
            let finalstr = formatstr;
            for (let pathstr of pathlist) {
                let path = pathstr.split(".");
                let aval = avalue;
                for (let entry of path) {
                    if (aval && aval!=="-" && entry in aval && aval[entry]) {
                        aval = aval[entry]
                    } else {
                        aval = "-"
                    }
                }
                finalstr = finalstr.replace("$(" + pathstr + ")", aval)

            }
            finalStrList.push(finalstr)
            }

            return finalStrList.join(", ")
        }
        provide("formatString",formatString)


        onBeforeMount(() => {
            if (props.value) {
                state.bonevalue = props.value
            } else {
                state.bonevalue = props.skel[props.name]
            }
        })


        return {
            state,
            defaultBar,
            updateValue,
            addMultipleEntry,
            removeMultipleEntry,
            BoneHasMultipleHandling
        }
    }
})
</script>

<style scoped>
  .bone-wrapper{
    display: grid;
    grid-template-columns: 230px 1fr;
    margin-bottom: 20px;
  }
  sl-tab-panel::part(base){
    padding: 0;
  }
</style>
