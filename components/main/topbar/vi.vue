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
  >
    <div class="drawer-header">
      <sl-avatar
        :image="state.avatarUser"
        :label="state.name"
        :initials="state.nameInitials"
        @click="state.sidebarOpen = !state.sidebarOpen"
      ></sl-avatar>

      <div class="name">{{ state.name }}</div>

      <sl-button
        variant="primary"
        size="small"
        @click="userStore.logout"
        >{{ $t("sidebar.logout") }}
      </sl-button>
    </div>

    <div class="drawer-scroller">
      <div class="group">
        <div class="group-headline">
          {{ $t("sidebar.section_general_name") }}
        </div>
        <sl-button size="medium">
          <sl-icon name="gear"></sl-icon>
          Aktuelles Log
        </sl-button>
        <!--<sl-button size="medium">
          <sl-icon name="gear"></sl-icon>
          {{ $t("sidebar.section_general_cache") }}
        </sl-button>      -->
      </div>

      <div class="group">
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
                <form-handler
                  :no-topbar="true"
                  module="_tasks"
                  action="execute"
                  :secure="true"
                  :group="item['key']"
                  @change="setValues"
                >
                </form-handler>
              </div>
              <sl-button
                slot="footer"
                :disabled="!state.formValues"
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

        <!--<sl-button size="medium">
          <sl-icon name="gear"></sl-icon>
          {{ $t("sidebar.section_system_vacuum") }}
        </sl-button>
        <sl-button size="medium">
          <sl-icon name="gear"></sl-icon>
          {{ $t("sidebar.section_system_entities") }}
        </sl-button>-->
      </div>
    </div>

    <div
      slot="footer"
      class="drawer-footer"
    >
      <div class="footer-item">Vi: {{ state.viVersion }}</div>
      <div class="footer-item">Core: {{ state.coreVersion }}</div>
    </div>
  </sl-drawer>
</template>

<script lang="ts">
import { reactive, defineComponent, computed, onMounted } from "vue"
import { useUserStore } from "../../stores/user"
import { useMessageStore } from "../../stores/message"
import { useAppStore } from "../../stores/app"
import { useDBStore } from "../../stores/db"
import FormHandler from "../../handler/FormHandler.vue"
import { Request } from "@viur/vue-utils"

export default defineComponent({
  props: {},
  components: { FormHandler },
  setup(props, context) {
    const userStore = useUserStore()
    const appStore = useAppStore()
    const dbStore = useDBStore()
    const messageStore = useMessageStore()
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
        for (let i = 0; i < appStore.state["core.version"].length; i++) {
          core += appStore.state["core.version"][i]
          if (i < appStore.state["core.version"].length - 1) {
            core += "."
          }
        }
        return core
      }),
      openedTask: null,
      formValues: null
    })

    function logout() {
      userStore.logout()
    }

    onMounted(() => {
      Request.get("/vi/_tasks/list").then(async (resp) => {
        let data = await resp.json()
        dbStore.state["tasks"] = data["skellist"]
      })
    })
    function executeTask(key) {
      const formData: FormData = new FormData()
      for (const [boneName, boneValue] of Object.entries(state.formValues)) {
        for (const value of boneValue) {
          for (const [k, v] of Object.entries(value)) {
            formData.append(k, v)
          }
        }
      }
      const obj = {}
      for (const key: string of formData.keys()) {
        obj[[key]] = formData.getAll(key)
      }

      Request.securePost("/vi/_tasks/execute/dt_RebuildSearchIndex", {
        dataObj: obj
      })
        .then(async (resp) => {
          state.openedTask = nulls
        })
        .catch((error) => {
          state.openedTask = null
          messageStore.addMessage("error", `${error.message}`, error.response?.url)
        })
    }
    function openTask(key) {
      state.openedTask = key
    }
    function setValues(formValues) {
      state.formValues = formValues
    }

    return {
      state,
      userStore,
      dbStore,
      logout,
      openTask,
      executeTask,
      setValues
    }
  }
})
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
}

.user {
  cursor: pointer;
}
</style>
