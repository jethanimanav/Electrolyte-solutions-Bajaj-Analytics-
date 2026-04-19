import zlib from 'zlib'
import fs   from 'fs'
import { execSync } from 'child_process'

// ── Null cleaner ─────────────────────────────────────────────
const nv = (v) => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (s === '\\N' || s === 'NULL' || s === 'null' || s === '' ||
      s === 'NA'  || s === 'N/A'  || s === '-' || s === 'None') return null
  // Remove wrapping quotes if present
  if (s && s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).trim()
  }
  return s
}
const nvInt = (v) => { const s = nv(v); if (!s) return null; const n = parseInt(s, 10); return isNaN(n) ? null : n }
const nvDate = (v) => { const s = nv(v); if (!s) return null; try { const d = new Date(s); return isNaN(d.getTime()) ? null : s } catch { return null } }

// ── Normalize status ─────────────────────────────────────────
const normalizeStatus = (v) => {
  const s = nv(v)
  if (!s) return 'WIP'
  const u = s.toUpperCase().trim()
  if (u === 'OK') return 'OK'
  if (u === 'NFF') return 'NFF'
  if (u === 'SCRAP' || u === 'SCRAPPED' || u === 'DUMPED' || u === 'WASTE' || u === 'REJECTED') return 'SCRAP'
  return 'WIP'
}

// ═══════════════════════════════════════════════════════════════
// Data Derivation Helpers (moved from import-dump.js)
// ═══════════════════════════════════════════════════════════════

