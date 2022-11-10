import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";
import copy from 'rollup-plugin-copy'

// https://vitejs.dev/config/
console.log(path.join(__dirname, "node_modules", "@viur", "viur-shoelace", "dist", "assets"))
export default defineConfig({
  plugins: [
    copy({
      targets: [
        {
          src: path.join(__dirname, "node_modules", "@viur", "viur-shoelace", "dist", "assets"),
          dest: path.join(__dirname, 'public', 'vi', "viur-shoelace")
        }
      ]
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('sl-')
        }
      }
    })],
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `
                @import "./src/style/app.less";`
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  //base: "/vi_vue/",
  build: {
    emptyOutDir:true,
    outDir: path.resolve(__dirname, '../../deploy/vi-vue-wip-build'),
    chunkSizeWarningLimit: 700,
  }


})
