import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";
import copy from 'rollup-plugin-copy'
import {visualizer} from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
console.log(path.join(__dirname, "node_modules", "@viur", "viur-shoelace", "dist", "assets"))
export default defineConfig({
  plugins: [
      visualizer(),
    copy({
      targets: [
        {
          src: path.join(__dirname, "node_modules", "@viur", "viur-shoelace", "dist", "assets"),
          dest: path.join(__dirname, 'public', "viur-shoelace")
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
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    fs: {
      allow: ['/'],
    },
  },

  base:"/vi/s",
  build: {
    //emptyOutDir:true,
    //target:['esnext'],
    outDir: path.resolve(__dirname, '../../../deploy/vi'),
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
          index: path.resolve(__dirname, 'main.html'),
      },
      output: {
        chunkFileNames: (chunkinfo) => {
          if (chunkinfo['moduleIds'].filter(x => x.includes('node_modules/@viur/viur-shoelace/dist/components')).length > 0) {
            return `[name].js`
          } else {
            return `[name]-[hash].js`
          }

        },
        manualChunks(id) {
          if (id.includes('node_modules/@viur/viur-shoelace/dist/components')) {
            return "viur-shoelace/component_" + id.split("/").slice(-2)[0];
          }
          if(id.includes("node_modules/@viur/ckeditor5-build-classic/build/ckeditor.js")){
            return "viur-ckeditor.js"

          }
        }
      }
  }


  }


})
