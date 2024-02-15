//@ts-nocheck
import { getCurrentInstance, Slot } from "vue"

export default class Utils {
  static getSlotLength(slot: Slot | undefined): number {
    if (!slot) {
      return 0
    }

    let currentSlot = slot()
    let length = 0
    for (let slotElement of currentSlot) {
      if (slotElement.type.toString() === "Symbol(Fragment)") {
        length += slotElement.children.length
      } else if (
        slotElement.type.toString() === "Symbol(Comment)" ||
        slotElement.type.toString() === "Symbol(v-cmt)" ||
        (slotElement.type.toString() === "Symbol()" && slotElement.scopeId === null)
      ) {
        continue
      } else {
        length += 1
      }
    }
    return length
  }

  static nameToInitials(name: string | undefined) {
    if (!name) return ""
    return name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .slice(0, 2)
  }

  static objectEmpty(obj: object) {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  }

  static getDescr(bone: Object, value: any) {
    try {
      //@ts-ignore
      return bone["values"].filter((option) => option[0] === value)[0][1]
    } catch (e) {
      return "-"
    }
  }

  static formatString(formatstr: string, boneValue: object | Array<object>) {
    function getpathListFromFormatstring(formatstr: string) {
      let output = []
      let formatList: RegExpExecArray | null | boolean | Array<null> = []
      let regstr = /\$\((.*?)\)/g

      while (formatList) {
        formatList = regstr.exec(formatstr)
        if (!formatList) {
          formatList = false
          continue
        }

        output.push(formatList[1])
      }

      return output
    }

    let pathlist = getpathListFromFormatstring(formatstr)

    let finalStrList = []
    if (!Array.isArray(boneValue)) {
      boneValue = [boneValue]
    }
    // @ts-ignore
    for (let avalue of boneValue) {
      let finalstr = formatstr
      for (let pathstr of pathlist) {
        let path = pathstr.split(".")
        let aval = avalue
        for (let entry of path) {
          if (aval && entry in aval && aval[entry]) {
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

  static publicAsset(path, prefix = "s") {
    if (import.meta.env.DEV) {
      return `${prefix}/${path}`
    }
    return path
  }

  static iconNormalization(icon) {
    let oldicons = {
      "file-system": "folder-fill",
      users: "people-fill",
      user: "person-fill",
      dashboard: "grid-3x3-gap-fill",
      trash: "trash-fill",
      interface: "shuffle",
      hierarchy: "diagram-2-fill",
      "icon-settings": "gear-fill",
      "icon-hashtag": "hash",
      "icon-list": "list-ul"
    }

    // add empty icon if missing or construct library prefixed icon if needed
    let iconType = "library"
    if (!icon) {
      icon = ""
    } else if (Object.keys(oldicons).includes(icon)) {
      icon = "default___" + oldicons[icon]
    } else if (icon.startsWith("bootstrap___")) {
      icon = icon.replace("bootstrap___", "default___")
    } else if (icon.startsWith("/static/")) {
      iconType = "path"
      icon = `${import.meta.env.VITE_API_URL}` + icon
    } else if (!icon.includes("___") && icon !== "") {
      icon = "default___" + icon
    }

    if (iconType === "library") {
      let [library, iconname] = icon.split("___")
      return [icon, iconType, iconname, library]
    }

    return [icon, iconType, null, null]
  }
}
