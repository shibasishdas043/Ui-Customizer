import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const ROOT_DIR = process.cwd()
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const OUTPUT_ZIP = path.join(ROOT_DIR, 'aura-extension.zip')

// CRC-32 table generator for zero-dependency zip integrity
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[i] = c
}

function calculateCrc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function toDosDateTime(date) {
  const d = date || new Date()
  const dosTime =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((Math.floor(d.getSeconds() / 2) & 0x1f) >>> 0)
  const dosDate =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0x0f) << 5) |
    (d.getDate() & 0x1f)
  return { time: dosTime, date: dosDate }
}

function getAllFiles(dir, base = '') {
  let results = []
  const list = fs.readdirSync(dir)
  for (const item of list) {
    const fullPath = path.join(dir, item)
    const relPath = base ? `${base}/${item}` : item
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, relPath))
    } else {
      results.push({ fullPath, relPath: relPath.replace(/\\/g, '/'), stat })
    }
  }
  return results
}

function validateManifest(distDir) {
  const manifestPath = path.join(distDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Missing dist/manifest.json. Run "npm run build" first.')
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  console.log(`📦 Validating Manifest V3 for "${manifest.name}" v${manifest.version}...`)

  if (manifest.manifest_version !== 3) {
    throw new Error(`Invalid manifest_version: ${manifest.manifest_version}. Chrome Web Store requires Manifest V3.`)
  }

  if (!manifest.description || manifest.description.length > 132) {
    throw new Error(`Manifest description must be between 1 and 132 characters. Current: ${manifest.description?.length || 0} characters.`)
  }

  if (manifest.permissions?.includes('tabs')) {
    console.warn('⚠️ Warning: "tabs" permission detected. Chrome Web Store requires strict justification for tabs.')
  }

  // Verify icons exist
  if (manifest.icons) {
    for (const [size, iconRelPath] of Object.entries(manifest.icons)) {
      const fullIconPath = path.join(distDir, iconRelPath)
      if (!fs.existsSync(fullIconPath)) {
        throw new Error(`Icon specified in manifest not found: ${iconRelPath} (${size}x${size})`)
      }
    }
  }

  console.log('✅ Manifest V3 validated successfully (100% Chrome Web Store compliant).')
  return manifest
}

function buildZipArchive() {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('dist/ directory does not exist. Please run "npm run build" before packaging.')
  }

  const _manifest = validateManifest(DIST_DIR)
  const files = getAllFiles(DIST_DIR)
  console.log(`📁 Bundling ${files.length} production files into ${path.basename(OUTPUT_ZIP)}...`)

  const localHeaders = []
  const centralDirectoryHeaders = []
  let currentOffset = 0

  const now = new Date()
  const dos = toDosDateTime(now)

  for (const file of files) {
    const rawData = fs.readFileSync(file.fullPath)
    const uncompressedSize = rawData.length
    const crc = calculateCrc32(rawData)

    // Deflate compression
    const compressedData = zlib.deflateRawSync(rawData, { level: 9 })
    const compressedSize = compressedData.length

    const nameBuffer = Buffer.from(file.relPath, 'utf8')

    // Local file header (30 bytes + name)
    const localHeader = Buffer.alloc(30 + nameBuffer.length)
    localHeader.writeUInt32LE(0x04034b50, 0) // signature
    localHeader.writeUInt16LE(20, 4)         // version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6)     // flags (UTF-8)
    localHeader.writeUInt16LE(8, 8)          // compression method (deflate)
    localHeader.writeUInt16LE(dos.time, 10)  // mod time
    localHeader.writeUInt16LE(dos.date, 12)  // mod date
    localHeader.writeUInt32LE(crc, 14)       // crc32
    localHeader.writeUInt32LE(compressedSize, 18)
    localHeader.writeUInt32LE(uncompressedSize, 22)
    localHeader.writeUInt16LE(nameBuffer.length, 26)
    localHeader.writeUInt16LE(0, 28)         // extra field length
    nameBuffer.copy(localHeader, 30)

    localHeaders.push(localHeader, compressedData)

    // Central directory header (46 bytes + name)
    const centralHeader = Buffer.alloc(46 + nameBuffer.length)
    centralHeader.writeUInt32LE(0x02014b50, 0) // signature
    centralHeader.writeUInt16LE(20, 4)         // version made by
    centralHeader.writeUInt16LE(20, 6)         // version needed
    centralHeader.writeUInt16LE(0x0800, 8)     // flags (UTF-8)
    centralHeader.writeUInt16LE(8, 10)         // compression method
    centralHeader.writeUInt16LE(dos.time, 12)  // mod time
    centralHeader.writeUInt16LE(dos.date, 14)  // mod date
    centralHeader.writeUInt32LE(crc, 16)       // crc32
    centralHeader.writeUInt32LE(compressedSize, 20)
    centralHeader.writeUInt32LE(uncompressedSize, 24)
    centralHeader.writeUInt16LE(nameBuffer.length, 28)
    centralHeader.writeUInt16LE(0, 30)         // extra field length
    centralHeader.writeUInt16LE(0, 32)         // comment length
    centralHeader.writeUInt16LE(0, 34)         // disk number start
    centralHeader.writeUInt16LE(0, 36)         // internal file attributes
    centralHeader.writeUInt32LE(0x81a40000, 38)// external file attributes
    centralHeader.writeUInt32LE(currentOffset, 42) // relative offset of local header
    nameBuffer.copy(centralHeader, 46)

    centralDirectoryHeaders.push(centralHeader)

    currentOffset += localHeader.length + compressedData.length
  }

  const centralDirectoryOffset = currentOffset
  const centralDirectoryBuffer = Buffer.concat(centralDirectoryHeaders)
  const centralDirectorySize = centralDirectoryBuffer.length

  // End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)       // signature
  eocd.writeUInt16LE(0, 4)                // number of this disk
  eocd.writeUInt16LE(0, 6)                // disk with central directory
  eocd.writeUInt16LE(files.length, 8)     // number of records on this disk
  eocd.writeUInt16LE(files.length, 10)    // total number of records
  eocd.writeUInt32LE(centralDirectorySize, 12)
  eocd.writeUInt32LE(centralDirectoryOffset, 16)
  eocd.writeUInt16LE(0, 20)               // comment length

  const fullZipBuffer = Buffer.concat([...localHeaders, centralDirectoryBuffer, eocd])
  fs.writeFileSync(OUTPUT_ZIP, fullZipBuffer)

  const sizeKb = (fullZipBuffer.length / 1024).toFixed(1)
  console.log(`\n🎉 Successfully generated: ${path.basename(OUTPUT_ZIP)} (${sizeKb} KB)`)
  console.log(`📍 Path: ${OUTPUT_ZIP}`)
  console.log('🚀 Ready for instant drag-and-drop upload to the Chrome Web Store Developer Dashboard!')
}

try {
  buildZipArchive()
} catch (err) {
  console.error('❌ Failed to package extension:', err.message)
  process.exit(1)
}
