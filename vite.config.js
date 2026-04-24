import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'

function buildZip() {
  return {
    name: 'build-zip',
    apply: 'build',
    closeBundle() {
      const out = fs.createWriteStream(path.resolve('dist/extension.zip'))
      const archive = archiver('zip', { zlib: { level: 9 } })
      archive.pipe(out)
      archive.directory(path.resolve('dist'), false)
      archive.finalize()
    }
  }
}

function firefoxManifest() {
  return {
    name: 'firefox-manifest-patch',
    closeBundle() {
      const out = path.resolve('dist/manifest.json')
      const m = JSON.parse(fs.readFileSync(out, 'utf8'))
      m.background.scripts = [m.background.service_worker]
      fs.writeFileSync(out, JSON.stringify(m, null, 2))
    }
  }
}

export default defineConfig({
  plugins: [
    crx({ manifest }),
    firefoxManifest(),
    buildZip()
  ]
})
