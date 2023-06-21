<template>
  <header>
    <!-- <router-link to="/" class="head"> -->
    <div class="head" @click="homebutton()">
      <div class="logo">
        <sl-icon src="logo-cube.svg"></sl-icon>
      </div>
      <h1 class="main-headline">
        {{ appStore.state["admin.name"] }} {{ dbStore.state["handlers.active"] }}
      </h1>
    </div>
    <!-- </router-link> -->

    <div class="main-group">
      <!--<component v-for="action in dbStore.state['topbar.actions']" :is="action">
            </component>-->

      <sl-avatar
        :image="state.avatarUser"
        @click="state.sidebarOpen = !state.sidebarOpen"
        :label="state.name"
        :initials="state.nameInitials"
        class="user"
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

          <sl-button variant="primary" size="small" @click="userStore.logout">{{
            $t("sidebar.logout")
          }}</sl-button>
        </div>

        <div class="drawer-scroller">
          <div class="group">
            <div class="group-headline">
              {{ $t("sidebar.section_general_name") }}
            </div>
            <sl-button size="medium">
              <sl-icon name="gear"></sl-icon>
              {{ $t("sidebar.section_general_configuration") }}
            </sl-button>
            <sl-button size="medium">
              <sl-icon name="gear"></sl-icon>
              {{ $t("sidebar.section_general_cache") }}
            </sl-button>
          </div>
          <div class="group">
            <div class="group-headline">
              {{ $t("sidebar.section_system_name") }}
            </div>
            <sl-button size="medium">
              <sl-icon name="gear"></sl-icon>
              {{ $t("sidebar.section_system_searchindex") }}
            </sl-button>
            <sl-button size="medium">
              <sl-icon name="gear"></sl-icon>
              {{ $t("sidebar.section_system_vacuum") }}
            </sl-button>
            <sl-button size="medium">
              <sl-icon name="gear"></sl-icon>
              {{ $t("sidebar.section_system_entities") }}
            </sl-button>
          </div>
        </div>

        <div slot="footer" class="drawer-footer">
          <div class="footer-item">Vi: {{ state.viVersion }}</div>
          <div class="footer-item">Core: {{ state.coreVersion }}</div>
        </div>
      </sl-drawer>
    </div>
  </header>
</template>

<script lang="ts">
import { useUserStore } from "../stores/user";
import { useAppStore } from "../stores/app";
import { useDBStore } from "../stores/db";
import { defineComponent, reactive, computed } from "vue";
import router from "../routes";

export default defineComponent({
  setup(props, context) {
    const userStore = useUserStore();
    const appStore = useAppStore();
    const dbStore = useDBStore();
    const state = reactive({
      sidebarOpen: false,
      nameInitials: computed(() => {
        let name = "";
        if (!userStore.state.user) return name;

        if (
          userStore.state.user["firstname"] &&
          userStore.state.user["lastname"]
        ) {
          name =
            userStore.state.user["firstname"][0] +
            userStore.state.user["lastname"][0];
        } else {
          let nameSplitted = userStore.state.user["name"].split(" ");
          for (let namePart in nameSplitted) {
            name += namePart[0];
          }
        }
        return name;
      }),
      name: computed(() => {
        let name = "";
        if (!userStore.state.user) return name;

        if (
          userStore.state.user["firstname"] &&
          userStore.state.user["lastname"]
        ) {
          name =
            userStore.state.user["firstname"] +
            " " +
            userStore.state.user["lastname"];
        } else {
          name = userStore.state.user["name"];
        }
        return name;
      }),
      avatarUser: computed(() => {
        let avatar = "";
        if (!userStore.state.user) return avatar;

        return userStore.state.user["image"];
      }),
      viVersion: computed(() => {
        let vi = "";
        if (!appStore.state["vi.version"]) return vi;
        for (let i = 0; i < appStore.state["vi.version"].length; i++) {
          vi += appStore.state["vi.version"][i];
          if (i < appStore.state["vi.version"].length - 1) {
            vi += ".";
          }
        }
        return vi;
      }),
      coreVersion: computed(() => {
        let core = "";
        if (!appStore.state["core.version"]) return core;
        for (let i = 0; i < appStore.state["core.version"].length; i++) {
          core += appStore.state["core.version"][i];
          if (i < appStore.state["core.version"].length - 1) {
            core += ".";
          }
        }
        return core;
      }),
    });

    function homebutton() {
      dbStore.state["handlers.active"] = 0;
      router.push("/");
    }

    return {
      userStore,
      appStore,
      dbStore,
      state,
      homebutton,
    };
  },
});
</script>

<style scoped lang="less">
header {
  height: 60px;
  border-bottom: 2px solid var(--sl-color-primary-500);
  display: flex;
  flex-direction: row;
  font-size: 0.9rem;
  align-items: center;
  min-height: 35px;
  position: relative;
  text-align: center;
  justify-content: space-between;
  //box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  z-index: 99;
}

.head {
  height: 100%;
  display: flex;
  align-items: center;

  h1 {
    margin-left: 15px;
    font-size: 1.2em;
    font-weight: 700;
    color: var(--vi-foreground-color);
  }

  .logo {
    background: var(--sl-color-primary-500);
    height: 100%;
    color: var(--sl-color-neutral-0);
    width: calc(2.5rem + 2 * 1.25 * 3px);
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;

    sl-icon {
      width: 75%;
      height: 75%;
    }
  }
}

.main-group {
  margin-right: 15px;
}

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

  sl-button {
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

    sl-icon {
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

.user{
  cursor: pointer;
}
</style>
