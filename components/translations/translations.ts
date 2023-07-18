// @ts-ignore
import {de_translations as de_utils, en_translations as en_utils} from "@viur/vue-utils";
import de_components from './de'
import en_components from './en'


let  de_translations = {...de_utils, ...de_components}
let  en_translations = {...en_utils, ...en_components}


export {
	de_translations,
	en_translations
}

