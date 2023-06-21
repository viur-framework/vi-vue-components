// @ts-nocheck
//import "@viur/viur-shoelace/dist/themes/light.css"
import "@viur/viur-shoelace/dist/components/button/button"
import "@viur/viur-shoelace/dist/components/button-group/button-group"
import "@viur/viur-shoelace/dist/components/icon/icon"
import "@viur/viur-shoelace/dist/components/input/input"
import "@viur/viur-shoelace/dist/components/dropdown/dropdown"
import "@viur/viur-shoelace/dist/components/option/option"
import "@viur/viur-shoelace/dist/components/menu/menu"
import "@viur/viur-shoelace/dist/components/menu-item/menu-item"
import "@viur/viur-shoelace/dist/components/badge/badge"
import "@viur/viur-shoelace/dist/components/divider/divider"
import "@viur/viur-shoelace/dist/components/avatar/avatar"
import "@viur/viur-shoelace/dist/components/dialog/dialog"
import "@viur/viur-shoelace/dist/components/tooltip/tooltip"
import "@viur/viur-shoelace/dist/components/split-panel/split-panel"
import "@viur/viur-shoelace/dist/components/radio-group/radio-group"
import "@viur/viur-shoelace/dist/components/radio-button/radio-button"
import "@viur/viur-shoelace/dist/components/select/select"
import "@viur/viur-shoelace/dist/components/spinner/spinner"
import "@viur/viur-shoelace/dist/components/card/card"
import "@viur/viur-shoelace/dist/components/tag/tag"
import "@viur/viur-shoelace/dist/components/tooltip/tooltip"
import "@viur/viur-shoelace/dist/components/checkbox/checkbox"
import "@viur/viur-shoelace/dist/components/table-wrapper/table-wrapper"
import "@viur/viur-shoelace/dist/components/table/table"
import "@viur/viur-shoelace/dist/components/drawer/drawer"
import "@viur/viur-shoelace/dist/components/alert/alert"
import "@viur/viur-shoelace/dist/components/tab/tab"
import "@viur/viur-shoelace/dist/components/tab-group/tab-group"
import "@viur/viur-shoelace/dist/components/tab-panel/tab-panel"
import "@viur/viur-shoelace/dist/components/tree/tree"
import "@viur/viur-shoelace/dist/components/details/details"
import "@viur/viur-shoelace/dist/components/switch/switch"
import "@viur/viur-shoelace/dist/components/combobox/combobox"
import "@viur/viur-shoelace/dist/components/icon-button/icon-button"
import "@viur/viur-shoelace/dist/components/breadcrumb/breadcrumb"
import "@viur/viur-shoelace/dist/components/breadcrumb-item/breadcrumb-item"
import "@viur/viur-shoelace/dist/components/dialog/dialog"
import "@viur/viur-shoelace/dist/components/format-bytes/format-bytes"
import "@viur/viur-shoelace/dist/components/format-date/format-date"
import "@viur/viur-shoelace/dist/components/color-picker/color-picker"
import "@viur/viur-shoelace/dist/components/textarea/textarea"


import '@viur/viur-shoelace/dist/components/bone/bone';

//@ts-nocheck

import {setBasePath} from '@viur/viur-shoelace/dist/utilities/base-path';

if(import.meta.env.DEV){
    setBasePath(`s/viur-shoelace`)
}else{
    setBasePath(`viur-shoelace`)
}

/*
import {registerIconLibrary} from '@viviur/viur-shoelace/dist/utilities/icon-library';
// Register a custom icons repository for this app

registerIconLibrary('logo', {
    resolver: name => `${config.staticFolder}/dt-logos/${name}.svg`,
})
*/
