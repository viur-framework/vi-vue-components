export default class Utils {
  static getSlotLength(slot) {
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

  static nameToInitials(name) {
    if (!name) return ""
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
  }

  static objectEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  }

  static getDescr(bone, value) {
    let values = bone["values"]
    if (!Array.isArray(bone["values"])) {
      values = []
      for (const [k, v] of Object.entries(bone["values"])) {
        values.push([k, v])
      }
    }
    try {
      //@ts-ignore
      return values.filter((option) => option[0] === value)[0][1]
    } catch (e) {
      return "-"
    }
  }

  static formatString(formatstr, boneValue) {
    function getpathListFromFormatstring(formatstr) {
      let output = []
      let formatList = []
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

  static renderValue(val){
    if (typeof val === 'object' &&
      !Array.isArray(val) &&
      val !== null
    ){
      val = Object.entries(val).filter(x=>!!x[1]).map((x)=>Utils.unescape(x[1])).join(", ")
    }else{
      val = Utils.unescape(val)
    }

    return val
  }


  static publicAsset(path, prefix = "s") {
    if (import.meta.env.DEV) {
      if(path.startsWith("/")){
        return `${import.meta.env.VITE_API_URL}${path}`
      }else{
        return `${prefix}/${path}`
      }

    }
    return path
  }

  static iconNormalization(icon){
    let viurIcons = [
      "audio","chat","dashboard","exclamation-octagon","folder","justify-left",
      "login","pdf","quote","statistics","type-h3","barcode","check-all","database",
      "exclamation-triangle","fullscreen-exit","justify-right","logout","pencil","stop",
      "type-h4","basket","check-circle","delivery-note","eye-slash","fullscreen","justify",
      "megaphone","person","rename","sun", "type-italic","scriptsbell","check-square-outline",
      "delivery","eye","funnel","key-chubb","menu","personae","ribbon","system","type-underline",
      "billing-file","check-square","desktop","file-earmark-arrow-up","gear","key-cylinder",
      "message-news","phone-book","scale","table","unlock","add-box","billing","check","diagnosis",
      "file-earmark-check","gift","kiosk","minus","phone","search","tablet","upload","add-file",
      "book","chevron-down","dot","file-earmark-image","globe","labels","moon","photo","send",
      "text-center","user-accounts","aircraft","box-arrow-up-right","chevron-left","download-file",
      "file-earmark-lightning","grip-vertical","laptop","notes","pin","share","text-file","user-contacts",
      "archive","box","chevron-right","download","file-earmark-minus","hashtag","order-cancelled",
      "play-circle","shield-check","text-indent","users","arrow-clockwise","briefcase","chevron-up",
      "draggable","file-earmark-pdf","heart-fill","lightbulb","order-coupon","play","shield-slash",
      "text-left","wifi","arrow-counterclockwise","bug","clock","droplet","file-earmark-play","heart",
      "lightning","order-error","plus","shield-warning","text-outdent","workflow","arrow-down",
      "calendar-check","clone","e-commerce","file-earmark-zip","hierarchy","link-45deg","order-return",
      "power","shield-x","text-right","wrench","arrow-left-right","calendar-event","cloud","edit-box",
      "file-earmark","house","list-item","order-shipped","press","slash-square","three-dots","x-circle",
      "arrow-left","calendar-x","code-slash","envelope-open","file-system","image","list-ul","order","pricelist",
      "smartphone","trash","x","arrow-repeat","calendar","component","envelope","filter","inbox","loader",
      "otp-authentification","print","sound-off","truck","zoom-in","arrow-right","cart","configuration",
      "error-file","flag","info-circle","locations","paragraph-slash","puzzle","sound-on","type-bold","zoom-out",
      "arrow-up","categories-box","cut","error","folder-back","interface","lock","paragraph","qr-code","star-fill",
      "type-h1","audio-file","chat-left","dash","euro-circle","folder-plus","invert-selection",
      "logbook","pause","question","star","type-h2",
    ]

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
    } else if (viurIcons.includes(icon)) {
      icon = "viur___" + icon
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

  static unescape(value) {
    return String(value)
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#40;/g, "(")
      .replace(/&#41;/g, ")")
      .replace(/&#61;/g, "=")
      .replace(/&#039;/g, "'")
      .replace(/&#040;/g, "(")
      .replace(/&#041;/g, ")")
      .replace(/&#061;/g, "=")
  }

  static extractNamefromSkel(skel){
    for (const fname of ['name', 'headline']){
      if (Object.keys(skel).includes(fname)){
        if (typeof skel[fname] === 'string'){
          return skel[fname]
        }
        if (Array.isArray(skel[fname])){
          if (typeof skel[fname][0] === 'string'){
            return skel[fname][0]
          }
          try{
            let keys = Object.keys(skel[fname][0])
            return skel[fname][0][keys[0]]
          }catch(error){}
        }else{
          try{
            let keys = Object.keys(skel[fname])
            return skel[fname][keys[0]]
          }catch(error){}
        }
      }
    }
    return null
  }

}
