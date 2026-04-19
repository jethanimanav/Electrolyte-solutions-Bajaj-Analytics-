// ============================================================
// /api/nexscan-sync
//
// PHASE 3 — Live nexscan → Dashboard data bridge
//
// Three modes:
//
// 1. PUSH  (POST /api/nexscan-sync)
//    nexscan server sends a JSON payload of new/updated records.
//    Protected by API key.  Idempotent — safe to call repeatedly.
//
// 2. PULL  (POST /api/nexscan-sync?action=pull)
//    Dashboard reaches into nexscan's PostgreSQL directly.
//    Uses NEXSCAN_DB_* env vars.  Fetches only rows newer than
//    the last sync watermark.
//
// 3. STATUS (GET /api/nexscan-sync)
//    Returns sync health, last sync time, row counts, drift.
// ============================================================

import pool from '../../lib/db'
import {
  clean, normalizeStatus, normalizeBranch,
  normalizeDefect, parseComponents,
} from '../../lib/normalize'
import { AutoCorrector, KNOWN_CITIES } from '../../lib/fuzzy-matcher'
import { buildDataRecord } from '../../lib/nexscan-ingest'

// ── Auth ─────────────────────────────────────────────────────
const API_KEY = process.env.NEXSCAN_API_KEY || 'changeme-set-NEXSCAN_API_KEY-in-env'

const authorized = (req) => {
  const key = req.headers['x-api-key'] || req.query.api_key
  return key === API_KEY
}

