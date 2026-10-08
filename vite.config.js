import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from "rollup-plugin-visualizer";
import fs from 'fs'
import path from 'path'

// Peculiar People: expose city-maps/data (written by fetch_map.py) at /local-data.
const dataDir = fileURLToPath(new URL('../data', import.meta.url))
function localData() {
  return {
    name: 'local-data',
    configureServer(server) {
      server.middlewares.use('/local-data', (req, res, next) => {
        const file = path.join(dataDir, path.basename(decodeURIComponent(req.url.split('?')[0])))
        if (!file.endsWith('.json') || !fs.existsSync(file)) return next()
        res.setHeader('Content-Type', 'application/json')
        fs.createReadStream(file).pipe(res)
      })
    }
  }
}


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), localData(), visualizer({
  //  template: 'network'
  })],
  base: '',
  server: {
    port: 8080
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
