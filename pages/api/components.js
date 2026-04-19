import pool from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { part_code, limit = 12 } = req.query

  try {
    const params = []
    const conditions = [
      `component IS NOT NULL`,
      `TRIM(component) <> ''`,
      `UPPER(TRIM(component)) NOT IN ('NA','N/A','NULL','NAN','-')`
    ]

    if (part_code && part_code !== 'all') {
      params.push(part_code)
      conditions.push(`part_code = $${params.length}`)
    }

    params.push(parseInt(limit))
    const result = await pool.query(`
      SELECT
        component,
        COALESCE(NULLIF(description,''), component) AS description,
        SUM(count)::int                             AS total_count,
        COUNT(DISTINCT part_code)::int              AS pcb_count
      FROM component_data
      WHERE ${conditions.join(' AND ')}
      GROUP BY component, COALESCE(NULLIF(description,''), component)
      ORDER BY total_count DESC, component ASC
      LIMIT $${params.length}
    `, params)

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
