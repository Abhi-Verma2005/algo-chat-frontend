import { promises as fs } from 'node:fs'
import path from 'node:path'

async function run() {
  const distDir = path.resolve(process.cwd(), 'dist')
  const assetsDir = path.join(distDir, 'assets')
  const manifestPath = path.join(distDir, 'manifest.json')

  const files = await fs.readdir(assetsDir)
  const bgFile = files.find((f) => /^background\.js-.*\.js$/.test(f))
  if (!bgFile) {
    console.error('[fix-manifest] background bundle not found in dist/assets')
    process.exit(1)
  }

  const manifestRaw = await fs.readFile(manifestPath, 'utf-8')
  const manifest = JSON.parse(manifestRaw)

  manifest.background = manifest.background || {}
  manifest.background.service_worker = `assets/${bgFile}`
  // type module is optional; keep it safe for MV3
  manifest.background.type = 'module'

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  console.log('[fix-manifest] Updated background.service_worker ->', manifest.background.service_worker)
}

run().catch((e) => {
  console.error('[fix-manifest] error:', e)
  process.exit(1)
})
