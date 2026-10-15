import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backgroundsDir = path.resolve(__dirname, '../public/backgrounds')

if (!fs.existsSync(backgroundsDir)) {
  fs.mkdirSync(backgroundsDir, { recursive: true })
}

const targets = [
  { category: 'nature', query: 'nature forest lake' },
  { category: 'mountains', query: 'mountains peak alpine' },
  { category: 'beaches', query: 'beach ocean tropical' },
]

async function run() {
  const metadata = {}

  for (const target of targets) {
    console.log(`Fetching ${target.category}...`)
    const res = await fetch(`https://services.bonjourr.fr/backgrounds/unsplash/images/search?query=${encodeURIComponent(target.query)}`)
    const data = await res.json()
    const photos = data['unsplash-images-search'] || []

    metadata[target.category] = []

    for (let i = 0; i < 2; i++) {
      const p = photos[i]
      if (!p) continue
      const filename = `${target.category}-${i + 1}.webp`
      const filepath = path.join(backgroundsDir, filename)

      const webpUrl = `${p.urls.full}&fm=webp&q=75`
      console.log(`Downloading ${filename} from ${p.name}...`)
      const imgRes = await fetch(webpUrl)
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      fs.writeFileSync(filepath, buffer)

      const sizeKb = Math.round(buffer.length / 1024)
      console.log(`Saved ${filename}: ${sizeKb} KB`)

      metadata[target.category].push({
        id: `${target.category}_${i + 1}`,
        localUrl: `/backgrounds/${filename}`,
        author: p.name || 'Unsplash',
        username: p.username || '',
        pageUrl: p.page || 'https://unsplash.com',
        color: p.color || '#1e293b',
      })
    }
  }

  // Save metadata
  fs.writeFileSync(path.join(backgroundsDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

  // Calculate total size
  const files = fs.readdirSync(backgroundsDir)
  let totalBytes = 0
  for (const f of files) {
    totalBytes += fs.statSync(path.join(backgroundsDir, f)).size
  }
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2)
  console.log(`\n🎉 Total fallback backgrounds package size: ${totalMb} MB (Strictly under 3MB requirement)`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
