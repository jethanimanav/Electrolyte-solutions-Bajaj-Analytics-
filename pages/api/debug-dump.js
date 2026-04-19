// /api/debug-dump — v3: full rich preview (no DB write)
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import os from 'os'
import zlib from 'zlib'
import { parseDumpFile } from '../../lib/dump-parser'

export const config = { api: { bodyParser: false } }

const uploadDir = path.join(os.tmpdir(), 'pcb_uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
const upload = multer({ dest: uploadDir, limits: { fileSize: 500 * 1024 * 1024 } })
const runMiddleware = (req, res, fn) => new Promise((resolve, reject) => { fn(req, res, (r) => (r instanceof Error ? reject(r) : resolve(r))) })

const decompressAll = (buffer) => {
  const SECOND = new Set([0x01, 0x9c, 0xda, 0x5e])
  const chunks = []
  let i = 0
  while (i < buffer.length - 2) {
    if (buffer[i] === 0x78 && SECOND.has(buffer[i + 1])) {
      let best = null
      for (const win of [2048, 16384, 65536, 262144, 524288, buffer.length - i]) {
        try { const dec = zlib.inflateSync(buffer.slice(i, Math.min(i + win, buffer.length))); if (dec.length > 20) best = dec.toString('utf8') } catch {}
      }
      if (best) chunks.push(best)
    }
    i++
  }
  return chunks.join('\n')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  let filePath = null
  try {
    await runMiddleware(req, res, upload.single('file'))
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    filePath = req.file.path

    const buffer = fs.readFileSync(filePath)
    const isPGDMP = buffer.slice(0, 5).toString('ascii') === 'PGDMP'
    const isGzip  = buffer[0] === 0x1f && buffer[1] === 0x8b

    let text = ''
    if (isPGDMP) text = decompressAll(buffer)
    else if (isGzip) text = zlib.gunzipSync(buffer).toString('utf8')
    else text = buffer.toString('utf8')

    const insertMatches = [...text.matchAll(/INSERT INTO (?:public\.)?(\w+)\s+VALUES/gi)]
    const allTables = [...new Set(insertMatches.map(m => m[1]))]
    const rowCounts = {}
    for (const t of allTables) {
      const re = new RegExp(`INSERT INTO (?:public\\.)?${t}\\s+VALUES`, 'gi')
      rowCounts[t] = (text.match(re) || []).length
    }

    // Parse everything
    let parsed = { bom: [], engineers: [], consolidatedData: [], componentData: [], statusData: [], pcbMaster: [] }
    try { parsed = parseDumpFile(filePath) } catch {}

    const { bom, engineers, consolidatedData, componentData, statusData, pcbMaster } = parsed

    const bomRows = rowCounts.bom || bom.length
    const cdRows  = rowCounts.consolidated_data || rowCounts.pcb_data || consolidatedData.length
    const engRows = rowCounts.engineers || engineers.length

    let recommendation
    if (!isPGDMP && !isGzip) recommendation = 'Plain text SQL detected — import should work. Proceed with Import.'
    else if (isPGDMP && text.length < 100) recommendation = 'PGDMP detected but could not decompress. Try: pg_restore -Fp yourfile.dump > yourfile.sql'
    else if (bomRows > 0 || cdRows > 0) recommendation = `File looks good — found ${bomRows} BOM, ${cdRows} PCB records, ${engRows} engineers. Ready to import.`
    else if (allTables.length === 0) recommendation = 'No table data detected. Try: pg_restore -Fp yourfile.dump > yourfile.sql'
    else recommendation = `Found tables: ${allTables.join(', ')} — but no matching data rows. Check if this is the correct dump file.`

    res.json({
      file: { name: req.file.originalname, size_mb: (buffer.length / 1024 / 1024).toFixed(2), size_human: `${(buffer.length / 1024 / 1024).toFixed(1)} MB`, format: isPGDMP ? 'PostgreSQL custom (PGDMP)' : isGzip ? 'Gzip SQL' : 'Plain SQL' },
      content: { tables_detected: allTables, insert_counts: rowCounts, bom_like_lines: bomRows, data_like_lines: cdRows, engineers_found: engRows },
      // Full parsed data for preview
      bom_sample: bom.slice(0, 500),
      engineers,
      pcb_sample: consolidatedData.slice(0, 500),
      component_sample: componentData.slice(0, 300),
      status_sample: statusData,
      pcb_master: pcbMaster,
      recommendation,
      summary: {
        total_bom: bom.length,
        total_pcb_records: consolidatedData.length,
        total_engineers: engineers.length,
        total_components: componentData.length,
        total_status_entries: statusData.length,
        total_pcb_master: pcbMaster.length,
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    if (filePath && fs.existsSync(filePath)) try { fs.unlinkSync(filePath) } catch {}
  }
}
