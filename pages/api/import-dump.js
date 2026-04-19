// ============================================================
// /api/import-dump  —  v7
//
// Imports EVERYTHING from a DB dump:
//   1. BOM entries         → bom table
//   2. Engineers           → engineers table
//   3. PCB repair records  → pcb_data table (part codes, OK/NFF/SCRAP/WIP etc)
//   4. Component data      → component_data table (consumption)
//   5. Status data         → status_data table
//   6. PCB Master          → pcb_master table
//   7. DC Numbers          → dc_numbers table
//   8. Users               → users table
//   9. Sheets              → sheets table
// ============================================================
import pool from '../../lib/db'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { parseDumpFile } from '../../lib/dump-parser'

export const config = { api: { bodyParser: false } }

const uploadDir = path.join(os.tmpdir(), 'pcb_uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (['.dump', '.sql', '.backup', '.pg', '.pgdump'].includes(ext)) cb(null, true)
    else cb(new Error('Only .dump / .sql / .backup files are supported'))
  },
})

const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (r) => (r instanceof Error ? reject(r) : resolve(r)))
  })

// ── Ensure tables exist ───────────────────────────────────────
const ensureTablesExist = async (client) => {
  // engineers table
  await client.query(`
    CREATE TABLE IF NOT EXISTS engineers (
      id   SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})

  // pcb_master table
  await client.query(`
    CREATE TABLE IF NOT EXISTS pcb_master (
      part_code BIGINT PRIMARY KEY,
      product_description TEXT,
      total_entries INT DEFAULT 0,
      dc_no TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})

  // status_data table
  await client.query(`
    CREATE TABLE IF NOT EXISTS status_data (
      id SERIAL PRIMARY KEY,
      part_code BIGINT,
      status TEXT,
      status_description TEXT,
      status_count INT DEFAULT 0
    )
  `).catch(() => {})

  // dc_numbers table
  await client.query(`
    CREATE TABLE IF NOT EXISTS dc_numbers (
      id SERIAL PRIMARY KEY,
      dc_no VARCHAR(100) NOT NULL,
      part_codes JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})

  // users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      auth_id VARCHAR(255),
      email VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'USER',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})

  // sheets table
  await client.query(`
    CREATE TABLE IF NOT EXISTS sheets (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    )
  `).catch(() => {})

  // Ensure scrap_rows column on upload_history
  await client.query(`
    ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS scrap_rows INTEGER DEFAULT 0
  `).catch(() => {})
}

// ── Import BOM ────────────────────────────────────────────────
const importBOM = async (client, rows) => {
  let count = 0
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    for (const r of chunk) {
      try {
        await client.query(`
          INSERT INTO bom (part_code, component, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (part_code, component)
          DO UPDATE SET description = EXCLUDED.description
        `, [r.part_code, r.location, r.description])
        count++
      } catch (e) {
        console.warn('[import-dump] BOM skip:', e.message.slice(0, 80))
      }
    }
  }
  return count
}

// ── Import Engineers ──────────────────────────────────────────
const importEngineers = async (client, rows) => {
  let count = 0
  for (const r of rows) {
    try {
      await client.query(`
        INSERT INTO engineers (id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
      `, [r.id, r.name])
      count++
    } catch {}
  }
  return count
}

// ── Import PCB Data (repair records) ─────────────────────────
const importPCBData = async (client, rows) => {
  if (rows.length === 0) return 0
  let count = 0

  // Clear existing data and replace with dump data
  await client.query('DELETE FROM pcb_data').catch(() => {})

  const CHUNK = 300
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    for (const r of chunk) {
      try {
        await client.query(`
          INSERT INTO pcb_data (
            source_id, sr_no, dc_no, branch, branch_normalized,
            product_description, part_code, defect, visiting_tech_name,
            repair_date, status, pcb_sr_no, analysis, component_change,
            engg_name, dispatch_date, failure, complaint_no
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
          ON CONFLICT DO NOTHING
        `, [
          r.source_id || null,
          r.sr_no || null,
          r.dc_no || null,
          r.branch || null,
          r.branch_normalized || null,
          r.product_description || null,
          r.part_code,
          r.defect || null,
          r.visiting_tech_name || null,
          r.repair_date || null,
          r.status || 'WIP',
          r.pcb_sr_no || null,
          r.analysis || null,
          r.component_change || null,
          r.engg_name || null,
          r.dispatch_date || null,
          r.failure || null,
          r.complaint_no || null,
        ])
        count++
      } catch (e) {
        // silent — likely column mismatch for edge cases
      }
    }
  }
  return count
}

// ── Import Component Data ─────────────────────────────────────
const importComponentData = async (client, rows) => {
  if (rows.length === 0) return 0
  let count = 0

  // Only clear and replace if we actually have component data from dump
  await client.query('DELETE FROM component_data').catch(() => {})

  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500)
    for (const r of chunk) {
      try {
        await client.query(`
          INSERT INTO component_data (part_code, component, description, count)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (part_code, component) DO UPDATE
          SET description = COALESCE(EXCLUDED.description, component_data.description),
              count = EXCLUDED.count
        `, [r.part_code, r.component, r.description || null, r.count || 0])
        count++
      } catch {}
    }
  }
  return count
}

// ── Import Status Data ────────────────────────────────────────
const importStatusData = async (client, rows) => {
  if (rows.length === 0) return 0
  let count = 0
  await client.query('DELETE FROM status_data').catch(() => {})
  for (const r of rows) {
    try {
      await client.query(`
        INSERT INTO status_data (part_code, status, status_description, status_count)
        VALUES ($1, $2, $3, $4)
      `, [r.part_code, r.status, r.status_description || r.status, r.status_count || 0])
      count++
    } catch {}
  }
  return count
}

// ── Import PCB Master ─────────────────────────────────────────
const importPCBMaster = async (client, rows) => {
  if (rows.length === 0) return 0
  let count = 0
  for (const r of rows) {
    try {
      await client.query(`
        INSERT INTO pcb_master (part_code, product_description, total_entries, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (part_code) DO UPDATE SET
          product_description = COALESCE(EXCLUDED.product_description, pcb_master.product_description),
          total_entries = EXCLUDED.total_entries,
          updated_at = NOW()
      `, [r.part_code, r.product_description, r.total_entries || 0])
      count++
    } catch {}
  }
  return count
}

// ── Import DC Numbers ─────────────────────────────────────────
const importDCNumbers = async (client, rows) => {
  if (rows.length === 0) return 0
  let count = 0
  await client.query('DELETE FROM dc_numbers').catch(() => {})
  for (const r of rows) {
    try {
      await client.query(`
        INSERT INTO dc_numbers (dc_no, part_codes, created_at, updated_at)
        VALUES ($1, $2::jsonb, COALESCE($3::timestamp, NOW()), COALESCE($4::timestamp, NOW()))
        ON CONFLICT DO NOTHING
      `, [r.dc_no, JSON.stringify(r.part_codes), r.created_at, r.updated_at])
      count++
    } catch {}
  }
  return count
}

// ── Import Users ──────────────────────────────────────────────
const importUsers = async (client, rows) => {
  if (rows.length === 0) return 0
  let count = 0
  for (const r of rows) {
    try {
      await client.query(`
        INSERT INTO users (id, auth_id, email, name, role, created_at)
        VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, NOW()))
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = COALESCE(EXCLUDED.email, users.email),
          role = EXCLUDED.role
      `, [r.id, r.auth_id, r.email, r.name, r.role, r.created_at])
      count++
    } catch {}
  }
  return count
}

// ── Import Sheets ─────────────────────────────────────────────
const importSheets = async (client, rows) => {
  if (rows.length === 0) return 0
  let count = 0
  for (const r of rows) {
    try {
      await client.query(`
        INSERT INTO sheets (id, name, created_at, updated_at)
        VALUES ($1, $2, $3::timestamp, $4::timestamp)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          updated_at = EXCLUDED.updated_at
      `, [r.id, r.name, r.created_at, r.updated_at])
      count++
    } catch {}
  }
  return count
}

// ── Generic helpers ──────────────────────────────────────────
// (Most logic moved to dump-parser.js, but these support multi-source backfills)

const buildPCBMasterFromDCNumbers = (dcNumbers) => {
  const masterMap = new Map()
  for (const dc of dcNumbers) {
    for (const pc of dc.part_codes) {
      const partCode = parseInt(pc)
      if (isNaN(partCode) || partCode < 10000) continue
      if (!masterMap.has(partCode)) {
        masterMap.set(partCode, {
          part_code: partCode,
          product_description: null,
          total_entries: 0,
          dc_no: dc.dc_no,
        })
      }
    }
  }
  return [...masterMap.values()]
}

const buildPCBMasterFromBOM = (bomRows) => {
  const masterMap = new Map()
  for (const r of bomRows) {
    if (!r.part_code) continue
    if (!masterMap.has(r.part_code)) {
      masterMap.set(r.part_code, {
        part_code: r.part_code,
        product_description: null,
        total_entries: 0,
      })
    }
  }
  return [...masterMap.values()]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let filePath = null
  try {
    await runMiddleware(req, res, upload.single('file'))
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    filePath = req.file.path

    const fileSizeMB = (req.file.size / 1024 / 1024).toFixed(1)
    console.log(`[import-dump] ${req.file.originalname} — ${fileSizeMB} MB`)

    // ── Parse the dump file ───────────────────────────────────
    let parsed
    try {
      parsed = parseDumpFile(filePath)
    } catch (e) {
      return res.status(400).json({
        error: `Parse failed: ${e.message}`,
        hint: 'Try: pg_restore -Fp yourfile.dump > yourfile.sql then upload the .sql file',
      })
    }

    const {
      bom, engineers, consolidatedData,
      dcNumbers, users, sheets,
      componentData, statusData, pcbMaster,
      format, tablesFound = []
    } = parsed

    console.log(`[import-dump] Parsed: ${bom.length} BOM, ${engineers.length} engineers, ${consolidatedData.length} PCB rows`)

    // Derived data available from parser
    
    // Check if we have ANY data at all
    const totalParsedRows = bom.length + engineers.length + consolidatedData.length +
      dcNumbers.length + users.length + sheets.length
    
    if (totalParsedRows === 0) {
      return res.status(400).json({
        error: 'No data found in dump file.',
        detail: `Tables detected in dump: ${tablesFound.join(', ') || 'none'}`,
        hint: 'Make sure this is a valid Postgres dump.',
        tables_found: tablesFound,
      })
    }

    // ── Import all data in a transaction ─────────────────────
    const client = await pool.connect()
    let bomImported = 0, engineersImported = 0, pcbImported = 0
    let componentImported = 0, statusImported = 0, masterImported = 0
    let dcImported = 0, usersImported = 0, sheetsImported = 0

    try {
      await client.query('BEGIN')
      await ensureTablesExist(client)

      // 1. BOM
      if (bom.length > 0) {
        bomImported = await importBOM(client, bom)
      }

      // 2. Engineers
      if (engineers.length > 0) {
        engineersImported = await importEngineers(client, engineers)
      }

      // 3. PCB Repair Records (the main data)
      if (consolidatedData.length > 0) {
        pcbImported = await importPCBData(client, consolidatedData)
      }

      // 4. Component Data (derived)
      if (componentData.length > 0) {
        componentImported = await importComponentData(client, componentData)
      }

      // 5. Status Data (derived)
      if (statusData.length > 0) {
        statusImported = await importStatusData(client, statusData)
      }

      // 6. PCB Master
      let finalMasterData = pcbMaster
      if (finalMasterData.length === 0 && dcNumbers.length > 0) {
        finalMasterData = buildPCBMasterFromDCNumbers(dcNumbers)
      }
      if (finalMasterData.length === 0 && bom.length > 0) {
        finalMasterData = buildPCBMasterFromBOM(bom)
      }
      if (finalMasterData.length > 0) {
        masterImported = await importPCBMaster(client, finalMasterData)
      }

      // 7. DC Numbers
      if (dcNumbers.length > 0) {
        dcImported = await importDCNumbers(client, dcNumbers)
      }

      // 8. Users
      if (users.length > 0) {
        usersImported = await importUsers(client, users)
      }

      // 9. Sheets
      if (sheets.length > 0) {
        sheetsImported = await importSheets(client, sheets)
      }

      // 10. Log to upload_history
      const totalRows = bomImported + engineersImported + pcbImported + componentImported +
        dcImported + usersImported + sheetsImported
        
      await client.query(`
        INSERT INTO upload_history (filename, original_name, total_rows, ok_rows, nff_rows, wip_rows, scrap_rows, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'success')
      `, [
        req.file.filename,
        req.file.originalname,
        totalRows,
        consolidatedData.filter(r => r.status === 'OK').length,
        consolidatedData.filter(r => r.status === 'NFF').length,
        consolidatedData.filter(r => r.status === 'WIP').length,
        consolidatedData.filter(r => r.status === 'SCRAP').length,
      ]).catch(() => {})

      await client.query('COMMIT')

      res.json({
        success: true,
        format,
        tables_found: tablesFound,
        imported: {
          bom: bomImported,
          engineers: engineersImported,
          pcb_records: pcbImported,
          components: componentImported,
          status_rows: statusImported,
          pcb_master: masterImported,
          dc_numbers: dcImported,
          users: usersImported,
          sheets: sheetsImported,
        },
        status_breakdown: {
          ok: consolidatedData.filter(r => r.status === 'OK').length,
          nff: consolidatedData.filter(r => r.status === 'NFF').length,
          wip: consolidatedData.filter(r => r.status === 'WIP').length,
          scrap: consolidatedData.filter(r => r.status === 'SCRAP').length,
        },
        message: `Imported Successfully! Found ${pcbImported} records and ${bomImported} BOM items.`,
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

  } catch (err) {
    console.error('[import-dump]', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    if (filePath) try { fs.unlinkSync(filePath) } catch {}
  }
}