const deriveComponentsFromPCB = (pcbRecords) => {
  const compMap = new Map()
  for (const r of pcbRecords) {
    if (!r.component_change || !r.part_code) continue
    const parts = String(r.component_change).split(/[/,;+|\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
    for (const comp of parts) {
      if (!comp || ['NA', 'N/A', 'NULL', '-', 'NIL', 'NONE'].includes(comp)) continue
      const key = `${r.part_code}:${comp}`
      compMap.set(key, {
        part_code: r.part_code,
        component: comp,
        description: null,
        count: (compMap.get(key)?.count || 0) + 1,
      })
    }
  }
  return [...compMap.values()]
}

const buildStatusFromRecords = (pcbRecords) => {
  const statusMap = new Map()
  for (const r of pcbRecords) {
    if (!r.part_code || !r.status) continue
    const key = `${r.part_code}:${r.status}`
    const entry = statusMap.get(key) || { part_code: r.part_code, status: r.status, status_description: r.status, status_count: 0 }
    entry.status_count += 1
    statusMap.set(key, entry)
  }
  return [...statusMap.values()]
}

const buildPCBMasterFromRecords = (pcbRecords) => {
  const masterMap = new Map()
  for (const r of pcbRecords) {
    if (!r.part_code) continue
    if (!masterMap.has(r.part_code)) {
      masterMap.set(r.part_code, {
        part_code: r.part_code,
        product_description: r.product_description || null,
        total_entries: 0,
        dc_no: r.dc_no || null,
      })
    }
    const entry = masterMap.get(r.part_code)
    entry.total_entries += 1
    if (!entry.product_description && r.product_description) entry.product_description = r.product_description
    if (!entry.dc_no && r.dc_no) entry.dc_no = r.dc_no
  }
  return [...masterMap.values()]
}

// ── SQL value splitter (handles quoted strings + escapes) ─────
// Improved to handle SQL escaped characters and nested quotes
const splitSQLValuesByComma = (str) => {
  const vals = []; let buf = ''; let inStr = false; let esc = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (esc) { buf += ch; esc = false; continue }
    if (ch === '\\') { esc = true; continue }
    
    // Postgres escapes ' as '' within a string
    if (ch === "'" && inStr && str[i+1] === "'") {
      buf += "'"; i++; continue 
    }
    
    if (ch === "'") { inStr = !inStr; continue }
    if (ch === ',' && !inStr) { vals.push(buf.trim()); buf = ''; continue }
    buf += ch
  }
  if (buf.trim()) vals.push(buf.trim())
  return vals
}

// ── Discover ALL table names in the SQL text ─────────────────
const discoverTables = (text) => {
  const tables = new Set()
  // Matches: INSERT INTO public.tablename VALUES or INSERT INTO tablename VALUES
  const insertPattern = /INSERT INTO (?:public\.)?(\w+)\s+VALUES/gi
  let match
  while ((match = insertPattern.exec(text)) !== null) {
    tables.add(match[1].toLowerCase())
  }
  // Matches: COPY public.tablename (cols) FROM stdin
  const copyPattern = /^COPY (?:public\.)?(\w+)\s*\(/gim
  while ((match = copyPattern.exec(text)) !== null) {
    tables.add(match[1].toLowerCase())
  }
  return [...tables]
}

// ── Generic INSERT extractor for any table ───────────────────
const extractInsertRows = (text, tableName) => {
  const rows = []
  // Match: INSERT INTO [public.]tableName VALUES (values);
  // Using a less greedy match for the values part
  const pattern = new RegExp(`INSERT INTO (?:public\\.)?${tableName}\\s+VALUES\\s*\\((.+?)\\)\\s*;`, 'gi')
  let match
  while ((match = pattern.exec(text)) !== null) {
    try { 
      const vals = splitSQLValuesByComma(match[1])
      if (vals.length > 0) rows.push(vals)
    } catch {}
  }
  return rows
}

// ── Generic COPY block parser ─────────────────────────────────
const extractCopyRows = (text, tableName) => {
  const rows = []
  const lines = text.split('\n')
  let inBlock = false
  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (new RegExp(`^COPY\\s+(?:public\\.)?${tableName}\\s`, 'i').test(trimmed)) { inBlock = true; continue }
    if (inBlock && (trimmed === '\\.' || trimmed.startsWith('\\.'))) { inBlock = false; continue }
    if (!inBlock) continue
    const cols = trimmed.split('\t').map(v => (v === '\\N' || v === '') ? null : v.trim())
    if (cols.length > 1) rows.push(cols)
  }
  return rows
}

// ── Extract rows from either INSERT or COPY format ────────────
const extractRows = (text, tableName) => {
  const ins = extractInsertRows(text, tableName)
  if (ins.length > 0) return ins
  return extractCopyRows(text, tableName)
}

// ═══════════════════════════════════════════════════════════════
// Table specific extractors
// ═══════════════════════════════════════════════════════════════

const extractBOM = (text, allTables) => {
  const bomNames = allTables.filter(t => t === 'bom' || t.includes('bom'))
  const bom = []; const seen = new Set()
  for (const tableName of bomNames) {
    const rows = extractRows(text, tableName)
    for (const vals of rows) {
      try {
        const partCode = nv(vals[1]); const location = nv(vals[2])
        if (!partCode || !location) continue
        const key = `${partCode}_${location.toUpperCase()}`
        if (seen.has(key)) continue; seen.add(key)
        bom.push({
          part_code: parseInt(partCode),
          location: location.trim(),
          description: nv(vals[3]) || location.trim(),
          source: 'dump'
        })
      } catch {}
    }
  }
  return bom
}

const extractEngineers = (text, allTables) => {
  const engNames = allTables.filter(t => t === 'engineers' || t.includes('eng'))
  const engineers = []
  for (const tableName of engNames) {
    const rows = extractRows(text, tableName)
    for (const vals of rows) {
      const id = nvInt(vals[0]); const name = nv(vals[1])
      if (id && name) engineers.push({ id, name })
    }
  }
  return engineers
}

const extractPCBRecords = (text, allTables) => {
  const records = []
  // Priority table: consolidated_data
  const tableName = allTables.find(t => t === 'consolidated_data' || t === 'pcb_data') || 'consolidated_data'
  const rows = extractRows(text, tableName)
  
  if (rows.length === 0) return []

  console.log(`[dump-parser] Extracting ${rows.length} records from ${tableName}`)

  for (const vals of rows) {
    const partCode = nvInt(vals[10]) || nvInt(vals[12]) // try both layout A and B
    if (!partCode) continue

    // Layout A mapping (consolidated_data)
    if (vals.length >= 18) {
      records.push({
        source_id:           nvInt(vals[0]),
        sr_no:               nvInt(vals[1]),
        dc_no:               nv(vals[2]),
        branch:              nv(vals[4]),
        product_description: nv(vals[6]),
        pcb_sr_no:           nv(vals[18]) || nv(vals[8]), // try indices
        repair_date:         nvDate(vals[14]) || nvDate(vals[96]),
        part_code:           partCode,
        defect:              nv(vals[11]),
        visiting_tech_name:  nv(vals[12]),
        status:              normalizeStatus(vals[17]),
        analysis:            nv(vals[20]),
        component_change:    nv(vals[22]),
        engg_name:           nv(vals[23]),
        failure:             nv(vals[16]),
        dispatch_date:       nvDate(vals[27]),
        complaint_no:        nv(vals[9])?.substring(0, 150) ?? null
      })
    }
  }
  return records
}

const extractDCNumbers = (text, allTables) => {
  const rows = extractRows(text, 'dc_numbers')
  return rows.map(vals => ({
    id: nvInt(vals[0]),
    dc_no: nv(vals[1]),
    part_codes: (() => {
      try { return JSON.parse(nv(vals[2]).replace(/'/g, '"')) } catch { return [] }
    })(),
    created_at: nv(vals[3]),
    updated_at: nv(vals[4])
  })).filter(r => r.dc_no)
}

const extractUsers = (text, allTables) => {
  const rows = extractRows(text, 'users')
  return rows.map(vals => ({
    id: nv(vals[0]),
    auth_id: nv(vals[1]),
    email: nv(vals[2]),
    name: nv(vals[3]),
    role: nv(vals[4]) || 'USER',
    created_at: nv(vals[5])
  })).filter(r => r.id)
}

const extractSheets = (text, allTables) => {
  const rows = extractRows(text, 'sheets')
  return rows.map(vals => ({
    id: nv(vals[0]),
    name: nv(vals[1]),
    created_at: nv(vals[2]),
    updated_at: nv(vals[3])
  })).filter(r => r.id)
}

export const parseDumpFile = (filePath) => {
  let text = ''
  let format = 'sql'

  try {
    // 1. Try pg_restore if it's a binary dump
    const buffer = fs.readFileSync(filePath)
    const header5 = buffer.slice(0, 5).toString('ascii')
    
    if (header5 === 'PGDMP') {
      console.log('[dump-parser] PGDMP detected, using pg_restore...')
      try {
        text = execSync(`pg_restore -f - "${filePath}"`, { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 })
        format = 'custom-sql'
      } catch (e) {
        console.error('[dump-parser] pg_restore failed:', e.message)
        // Fallback to manual decompression is unreliable, but we can try if pg_restore fails
        throw new Error('pg_restore failed. Ensure it is in your PATH.')
      }
    } else if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
      text = zlib.gunzipSync(buffer).toString('utf8')
      format = 'sql-gz'
    } else {
      text = buffer.toString('utf8')
    }
  } catch (err) {
    console.error('[dump-parser] Read error:', err.message)
    throw err
  }

  if (!text) throw new Error('Empty dump file')

  const allTables = discoverTables(text)
  console.log(`[dump-parser] Tables: ${allTables.join(', ')}`)

  const bom = extractBOM(text, allTables)
  const engineers = extractEngineers(text, allTables)
  const consolidatedData = extractPCBRecords(text, allTables)
  const dcNumbers = extractDCNumbers(text, allTables)
  const users = extractUsers(text, allTables)
  const sheets = extractSheets(text, allTables)

  // Derive extra data
  const componentData = deriveComponentsFromPCB(consolidatedData)
  const statusData = buildStatusFromRecords(consolidatedData)
  const pcbMaster = buildPCBMasterFromRecords(consolidatedData)

  console.log(`[dump-parser] Parsed: BOM:${bom.length} ENG:${engineers.length} PCB:${consolidatedData.length} Comp:${componentData.length}`)

  return {
    bom, engineers, consolidatedData, dcNumbers, users, sheets,
    componentData, statusData, pcbMaster,
    format, tablesFound: allTables, rawLength: text.length
  }
}
