<template>

  <div class="topbar">
    <div class="top-headline">
      {{ module }}
      {{ action }}
      {{ group }}
      {{ skelkey }}
    </div>

    <entry-bar :module="module" :action="action" :skelkey="skelkey"
    ></entry-bar>
  </div>
   <sl-details open summary="Info" v-if="modulesStore.state.loaded && modulesStore.state.modules[module][`help_text_${action}`]">
    {{modulesStore.state.modules[module][`help_text_${action}`]}}
  </sl-details>
  <div class="scroll-content">
    <template v-for="(group,key) in state.formGroups">
     
		<sl-details :summary="group['name']">
			<template v-for="bone in group['bones']">
				<!--<label>{{ bone['boneStructure']["descr"] }}</label>

				<bone
					:name="bone['boneName']"
					:structure="state.structure"
					:skel="state.skel"
					@change="updateValue"
			></bone>-->

				<sl-bone
						:boneName="bone['boneName']"
						:boneStructure="state.structure[bone['boneName']]"
						:boneValue="state.skel[bone['boneName']]"
						renderType="edit"
						:renderLabel="true"
						@sl-boneChange="updateValue"
            :errors="state.errors"
            v-if="state.structure[bone['boneName']]['visible']"
				>
				</sl-bone>


			</template>
		</sl-details>
	</template>

    <sl-details summary="DEBUG: Formdata">
      {{ state.formValues }}
    </sl-details>
    <sl-details summary="DEBUG: Errors">
      {{ state.errors }}
    </sl-details>

  </div>

</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onBeforeMount, computed, provide} from 'vue'
import {Request} from "@viur/viur-vue-utils";
import {useAppStore} from "../../stores/app";
import {useRoute} from "vue-router";
import bone from "../../components/Bones/edit/bone.vue";
import EntryBar from "../Bars/EntryBar.vue";
import {useModulesStore} from "../../stores/modules";

export default defineComponent({
	props: {
		module: {
			type: String,
			required: true
		},
		action: null,
		group: null,
		skelkey: null,


	},
	components: {EntryBar, bone},
	setup(props, context) {
		const appStore = useAppStore();
		const route = useRoute();
    const modulesStore = useModulesStore();
		const values = reactive({})
		const state = reactive({
			skel: {},
			structure: {},
			errors: [],
			conf: computed(() => {
				return appStore.getConfByRoute(route)
			}),
			formGroups: computed(() => {
				let groups = {"default": {"name": "Allgemein", "bones": []}}
				for (const [boneName, bone] of Object.entries(state.structure)) {
					let category = "default"
					if (bone?.params?.category) {
						category = bone.params.category
					}

					if (Object.keys(groups).includes(category)) {
						groups[category]["bones"].push({
							"boneName": boneName,
							"boneStructure": state.structure[boneName],
							"boneValue": state.skel[boneName]
						})
					} else {
            if(!bone?.visible)continue;//Only add the group when we can show something
						groups[category] = {
							"name": category, "bones": [{
								"boneName": boneName,
								"boneStructure": state.structure[boneName],
								"boneValue": state.skel[boneName]
							}]
						}
					}


				}
				return groups
			}),
			formValues: {},
      module:props.module,
      action:props.action,
      group: props.group,
      skelkey:props.skelkey,


		})
		provide("state", state)

		function structureToDict(structure: object) {
			let struct = {}
			if (structure) {
				for (let idx in structure) {
					struct[structure[idx][0]] = structure[idx][1]
				}
			}
			return struct
		}

		function fetchData() {
			let url = `/vi/${props.module}/${props.action==="clone"?"edit": props.action}`;
      console.log("new url ",url)
			if (props.group) url + `/${props.group}`

			if (props.action === "edit"||props.action === "clone") {
				url += `/${props.skelkey}`
			}

			Request.get(url).then(async (resp) => {
				let data = await resp.json()
				state.skel = data["values"]
				state.structure = structureToDict(data["structure"])
				state.errors = data["errors"]
			})

		}

		function getWidget(boneName: string) {
			let widget = "base_item"
			if (state.structure != null && state.structure[boneName] != null && state.structure[boneName]["type"] != null) {
				const typeName = state.structure[boneName]["type"].replace(/\./g, "_")
				if (Object.keys(bones).includes(typeName)) {
					widget = typeName
				}
			}
			return widget
		}

		/*
				function updateValue(name: string, value: any) {
					state.formValues[name] = value
				}
			 */

		function updateValue(event: Object) {

			state.formValues[event.detail.boneName] = event.detail.formValue;

		}


		onBeforeMount(() => {
			fetchData()
		})

		return {
			state,
			values,
			getWidget,
			updateValue,
      modulesStore
		}
	}
})
</script>

<style scoped lang="less">

.topbar{
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: var(--sl-spacing-small);
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, .25);
  z-index: 1;
}

.top-headline{
  margin-right: auto;
  color: var(--sl-color-primary-500);
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scroll-content{
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar-track {
        background-color: transparent;
    }

    &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
        background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background-color: transparent;
        border-radius: 3px;
    }

    &:hover {
        &::-webkit-scrollbar-thumb {
            background-color: #afafaf;
        }
    }
}

sl-details{
  &::part(base){
    border-radius: 0;
  }
}

</style>
