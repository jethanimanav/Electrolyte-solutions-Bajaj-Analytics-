import pool from '../../lib/db'
import { buildHierarchy, queryPartCodeDetail, queryRepairRows } from '../../lib/analytics'

// Case-insensitive, trim-safe finder
const findCI = (arr, key, value) => {
  if (!value) return null
  const v = String(value).trim().toLowerCase()
  return arr.find((item) => String(item[key] || '').trim().toLowerCase() === v)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const level = req.query.level || 'india'
  const stateName = req.query.state
  const cityName = req.query.city
  const partCode = req.query.part_code

  try {
    const repairRows = await queryRepairRows(pool, {
      partCode: partCode && level === 'india' ? partCode : undefined,
    })
    const hierarchy = buildHierarchy(repairRows)

    if (level === 'india') {
      return res.json({
        level,
        states: hierarchy.states,
        totalMapped: hierarchy.partCodes.reduce((sum, item) => sum + item.total, 0),
      })
    }

    const stateEntry = findCI(hierarchy.states, 'state', stateName)
    if (!stateEntry) return res.status(404).json({ error: 'State not found', level })

    if (level === 'state') {
      return res.json({
        level,
        state: stateEntry,
        cities: stateEntry.cities,
      })
    }

    const cityEntry = findCI(stateEntry.cities, 'city', cityName)
    if (!cityEntry) return res.status(404).json({ error: 'City not found', level })

    if (level === 'city') {
      return res.json({
        level,
        state: stateEntry.state,
        city: cityEntry,
        partCodes: cityEntry.partCodes,
      })
    }

    const partEntry = (cityEntry.partCodes || []).find((item) => String(item.partCode) === String(partCode))
    if (!partEntry) return res.status(404).json({ error: 'Part code not found', level })

    const partDetail = await queryPartCodeDetail(pool, {
      partCode,
      city: cityName,
    })

    return res.json({
      level: 'part-code',
      state: stateEntry.state,
      city: cityEntry.city,
      summary: partEntry,
      detail: partDetail,
    })
  } catch (err) {
    console.error('Map data error:', err)
    res.status(500).json({ error: err.message })
  }
}
