// Excel Cleaning API — reads uploaded Excel, applies all normalizations, returns cleaned file
import multer from 'multer'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { clean, cleanDate, normalizeStatus, normalizeBranch, normalizeDefect } from '../../lib/normalize'

export const config = { api: { bodyParser: false } }

const uploadDir = path.join(os.tmpdir(), 'pcb_uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const upload = multer({ dest: uploadDir, limits: { fileSize: 100 * 1024 * 1024 } })
const runMiddleware = (req, res, fn) => new Promise((resolve, reject) => { fn(req, res, r => r instanceof Error ? reject(r) : resolve(r)) })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let filePath = null
  try {
    await runMiddleware(req, res, upload.single('file'))
    filePath = req.file.path

    const workbook = XLSX.readFile(filePath)
    const isNew = workbook.SheetNames.includes('Bajaj_consolidated_data')
    const sheetName = isNew ? 'Bajaj_consolidated_data' : workbook.SheetNames[0]
    const ws = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false })

    let stats = { total: 0, nullFixed: 0, branchFixed: 0, defectFixed: 0, statusFixed: 0, garbage: 0 }
    const cleanedRows = []
    const issues = []

    for (const row of rows) {
      stats.total++
      const cleaned = { ...row }

      // Fix all NULL strings
      for (const key of Object.keys(cleaned)) {
        const v = cleaned[key]
        if (v !== null && v !== undefined && ['NULL','null','NA','N/A','na','n/a'].includes(String(v).trim())) {
          cleaned[key] = ''
          stats.nullFixed++
        }
      }

      // Normalize branch
      const rawBranch = isNew ? row.branch : row['Branch']
      const normBranch = normalizeBranch(rawBranch)
      const branchKey = isNew ? 'branch' : 'Branch'
      const normBranchKey = isNew ? 'branch_normalized' : 'Branch (Normalized)'

      if (rawBranch && normBranch && normBranch !== rawBranch) {
        stats.branchFixed++
        issues.push({ row: stats.total, field: 'Branch', original: rawBranch, fixed: normBranch })
      }
      if (!normBranch && rawBranch && clean(rawBranch)) {
        stats.garbage++
        issues.push({ row: stats.total, field: 'Branch', original: rawBranch, fixed: '(REMOVED - unrecognizable)' })
      }
      cleaned[normBranchKey] = normBranch || ''

      // Normalize status → OK / NFF / WIP
      const rawStatus = isNew ? row.status : row['Status']
      const normStatus = normalizeStatus(rawStatus)
      const statusKey = isNew ? 'status' : 'Status'
      cleaned[statusKey] = normStatus
      if (rawStatus !== normStatus) stats.statusFixed++

      // Normalize defect
      const rawDefect = isNew ? row.defect : row['Defect']
      const normDefect = normalizeDefect(rawDefect)
      const defectKey = isNew ? 'defect' : 'Defect'
      const normDefectKey = isNew ? 'defect_normalized' : 'Defect (Normalized)'
      if (normDefect && normDefect !== rawDefect) {
        stats.defectFixed++
        cleaned[normDefectKey] = normDefect
      }

      cleanedRows.push(cleaned)
    }

    // Write cleaned Excel
    const newWb = XLSX.utils.book_new()
    const newWs = XLSX.utils.json_to_sheet(cleanedRows)
    XLSX.utils.book_append_sheet(newWb, newWs, 'Cleaned_Data')

    // Write issues sheet
    if (issues.length > 0) {
      const issuesWs = XLSX.utils.json_to_sheet(issues)
      XLSX.utils.book_append_sheet(newWb, issuesWs, 'Issues_Log')
    }

    // Stats sheet
    const statsSheet = XLSX.utils.json_to_sheet([
      { Metric: 'Total Rows Processed', Value: stats.total },
      { Metric: 'NULL strings fixed', Value: stats.nullFixed },
      { Metric: 'Branch names normalized', Value: stats.branchFixed },
      { Metric: 'Branch garbage removed', Value: stats.garbage },
      { Metric: 'Status values fixed (→ WIP)', Value: stats.statusFixed },
      { Metric: 'Defect values normalized', Value: stats.defectFixed },
    ])
    XLSX.utils.book_append_sheet(newWb, statsSheet, 'Cleaning_Summary')

    const outPath = path.join(os.tmpdir(), `cleaned_${Date.now()}.xlsx`)
    XLSX.writeFile(newWb, outPath)

    const fileBuffer = fs.readFileSync(outPath)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="cleaned_pcb_data.xlsx"`)
    res.send(fileBuffer)

    fs.unlinkSync(outPath)
  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
}