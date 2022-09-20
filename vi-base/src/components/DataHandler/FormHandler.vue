<template>
  {{ module }}
  {{ action }}
  {{ group }}
  {{ skelkey }}
	<entry-bar :module="module" :action="action" :skelkey="skelkey"
	></entry-bar>

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


</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onBeforeMount, computed, provide} from 'vue'
import {Request} from "@viur/viur-vue-utils";
import {useAppStore} from "../../stores/app";
import {useRoute} from "vue-router";
import bone from "../../components/Bones/edit/bone.vue";
import EntryBar from "../Bars/EntryBar.vue";

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
		const appStore = useAppStore()
		const route = useRoute()
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
			let url = `/vi/${props.module}/${props.action}`
			if (props.group) url + `/${props.group}`

			if (props.action === "edit") {
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

			state.formValues[event.detail.boneName] = event.detail.formData

		}


		onBeforeMount(() => {
			fetchData()
		})

		return {
			state,
			values,
			getWidget,
			updateValue
		}
	}
})
</script>

<style scoped lang="less">

</style>
