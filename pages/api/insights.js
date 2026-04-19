import pool from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const [topComp, topBranch, nffBranch, wipPart] = await Promise.all([
      pool.query(`
        SELECT component, SUM(count)::int AS total
        FROM component_data
        WHERE component IS NOT NULL AND TRIM(component) <> ''
          AND UPPER(TRIM(component)) NOT IN ('NA','NULL','N/A','-')
        GROUP BY component ORDER BY total DESC LIMIT 1
      `),
      pool.query(`
        SELECT COALESCE(branch_normalized, TRIM(branch)) AS branch, COUNT(*)::int AS total
        FROM pcb_data
        WHERE COALESCE(branch_normalized, TRIM(branch)) IS NOT NULL
          AND COALESCE(branch_normalized, TRIM(branch)) NOT IN ('','NA','nan','N/A')
        GROUP BY 1 ORDER BY total DESC LIMIT 1
      `),
      pool.query(`
        SELECT COALESCE(branch_normalized, TRIM(branch)) AS branch,
               SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) = 'NFF' THEN 1 ELSE 0 END)::int AS nff_count
        FROM pcb_data
        WHERE COALESCE(branch_normalized, TRIM(branch)) IS NOT NULL
          AND COALESCE(branch_normalized, TRIM(branch)) NOT IN ('','NA','nan','N/A')
        GROUP BY 1 ORDER BY nff_count DESC LIMIT 1
      `),
      pool.query(`
        SELECT part_code::text,
               SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) NOT IN ('OK','NFF') THEN 1 ELSE 0 END)::int AS wip
        FROM pcb_data
        GROUP BY part_code ORDER BY wip DESC LIMIT 1
      `),
    ])

    const insights = [
      {
        icon: '📍', title: 'Top Service Location',
        value: topBranch.rows[0]?.branch || 'No data',
        detail: topBranch.rows[0] ? `${topBranch.rows[0].total.toLocaleString('en-IN')} PCBs received` : 'Upload data to see',
        color: '#3b82f6',
      },
      {
        icon: '⚠️', title: 'Highest NFF Location',
        value: nffBranch.rows[0]?.branch || 'No data',
        detail: nffBranch.rows[0] ? `${nffBranch.rows[0].nff_count.toLocaleString('en-IN')} NFF records` : 'No NFF pattern yet',
        color: '#f59e0b',
      },
      {
        icon: '🔧', title: 'Most Used Component',
        value: topComp.rows[0]?.component || 'No data',
        detail: topComp.rows[0] ? `${topComp.rows[0].total.toLocaleString('en-IN')} replacements` : 'Upload to unlock',
        color: '#22c55e',
      },
      {
        icon: '⏳', title: 'Highest WIP Part Code',
        value: wipPart.rows[0]?.part_code ? `Part ${wipPart.rows[0].part_code}` : 'No data',
        detail: wipPart.rows[0] ? `${wipPart.rows[0].wip.toLocaleString('en-IN')} pending records` : 'All records complete',
        color: '#a78bfa',
      },
    ]

    res.json(insights)
  } catch (err) {
    console.error('Insights error:', err)
    res.status(500).json({ error: err.message })
  }
}
