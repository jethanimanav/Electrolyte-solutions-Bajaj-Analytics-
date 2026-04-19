import pool from '../../lib/db'
import multer from 'multer'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  clean,
  cleanDate,
  normalizeStatus,
  normalizeBranch,
  normalizeDefect,
  parseComponents,
} from '../../lib/normalize'
import { AutoCorrector, KNOWN_CITIES, KNOWN_DEFECTS } from '../../lib/fuzzy-matcher'

export const config = { api: { bodyParser: false } }

const uploadDir = path.join(os.tmpdir(), 'pcb_uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (['.xlsx', '.xlsm'].includes(ext)) cb(null, true)
    else cb(new Error('Only .xlsx and .xlsm files allowed'))
  },
  limits: { fileSize: 100 * 1024 * 1024 },
})

const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => (result instanceof Error ? reject(result) : resolve(result)))
  })

const detectFormat = (workbook) => {
  if (workbook.SheetNames.some((sheet) => ['Bajaj_consolidated_data', 'consolidated_data'].includes(sheet))) {
    return 'new'
  }
  const skip = ['Master_Summary', 'Dashboard', 'Pivot']
  return workbook.SheetNames.filter((sheet) => !skip.includes(sheet)).length > 0 ? 'old' : 'unknown'
}

const getValue = (row, isNew, newKey, oldKey) => {
  if (isNew) return row?.[newKey] ?? null
  return row?.[oldKey] ?? null
}

const toInt = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number.parseInt(String(value).trim(), 10)
  return Number.isNaN(parsed) ? null : parsed
}

const validateRow = (row) => row.part_code && row.status

const normalizeRow = (corrector, row, isNew) => {
  const rawBranch = clean(getValue(row, isNew, 'branch', 'Branch'))
  const branchHardcoded = normalizeBranch(rawBranch)
  const branchResult = rawBranch
    ? branchHardcoded && branchHardcoded !== rawBranch
      ? { value: branchHardcoded, wasFixed: true, method: 'hardcoded', flagged: false }
      : corrector.correctValue('branch', rawBranch, KNOWN_CITIES)
    : { value: null, flagged: false }

  const rawDefect = clean(getValue(row, isNew, 'defect', 'Defect'))
  const defectHardcoded = normalizeDefect(rawDefect)
  const defectResult = rawDefect
    ? defectHardcoded && defectHardcoded !== rawDefect
      ? { value: defectHardcoded, wasFixed: true, method: 'hardcoded', flagged: false }
      : corrector.correctValue('defect', rawDefect, KNOWN_DEFECTS)
    : { value: null, flagged: false }

  const rawPartCode = clean(getValue(row, isNew, 'part_code', 'Part Code'))
  const partCode = toInt(rawPartCode)

  const normalized = {
    source_id: toInt(getValue(row, isNew, 'id', null)),
    sr_no: toInt(getValue(row, isNew, 'sr_no', 'Sr. No.')),
    dc_no: clean(getValue(row, isNew, 'dc_no', 'DC No.')),
    branch: rawBranch,
    branch_normalized: branchResult.value || null,
    branch_flagged: Boolean(branchResult.flagged),
    bccd_name: clean(getValue(row, isNew, 'bccd_name', 'BCCD Name')),
    product_description: clean(getValue(row, isNew, 'product_description', 'Product Description')),
    product_sr_no: clean(getValue(row, isNew, 'product_sr_no', 'Product Sr. No.')),
    date_of_purchase: clean(getValue(row, isNew, 'date_of_purchase', 'Date of Purchase')),
    complaint_no: clean(getValue(row, isNew, 'complaint_no', 'Complaint No.'))?.slice(0, 150) || null,
    part_code: partCode,
    defect: rawDefect,
    defect_normalized: defectResult.value || null,
    visiting_tech_name: clean(getValue(row, isNew, 'visiting_tech_name', 'Visiting Tech Name')),
    mfg_month_year: clean(getValue(row, isNew, 'mfg_month_year', 'Mfg Month/Year')),
    repair_date: cleanDate(getValue(row, isNew, 'repair_date', 'Repair Date')),
    pcb_sr_no: clean(getValue(row, isNew, 'pcb_sr_no', 'PCB Sr. No.')),
    testing: clean(getValue(row, isNew, 'testing', 'Testing')),
    failure: clean(getValue(row, isNew, 'failure', 'Failure')),
    analysis: clean(getValue(row, isNew, 'analysis', 'Analysis')),
    status: normalizeStatus(getValue(row, isNew, 'status', 'Status')),
    validation_result: clean(getValue(row, isNew, 'validation_result', null)),
    component_change: clean(getValue(row, isNew, 'component_change', 'Component Consumption')),
    engg_name: clean(getValue(row, isNew, 'engg_name', 'Engg. Name')),
    tag_entry_by: clean(getValue(row, isNew, 'tag_entry_by', 'Tag Entry By')),
    consumption_entry_by: clean(getValue(row, isNew, 'consumption_entry_by', 'Consumption Entry')),
    dispatch_entry_by: clean(getValue(row, isNew, 'dispatch_entry_by', null)),
    dispatch_date: cleanDate(getValue(row, isNew, 'dispatch_date', 'Send Date')),
    source_created_at: cleanDate(getValue(row, isNew, 'created_at', null)),
    source_updated_at: cleanDate(getValue(row, isNew, 'updated_at', null)),
  }

  return validateRow(normalized) ? normalized : null
}

