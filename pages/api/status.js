import pool from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { part_code } = req.query

  try {
    const params = []
    let partFilter = ''
    if (part_code && part_code !== 'all') {
      params.push(part_code)
      partFilter = `AND part_code = $${params.length}`
    }

    // CRITICAL FIX: Do NOT filter out NULL status — those are WIP records
    // Previous bug: WHERE status IS NOT NULL AND status != '' excluded all WIP
    const result = await pool.query(`
      WITH status_groups AS (
        SELECT
          CASE
            WHEN UPPER(TRIM(COALESCE(status, ''))) = 'OK'  THEN 'OK'
            WHEN UPPER(TRIM(COALESCE(status, ''))) = 'NFF' THEN 'NFF'
            ELSE 'WIP'
          END AS status,
          COUNT(*)::int AS count
        FROM pcb_data
        WHERE 1=1 ${partFilter}
        GROUP BY 1
      ),
      total AS (SELECT SUM(count) AS total FROM status_groups)
      SELECT
        s.status,
        s.count,
        ROUND(s.count * 100.0 / NULLIF(t.total, 0), 1) AS percentage
      FROM status_groups s, total t
      ORDER BY
        CASE s.status WHEN 'OK' THEN 1 WHEN 'NFF' THEN 2 ELSE 3 END
    `, params)

    res.json(result.rows)
  } catch (err) {
    console.error('Status API error:', err)
    res.status(500).json({ error: err.message })
  }
}
