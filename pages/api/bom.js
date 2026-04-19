import pool from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { part_code, search, page = 1, limit = 50 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)

  try {
    // ── Mode A: paginated global list (for /bom page) ─────────────────────
    // Triggered when ?page or ?search is present (no part_code), or part_code=all
    if (!part_code || part_code === 'all') {
      // Build search filter
      let where = ''
      let params = []
      if (search && search.trim()) {
        where = `WHERE b.part_code::text ILIKE $1 OR UPPER(b.component) ILIKE UPPER($1) OR UPPER(COALESCE(b.description,'')) ILIKE UPPER($1)`
        params = [`%${search.trim()}%`]
      }

      const [countResult, dataResult, consumptionResult] = await Promise.all([
        pool.query(`SELECT COUNT(*) as total FROM bom b ${where}`, params),

        pool.query(`
          SELECT
            b.id,
            b.part_code,
            TRIM(b.component) AS location,
            COALESCE(NULLIF(TRIM(b.description),''), TRIM(b.component)) AS description,
            'db' AS source,
            b.created_at
          FROM bom b
          ${where}
          ORDER BY b.part_code ASC, b.component ASC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, parseInt(limit), offset]),

        // Get actual consumption counts for all bom entries
        pool.query(`
          SELECT
            cd.part_code::text AS part_code,
            UPPER(TRIM(cd.component)) AS component,
            SUM(cd.count)::int AS actual_count
          FROM component_data cd
          WHERE cd.component IS NOT NULL AND TRIM(cd.component) <> ''
          GROUP BY cd.part_code::text, UPPER(TRIM(cd.component))
        `),
      ])

      const total = parseInt(countResult.rows[0].total)

      // Build consumption lookup map
      const consumptionMap = {}
      for (const r of consumptionResult.rows) {
        consumptionMap[`${r.part_code}_${r.component}`] = r.actual_count
      }

      // Enrich rows with actual_count
      const enriched = dataResult.rows.map(row => ({
        ...row,
        actual_count: consumptionMap[`${row.part_code}_${String(row.location).toUpperCase()}`] || 0,
      }))

      return res.json({
        data: enriched,
        bom: enriched, // backward compat
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        bom_count: total,
      })
    }

    // ── Mode B: per-part comparison (for [part_code].js detail page) ──────
    const filterParam = part_code
    const [bomRows, actualRows, totalPCBs] = await Promise.all([
      pool.query(`
        SELECT
          b.part_code::text AS part_code,
          TRIM(b.component) AS component,
          COALESCE(NULLIF(TRIM(b.description),''), TRIM(b.component)) AS description,
          'db' AS source,
          b.created_at
        FROM bom b
        WHERE b.part_code::text = $1::text
        ORDER BY b.component ASC
      `, [filterParam]),

      pool.query(`
        SELECT
          cd.part_code::text AS part_code,
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
        GROUP BY cd.part_code::text, UPPER(TRIM(cd.component))
        ORDER BY actual_count DESC, component ASC
      `, [filterParam]),

      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM pcb_data WHERE part_code::text = $1::text`,
        [filterParam]
      ),
    ])

    const pcbCount = totalPCBs.rows[0]?.cnt || 0

    // Build BOM map
    const bomMap = {}
    for (const r of bomRows.rows) {
      const key = `${r.part_code}_${String(r.component).toUpperCase()}`
      bomMap[key] = {
        component: r.component,
        description: r.description,
        bom_expected: 1,
        actual_count: 0,
        in_bom: true,
        source: r.source,
        created_at: r.created_at,
      }
    }

    const comparison = []
    for (const r of actualRows.rows) {
      const key = `${r.part_code}_${r.component}`
      if (bomMap[key]) {
        bomMap[key].actual_count = r.actual_count
        if (!bomMap[key].description || bomMap[key].description === bomMap[key].component) {
          bomMap[key].description = r.description || bomMap[key].description
        }
      } else {
        comparison.push({
          component: r.component,
          description: r.description || r.component,
          bom_expected: 0,
          actual_count: r.actual_count,
          in_bom: false,
          source: 'repair_data',
        })
      }
    }
    for (const entry of Object.values(bomMap)) comparison.push(entry)
    comparison.sort((a, b) => b.actual_count - a.actual_count || (b.in_bom ? 1 : -1))

    const enriched = comparison.map(c => ({
      ...c,
      failure_rate: pcbCount > 0 && c.actual_count > 0
        ? Number(((c.actual_count / pcbCount) * 100).toFixed(1))
        : 0,
    }))

    res.json({
      bom: bomRows.rows,
      actual: actualRows.rows,
      comparison: enriched,
      total_pcbs: pcbCount,
      bom_count: bomRows.rows.length,
      actual_components: actualRows.rows.length,
    })
  } catch (err) {
    console.error('BOM API error:', err)
    res.status(500).json({ error: err.message })
  }
}