// ── GET — sync status ─────────────────────────────────────────
const handleStatus = async (req, res) => {
  try {
    const [localCount, lastSync, lastImport, syncLog] = await Promise.all([
      pool.query('SELECT COUNT(*) AS cnt FROM pcb_data'),
      pool.query(`
        SELECT value FROM sync_state WHERE key = 'last_nexscan_sync' LIMIT 1
      `).catch(() => ({ rows: [] })),
      pool.query(`
        SELECT uploaded_at, total_rows, ok_rows, nff_rows, wip_rows, original_name
        FROM upload_history ORDER BY uploaded_at DESC LIMIT 1
      `).catch(() => ({ rows: [] })),
      pool.query(`
        SELECT * FROM sync_log ORDER BY synced_at DESC LIMIT 10
      `).catch(() => ({ rows: [] })),
    ])

    res.json({
      status: 'ok',
      dashboard_records: parseInt(localCount.rows[0]?.cnt || 0),
      last_sync: lastSync.rows[0]?.value || null,
      last_import: lastImport.rows[0] || null,
      recent_syncs: syncLog.rows,
      phase: 3,
      mode: process.env.NEXSCAN_DB_HOST ? 'pull-capable' : 'push-only',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── POST action=pull — fetch from nexscan DB directly ────────
const handlePull = async (req, res) => {
  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized — set x-api-key header' })

  const nexscanHost = process.env.NEXSCAN_DB_HOST
  if (!nexscanHost) {
    return res.status(400).json({
      error: 'NEXSCAN_DB_HOST not configured',
      help: 'Add NEXSCAN_DB_HOST, NEXSCAN_DB_PORT, NEXSCAN_DB_NAME, NEXSCAN_DB_USER, NEXSCAN_DB_PASSWORD to .env.local',
    })
  }

  // Lazy-load pg Pool for nexscan connection
  const { Pool } = await import('pg')
  const nexscanPool = new Pool({
    host:     process.env.NEXSCAN_DB_HOST,
    port:     parseInt(process.env.NEXSCAN_DB_PORT || '5432'),
    database: process.env.NEXSCAN_DB_NAME || 'nexscan',
    user:     process.env.NEXSCAN_DB_USER || 'postgres',
    password: process.env.NEXSCAN_DB_PASSWORD,
    ssl:      process.env.NEXSCAN_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  })

  try {
    // Get last sync watermark
    const wmRow = await pool.query(
      `SELECT value FROM sync_state WHERE key = 'last_nexscan_sync' LIMIT 1`
    ).catch(() => ({ rows: [] }))
    const lastSync = wmRow.rows[0]?.value || '1970-01-01'

    // Fetch new/updated rows from nexscan
    const { rows: newRows } = await nexscanPool.query(`
      SELECT * FROM consolidated_data
      WHERE updated_at > $1
      ORDER BY updated_at ASC
      LIMIT 5000
    `, [lastSync])

    if (newRows.length === 0) {
      return res.json({ success: true, pulled: 0, message: 'No new records since last sync' })
    }

    // Ingest into local DB
    const result = await ingestRows(newRows)

    // Update watermark
    const newWatermark = newRows[newRows.length - 1].updated_at
    await pool.query(`
      INSERT INTO sync_state (key, value, updated_at) VALUES ('last_nexscan_sync', $1, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
    `, [newWatermark])

    // Log sync
    await pool.query(`
      INSERT INTO sync_log (source, rows_synced, ok_rows, nff_rows, wip_rows, mode, synced_at)
      VALUES ('nexscan-pull', $1, $2, $3, $4, 'pull', NOW())
    `, [result.imported, result.ok, result.nff, result.wip]).catch(() => {})

    await nexscanPool.end()
    res.json({
      success: true,
      mode: 'pull',
      pulled: newRows.length,
      imported: result.imported,
      ok: result.ok, nff: result.nff, wip: result.wip,
      new_watermark: newWatermark,
    })
  } catch (err) {
    await nexscanPool.end().catch(() => {})
    console.error('[nexscan-sync pull]', err)
    res.status(500).json({ error: err.message })
  }
}

// ── POST — receive pushed records from nexscan ───────────────
// nexscan calls: POST /api/nexscan-sync
// Headers:       x-api-key: <NEXSCAN_API_KEY>
// Body (JSON):
// {
//   "records": [
//     {
//       "id": 12345,
//       "sr_no": 1,
//       "dc_no": "DC001",
//       "branch": "LUCKNOW",
//       "part_code": 971039,
//       "status": "OK",
//       "component_change": "EC1/IC1",
//       ...all consolidated_data columns...
//     }
//   ],
//   "bom": [                   ← optional, sent on schema changes
//     { "part_code": 971039, "location": "EC1", "description": "10uF/500V" }
//   ]
// }
const handlePush = async (req, res) => {
  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized — set x-api-key header' })

  let body = req.body
  if (!body) {
    // Parse JSON body manually if bodyParser not set
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      body = JSON.parse(Buffer.concat(chunks).toString())
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
  }

  const { records = [], bom: bomRows = [] } = body

  if (!Array.isArray(records) && !Array.isArray(bomRows)) {
    return res.status(400).json({ error: 'Body must have "records" array and/or "bom" array' })
  }

  try {
    let bomImported = 0
    let result = { imported: 0, ok: 0, nff: 0, wip: 0 }

    if (bomRows.length > 0) {
      bomImported = await ingestBOM(bomRows)
    }
    if (records.length > 0) {
      result = await ingestRows(records)
    }

    // Log sync
    await pool.query(`
      INSERT INTO sync_log (source, rows_synced, ok_rows, nff_rows, wip_rows, mode, synced_at)
      VALUES ('nexscan-push', $1, $2, $3, $4, 'push', NOW())
    `, [result.imported, result.ok, result.nff, result.wip]).catch(() => {})

    res.json({
      success: true,
      mode: 'push',
      records_received: records.length,
      bom_received: bomRows.length,
      imported: result.imported,
      bom_imported: bomImported,
      ok: result.ok, nff: result.nff, wip: result.wip,
    })
  } catch (err) {
    console.error('[nexscan-sync push]', err)
    res.status(500).json({ error: err.message })
  }
}

// ── Shared ingest logic ──────────────────────────────────────
const ingestRows = async (rows) => {
  const corrector = new AutoCorrector(pool)
  await corrector.loadCorrections()

  let imported = 0, ok = 0, nff = 0, wip = 0
  const componentMap = {}
  const masterMap = {}

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const raw of rows) {
      const status    = normalizeStatus(raw.status)
      const rawBranch = clean(raw.branch)
      const branchNorm = normalizeBranch(rawBranch) ||
        corrector.correctValue('branch', rawBranch, KNOWN_CITIES).value

      if (status === 'OK') ok++
      else if (status === 'NFF') nff++
      else wip++

      const pc = parseInt(raw.part_code)
      if (!masterMap[pc]) masterMap[pc] = { desc: null, count: 0, dc_no: null }
      masterMap[pc].count++
      if (!masterMap[pc].desc && raw.product_description) masterMap[pc].desc = clean(raw.product_description)
      if (!masterMap[pc].dc_no && raw.dc_no) masterMap[pc].dc_no = clean(raw.dc_no)

      try {
        await client.query(`
          INSERT INTO pcb_data (
            source_id, sr_no, dc_no, branch, branch_normalized, bccd_name,
            product_description, product_sr_no, date_of_purchase, complaint_no,
            part_code, defect, defect_normalized, visiting_tech_name, mfg_month_year,
            repair_date, pcb_sr_no, testing, failure, status, analysis,
            validation_result, component_change, engg_name, tag_entry_by,
            consumption_entry_by, dispatch_date, source_created_at, source_updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
            $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
          )
          ON CONFLICT (source_id) DO UPDATE SET
            status = EXCLUDED.status,
            component_change = EXCLUDED.component_change,
            analysis = EXCLUDED.analysis,
            branch_normalized = EXCLUDED.branch_normalized,
            source_updated_at = EXCLUDED.source_updated_at
        `, [
          raw.id || raw.source_id,
          raw.sr_no ? parseInt(raw.sr_no) : null,
          clean(raw.dc_no),
          rawBranch, branchNorm,
          clean(raw.bccd_name),
          clean(raw.product_description),
          clean(raw.product_sr_no),
          clean(raw.date_of_purchase),
          raw.complaint_no ? String(raw.complaint_no).substring(0, 150) : null,
          pc,
          clean(raw.defect),
          normalizeDefect(raw.defect),
          clean(raw.visiting_tech_name),
          clean(raw.mfg_month_year),
          raw.repair_date || null,
          clean(raw.pcb_sr_no),
          clean(raw.testing),
          clean(raw.failure),
          status,
          clean(raw.analysis),
          clean(raw.validation_result),
          clean(raw.component_change),
          clean(raw.engg_name),
          clean(raw.tag_entry_by),
          clean(raw.consumption_entry_by),
          raw.dispatch_date || null,
          raw.created_at || raw.source_created_at || null,
          raw.updated_at || raw.source_updated_at || null,
        ])
        imported++
      } catch (e) {
        console.warn('[nexscan-sync] row skip:', e.message)
      }

      // Build component map
      for (const comp of parseComponents(raw.component_change)) {
        if (!componentMap[pc]) componentMap[pc] = {}
        componentMap[pc][comp] = (componentMap[pc][comp] || 0) + 1
      }
    }

    // Upsert pcb_master
    for (const [pc, { desc, count, dc_no }] of Object.entries(masterMap)) {
      await client.query(`
        INSERT INTO pcb_master (part_code, product_description, total_entries, dc_no, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (part_code) DO UPDATE SET
          product_description = COALESCE(EXCLUDED.product_description, pcb_master.product_description),
          total_entries = (SELECT COUNT(*) FROM pcb_data WHERE part_code = $1),
          updated_at = NOW()
      `, [parseInt(pc), desc, count, dc_no])
    }

    // Upsert component_data
    for (const [pc, comps] of Object.entries(componentMap)) {
      for (const [comp, cnt] of Object.entries(comps)) {
        const bomRow = await client.query(
          `SELECT description FROM bom WHERE part_code=$1 AND UPPER(TRIM(component))=UPPER(TRIM($2)) LIMIT 1`,
          [parseInt(pc), comp]
        )
        await client.query(`
          INSERT INTO component_data (part_code, component, description, count)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (part_code, component)
          DO UPDATE SET count = component_data.count + EXCLUDED.count,
                        description = COALESCE(EXCLUDED.description, component_data.description)
        `, [parseInt(pc), comp, bomRow.rows[0]?.description || null, cnt])
      }
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return { imported, ok, nff, wip }
}

const ingestBOM = async (bomRows) => {
  let count = 0
  for (const b of bomRows) {
    try {
      await pool.query(`
        INSERT INTO bom (part_code, component, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (part_code, component)
        DO UPDATE SET description = EXCLUDED.description
      `, [parseInt(b.part_code), b.location, b.description])
      count++
    } catch {}
  }
  return count
}

// ── Router ───────────────────────────────────────────────────
export default async function handler(req, res) {
  // Ensure support tables exist (idempotent)
  await ensureSyncTables()

  if (req.method === 'GET') return handleStatus(req, res)

  if (req.method === 'POST') {
    const action = req.query.action
    if (action === 'pull') return handlePull(req, res)
    return handlePush(req, res)
  }

  res.status(405).json({ error: 'Method not allowed' })
}

const ensureSyncTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_state (
      key        VARCHAR(100) PRIMARY KEY,
      value      TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sync_log (
      id          SERIAL PRIMARY KEY,
      source      VARCHAR(50),
      rows_synced INTEGER DEFAULT 0,
      ok_rows     INTEGER DEFAULT 0,
      nff_rows    INTEGER DEFAULT 0,
      wip_rows    INTEGER DEFAULT 0,
      mode        VARCHAR(20) DEFAULT 'push',
      synced_at   TIMESTAMP DEFAULT NOW()
    );
  `).catch(() => {}) // Silently ignore if already exists
}
