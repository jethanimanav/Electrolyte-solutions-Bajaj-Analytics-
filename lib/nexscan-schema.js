// ============================================================
// nexscan-schema.js
// Single source of truth for the nexscan PostgreSQL schema.
// Both the dump parser AND the live API bridge use this.
// ============================================================

// Exact column order in nexscan's consolidated_data COPY blocks
// (confirmed from pg_dump output of nexscan production DB)
export const CONSOLIDATED_COLUMNS = [
  'id',                   // 0  — bigint, primary key
  'sr_no',                // 1  — integer
  'dc_no',                // 2  — varchar
  'dc_date',              // 3  — date
  'branch',               // 4  — varchar  ← key field
  'bccd_name',            // 5  — varchar
  'product_description',  // 6  — varchar
  'product_sr_no',        // 7  — varchar
  'date_of_purchase',     // 8  — varchar
  'complaint_no',         // 9  — varchar
  'part_code',            // 10 — bigint   ← key field
  'defect',               // 11 — varchar
  'visiting_tech_name',   // 12 — varchar
  'mfg_month_year',       // 13 — varchar
  'repair_date',          // 14 — date
  'testing',              // 15 — varchar
  'failure',              // 16 — varchar
  'status',               // 17 — varchar  ← OK | NFF | WIP
  'pcb_sr_no',            // 18 — varchar
  'rf_observation',       // 19 — varchar
  'analysis',             // 20 — text
  'validation_result',    // 21 — text
  'component_change',     // 22 — text     ← component_consumption
  'engg_name',            // 23 — varchar
  'tag_entry_by',         // 24 — varchar
  'consumption_entry_by', // 25 — varchar
  'dispatch_entry_by',    // 26 — varchar
  'dispatch_date',        // 27 — date
  'created_at',           // 28 — timestamp
  'updated_at',           // 29 — timestamp
]

// BOM table columns
export const BOM_COLUMNS = [
  'id',           // 0
  'part_code',    // 1
  'location',     // 2 — component ref (EC1, IC1, R1 …)
  'description',  // 3 — human description
  'source',       // 4
  'created_at',   // 5
]

// Map a positional tab-split row → named object using CONSOLIDATED_COLUMNS
export const mapConsolidatedRow = (cols) => {
  const row = {}
  CONSOLIDATED_COLUMNS.forEach((name, i) => {
    row[name] = cols[i] ?? null
  })
  return row
}

// Map a positional tab-split row → named object using BOM_COLUMNS
export const mapBomRow = (cols) => {
  const row = {}
  BOM_COLUMNS.forEach((name, i) => {
    row[name] = cols[i] ?? null
  })
  return row
}

// Validate that a row looks like it came from consolidated_data
export const isValidConsolidatedRow = (cols) => {
  if (!Array.isArray(cols) || cols.length < 20) return false
  const id = String(cols[0] ?? '').trim()
  const partCode = String(cols[10] ?? '').trim()
  return /^\d+$/.test(id) && /^\d{5,8}$/.test(partCode)
}

// Validate that a row looks like a BOM row
export const isValidBomRow = (cols) => {
  if (!Array.isArray(cols) || cols.length < 4) return false
  const id = String(cols[0] ?? '').trim()
  const partCode = String(cols[1] ?? '').trim()
  const location = String(cols[2] ?? '').trim()
  const desc = String(cols[3] ?? '').trim()
  return (
    /^\d+$/.test(id) &&
    /^\d{5,8}$/.test(partCode) &&
    location.length > 0 &&
    location.length <= 50 &&
    desc.length > 0 &&
    desc !== '\\N'
  )
}

// Clean a single nexscan field value
export const nv = (v) => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (s === '\\N' || s === 'NULL' || s === 'null' || s === 'NA' ||
      s === 'N/A' || s === 'n/a' || s === '' || s === '-' || s === 'nan') return null
  return s
}

export const nvInt = (v) => {
  const s = nv(v); if (!s) return null
  const n = parseInt(s, 10); return isNaN(n) ? null : n
}

export const nvDate = (v) => {
  const s = nv(v); if (!s) return null
  try { const d = new Date(s); return isNaN(d.getTime()) ? null : s } catch { return null }
}
