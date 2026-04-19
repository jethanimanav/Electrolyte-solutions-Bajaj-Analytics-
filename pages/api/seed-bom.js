import pool from '../../lib/db'
import bomSeedData from '../../lib/bom-seed.json'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const client = await pool.connect()
    let inserted = 0, updated = 0

    try {
      await client.query('BEGIN')

      for (const entry of bomSeedData) {
        const r = await client.query(`
          INSERT INTO bom (part_code, component, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (part_code, component)
          DO UPDATE SET description = EXCLUDED.description
          RETURNING (xmax = 0) AS inserted
        `, [entry.part_code, entry.location, entry.description])
        if (r.rows[0]?.inserted) inserted++
        else updated++
      }

      // Update component_data descriptions from BOM
      const updateResult = await client.query(`
        UPDATE component_data cd
        SET description = b.description
        FROM bom b
        WHERE cd.part_code = b.part_code
          AND UPPER(TRIM(cd.component)) = UPPER(TRIM(b.component))
      `)

      await client.query('COMMIT')

      res.json({
        success: true,
        total: bomSeedData.length,
        inserted,
        updated,
        component_descriptions_updated: updateResult.rowCount,
        message: `BOM seeded: ${inserted} new, ${updated} updated. ${updateResult.rowCount} component descriptions enriched.`
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
