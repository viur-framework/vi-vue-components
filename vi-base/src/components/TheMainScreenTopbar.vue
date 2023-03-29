<template>
    <header>
        <router-link to="/" class="head">
            <div class="logo">
                <sl-icon src="logo-cube.svg"></sl-icon>
            </div>
            <h1 class="main-headline">
                {{ appStore.state["vi.name"] }}
            </h1>
        </router-link>

        <div class="main-group">
            <!--<component v-for="action in appStore.state['topbar.actions']" :is="action">
            </component>-->

            <sl-avatar
              image="https://images.unsplash.com/photo-1529778873920-4da4926a72c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
              label="Avatar of a gray tabby kitten looking down"
            ></sl-avatar>

          <sl-drawer label="Drawer" class="drawer-overview" open>
            <div class="drawer-header">
                <sl-avatar
                image="https://images.unsplash.com/photo-1529778873920-4da4926a72c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                label="Avatar of a gray tabby kitten looking down"
              ></sl-avatar>
                <div class="name">
                  Roland Brose
                </div>

                <sl-button variant="primary" size="small">
                  Ausloggen
                </sl-button>
            </div>

            <div class="drawer-scroller">
              <div class="group">
                <div class="group-headline">Allgemein</div>
                <sl-button size="medium">
                  <sl-icon name="gear"></sl-icon>
                  Einstellungen
                </sl-button>
                <sl-button size="medium">
                  <sl-icon name="gear"></sl-icon>
                  Cache leeren
                </sl-button>
              </div>
              <div class="group">
                <div class="group-headline">System Jobs</div>
                <sl-button size="medium">
                  <sl-icon name="gear"></sl-icon>
                  Rebuild Search Index
                </sl-button>
                <sl-button size="medium">
                  <sl-icon name="gear"></sl-icon>
                  Vacuum Viur Relations
                </sl-button>
              </div>
            </div>

            <div slot="footer" class="drawer-footer">
              <div class="footer-item">
                Vi: 3.3
              </div>
              <div class="footer-item">
                Core: 3.3
              </div>
            </div>
          </sl-drawer>
        </div>
    </header>
</template>

<script lang="ts">
import {useUserStore} from "../stores/user";
import {useAppStore} from "../stores/app";
import {defineComponent} from "vue";

export default defineComponent({
    setup(props, context) {
        const userStore = useUserStore()
        const appStore = useAppStore()

        return {
            userStore,
            appStore
        }
    }
})
</script>

<style scoped lang="less">
header {
    height: 60px;
    border-bottom: 2px solid var(--sl-color-primary-500);
    display: flex;
    flex-direction: row;
    font-size: .9rem;
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
        color: var(--sl-foreground-color);
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

.main-group{
  margin-right: 15px
}

sl-avatar{
  --size: 2.2em;
}

sl-drawer{
  &::part(panel){
    box-shadow: 0 0 15px 0 rgba(0, 0, 0, .3);
  }

  &::part(overlay){
    background-color: var(--sl-background-color);
    opacity: .8;
  }

  &::part(header){
    display: none;
  }

  &::part(body){
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    padding: 0;
    background-color: var(--sl-background-color);
  }

  &::part(footer){
    padding: 0;
  }
}

.drawer-header{
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px 15px;
  height: 60px;
  border-bottom: 2px solid var(--sl-color-primary-500);
}

.drawer-footer{
  background-color: var(--sl-color-primary-500);
  color: #fff;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 7px 15px;
}

.drawer-scroller{
  flex: 1;
  height: 1px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 15px;
}

.group{
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  color: var(--sl-foreground-color);

  sl-button{
    &::part(base){
      justify-content: flex-start;
      background-color: transparent;
      border: none;
      color: var(--sl-foreground-color);
      transition: all ease .3s;
    }

    &::part(label){
      padding: 0 5px;
    }

    sl-icon{
      margin-right: 10px;
    }

    &:hover{
      &::part(base){
        background-color: var(--sl-hover-color);
      }
    }
  }
}

.group-headline{
  padding: 5px;
  text-align: left;
  font-weight: bold;
}

.name{
  color: var(--sl-foreground-color);
  font-weight: bold;
  margin-left: 15px;
  font-size: 1.1em;
  margin-right: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
