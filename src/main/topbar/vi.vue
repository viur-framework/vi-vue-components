<template>
  <sl-avatar
    :image="state.avatarUser"
    :label="state.name"
    :initials="state.nameInitials"
    class="user"
    @click="state.sidebarOpen = !state.sidebarOpen"
  ></sl-avatar>

  <sl-drawer
    :label="$t('sidebar.name')"
    class="drawer-overview"
    :open="state.sidebarOpen"
    @sl-hide="state.sidebarOpen = false"
  >
    <div class="drawer-header">
      <sl-avatar
        :image="state.avatarUser"
        :label="state.name"
        :initials="state.nameInitials"
        @click="openUser"
      ></sl-avatar>

      <div
        class="name"
        @click="openUser"
      >
        {{ state.name }}
        <span class="subline">{{ userStore.state.user.name }}</span>
      </div>
      <sl-button-group>
        <sl-button
          variant="primary"
          size="small"
          @click="state.openLogout = !state.openLogout"
          >{{ $t("sidebar.logout") }}
        </sl-button>
        <sl-button
          variant="primary"
          size="small"
          @click="state.sidebarOpen = false"
        >
          <sl-icon
            slot="prefix"
            name="x-lg"
          >
          </sl-icon>
        </sl-button>
      </sl-button-group>
    </div>

    <div class="drawer-scroller">
      <!--
      <div class="group">
        <div class="group-headline">
          {{ $t("sidebar.section_general_name") }}
        </div>
        <sl-button size="medium">
          <sl-icon name="gear"></sl-icon>
          Aktuelles Log
        </sl-button>
        <sl-button size="medium">
          <sl-icon name="gear"></sl-icon>
          {{ $t("sidebar.section_general_cache") }}
        </sl-button>
      </div> -->

      <div class="group">
        <template v-if="userStore.userAccess.includes('scriptor')">
          <div class="group-headline">
            {{ $t("sidebar.section_tools") }}
          </div>
          <sl-button
            size="medium"
            @click="openScriptor"
          >
            <sl-icon name="code-slash"></sl-icon>
            Scriptor
          </sl-button>
        </template>

        <div class="group-headline">
          {{ $t("sidebar.section_system_name") }}
        </div>
        <template
          v-for="item in dbStore.state['tasks']"
          :key="item['key']"
        >
          <sl-button
            size="medium"
            @click="state.openedTask = item['key']"
          >
            <sl-icon name="gear"></sl-icon>
            {{ item["name"] }}
          </sl-button>

          <teleport
            v-if="state.openedTask === item['key']"
            to="#dialogs"
            :disabled="state.openedTask !== item['key']"
          >
            <sl-dialog
              :label="item['name']"
              style="--width: 50%"
              open
              @sl-after-hide="state.openedTask = null"
            >
              <div style="height: 400px">
                <vi-form :ref="forms[`form_${item['key']}`]"
                  :useCategories="false"
                  module="_tasks"
                  action="execute"
                  :group="item['key']"
                >
                </vi-form>

                <sl-alert variant="success" :open="state.taskstarted" duration="5000">{{ item["name"] }} started... </sl-alert>
              </div>

              <sl-button
                slot="footer"
                :loading="forms[`form_${item['key']}`]?.value?.[0]?.state?.loading"
                variant="success"
                @click="executeTask(item['key'])"
              >
                {{ $t("confirm") }}
              </sl-button>
              <sl-button
                slot="footer"
                variant="danger"
                @click="state.openedTask = null"
              >
                {{ $t("abort") }}
              </sl-button>
            </sl-dialog>
          </teleport>
        </template>
      </div>
    </div>

    <div
      slot="footer"
      class="drawer-footer"
    >
      <div class="footer-item">Admin: {{ state.viVersion }}</div>
      <div class="footer-item">Core: {{ state.coreVersion }}</div>
    </div>
  </sl-drawer>

  <teleport
    v-if="state.openLogout"
    to="#dialogs"
    :disabled="!state.openLogout"
  >
    <sl-dialog
      :label="$t('sidebar.logout')"
      style="--width: 50%"
      class="logout-confirm"
      open
      @sl-after-hide="state.openLogout = false"
    >
      {{ $t("sidebar.logout_text") }}

      <sl-button
        slot="footer"
        variant="danger"
        @click="state.openedTask = null"
      >
        {{ $t("abort") }}
      </sl-button>
      <sl-button
        slot="footer"
        variant="success"
        :loading="state.logoutloading"
        @click="logout"
      >
        {{ $t("confirm") }}
      </sl-button>
    </sl-dialog>
  </teleport>
</template>

