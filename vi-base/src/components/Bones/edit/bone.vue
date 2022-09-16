<template>
    <!--Language chooser -->
    <sl-tab-group v-if="state.multilanguage">
        <template v-for="lang in state.languages" :key="lang+'_tab'">
            <sl-tab slot="nav" :panel="'lang_'+lang">
                {{ $t(lang) }}
            </sl-tab>

            <sl-tab-panel :name="'lang_'+lang">
                <!--Bone rendering for multiple bones-->
                <template v-if="state.multiple">
                    <!--Bone Buttonbar -->
                    <div class="actionbar">
                        <sl-button v-if="state.multiple && !state.readonly" @click="addMultipleEntry(lang)">{{
                                $t("bone.add")
                            }}
                        </sl-button>
                    </div>
                    <!--multilang and multiple-->
                    <div v-if="state.bonevalue?.[lang]" v-for="(val, index) in state.bonevalue?.[lang]" :key="index">
                        <wrapper-multiple :readonly="!state.readonly" @delete="removeMultipleEntry(index,lang)">
                            <component :is="is" :value="val" :index="index" :lang="lang" :name="name"
                                       @change="updateValue"></component>
                        </wrapper-multiple>
                    </div>
                </template>
                <!--Bone rendering for normal bones-->
                <component v-else :is="is" :value="state.bonevalue?.[lang]" :index="null" :lang="lang" :name="name"
                           @change="updateValue"></component>
            </sl-tab-panel>
        </template>

    </sl-tab-group>

    <template v-else>

        <!--Bone rendering for multiple bones-->
        <template v-if="state.multiple">
            <!--Bone Buttonbar -->
            <div class="actionbar">
                <sl-button v-if="state.multiple && !state.readonly" @click="addMultipleEntry(null)">{{
                        $t("bone.add")
                    }}
                </sl-button>
            </div>
            <div v-if="state.bonevalue" v-for="(val, index) in state.bonevalue" :key="index">
                <wrapper-multiple :readonly="!state.readonly" @delete="removeMultipleEntry(index)">
                    <component :is="is" :value="val" :index="index" :name="name" @change="updateValue"></component>
                </wrapper-multiple>
            </div>
        </template>
        <!--Bone rendering for normal bones-->
        <component v-else :is="is" :value="state.bonevalue" :name="name" :index="null" @change="updateValue"></component>
    </template>

</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed, onBeforeMount} from 'vue'
import wrapperMultiple from "../../../components/Bones/edit/wrapper_multiple.vue";
import bones from '../../../components/Bones/edit/index';

export default defineComponent({
    components: {wrapperMultiple, ...bones},
    props: {
        is: {
            type: Object,
            default: bones.base_item
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
        errors: Object
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


        })

        function updateValue(name:string, val:any, lang:(string|null) = null, index:number = 0) {
            if (lang) {
                if (Object.keys(state.bonevalue).includes(lang) && index!==null) {
                    state.bonevalue[lang][index] = val
                } else {
                    state.bonevalue[lang] = [val]
                }

            } else if(index!==null){
                state.bonevalue[index] = val
            }else{
                state.bonevalue = val
            }

            context.emit("change", name, toFormValue())
        }

        function toFormValue() {
            function rewriteData(val:any, key:(string|null) = null):Array<Object> {
                let ret = []
                if (Array.isArray(val)) {
                    if (Object.values(val).filter(c => c === Object(c)).length > 0) {
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

        function addMultipleEntry(lang = null) {

            if (lang) {
                if (Object.keys(state.bonevalue).includes(lang)) {
                    state.bonevalue[lang].push('')
                } else {
                    state.bonevalue[lang] = ['']
                }

            } else {
                if (state.bonevalue) {
                    state.bonevalue.push('')
                } else {
                    state.bonevalue = ['']
                }

            }
        }

        function removeMultipleEntry(index:number, lang = null) {
            if (lang) {
                state.bonevalue?.[lang].splice(index, 1)
            } else {
                state.bonevalue.splice(index, 1)
            }
        }

        onBeforeMount(() => {
            if (props.value) {
                state.bonevalue = props.value
            } else {
                state.bonevalue = props.skel[props.name]
            }
        })


        return {
            state,
            updateValue,
            addMultipleEntry,
            removeMultipleEntry
        }
    }
})
</script>

<style scoped lang="less">

</style>