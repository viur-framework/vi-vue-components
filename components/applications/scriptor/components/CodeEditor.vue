<template>
  <div class="wrapper">
    <textarea ref="element"></textarea>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import {basicSetup} from "codemirror"
import {EditorView, keymap, drawSelection} from "@codemirror/view"
import {python} from "@codemirror/lang-python"
import {syntaxHighlighting, defaultHighlightStyle} from "@codemirror/language"
import {indentLess, indentMore, indentWithTab, indentSelection, insertTab, } from "@codemirror/commands"
import {indentString, indentUnit} from '@codemirror/language'
//import { defaultKeymap } from "@codemirror/next/commands";
import {EditorState} from "@codemirror/state"

import {useScriptorStore} from "../store/scriptor"
const scriptorStore = useScriptorStore()

const props = defineProps({
  id:{
    required:true
  }
})

const element = ref(null);
const view = ref(null);

const state = reactive({
  scriptor:computed(()=>{
    return scriptorStore.state.instances[props.id]
  })
})

function editorFromTextArea(textarea, extensions)
{
	let _view = new EditorView({doc: textarea.value, extensions});

	textarea.parentNode.insertBefore(_view.dom, textarea);
	textarea.style.display = "none";

	if (textarea.form) {
		textarea.form.addEventListener("submit", () => {
			textarea.value = _view.state.doc.toString()
		})

	}

	indentString(_view.state, 4);


	let listener = () => {
		let lines = "";
		for (let i = 0; i<_view.state.doc.lines; ++i) {
			let line = _view.state.doc.line(i+1).text;
			lines += line + "\n";
		}
    state.scriptor.scriptCode = lines
	};


	_view.dom.addEventListener("input", listener);
	_view.dom.addEventListener("keyup", listener);
	_view.dom.addEventListener("paste", listener);
	_view.dom.addEventListener("cut", listener);
	return _view;
}


onMounted(()=>{
  view.value = editorFromTextArea(element.value,
		[
			basicSetup,
			python(),
			syntaxHighlighting(defaultHighlightStyle),
			//keymap.of(value),
			keymap.of([indentWithTab]),
			indentUnit.of("    "),
			EditorState.tabSize.of(4),
			drawSelection(),
			//EditorView.lineWrapping
		]
	)
  //init editor
  view.value.dispatch({
		changes: {from: 0, to: view.value.state.doc.length, insert: state.scriptor.scriptCode}
	})
})

</script>
<style scoped>
  .wrapper{
    display:flex;
    height:100%;
    width:100%;
  }
  :deep(.cm-editor){
    width:100%;
  }

</style>
