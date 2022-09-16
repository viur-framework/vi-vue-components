//@ts-nocheck
import Utils from '../utils'
import {computed, reactive} from "vue";

const boneLogic = (skel, structure) => {
    let bones_state = reactive({
        skel: computed(() => {
            if (skel && skel.constructor.name === "RefImpl") {
                return skel.value
            }
            return skel
        }),
        structure: computed(() => {
            if (structure.constructor.name === "RefImpl") {
                return structure.value
            }
            return structure
        })
    })

    function getBoneValue(boneName, options = null, skel = null) {
        if (skel === null) {
            skel = bones_state.skel
        }
        if (skel === null) {
            return "-"
        }
        if (Utils.objectEmpty(skel) || Utils.objectEmpty(bones_state.structure)) {
            return "-"
        }
        let languages = hasLanguages(boneName)
        if (languages) {
            let values = []

            for (let lang of languages) {
                if (isMultiple(boneName)) {
                    values.push(renderMultipleValue(boneName, options, skel, lang))
                } else {
                    values.push(renderSingleValue(boneName, options, null, skel, lang))
                }
            }
            return values.join(", ")
        } else {
            if (isMultiple(boneName)) {
                return renderMultipleValue(boneName, options, skel, null)
            } else {
                return renderSingleValue(boneName, options, null, skel, null)
            }
        }
    }

    function hasLanguages(boneName) {
        return (bones_state.structure[boneName] && bones_state.structure[boneName]["languages"]) ? bones_state.structure[boneName]["languages"] : false;
    }

    function isMultiple(boneName) {
        return (bones_state.structure[boneName] && bones_state.structure[boneName]["multiple"]) ? !!bones_state.structure[boneName]["multiple"] : false;
    }

    function renderSingleValue(boneName, options, value = null, skel = null, lang = null) {
        let boneStructure = bones_state.structure[boneName]
        if (boneStructure == null) {
            return "-"
        }
        if (!boneStructure["multiple"]) {
            if (skel === null) {
                skel = bones_state.skel
            }
            value = skel[boneName]
            if (lang) {
                value = skel[boneName][lang]
            }
        }


        if (!value || !boneStructure) {
            return "-"

        } else if (boneStructure["type"] === "select" || boneStructure["type"].startsWith("select.")) {
            // extract description from tuple
            if (boneStructure["values"].length > 0) {
                var [valuename, valuedescr] = boneStructure["values"][0]
                return valuedescr
            }
            return "-"

        } else if (boneStructure["type"] === "date" || boneStructure["type"].startsWith("date.")) {
            if (options && options === "time") {
                return new Date(value).toLocaleTimeString()
            } else if (options && options === "date") {
                return new Date(value).toLocaleDateString()
            }
            return new Date(value).toLocaleString()

        } else if (boneStructure["type"] === "relational" || boneStructure["type"].startsWith("relational.")) {
            return Utils.formatString(boneStructure["format"], value)

        } else if (boneStructure["type"] === "hierarchy" || boneStructure["type"].startsWith("hierarchy.")) {
            return Utils.formatString(boneStructure["format"], value)

        } else if (boneStructure["type"] === "bool") {
            return value ? "Ja" : "Nein"
        } else {
            return value.toString()
        }
    }

    function renderMultipleValue(boneName, options, skel = null, lang = null) {
        if (skel === null) {
            skel = bones_state.skel
        }

        let value = skel[boneName]

        if (lang) {
            value = skel[boneName][lang]
        }

        if (value && value.length > 0) {
            return value.map(x => renderSingleValue(boneName, options, x, skel, lang)).join(", ")
        }
        return "-"
    }


    return {
        getBoneValue,
        bones_state
    }
}

export default boneLogic
