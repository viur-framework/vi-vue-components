<template>
  <div class="wrap-for-popup">
    <div v-if="!noTopbar" class="topbar">
      <div class="top-headline" style="display: flex; gap: 10px; align-items: center">
        <div>
          <span v-if="['clone', 'add'].includes(action)">{{ $t("form.new") }}</span>
          <span v-else-if="['edit'].includes(action)">{{ $t("form.edit") }}</span>
          {{ Utils.unescape(state.conf?.["name"]) }} {{ $t("form.entry") }}
          <span v-if="state.formValues?.['name']?.[0]['name']">
            : {{ Utils.unescape(state.formValues["name"][0]["name"]) }}
          </span>
        </div>
        <handler-context></handler-context>
      </div>
      <entry-bar :module="module" :action="action" :skelkey="skelkey" skeltype="skeltype"></entry-bar>
    </div>
    <loader v-if="viform?.state?.loading" size="3"></loader>
    <sl-details
      v-if="modulesStore.state.loaded && modulesStore.state.modules[module]?.[`help_text_${action}`]"
      open
      summary="Info"
    >
      <p v-html="modulesStore.state.modules[module][`help_text_${action}`]"></p>
    </sl-details>
    <div class="scroll-content">
      <div class="metainfo">
        <div class="boxwrapper">
          <h2 class="top-headline">{{ $t("shop.order.title") }}</h2>
          <div v-if="state.formfailed" class="errorwrapper">
            <sl-alert open variant="warning">
              <sl-icon slot="icon" name="info-circle"></sl-icon>

              <span>
                <b>{{ $t("shop.order.status") }}</b>
                :{{ state.formfailed.status }}
              </span>
              <br />
              <span>
                <b>{{ $t("title") }}</b>
                : {{ state.formfailed.title }}
              </span>
              <br />
              <span>
                <b>{{ $t("descr") }}</b>
                : {{ state.formfailed.descr }}
              </span>
            </sl-alert>
          </div>
          <div v-if="!state.loading">
            <vi-form
              ref="viform"
              :boneactions="true"
              :module="state.module"
              :action="state.action"
              :group="state.group"
              :skelkey="skelkey"
              :skeltype="skeltype"
              :values="values"
              :secure="secure"
              :renderer="renderer"
              :collapsed-categories="state.conf?.['collapsedCategories'] || []"
              :fetch-url="state.fetchurl"
              :params="state.params"
              :debug="appStore.state.debug"
              :readonly="!state.canEdit"
              :default-language="appStore.state.language"
              :layout="OrderLayout"
              @failed="formfailed"
            ></vi-form>
            <template v-for="handler in state.conf?.['editViews']" :key="handler['module']">
              <sl-details
                v-if="skelkey && viform && Object.keys(viform?.state?.skel).length > 0"
                :summary="handler['name'] || state.conf?.['name'] || handler['module']"
                :open="false"
              >
                <div class="embeded-list">
                  <component
                    :is="currentHandler(getEditView(handler))"
                    :module="handler['module']"
                    :group="handler?.['group']"
                    :columns="handler?.['columns'] ? handler['columns'] : []"
                    :filter="editViewFilter(handler)"
                  ></component>
                </div>
              </sl-details>
            </template>
          </div>
        </div>
        <div>
          <div class="boxwrapper">
            <h2 class="top-headline">
              {{ shippingIsBilling ? $t("shop.order.shipping_billing_address") : $t("shop.order.shipping_address") }}
            </h2>
            <div v-if="viform?.state?.skel?.cart?.dest?.shipping_address.dest?.key">
              <vi-form
                module="shop/address"
                action="view"
                :skelkey="viform?.state?.skel?.cart?.dest?.shipping_address.dest?.key"
                renderer="vi"
                :fetch-url="`/vi/shop/address/view/${viform?.state?.skel?.cart?.dest?.shipping_address.dest?.key}`"
                :readonly="true"
                :layout="AddressLayout"
              ></vi-form>
            </div>
          </div>
        </div>
        <div v-if="!shippingIsBilling">
          <div class="boxwrapper">
            <h2 class="top-headline">{{ $t("shop.order.billing_address") }}</h2>
            <div v-if="viform?.state?.skel?.billing_address?.dest?.key">
              <vi-form
                module="shop/address"
                action="view"
                :skelkey="viform?.state?.skel?.billing_address?.dest?.key"
                renderer="vi"
                :fetch-url="`/vi/shop/address/view/${viform?.state?.skel?.billing_address?.dest?.key}`"
                :readonly="true"
                :layout="AddressLayout"
              ></vi-form>
            </div>
          </div>
        </div>
      </div>
      <div class="cartinfo">
        <sl-details v-if="orderNote" class="order-note-details" open>
          <h2 slot="summary" class="top-headline">{{ $t("shop.order.note") }}</h2>
          <p class="cart-note__text">{{ orderNote }}</p>
        </sl-details>
        <h2 class="top-headline">{{ $t("shop.order.cart.title") }}</h2>
        <div class="boxwrapper">
          <table class="cart-table">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col class="cart-table__total-column" />
            </colgroup>
            <thead>
              <tr>
                <th>{{ $t("shop.order.cart.quantity") }}</th>
                <th>{{ $t("shop.order.cart.art_no") }}</th>
                <th>{{ $t("shop.order.cart.name") }}</th>
                <th>{{ $t("shop.order.cart.unit_price") }}</th>
                <th>{{ $t("shop.order.cart.total_price") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cartList?.state?.state === 0">
                <td colspan="5" class="cart-table__empty">{{ $t("shop.order.cart.loading") }}</td>
              </tr>
              <tr v-else-if="cartList?.state?.state === -1">
                <td colspan="5" class="cart-table__empty">{{ $t("shop.order.cart.load_failed") }}</td>
              </tr>
              <tr v-else-if="cartRows.length === 0">
                <td colspan="5" class="cart-table__empty">{{ $t("shop.order.cart.empty") }}</td>
              </tr>
              <tr v-for="(item, idx) in cartRows" :key="item.key || idx">
                <td class="cart-table__quantity">{{ item.quantity }}</td>
                <td>{{ getCartValue(item.shop_art_no_or_gtin) }}</td>
                <td>{{ Utils.unescape(getCartValue(item.shop_name)) }}</td>
                <td class="cart-table__price">
                  <sl-format-number
                    lang="de"
                    type="currency"
                    currency="EUR"
                    :value="getNumber(item.price?.current)"
                  ></sl-format-number>
                </td>
                <td class="cart-table__price">
                  <sl-format-number
                    lang="de"
                    type="currency"
                    currency="EUR"
                    :value="getNumber(item.quantity) * getNumber(item.price?.current)"
                  ></sl-format-number>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="showCartSummary">
              <tr>
                <td colspan="4" class="cart-table__summary-label">{{ $t("shop.order.cart.subtotal") }}</td>
                <td class="cart-table__price">
                  <sl-format-number lang="de" type="currency" currency="EUR" :value="cartSubtotal"></sl-format-number>
                </td>
              </tr>
              <tr v-if="shippingDetails">
                <td colspan="4" class="cart-table__summary-label">
                  {{ $t("shop.order.cart.shipping_cost") }}
                  <span v-if="shippingName">({{ shippingName }})</span>
                  <span v-if="shippingDeliveryTimeRange" class="cart-table__summary-detail">
                    {{ $t("shop.order.cart.delivery_time", { range: shippingDeliveryTimeRange }) }}
                  </span>
                </td>
                <td class="cart-table__price">
                  <sl-format-number lang="de" type="currency" currency="EUR" :value="shippingCosts"></sl-format-number>
                </td>
              </tr>
              <tr v-if="hasDiscount" class="cart-table__summary-discount">
                <td colspan="4" class="cart-table__summary-label">
                  {{ $t("shop.order.cart.discount") }}
                  <span v-if="discountName">({{ discountName }})</span>
                </td>
                <td class="cart-table__price">
                  <sl-format-number lang="de" type="currency" currency="EUR" :value="discountAmount"></sl-format-number>
                </td>
              </tr>
              <tr class="cart-table__summary-total">
                <td colspan="4" class="cart-table__summary-label">{{ $t("shop.order.cart.total") }}</td>
                <td class="cart-table__price">
                  <sl-format-number lang="de" type="currency" currency="EUR" :value="displayTotal"></sl-format-number>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
    <template v-if="state.relation_opened">
      <template v-for="bone in state.relation_opened">
        <sl-dialog
          open
          style="--width: 85%"
          class="relation-popup"
          :label="$t('shop.order.relation.selection', { descr: bone['boneStructure']['descr'] })"
          @sl-request-close="relationCloseAction($event)"
        >
          <component
            :is="currentHandler(bone['bone_conf']['handlerComponent'])"
            :rowselect="1"
            :module="bone['boneStructure']['module']"
            @current-selection="relationUpdateSelection($event, bone)"
          ></component>
          <div slot="footer" class="footer">
            <sl-button variant="danger" size="small" outline @click="relationRemoveHandler(bone)">
              {{ $t("relation.abort") }}
            </sl-button>
            <sl-button
              :disabled="!bone['currentSelection'] || bone['currentSelection']?.length === 0"
              variant="success"
              size="small"
              @click="relationApplySelection(bone)"
            >
              {{ $t("relation.select") }}
            </sl-button>
          </div>
        </sl-dialog>
      </template>
    </template>
  </div>
</template>

<script setup>
import { reactive, defineComponent, onBeforeMount, computed, ref, provide, toRaw, unref, watch, onActivated } from "vue"
import { Request, ListRequest } from "@viur/vue-utils"
import { useDBStore } from "../../stores/db"
import { useLocalStore } from "../../stores/local"
import { useContextStore } from "../../stores/context"
import { useRoute } from "vue-router"
import { useMessageStore } from "../../stores/message"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import EntryBar from "../../bars/EntryBar.vue"
import { useModulesStore } from "../../stores/modules"
import handlers from "../../handler/handlers"
import bone from "@viur/vue-utils/bones/edit/bone.vue"
import { getBoneWidget } from "@viur/vue-utils/bones/edit/index"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import { useAppStore } from "../../stores/app"
import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"
import Logics from "logics-js"
import Utils from "../../utils"
import HandlerContext from "../../main/context/HandlerContext.vue"
import ViForm from "@viur/vue-utils/forms/ViForm.vue"
import OrderLayout from "./OrderLayout.vue"
import AddressLayout from "./AddressLayout.vue"

function currentHandler(name) {
  return handlers?.[name] ? handlers[name] : name
}

const props = defineProps({
  module: {
    type: String,
    required: true,
  },
  view: null,
  action: null,
  group: null,
  skelkey: null,
  skeltype: null,
  noTopbar: false,
  secure: {
    type: Boolean,
    default: true,
  },
  bones: {
    type: Array,
    default: [],
  },
  values: {
    type: Object,
    default: null,
  },
  renderer: {
    type: String,
    default: import.meta.env.VITE_DEFAULT_RENDERER || "vi",
  },
  errors: [],
})

const emit = defineEmits(["change"])
const dbStore = useDBStore()
const appStore = useAppStore()
const contextStore = useContextStore()
const route = useRoute()
const modulesStore = useModulesStore()
const messageStore = useMessageStore()
const localStore = useLocalStore()
const userStore = useUserStore()

const viform = ref(null)
const cartList = ref(null)
const cartRows = computed(() => {
  return (cartList.value?.state?.skellist || []).filter((item) => item?.skel_type !== "node")
})
const orderSkel = computed(() => {
  return viform.value?.state?.skel || viform.value?.skel || {}
})
const cartRoot = computed(() => {
  return orderSkel.value?.cart?.dest || {}
})
const shippingIsBilling = computed(() => {
  const addressType = cartRoot.value?.shipping_address?.dest?.address_type
  if (!Array.isArray(addressType)) {
    return false
  }
  return addressType.includes("shipping") && addressType.includes("billing")
})
const shippingDetails = computed(() => {
  return cartRoot.value?.shipping?.dest || null
})
const shippingName = computed(() => {
  return Utils.unescape(getCartValue(shippingDetails.value?.name))
})
const shippingDeliveryTimeRange = computed(() => {
  const deliveryTimeRange = shippingDetails.value?.delivery_time_range
  if (
    deliveryTimeRange === null ||
    deliveryTimeRange === undefined ||
    deliveryTimeRange === "" ||
    deliveryTimeRange === "None"
  ) {
    return ""
  }
  return deliveryTimeRange
})
const cartSubtotal = computed(() => {
  return cartRows.value.reduce((sum, item) => {
    return sum + getNumber(item.quantity) * getNumber(item.price?.current)
  }, 0)
})
const shippingCosts = computed(() => {
  return getNumber(shippingDetails.value?.shipping_cost)
})
const orderTotal = computed(() => {
  const orderTotalValue = getOptionalNumber(orderSkel.value?.total)
  if (orderTotalValue !== null) {
    return orderTotalValue
  }

  const cartTotalValue = getOptionalNumber(cartRoot.value?.total)
  if (cartTotalValue !== null) {
    return cartTotalValue
  }

  return cartSubtotal.value + shippingCosts.value
})
const showCartSummary = computed(() => {
  return (
    cartRows.value.length > 0 || getOptionalNumber(orderSkel.value?.total) !== null || Boolean(shippingDetails.value)
  )
})
// Discount handling mirrors the shop-frontend (ShopSummary.vue): the reduction is the difference
// between the undiscounted total and the discounted total; the final total shown is the discounted one.
const discountAmount = computed(() => {
  const undiscounted = getOptionalNumber(cartRoot.value?.total)
  const discounted = getOptionalNumber(cartRoot.value?.total_discount_price)
  if (undiscounted === null || discounted === null) {
    return null
  }
  return discounted - undiscounted
})
const hasDiscount = computed(() => discountAmount.value !== null && discountAmount.value < 0)
const discountName = computed(() => Utils.unescape(getCartValue(cartRoot.value?.discount?.dest?.name)))
const displayTotal = computed(() => {
  return hasDiscount.value ? getNumber(cartRoot.value?.total_discount_price) : orderTotal.value
})
// Free-text comment on the order (plain multiline text, validHtml=None on the bone).
const orderNote = computed(() => Utils.unescape(getCartValue(orderSkel.value?.note)))

const state = reactive({
  type: "formhandler",
  skel: {},
  structure: {},
  errors: [],
  conf: computed(() => {
    return dbStore.getConf(props.module)
  }),
  tabId: route.query?.["_"],
  formValues: {},
  module: computed(() => props.module.replace(".", "/")),
  view: computed(() => {
    if (Object.keys(route.query).includes("view")) {
      return route.query["view"]
    }
    return null
  }),
  action: computed(() => route.meta["action"]),
  group: computed(() => (props.group ? props.group : !["node", "leaf"].includes(props.skeltype) ? props.skeltype : "")),
  skelkey: props.skelkey,
  skeltype: computed(() => (["node", "leaf"].includes(props.skeltype) ? props.skeltype : "")),
  renderer: computed(() => props.renderer),
  relation_opened: [],
  loading: false,
  canEdit: computed(() => {
    let accessflag = `${state.module}-edit`
    if (state.group) {
      accessflag = `${state.module}-${state.group}-edit`
    }
    if (
      Object.keys(state.conf).includes("disabledActions") &&
      state.conf["disabledActions"]?.length > 0 &&
      state.conf["disabledActions"].includes("edit")
    ) {
      return false // if edit is disabled, open in view mode
    }
    if (userStore.state.user.access.includes("root")) {
      return true
    }
    let access = userStore.state.user.access.includes(accessflag)
    if (!access && state.group) {
      accessflag = `${state.module}-all-edit`
    }
    return userStore.state.user.access.includes(accessflag)
  }),
  fetchurl: computed(() => {
    let action = state.action
    if (!state.canEdit) {
      action = "view"
    }

    let url = `/${props.renderer}/${state.module}/${action}`
    if (
      action === "clone" &&
      appStore.state["core.version"] &&
      appStore.state["core.version"]?.[0] >= 3 &&
      appStore.state["core.version"]?.[1] <= 5
    ) {
      url = `/${props.renderer}/${props.module}/edit`
    }

    const isTree = ["node", "leaf"].includes(state.skeltype)

    if (state.group) {
      url += `/${state.group}`
    } else if (isTree) {
      url += `/${state.skeltype}`
    }

    if (["edit", "clone", "view"].includes(action) || (isTree && action === "add")) {
      url += `/${props.skelkey}`
    }
    return url
  }),
  params: computed(() => {
    let params = { ...contextStore.getContext(state.tabId) }
    if (["add", "clone"].includes(props.action)) {
      params["bounce"] = true
    }
    return params
  }),
  formfailed: null,
  shipping: { values: {}, structure: {} },
})

provide("handlerState", state)
provide("viform", viform)

function fetchData() {
  return viform.value.fetchData(state.fetchurl)
}
provide("fetchData", fetchData)

function getWidget(boneName) {
  let widget = "base_item"
  if (state.structure != null && state.structure[boneName] != null && state.structure[boneName]["type"] != null) {
    const typeName = state.structure[boneName]["type"].replace(/\./g, "_")
    if (Object.keys(bones).includes(typeName)) {
      widget = typeName
    }
  }
  return widget
}

function reloadAction() {
  state.loading = true
  if (!viform.value) return
  return viform.value
    .fetchData(state.fetchurl)
    .then(async (resp) => {
      state.loading = false
      if (resp.status !== 200) {
        messageStore.addMessage("error", resp.statusText, resp.url)
      }
    })
    .catch(async (error) => {
      messageStore.addMessage("error", `${error.message}`, error.response?.url)
    })
}
provide("reloadAction", reloadAction)

function updateValue(data) {
  state.formValues[data.name] = data.value
  emit("change", state.formValues)
}

function relationSelection(event, bone) {
  bone["bone_instance"] = event.target
  bone["bone_instance_boneName"] = event["detail"]["boneName"]
  bone["bone_conf"] = dbStore.getConf(bone["boneStructure"]["module"])

  state.relation_opened.push(bone)
}

function relationUpdateSelection(event, bone) {
  bone["currentSelection"] = event
}

function relationApplySelection(bone) {
  for (let skel of bone["currentSelection"]) {
    bone["bone_instance"].addRelation(toRaw(skel), bone["bone_instance_boneName"])
  }
  relationRemoveHandler(bone)
}

function relationCloseAction(event, bone) {
  if (event.detail.source === "overlay") {
    event.preventDefault()
    return 0
  }
  relationRemoveHandler(bone)
}

function relationRemoveHandler(bone) {
  state.relation_opened = state.relation_opened.filter((i) => i !== bone)
}

function editViewFilter(handler) {
  let filter = {}

  if (handler["filter"]) {
    filter = handler["filter"]
  }
  if (!viform.value?.state?.skel) return filter

  //todo set Context on routing
  if (typeof handler["context"] === "object") {
    for (const [k, v] of Object.entries(handler["context"])) {
      let resolved = viform.value.state.skel
      let found = true
      for (const part of String(v).split(".")) {
        if (resolved && typeof resolved === "object" && part in resolved) {
          resolved = resolved[part]
        } else {
          found = false
          break
        }
      }
      if (found) {
        if (k.startsWith("@")) {
          contextStore.setContext(k, resolved, state.tabId) //recursion error ,we need a tabid rework
        }
        filter[k] = resolved
      }
    }
  } else {
    filter[handler["context"]] = props.skelkey
    if (handler["context"].startsWith("@")) {
      contextStore.setContext(handler["context"], props.skelkey, state.tabId) //recursion error ,we need a tabid rework
    }
  }
  return filter
}

function getEditView(handler) {
  let currentModule = dbStore.getConf(handler["module"])
  //fluidpage editview always use lists
  if (currentModule["handlerComponent"] === "fluidpagehandler") {
    return "listhandler"
  }
  return currentModule["handlerComponent"]
}

async function formfailed(error) {
  state.formfailed = await error.response.json()
}

function getCartValue(value) {
  if (value === null || value === undefined) {
    return ""
  }
  if (typeof value === "object") {
    return value?.value || value?.descr || value?.name || ""
  }
  return value
}

function getOptionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? null : numberValue
}

function getNumber(value) {
  return getOptionalNumber(value) ?? 0
}

watch(
  () => props.errors,
  (newVal, oldVal) => {
    state.errors = props.errors
  }
)

watch(
  () => viform.value?.state?.skel,
  (newVal, oldVal) => {
    const cartKey = newVal?.cart?.dest?.key
    if (!cartKey) {
      cartList.value = null
      return
    }

    cartList.value = ListRequest("shop_cart_" + Date.now(), {
      module: "shop/cart",
      renderer: "vi",
      params: {
        skelType: "leaf",
        parentrepo: cartKey,
      },
    })

    cartList.value.fetchAll().catch((error) => {
      messageStore.addMessage("error", `${error.message}`, error.response?.url)
    })
  }
)

onActivated(() => {
  let tabData = dbStore.getTabById(route.query["_"])

  if (tabData?.["update"]) {
    reloadAction()
    tabData["update"] = false
  }
})
</script>

<style scoped>
.split {
  flex: 1;
  height: 0;

  &::part(panel) {
    display: flex;
    flex-direction: column;
  }
}

.topbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: var(--sl-spacing-small);
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.25);
  z-index: 1;
}

