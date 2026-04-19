import pool from '../../lib/db'
import {
  buildHierarchy,
  queryPartCodeDetail,
  queryPartCodeSummary,
  queryRepairRows,
} from '../../lib/analytics'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const level = req.query.level || 'dashboard'
  const stateName = req.query.state
  const cityName = req.query.city
  const partCode = req.query.part_code
  const status = req.query.status

  try {
    const repairRows = await queryRepairRows(pool, { status })
    const hierarchy = buildHierarchy(repairRows)
    const allPartCodes = level === 'part-code' ? await queryPartCodeSummary(pool, {}, 200) : null

    if (level === 'dashboard') {
      const partCodes = await queryPartCodeSummary(pool, { status }, 20)
      return res.json({
        level,
        title: 'Part Code View',
        items: partCodes,
      })
    }

    const stateEntry = hierarchy.states.find((item) => item.state === stateName)
    if (!stateEntry && level !== 'part-code') {
      return res.status(404).json({ error: 'State not found', level })
    }

    if (level === 'state') {
      return res.json({
        level,
        title: `${stateName} Cities`,
        summary: stateEntry,
        items: stateEntry.cities,
      })
    }

    const cityEntry = stateEntry?.cities?.find((item) => item.city === cityName)
    if (!cityEntry && level !== 'part-code') {
      return res.status(404).json({ error: 'City not found', level })
    }

    if (level === 'city') {
      return res.json({
        level,
        title: `${cityName} Part Codes`,
        summary: cityEntry,
        items: cityEntry.partCodes,
      })
    }

    const partEntry =
      cityEntry?.partCodes?.find((item) => item.partCode === String(partCode))
      || allPartCodes?.find((item) => item.partCode === String(partCode))
    if (!partEntry) {
      return res.status(404).json({ error: 'Part code not found', level })
    }

    const partDetail = await queryPartCodeDetail(pool, {
      partCode,
      city: cityEntry ? cityName : undefined,
    })

    return res.json({
      level: 'part-code',
      title: `Part Code ${partCode}`,
      summary: partEntry,
      detail: partDetail,
      state: stateEntry?.state,
      city: cityEntry?.city,
    })
  } catch (error) {
    console.error('Drilldown error:', error)
    res.status(500).json({ error: error.message || 'Failed to load drilldown data' })
  }
}
