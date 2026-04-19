import pool from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { part_code, status } = req.query

  try {
    const params = []
    const conditions = ['repair_date IS NOT NULL']

    if (part_code && part_code !== 'all') {
      params.push(part_code)
      conditions.push(`part_code = $${params.length}`)
    }
    if (status && status !== 'all') {
      if (status.toUpperCase() === 'WIP') {
        conditions.push(`UPPER(TRIM(COALESCE(status,''))) NOT IN ('OK','NFF')`)
      } else {
        params.push(status.toUpperCase())
        conditions.push(`UPPER(TRIM(COALESCE(status,''))) = $${params.length}`)
      }
    }

    const where = `WHERE ${conditions.join(' AND ')}`
    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', repair_date), 'Mon YYYY') AS month,
        DATE_TRUNC('month', repair_date)                       AS month_date,
        COUNT(*)::int                                          AS total,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) = 'OK'  THEN 1 ELSE 0 END)::int AS ok_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) = 'NFF' THEN 1 ELSE 0 END)::int AS nff_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) IN ('SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS scrap_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) NOT IN ('OK','NFF','SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS wip_count
      FROM pcb_data
      ${where}
      GROUP BY DATE_TRUNC('month', repair_date)
      ORDER BY month_date DESC
      LIMIT 12
    `, params)

    res.json(result.rows.reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