.top-headline {
  margin-right: auto;
  color: var(--sl-color-primary-500);
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  position: relative;

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

sl-details {
  &::part(prefix) {
    display: none;
  }

  &::part(base) {
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
    border-bottom: solid 1px var(--sl-color-neutral-300);
  }

  &::part(summary) {
    font-weight: 700;
  }
}

.footer {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
}

.wrap-for-popup {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
}

.embeded-list {
  position: relative;
  min-height: 400px;

  :deep(.main-wrapper) {
    height: auto;

    max-height: calc(100vh - 170px);
  }

  :deep(.main) {
    height: auto;
  }
}

.errorwrapper {
  padding: 20px;
}

.metainfo {
  display: flex;
  gap: 10px;
  width: 100%;
  padding: 10px;
}

.metainfo > div {
  flex: 1 1 0;
  min-width: 0;
}

.boxwrapper {
  background-color: var(--sl-color-neutral-100);
  padding: 10px;
  border: 1px solid var(--sl-color-neutral-300);
  border-radius: 10px;
}

.cartinfo {
  padding: 10px;
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
}

.cart-table__total-column {
  width: 10%;
}

.cart-table th,
.cart-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--sl-color-neutral-300);
  text-align: left;
  vertical-align: top;
}

.cart-table th {
  color: var(--sl-color-neutral-700);
  font-size: var(--sl-font-size-small);
  font-weight: 700;
}

.cart-table tfoot td {
  background-color: var(--sl-color-neutral-50);
  font-weight: 600;
}

.cart-table__quantity,
.cart-table__price {
  text-align: right;
  white-space: nowrap;
}

.cart-table__empty {
  color: var(--sl-color-neutral-600);
  text-align: center;
}

.cart-table__summary-label {
  text-align: right;
}

.cart-table__summary-detail {
  display: block;
  color: var(--sl-color-neutral-600);
  font-size: var(--sl-font-size-x-small);
  font-weight: 400;
}

.order-note-details {
  margin-bottom: var(--sl-spacing-medium);
}

.order-note-details::part(base) {
  background-color: var(--sl-color-neutral-100);
  border: 1px solid var(--sl-color-neutral-300);
  border-radius: 10px;
}

.order-note-details::part(header) {
  padding: 10px;
}

.order-note-details::part(content) {
  padding: 0 10px 10px;
}

.order-note-details .top-headline {
  margin: 0;
}

.cart-note__text {
  margin: 0;
  white-space: pre-wrap;
}

.cart-table__summary-total td {
  border-top: 2px solid var(--sl-color-neutral-400);
  font-weight: 700;
}
</style>
