import pool from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { part_code, page = 1, limit = 10, branch, status, component } = req.query
  if (!part_code) return res.status(400).json({ error: 'part_code required' })

  const offset = (parseInt(page) - 1) * parseInt(limit)
  const params = [part_code]
  let filterClause = ''
  const normalizedStatusExpr = `CASE WHEN UPPER(COALESCE(NULLIF(TRIM(status), ''), 'WIP')) = 'OK' THEN 'OK' WHEN UPPER(COALESCE(NULLIF(TRIM(status), ''), 'WIP')) = 'NFF' THEN 'NFF' WHEN UPPER(COALESCE(NULLIF(TRIM(status), ''), 'WIP')) IN ('SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 'SCRAP' ELSE 'WIP' END`
  const missingComponentExpr = `UPPER(COALESCE(NULLIF(TRIM(component_change), ''), 'NA')) IN ('NA', 'N/A', 'NULL', 'NAN', '-')`

  if (branch && branch !== 'all') {
    params.push(branch)
    filterClause += ` AND TRIM(branch) = $${params.length}`
  }
  if (status && status !== 'all') {
    if (String(status).toUpperCase() === 'WIP') {
      filterClause += ` AND ${normalizedStatusExpr} = 'WIP'`
    } else {
      params.push(String(status).toUpperCase())
      filterClause += ` AND ${normalizedStatusExpr} = $${params.length}`
    }
  }
  if (component && component !== 'all') {
    params.push(component)
    filterClause += ` AND UPPER(COALESCE(component_change, '')) LIKE '%' || UPPER($${params.length}) || '%'`
  }

  try {
    const [data, total, statusBreakdown, componentBreakdown, branchBreakdown, testingBreakdown, defectBreakdown, wipSummary, wipCities, bomRows, actualRows] = await Promise.all([
      pool.query(`
        SELECT * FROM pcb_data WHERE part_code = $1 ${filterClause}
        ORDER BY id LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]),

      pool.query(`SELECT COUNT(*) FROM pcb_data WHERE part_code = $1 ${filterClause}`, params),

      pool.query(`
        WITH grouped AS (
          SELECT ${normalizedStatusExpr} AS status, COUNT(*)::int AS count
          FROM pcb_data
          WHERE part_code = $1
          GROUP BY 1
        ),
        total_rows AS (
          SELECT COALESCE(SUM(count), 0)::int AS total FROM grouped
        )
        SELECT
          statuses.status,
          COALESCE(grouped.count, 0)::int AS count,
          CASE
            WHEN total_rows.total = 0 THEN 0
            ELSE ROUND(COALESCE(grouped.count, 0) * 100.0 / total_rows.total, 1)
          END AS percentage
        FROM (VALUES ('OK'), ('NFF'), ('SCRAP'), ('WIP')) AS statuses(status)
        LEFT JOIN grouped ON grouped.status = statuses.status
        CROSS JOIN total_rows
      `, [part_code]),

      pool.query(`
        SELECT component, description, count
        FROM component_data WHERE part_code = $1
        ORDER BY count DESC LIMIT 15
      `, [part_code]),

      pool.query(`
        SELECT INITCAP(LOWER(TRIM(branch))) as branch, COUNT(*) as count,
        SUM(CASE WHEN ${normalizedStatusExpr} = 'OK' THEN 1 ELSE 0 END) as ok_count,
        SUM(CASE WHEN ${normalizedStatusExpr} = 'NFF' THEN 1 ELSE 0 END) as nff_count,
        SUM(CASE WHEN ${normalizedStatusExpr} = 'SCRAP' THEN 1 ELSE 0 END) as scrap_count,
        SUM(CASE WHEN ${normalizedStatusExpr} = 'WIP' THEN 1 ELSE 0 END) as wip_count
        FROM pcb_data 
        WHERE part_code = $1 AND branch IS NOT NULL AND TRIM(branch) NOT IN ('NA','nan','','N/A','NULL','null')
        GROUP BY 1 ORDER BY count DESC LIMIT 15
      `, [part_code]),

      pool.query(`
        SELECT LOWER(testing) as testing, COUNT(*) as count
        FROM pcb_data WHERE part_code = $1 AND testing IS NOT NULL
        GROUP BY LOWER(testing)
      `, [part_code]),

      pool.query(`
        SELECT
          INITCAP(LOWER(TRIM(BOTH ' .,' FROM defect))) AS defect,
          SUM(cnt)::int AS count
        FROM (
          SELECT defect, COUNT(*) AS cnt
          FROM pcb_data 
          WHERE part_code = $1 AND defect IS NOT NULL AND TRIM(defect) NOT IN ('NA','nan','','N/A','NULL','null')
          GROUP BY defect
        ) raw
        GROUP BY 1
        ORDER BY count DESC LIMIT 10
      `, [part_code]),

      pool.query(`
        SELECT
          COUNT(*)::int AS total_records,
          SUM(CASE WHEN ${normalizedStatusExpr} = 'WIP' THEN 1 ELSE 0 END)::int AS total_wip,
          SUM(CASE WHEN ${normalizedStatusExpr} = 'SCRAP' THEN 1 ELSE 0 END)::int AS total_scrap,
          SUM(CASE WHEN ${missingComponentExpr} THEN 1 ELSE 0 END)::int AS missing_component_rows,
          SUM(CASE WHEN UPPER(COALESCE(NULLIF(TRIM(analysis), ''), 'NA')) IN ('NA', 'N/A', 'NULL', 'NAN', '-') THEN 1 ELSE 0 END)::int AS missing_analysis_rows
        FROM pcb_data
        WHERE part_code = $1
      `, [part_code]),

      pool.query(`
        SELECT
          INITCAP(LOWER(TRIM(branch))) AS branch,
          COUNT(*)::int AS total_wip
        FROM pcb_data
        WHERE part_code = $1
          AND branch IS NOT NULL
          AND TRIM(branch) NOT IN ('', 'NA', 'nan', 'N/A')
          AND ${normalizedStatusExpr} = 'WIP'
        GROUP BY INITCAP(LOWER(TRIM(branch)))
        ORDER BY total_wip DESC, branch ASC
        LIMIT 5
      `, [part_code]),

      pool.query(`
        SELECT
          id,
          part_code::text AS part_code,
          TRIM(component) AS location,
          COALESCE(NULLIF(TRIM(description), ''), TRIM(component)) AS description,
          'db_dump' AS source
        FROM bom
        WHERE part_code::text = $1::text
        ORDER BY component ASC
      `, [part_code]),

      pool.query(`
        SELECT
          cd.part_code::text AS part_code,
          UPPER(TRIM(cd.component)) AS component,
          COALESCE(
            MAX(NULLIF(TRIM(cd.description), '')),
            MAX(NULLIF(TRIM(b.description), '')),
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
          AND UPPER(TRIM(cd.component)) NOT IN ('NA', 'NULL', 'N/A', '-', 'NAN')
        GROUP BY cd.part_code::text, UPPER(TRIM(cd.component))
        ORDER BY actual_count DESC, component ASC
      `, [part_code]),
    ])

    const master = await pool.query('SELECT * FROM pcb_master WHERE part_code = $1', [part_code])

    const totalRecords = parseInt(total.rows[0].count, 10) || 0
    const bomMap = new Map()

    for (const row of bomRows.rows) {
      const componentCode = String(row.location || '').trim().toUpperCase()
      if (!componentCode) continue
      const key = `${row.part_code}_${componentCode}`
      bomMap.set(key, {
        id: row.id,
        part_code: String(row.part_code),
        component: componentCode,
        description: row.description || componentCode,
        source: row.source || 'db_dump',
        in_bom: true,
        actual_count: 0,
      })
    }

    const bomComparison = []

    for (const row of actualRows.rows) {
      const componentCode = String(row.component || '').trim().toUpperCase()
      if (!componentCode) continue
      const key = `${row.part_code}_${componentCode}`

      if (bomMap.has(key)) {
        const target = bomMap.get(key)
        target.actual_count = Number(row.actual_count || 0)
        if (!target.description || target.description === target.component) {
          target.description = row.description || target.description
        }
      } else {
        bomComparison.push({
          part_code: String(row.part_code),
          component: componentCode,
          description: row.description || componentCode,
          source: 'repair_data',
          in_bom: false,
          actual_count: Number(row.actual_count || 0),
        })
      }
    }

    for (const value of bomMap.values()) bomComparison.push(value)

    bomComparison.sort((left, right) => {
      if (right.actual_count !== left.actual_count) return right.actual_count - left.actual_count
      if (left.in_bom !== right.in_bom) return left.in_bom ? -1 : 1
      return String(left.component).localeCompare(String(right.component))
    })

    const replacedInBom = bomComparison.filter((row) => row.in_bom && Number(row.actual_count || 0) > 0).length
    const notReplaced = bomComparison.filter((row) => row.in_bom && Number(row.actual_count || 0) === 0).length
    const notInBom = bomComparison.filter((row) => !row.in_bom).length

    const bomComparisonWithMetrics = bomComparison.map((row) => {
      const actualCount = Number(row.actual_count || 0)
      const failureRate = totalRecords ? Number(((actualCount * 100) / totalRecords).toFixed(1)) : 0

      let statusLabel = 'Not Replaced'
      if (!row.in_bom) {
        statusLabel = 'Unexpected'
      } else if (actualCount >= Math.max(10, Math.round(totalRecords * 0.08))) {
        statusLabel = 'Moderate'
      } else if (actualCount > 0) {
        statusLabel = 'Occasional'
      }

      return {
        ...row,
        actual_count: actualCount,
        failure_rate: failureRate,
        status_label: statusLabel,
      }
    })

    res.json({
      master: master.rows[0] || null,
      data: data.rows,
      total: totalRecords,
      page: parseInt(page),
      limit: parseInt(limit),
      status_breakdown: statusBreakdown.rows,
      component_breakdown: componentBreakdown.rows,
      branch_breakdown: branchBreakdown.rows,
      testing_breakdown: testingBreakdown.rows,
      defect_breakdown: defectBreakdown.rows,
      wip_focus: {
        total_records: parseInt(wipSummary.rows[0]?.total_records || 0, 10),
        total_wip: parseInt(wipSummary.rows[0]?.total_wip || 0, 10),
        missing_component_rows: parseInt(wipSummary.rows[0]?.missing_component_rows || 0, 10),
        missing_analysis_rows: parseInt(wipSummary.rows[0]?.missing_analysis_rows || 0, 10),
        top_wip_cities: wipCities.rows,
      },
      bom_summary: {
        total_designed: bomRows.rows.length,
        replaced_in_bom: replacedInBom,
        not_replaced: notReplaced,
        not_in_bom: notInBom,
      },
      bom_rows: bomRows.rows,
      bom_comparison: bomComparisonWithMetrics,
    })
  } catch (err) {
    console.error('PCB Detail Error:', err)
    res.status(500).json({ error: err.message })
  }
}