const chunk = (items, size = 500) => {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

const insertPcbDataChunk = async (client, rows) => {
  await client.query(
    `
      INSERT INTO pcb_data (
        source_id, sr_no, dc_no, branch, branch_normalized,
        bccd_name, product_description, product_sr_no, date_of_purchase,
        complaint_no, part_code, defect, defect_normalized,
        visiting_tech_name, mfg_month_year, repair_date, pcb_sr_no,
        testing, failure, status, analysis, validation_result,
        component_change, engg_name, tag_entry_by, consumption_entry_by,
        dispatch_entry_by, dispatch_date, source_created_at, source_updated_at
      )
      SELECT
        x.source_id, x.sr_no, x.dc_no, x.branch, x.branch_normalized,
        x.bccd_name, x.product_description, x.product_sr_no, x.date_of_purchase,
        x.complaint_no, x.part_code, x.defect, x.defect_normalized,
        x.visiting_tech_name, x.mfg_month_year, x.repair_date::date,
        x.pcb_sr_no, x.testing, x.failure, x.status, x.analysis, x.validation_result,
        x.component_change, x.engg_name, x.tag_entry_by, x.consumption_entry_by,
        x.dispatch_entry_by, x.dispatch_date::date, x.source_created_at::timestamptz, x.source_updated_at::timestamptz
      FROM jsonb_to_recordset($1::jsonb) AS x(
        source_id int,
        sr_no int,
        dc_no text,
        branch text,
        branch_normalized text,
        bccd_name text,
        product_description text,
        product_sr_no text,
        date_of_purchase text,
        complaint_no text,
        part_code bigint,
        defect text,
        defect_normalized text,
        visiting_tech_name text,
        mfg_month_year text,
        repair_date text,
        pcb_sr_no text,
        testing text,
        failure text,
        status text,
        analysis text,
        validation_result text,
        component_change text,
        engg_name text,
        tag_entry_by text,
        consumption_entry_by text,
        dispatch_entry_by text,
        dispatch_date text,
        source_created_at text,
        source_updated_at text
      )
    `,
    [JSON.stringify(rows)]
  )
}

const insertPcbMaster = async (client, rows) => {
  await client.query(
    `
      INSERT INTO pcb_master (part_code, product_description, total_entries, dc_no, updated_at)
      SELECT x.part_code, x.product_description, x.total_entries, x.dc_no, NOW()
      FROM jsonb_to_recordset($1::jsonb) AS x(
        part_code bigint,
        product_description text,
        total_entries int,
        dc_no text
      )
      ON CONFLICT (part_code) DO UPDATE SET
        product_description = COALESCE(EXCLUDED.product_description, pcb_master.product_description),
        total_entries = EXCLUDED.total_entries,
        dc_no = COALESCE(EXCLUDED.dc_no, pcb_master.dc_no),
        updated_at = NOW()
    `,
    [JSON.stringify(rows)]
  )
}

const insertComponentData = async (client, rows) => {
  if (rows.length === 0) return
  await client.query(
    `
      INSERT INTO component_data (part_code, component, count)
      SELECT x.part_code, x.component, x.count
      FROM jsonb_to_recordset($1::jsonb) AS x(
        part_code bigint,
        component text,
        count int
      )
    `,
    [JSON.stringify(rows)]
  )
}

const insertStatusData = async (client, rows) => {
  if (rows.length === 0) return
  await client.query(
    `
      INSERT INTO status_data (part_code, status, status_description, status_count)
      SELECT x.part_code, x.status, x.status_description, x.status_count
      FROM jsonb_to_recordset($1::jsonb) AS x(
        part_code bigint,
        status text,
        status_description text,
        status_count int
      )
    `,
    [JSON.stringify(rows)]
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let uploadId = null
  let filePath = null

  try {
    await runMiddleware(req, res, upload.single('file'))
    filePath = req.file.path

    const uploadLog = await pool.query(
      `INSERT INTO upload_history (filename, original_name, status) VALUES ($1, $2, 'processing') RETURNING id`,
      [req.file.filename, req.file.originalname]
    )
    uploadId = uploadLog.rows[0].id

    const workbook = XLSX.readFile(filePath)
    const format = detectFormat(workbook)
    if (format === 'unknown') throw new Error('Unrecognised Excel format')

    const corrector = new AutoCorrector(pool)
    await corrector.loadCorrections()

    const isNew = format === 'new'
    const sheetName = isNew
      ? workbook.SheetNames.find((sheet) => ['Bajaj_consolidated_data', 'consolidated_data'].includes(sheet))
      : null
    const sheets = isNew
      ? [sheetName]
      : workbook.SheetNames.filter((sheet) => !['Master_Summary', 'Dashboard', 'Pivot'].includes(sheet))

    const normalizedRows = []
    const masterMap = new Map()
    const componentMap = new Map()
    const statusMap = new Map()
    const stats = { totalRows: 0, okRows: 0, nffRows: 0, wipRows: 0 }

    for (const sheet of sheets) {
      const partCodeFromSheet = isNew ? null : toInt(sheet)
      const worksheet = workbook.Sheets[sheet]
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false })

      for (const rawRow of rawRows) {
        if (!isNew && partCodeFromSheet) rawRow['Part Code'] = partCodeFromSheet
        const row = normalizeRow(corrector, rawRow, isNew)
        if (!row) continue

        normalizedRows.push(row)
        stats.totalRows++
        if (row.status === 'OK') stats.okRows++
        else if (row.status === 'NFF') stats.nffRows++
        else stats.wipRows++

        const master = masterMap.get(row.part_code) || {
          part_code: row.part_code,
          product_description: row.product_description,
          total_entries: 0,
          dc_no: row.dc_no,
        }
        master.total_entries += 1
        if (!master.product_description && row.product_description) master.product_description = row.product_description
        if (!master.dc_no && row.dc_no) master.dc_no = row.dc_no
        masterMap.set(row.part_code, master)

        const statusKey = `${row.part_code}:${row.status}`
        statusMap.set(statusKey, {
          part_code: row.part_code,
          status: row.status,
          status_description: row.status,
          status_count: (statusMap.get(statusKey)?.status_count || 0) + 1,
        })

        for (const component of parseComponents(row.component_change)) {
          const componentKey = `${row.part_code}:${component}`
          componentMap.set(componentKey, {
            part_code: row.part_code,
            component,
            count: (componentMap.get(componentKey)?.count || 0) + 1,
          })
        }
      }
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Scoped DELETE: only remove records for part codes present in this Excel upload
      // This preserves dump-imported data for any part codes not in this Excel
      const uploadedPartCodes = [...new Set(normalizedRows.map(r => r.part_code).filter(Boolean))]
      if (uploadedPartCodes.length > 0) {
        const pcPlaceholders = uploadedPartCodes.map((_, i) => `$${i + 1}`).join(',')
        await client.query(`DELETE FROM pcb_data WHERE part_code IN (${pcPlaceholders})`, uploadedPartCodes)
        await client.query(`DELETE FROM component_data WHERE part_code IN (${pcPlaceholders})`, uploadedPartCodes)
        await client.query(`DELETE FROM status_data WHERE part_code IN (${pcPlaceholders})`, uploadedPartCodes)
        await client.query(`DELETE FROM pcb_master WHERE part_code IN (${pcPlaceholders})`, uploadedPartCodes)
      } else {
        // Fallback: replace all (no part codes found)
        await client.query('DELETE FROM pcb_data')
        await client.query('DELETE FROM component_data')
        await client.query('DELETE FROM status_data')
        await client.query('DELETE FROM pcb_master')
      }

      await insertPcbMaster(client, Array.from(masterMap.values()))
      for (const rows of chunk(normalizedRows, 500)) {
        await insertPcbDataChunk(client, rows)
      }
      await insertComponentData(client, Array.from(componentMap.values()))
      await insertStatusData(client, Array.from(statusMap.values()))

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    await corrector.saveSessionResults(uploadId, req.file.originalname)

    await pool.query(
      `
        UPDATE upload_history
        SET total_rows = $1, ok_rows = $2, nff_rows = $3, wip_rows = $4,
            pcb_sheets = $5, status = 'success'
        WHERE id = $6
      `,
      [stats.totalRows, stats.okRows, stats.nffRows, stats.wipRows, sheets, uploadId]
    )

    const quality = corrector.getStats()
    res.json({
      success: true,
      format,
      message: `Processed ${stats.totalRows} records`,
      total_rows: stats.totalRows,
      ok_rows: stats.okRows,
      nff_rows: stats.nffRows,
      wip_rows: stats.wipRows,
      sheets_processed: sheets.length,
      quality: {
        auto_fixed: quality.autoFixed,
        fuzzy_fixed: quality.fuzzyFixed,
        flagged_for_review: quality.flagged,
        new_corrections_learned: quality.newCorrections.length,
      },
      has_flags: quality.flagged > 0,
    })
  } catch (error) {
    console.error('Upload Error:', error)
    if (uploadId) {
      await pool.query(`UPDATE upload_history SET status = 'failed', error_message = $1 WHERE id = $2`, [error.message, uploadId])
    }
    res.status(500).json({ error: error.message })
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
}
