import pool from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { part_code } = req.query

  try {
    // Get all part codes if no filter
    const pcbListResult = await pool.query(`
      SELECT DISTINCT part_code::text AS part_code
      FROM component_data
      ORDER BY part_code ASC
    `)
    const partCodes = pcbListResult.rows.map(r => r.part_code)

    if (!part_code || part_code === 'all') {
      // Return summary stats + list of part codes
      const [totalConsumptionResult, topComponentResult, pcbsRepairedResult, consumedTypesResult] = await Promise.all([
        pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM component_data`),
        pool.query(`
          SELECT UPPER(TRIM(component)) AS component, SUM(count)::int AS total
          FROM component_data
          WHERE component IS NOT NULL AND TRIM(component) <> ''
          GROUP BY UPPER(TRIM(component))
          ORDER BY total DESC LIMIT 1
        `),
        pool.query(`SELECT COUNT(DISTINCT id)::int AS cnt FROM pcb_data`),
        pool.query(`
          SELECT COUNT(DISTINCT UPPER(TRIM(component)))::int AS cnt
          FROM component_data
          WHERE component IS NOT NULL AND TRIM(component) <> ''
        `),
      ])

      return res.json({
        part_codes: partCodes,
        total_consumption: totalConsumptionResult.rows[0]?.total || 0,
        top_component: topComponentResult.rows[0]?.component || '—',
        pcbs_repaired: pcbsRepairedResult.rows[0]?.cnt || 0,
        consumed_types: consumedTypesResult.rows[0]?.cnt || 0,
      })
    }

    // Per-part comparison
    const [bomRows, actualRows, totalPCBsResult] = await Promise.all([
      pool.query(`
        SELECT
          TRIM(b.component) AS component,
          COALESCE(NULLIF(TRIM(b.description),''), TRIM(b.component)) AS description,
          b.part_code::text AS part_code
        FROM bom b
        WHERE b.part_code::text = $1::text
        ORDER BY b.component ASC
      `, [part_code]),

      pool.query(`
        SELECT
          UPPER(TRIM(cd.component)) AS component,
          COALESCE(
            MAX(NULLIF(TRIM(cd.description),'')),
            MAX(NULLIF(TRIM(b.description),'')),
            UPPER(TRIM(cd.component))
          ) AS description,
          SUM(cd.count)::int AS actual_count
        FROM component_data cd
        LEFT JOIN bom b
          ON b.part_code::text = cd.part_code::text
         AND UPPER(TRIM(b.component)) = UPPER(TRIM(cd.component))
        WHERE cd.part_code::text = $1::text
          AND cd.component IS NOT NULL
          AND TRIM(cd.component) <> ''
          AND UPPER(TRIM(cd.component)) NOT IN ('NA','NULL','N/A','-','NAN')
        GROUP BY UPPER(TRIM(cd.component))
        ORDER BY actual_count DESC
      `, [part_code]),

      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM pcb_data WHERE part_code::text = $1::text`,
        [part_code]
      ),
    ])

    const pcbCount = totalPCBsResult.rows[0]?.cnt || 0

    // Build BOM lookup map
    const bomMap = {}
    for (const r of bomRows.rows) {
      bomMap[String(r.component).toUpperCase()] = {
        component: r.component,
        description: r.description,
        in_bom: true,
        actual_count: 0,
      }
    }

    const comparison = []
    for (const r of actualRows.rows) {
      const key = String(r.component).toUpperCase()
      if (bomMap[key]) {
        bomMap[key].actual_count = r.actual_count
        if (!bomMap[key].description || bomMap[key].description === key) {
          bomMap[key].description = r.description || bomMap[key].description
        }
        comparison.push({ ...bomMap[key] })
        delete bomMap[key]
      } else {
        comparison.push({
          component: r.component,
          description: r.description || r.component,
          in_bom: false,
          actual_count: r.actual_count,
        })
      }
    }
    // Add BOM-only entries (in BOM but never consumed)
    for (const entry of Object.values(bomMap)) {
      comparison.push({ ...entry })
    }

    comparison.sort((a, b) => b.actual_count - a.actual_count)

    const maxCount = comparison[0]?.actual_count || 1

    const enriched = comparison.map(c => ({
      ...c,
      bar_pct: Math.min(100, Math.round((c.actual_count / maxCount) * 100)),
      failure_rate: pcbCount > 0 && c.actual_count > 0
        ? Number(((c.actual_count / pcbCount) * 100).toFixed(1))
        : 0,
    }))

    // Summary KPIs for this part code
    const bomParts = bomRows.rows.length
    const consumedTypes = actualRows.rows.length
    const totalConsumptions = actualRows.rows.reduce((s, r) => s + (r.actual_count || 0), 0)
    const topComp = actualRows.rows[0]?.component || '—'

    res.json({
      part_codes: partCodes,
      part_code,
      comparison: enriched,
      total_pcbs: pcbCount,
      bom_parts: bomParts,
      consumed_types: consumedTypes,
      total_consumptions: totalConsumptions,
      top_component: topComp,
    })
  } catch (err) {
    console.error('Consumption API error:', err)
    res.status(500).json({ error: err.message })
  }
}
