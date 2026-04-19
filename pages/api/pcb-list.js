import pool from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const result = await pool.query(`
      SELECT
        p.part_code,
        p.product_description,
        p.dc_no,
        COUNT(d.id)::int                                                                           AS total_entries,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(d.status,''))) = 'OK'  THEN 1 ELSE 0 END)::int          AS ok_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(d.status,''))) = 'NFF' THEN 1 ELSE 0 END)::int          AS nff_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(d.status,''))) IN ('SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS scrap_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(d.status,''))) NOT IN ('OK','NFF','SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS wip_count,
        COUNT(DISTINCT COALESCE(d.branch_normalized, TRIM(d.branch)))::int                         AS branch_count,
        ROUND(
          SUM(CASE WHEN UPPER(TRIM(COALESCE(d.status,''))) = 'OK' THEN 1 ELSE 0 END) * 100.0
          / NULLIF(SUM(CASE WHEN UPPER(TRIM(COALESCE(d.status,''))) IN ('OK','NFF') THEN 1 ELSE 0 END), 0),
        1)                                                                                          AS ok_rate
      FROM pcb_master p
      LEFT JOIN pcb_data d ON d.part_code = p.part_code
      GROUP BY p.part_code, p.product_description, p.dc_no
      ORDER BY total_entries DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
