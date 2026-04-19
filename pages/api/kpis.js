import pool from '../../lib/db'
import { queryLatestSuccessfulUpload } from '../../lib/upload-quality'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const [totals, branches, lastUpload] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int                                                                        AS total_entries,
          COUNT(DISTINCT part_code)::int                                                       AS total_pcbs,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) = 'OK'  THEN 1 ELSE 0 END)::int      AS ok_count,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) = 'NFF' THEN 1 ELSE 0 END)::int      AS nff_count,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) IN ('SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS scrap_count,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) NOT IN ('OK','NFF','SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS wip_count,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(testing,''))) = 'PASS' THEN 1 ELSE 0 END)::int   AS pass_count
        FROM pcb_data
      `),
      pool.query(`
        SELECT COUNT(DISTINCT COALESCE(branch_normalized, TRIM(branch)))::int AS total_branches
        FROM pcb_data
        WHERE COALESCE(branch_normalized, TRIM(branch)) IS NOT NULL
          AND COALESCE(branch_normalized, TRIM(branch)) NOT IN ('','NA','nan','N/A')
      `),
      queryLatestSuccessfulUpload(pool),
    ])

    const t = totals.rows[0]
    const ok  = parseInt(t.ok_count)
    const nff = parseInt(t.nff_count)
    const scrap = parseInt(t.scrap_count)
    const wip = parseInt(t.wip_count)
    const total = parseInt(t.total_entries)
    const completed = ok + nff

    res.json({
      total_entries:    total,
      total_pcbs:       parseInt(t.total_pcbs),
      ok_count:         ok,
      nff_count:        nff,
      scrap_count:      scrap,
      wip_count:        wip,
      pass_count:       parseInt(t.pass_count),
      ok_percentage:    completed > 0 ? ((ok  / completed) * 100).toFixed(1) : 0,
      nff_percentage:   completed > 0 ? ((nff / completed) * 100).toFixed(1) : 0,
      scrap_percentage: total     > 0 ? ((scrap / total)   * 100).toFixed(1) : 0,
      wip_percentage:   total     > 0 ? ((wip / total)     * 100).toFixed(1) : 0,
      pass_percentage:  total     > 0 ? ((parseInt(t.pass_count) / total) * 100).toFixed(1) : 0,
      total_branches:   parseInt(branches.rows[0].total_branches),
      last_upload:      lastUpload || null,
    })
  } catch (err) {
    console.error('KPI Error:', err)
    res.status(500).json({ error: err.message })
  }
}
