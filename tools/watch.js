import chokidar from 'chokidar'
import fs from 'fs'
import os from 'os'
import path from 'path'

const baseDir = './src'
const testDir = path.join(os.homedir(), 'Desktop', 'Shut Up Test Extensions')
const platforms = ['chrome', 'firefox']
const overrides = {
  chrome: [
    {
      src: 'manifest.ffx.json',
      dest: null
    }
  ],
  firefox: [
    {
      src: 'manifest.ffx.json',
      dest: 'manifest.json'
    },
    {
      src: 'manifest.json',
      dest: null
    }
  ]
}

process.chdir(baseDir)

try {
  fs.mkdirSync(testDir, { recursive: true })
} catch (e) {}

const handleUpdate = (event, fsEntry) => {
  const srcPath = path.join(path.resolve(baseDir), '../', fsEntry)
  console.log(event, srcPath)

  platforms.forEach(platform => {
    const destEntry = (() => {
      const override = overrides[platform].find(({ src }) => src === fsEntry)
      return override ? override.dest : fsEntry
    })()
    if (destEntry === null) return

    const destPath = path.join(testDir, platform, destEntry)

    switch (event) {
      case 'add':
      case 'change':
        fs.copyFileSync(srcPath, destPath)
        break
      case 'addDir':
        try {
          fs.mkdirSync(destPath)
        } catch (e) {}
        break
      case 'unlink':
      case 'unlinkDir':
        fs.rmSync(destPath, { recursive: true })
        break
    }
  })
}

chokidar.watch('./', { awaitWriteFinish: true }).on('all', handleUpdate)