<script setup>
import { reactive, defineComponent, computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useMessageStore } from "../../stores/message"
import { useAppStore } from "../../stores/app"
import { useDBStore } from "../../stores/db"
import FormHandler from "../../handler/FormHandler.vue"
import { Request } from "@viur/vue-utils"
import { useEventListener } from "@vueuse/core"
import ViForm from "@viur/vue-utils/forms/ViForm.vue"

    const userStore = useUserStore()
    const appStore = useAppStore()
    const dbStore = useDBStore()
    const messageStore = useMessageStore()
    const router = useRouter()

    let forms = {}
    const state = reactive({
      sidebarOpen: false,
      nameInitials: computed(() => {
        let name = ""
        if (!userStore.state.user) return name

        if (userStore.state.user["firstname"] && userStore.state.user["lastname"]) {
          name = userStore.state.user["firstname"][0] + userStore.state.user["lastname"][0]
        } else {
          let nameSplitted = userStore.state.user["name"].split(" ")
          for (let namePart in nameSplitted) {
            name += namePart[0]
          }
        }
        return name
      }),
      name: computed(() => {
        let name = ""
        if (!userStore.state.user) return name

        if (userStore.state.user["firstname"] && userStore.state.user["lastname"]) {
          name = userStore.state.user["firstname"] + " " + userStore.state.user["lastname"]
        } else {
          name = userStore.state.user["name"]
        }
        return name
      }),
      avatarUser: computed(() => {
        let avatar = ""
        if (!userStore.state.user) return avatar

        return userStore.state.user["image"]
      }),
      viVersion: computed(() => {
        let vi = ""
        if (!appStore.state["vi.version"]) return vi
        for (let i = 0; i < appStore.state["vi.version"].length; i++) {
          vi += appStore.state["vi.version"][i]
          if (i < appStore.state["vi.version"].length - 1) {
            vi += "."
          }
        }
        return vi
      }),
      coreVersion: computed(() => {
        let core = ""
        if (!appStore.state["core.version"]) return core
        appStore.state["core.version"] = appStore.state["core.version"].filter((e) => e !== null)
        return appStore.state["core.version"].join(".")
      }),
      openedTask: null,
      openLogout: null,
      formValues: null,
      taskstarted:false,
      logoutloading:false
    })


    useEventListener(window, "beforeunload", (e) => {
      e.preventDefault()
      e.returnValue = "Do you really want to reload?"
    })

    onMounted(() => {
      Request.get("/vi/_tasks/list").then(async (resp) => {
        let data = await resp.json()
        dbStore.state["tasks"] = data["skellist"]

        for(const task of data["skellist"]){
          forms[`form_${task["key"]}`] = ref(null)
        }
      })
    })
    function executeTask(key) {
      forms[`form_${key}`].value[0].sendData(`/vi/_tasks/execute/${key}`).then(async (resp)=>{
        let data = await resp.json()
        if (data["action"] === "addSuccess"){
          state.taskstarted = true
        }
      })
    }
    function openTask(key) {
      state.openedTask = key
    }
    function setValues(formValues){
      console.log(formValues)
      state.formValues = formValues
    }

    function openUser() {
      let route = router.resolve("/db/user/edit/self")
      dbStore.addOpened(route, "user")
      state.sidebarOpen = !state.sidebarOpen
    }

    function openScriptor() {
      let url = `${import.meta.env.VITE_API_URL}${appStore.state["admin.scriptor.url"]}#/home`
      window.open(url, "_blank").focus()
    }

    function logout(){
      state.logoutloading = true
      userStore.logout().then(async (resp)=>{
        let data = await resp.json()
        state.logoutloading = false
      })
    }
</script>

<style scoped>
sl-avatar {
  --size: 2.2em;
}

sl-drawer {
  &::part(panel) {
    box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.3);
  }

  &::part(overlay) {
    background-color: var(--vi-background-color);
    opacity: 0.8;
    cursor: pointer;
  }

  &::part(header) {
    display: none;
  }

  &::part(body) {
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    padding: 0;
    background-color: var(--vi-background-color);
  }

  &::part(footer) {
    padding: 0;
  }
}

.drawer-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px 15px;
  height: 60px;
  border-bottom: 2px solid var(--sl-color-primary-500);
  & sl-avatar {
    cursor: pointer;
  }
}

.drawer-footer {
  background-color: var(--sl-color-primary-500);
  color: #fff;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 7px 15px;
}

.drawer-scroller {
  flex: 1;
  height: 1px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 15px;
}

.group {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  color: var(--vi-foreground-color);

  & sl-button {
    &::part(base) {
      justify-content: flex-start;
      background-color: transparent;
      border: none;
      color: var(--vi-foreground-color);
      transition: all ease 0.3s;
    }

    &::part(label) {
      padding: 0 5px;
    }

    & sl-icon {
      margin-right: 10px;
    }

    &:hover {
      &::part(base) {
        background-color: var(--sl-color-neutral-200);
      }
    }
  }
}

.group-headline {
  padding: 5px;
  text-align: left;
  font-weight: bold;
}

.name {
  color: var(--vi-foreground-color);
  font-weight: bold;
  margin-left: 15px;
  font-size: 1.1em;
  margin-right: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user {
  cursor: pointer;
}

.logout-confirm {
  &::part(footer) {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
}

.subline {
  font-size: 0.7rem;
  text-align: left;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
