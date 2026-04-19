import pool from '../../lib/db'

export default async function handler(req, res) {
  try {
    // Table row counts
    const tables = ['consolidated_data', 'pcb_data', 'bom', 'engineers', 'users', 'dc_numbers', 'sheets', 'corrections', 'flagged_values', 'component_data', 'pcb_master', 'status_data', 'upload_history', 'upload_quality_log']
    const counts = {}
    for (const t of tables) {
      try {
        const r = await pool.query(`SELECT COUNT(*) as c FROM "${t}"`)
        counts[t] = parseInt(r.rows[0].c)
      } catch {
        counts[t] = 0
      }
    }

    // Upload history
    const uploads = await pool.query(`SELECT * FROM upload_history ORDER BY uploaded_at DESC LIMIT 20`)

    // Last consolidated_data entry timestamp
    let lastFetch = null
    try {
      const lf = await pool.query(`SELECT MAX(updated_at) as last FROM consolidated_data`)
      lastFetch = lf.rows[0]?.last
    } catch {}

    // DB size
    let dbSize = 'N/A'
    try {
      const sz = await pool.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`)
      dbSize = sz.rows[0].size
    } catch {}

    res.status(200).json({
      counts,
      uploads: uploads.rows,
      lastFetch,
      dbSize,
    })
  } catch (err) {
    console.error('Data history API error:', err)
    res.status(500).json({ error: err.message })
  }
}
