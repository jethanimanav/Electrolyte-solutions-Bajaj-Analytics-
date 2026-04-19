// ============================================================
// lib/analytics.js — Single Source of Truth for all queries
// V9 Final — Consistent WIP, full branch mapping, alerts
// ============================================================

import { queryLatestSuccessfulUpload } from './upload-quality'

const BRANCH_TO_STATE = {
  // Madhya Pradesh
  INDORE: 'Madhya Pradesh', BHOPAL: 'Madhya Pradesh',
  JABALPUR: 'Madhya Pradesh', JABALPR: 'Madhya Pradesh',
  GWALIOR: 'Madhya Pradesh', SAGAR: 'Madhya Pradesh',
  REWA: 'Madhya Pradesh', UJJAIN: 'Madhya Pradesh',
  SATNA: 'Madhya Pradesh', ASHTA: 'Madhya Pradesh', ASHITA: 'Madhya Pradesh',
  // Uttar Pradesh
  LUCKNOW: 'Uttar Pradesh', AGRA: 'Uttar Pradesh',
  VARANASI: 'Uttar Pradesh', KANPUR: 'Uttar Pradesh',
  GORAKHPUR: 'Uttar Pradesh', BAREILLY: 'Uttar Pradesh',
  ALLAHABAD: 'Uttar Pradesh', PRAYAGRAJ: 'Uttar Pradesh',
  ALIGARH: 'Uttar Pradesh', MEERUT: 'Uttar Pradesh',
  NOIDA: 'Uttar Pradesh', MATHURA: 'Uttar Pradesh',
  KUSHINAGAR: 'Uttar Pradesh', PRATAPGARH: 'Uttar Pradesh',
  RAMPUR: 'Uttar Pradesh', MUZAFFARNAGAR: 'Uttar Pradesh',
  LAKHIMPUR: 'Uttar Pradesh', SULTANPUR: 'Uttar Pradesh',
  AZAMGARH: 'Uttar Pradesh', JAUNPUR: 'Uttar Pradesh',
  // Bihar
  PATNA: 'Bihar', BHAGALPUR: 'Bihar', MUZAFFARPUR: 'Bihar',
  MOTIHARI: 'Bihar', GAYA: 'Bihar', DARBHANGA: 'Bihar',
  PURNIA: 'Bihar', BEGUSARAI: 'Bihar', SAMASTIPUR: 'Bihar',
  CHAMPARAN: 'Bihar', SHEIKHPURA: 'Bihar', SHEKHPURA: 'Bihar',
  SHEIKHOURA: 'Bihar', SHERGHATI: 'Bihar', LATEHAR: 'Bihar',
  NAWADA: 'Bihar', ROHTAS: 'Bihar', BUXAR: 'Bihar',
  // Chhattisgarh
  RAIPUR: 'Chhattisgarh', BHILAI: 'Chhattisgarh',
  BILASPUR: 'Chhattisgarh', DURG: 'Chhattisgarh',
  RAJNANDGAON: 'Chhattisgarh', KORBA: 'Chhattisgarh',
  // Maharashtra
  NAGPUR: 'Maharashtra', NAGAPUR: 'Maharashtra',
  MUMBAI: 'Maharashtra', PUNE: 'Maharashtra',
  AURANGABAD: 'Maharashtra', SAMBHAJINAGAR: 'Maharashtra',
  AMRAVATI: 'Maharashtra', KOLHAPUR: 'Maharashtra',
  NASHIK: 'Maharashtra', THANE: 'Maharashtra',
  NANDED: 'Maharashtra', SOLAPUR: 'Maharashtra',
  DHULE: 'Maharashtra', YAVATMAL: 'Maharashtra',
  AKOLA: 'Maharashtra', LATUR: 'Maharashtra',
  // West Bengal
  KOLKATA: 'West Bengal', BURDWAN: 'West Bengal',
  BARDHAMAN: 'West Bengal', SILIGURI: 'West Bengal',
  DURGAPUR: 'West Bengal', BARUIPUR: 'West Bengal',
  MALDA: 'West Bengal', HOWRAH: 'West Bengal',
  ASANSOL: 'West Bengal', KHARAGPUR: 'West Bengal',
  // Jharkhand
  RANCHI: 'Jharkhand', JAMSHEDPUR: 'Jharkhand',
  DHANBAD: 'Jharkhand', BOKARO: 'Jharkhand',
  HAZARIBAGH: 'Jharkhand', GIRIDIH: 'Jharkhand',
  // Odisha
  BBSR: 'Odisha', BHUBANESWAR: 'Odisha',
  BALASORE: 'Odisha', BHADRAK: 'Odisha',
  CUTTACK: 'Odisha', CTC: 'Odisha',
  SAMBALPUR: 'Odisha', BERHAMPUR: 'Odisha',
  ROURKELA: 'Odisha', PURI: 'Odisha',
  // Gujarat
  AHMEDABAD: 'Gujarat', SURAT: 'Gujarat',
  VADODARA: 'Gujarat', RAJKOT: 'Gujarat',
  AMRELI: 'Gujarat', CHUDA: 'Gujarat',
  GUJRAT: 'Gujarat', GANDHINAGAR: 'Gujarat',
  BHARUCH: 'Gujarat', ANAND: 'Gujarat',
  JUNAGADH: 'Gujarat', BHAVNAGAR: 'Gujarat',
  // Rajasthan
  JAIPUR: 'Rajasthan', JODHPUR: 'Rajasthan',
  KOTA: 'Rajasthan', AJMER: 'Rajasthan',
  RAJPUT: 'Rajasthan', BIKANER: 'Rajasthan',
  UDAIPUR: 'Rajasthan', BHARATPUR: 'Rajasthan',
  // Delhi & NCR
  DELHI: 'Delhi', 'NEW DELHI': 'Delhi',
  GURGAON: 'Haryana', GURUGRAM: 'Haryana',
  FARIDABAD: 'Haryana', KUNDLI: 'Haryana',
  // Punjab / Haryana
  CHANDIGARH: 'Punjab', CHD: 'Punjab',
  LUDHIANA: 'Punjab', AMRITSAR: 'Punjab',
  JALANDHAR: 'Punjab', PATIALA: 'Punjab',
  AMBALA: 'Haryana', HISAR: 'Haryana',
  ROHTAK: 'Haryana', PANIPAT: 'Haryana',
  // Uttarakhand
  DEHRADUN: 'Uttarakhand', HARIDWAR: 'Uttarakhand',
  RISHIKESH: 'Uttarakhand', NAINITAL: 'Uttarakhand',
  // Telangana
  HYDERABAD: 'Telangana', WARANGAL: 'Telangana',
  NIZAMABAD: 'Telangana', KARIMNAGAR: 'Telangana',
  // Karnataka
  BANGALORE: 'Karnataka', BNG: 'Karnataka',
  BENGALURU: 'Karnataka', MYSORE: 'Karnataka',
  HUBLI: 'Karnataka', MANGALORE: 'Karnataka',
  BELGAUM: 'Karnataka', GULBARGA: 'Karnataka',
  // Kerala
  CALICUT: 'Kerala', KOCHI: 'Kerala',
  TRIVANDRUM: 'Kerala', THRISSUR: 'Kerala',
  KOZHIKODE: 'Kerala', KOLLAM: 'Kerala',
  // Tamil Nadu
  CHENNAI: 'Tamil Nadu', COIMBATORE: 'Tamil Nadu',
  MADURAI: 'Tamil Nadu', TRICHY: 'Tamil Nadu',
  SALEM: 'Tamil Nadu', TIRUNELVELI: 'Tamil Nadu',
  // NE States
  GUWAHATI: 'Assam', SILI: 'West Bengal',
  SILIGURI: 'West Bengal', AGARTALA: 'Tripura',
  SHILLONG: 'Meghalaya', IMPHAL: 'Manipur',
  // Andhra Pradesh
  VIJAYAWADA: 'Andhra Pradesh', VISAKHAPATNAM: 'Andhra Pradesh',
  VIZAG: 'Andhra Pradesh', GUNTUR: 'Andhra Pradesh',
  TIRUPATI: 'Andhra Pradesh',
}

const CITY_ALIASES = {
  BBSR: 'Bhubaneswar', CTC: 'Cuttack',
  CHD: 'Chandigarh', BNG: 'Bangalore',
  NAGAPUR: 'Nagpur', JABALPR: 'Jabalpur',
  BURDWAN: 'Bardhaman', BARDHAMAN: 'Bardhaman',
  GUJRAT: 'Gandhinagar', SILI: 'Siliguri',
  SHEIKHOURA: 'Sheikhpura', SHEKHPURA: 'Sheikhpura',
  RAJPUT: 'Jaipur', ASHITA: 'Ashta',
  SAMBHAJINAGAR: 'Aurangabad',
}

const integer = (v) => Number.parseInt(v, 10) || 0
const titleCase = (v) => String(v || '').toLowerCase().replace(/\b\w/g, m => m.toUpperCase())

export const normalizeBranch = (branch) => String(branch || '').trim()

export const normalizeCity = (branch) => {
  const raw = normalizeBranch(branch)
  if (!raw) return null
  const upper = raw.toUpperCase()
  return CITY_ALIASES[upper] || titleCase(raw)
}

export const normalizeStateFromBranch = (branch) => {
  const raw = normalizeBranch(branch)
  if (!raw) return null
  return BRANCH_TO_STATE[raw.toUpperCase()] || null
}

export const normalizeStatus = (status) => {
  const v = String(status || '').trim().toUpperCase()
  if (!v || ['NULL','NA','N/A','NAN','UNKNOWN','PENDING','INCOMPLETE',''].includes(v)) return 'WIP'
  if (v === 'OK') return 'OK'
  if (v === 'NFF') return 'NFF'
  if (v === 'SCRAP' || v === 'SCRAPPED' || v === 'DUMPED' || v === 'WASTE' || v === 'REJECTED') return 'SCRAP'
  return 'WIP'
}

export const buildRepairWhereClause = (filters = {}) => {
  const params = []
  const conditions = []

  if (filters.partCode && filters.partCode !== 'all') {
    params.push(filters.partCode)
    conditions.push(`part_code = $${params.length}`)
  }

  if (filters.status && filters.status !== 'all') {
    const ns = normalizeStatus(filters.status)
    if (ns === 'WIP') {
      conditions.push(`UPPER(TRIM(COALESCE(status,''))) NOT IN ('OK','NFF','SCRAP')`)
    } else {
      params.push(ns)
      conditions.push(`UPPER(TRIM(COALESCE(status,''))) = $${params.length}`)
    }
  }

  if (filters.requireBranch !== false) {
    conditions.push(`branch IS NOT NULL`)
    conditions.push(`TRIM(branch) NOT IN ('','NA','nan','N/A','NULL','null')`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  return { params, where }
}

const createMetric = (base) => ({ ...base, total:0, ok:0, nff:0, wip:0, scrap:0, ...base })

const applyStatus = (target, status, count) => {
  target.total += count
  if (status === 'OK') target.ok += count
  else if (status === 'NFF') target.nff += count
  else if (status === 'SCRAP') target.scrap += count
  else target.wip += count
}

const finalizeMetric = (item) => ({
  ...item,
  okRate:  item.total > 0 ? Number(((item.ok  / item.total) * 100).toFixed(1)) : 0,
  nffRate: item.total > 0 ? Number(((item.nff / item.total) * 100).toFixed(1)) : 0,
  wipRate: item.total > 0 ? Number(((item.wip / item.total) * 100).toFixed(1)) : 0,
  scrapRate: item.total > 0 ? Number(((item.scrap / item.total) * 100).toFixed(1)) : 0,
})

export const buildHierarchy = (rows = []) => {
  const states = new Map()
  const partCodes = new Map()
  const cities = []

  for (const row of rows) {
    const stateName = normalizeStateFromBranch(row.branch)
    const cityName  = normalizeCity(row.branch)
    if (!stateName || !cityName) continue

    const partCode = String(row.part_code || '').trim()
    const count    = integer(row.count)
    const status   = normalizeStatus(row.status)
    const productDescription = row.product_description || 'PCB'

    if (!states.has(stateName)) {
      states.set(stateName, { state: stateName, total:0, ok:0, nff:0, wip:0, scrap:0, cityMap: new Map(), partCodeMap: new Map() })
    }
    const stateEntry = states.get(stateName)
    applyStatus(stateEntry, status, count)

    if (!stateEntry.cityMap.has(cityName)) {
      stateEntry.cityMap.set(cityName, { city: cityName, state: stateName, total:0, ok:0, nff:0, wip:0, scrap:0, partCodeMap: new Map() })
    }
    const cityEntry = stateEntry.cityMap.get(cityName)
    applyStatus(cityEntry, status, count)

    if (!stateEntry.partCodeMap.has(partCode)) {
      stateEntry.partCodeMap.set(partCode, { partCode, productDescription, state:stateName, total:0, ok:0, nff:0, wip:0, scrap:0 })
    }
    applyStatus(stateEntry.partCodeMap.get(partCode), status, count)

    if (!cityEntry.partCodeMap.has(partCode)) {
      cityEntry.partCodeMap.set(partCode, { partCode, productDescription, state:stateName, city:cityName, total:0, ok:0, nff:0, wip:0, scrap:0 })
    }
    applyStatus(cityEntry.partCodeMap.get(partCode), status, count)

    if (!partCodes.has(partCode)) {
      partCodes.set(partCode, { partCode, productDescription, total:0, ok:0, nff:0, wip:0, scrap:0 })
    }
    applyStatus(partCodes.get(partCode), status, count)
  }

  const stateList = Array.from(states.values()).map(stateEntry => {
    const cityList = Array.from(stateEntry.cityMap.values()).map(cityEntry => ({
      ...finalizeMetric(cityEntry),
      partCodes: Array.from(cityEntry.partCodeMap.values()).map(finalizeMetric).sort((a,b) => b.total - a.total),
    })).sort((a,b) => b.total - a.total)
    cities.push(...cityList)
    return {
      ...finalizeMetric(stateEntry),
      cities: cityList,
      cityCount: cityList.length,
      partCodes: Array.from(stateEntry.partCodeMap.values()).map(finalizeMetric).sort((a,b) => b.total - a.total),
    }
  }).sort((a,b) => b.total - a.total)

  return {
    states: stateList,
    cities: cities.sort((a,b) => b.total - a.total),
    partCodes: Array.from(partCodes.values()).map(finalizeMetric).sort((a,b) => b.total - a.total),
  }
}

// ─── QUERIES ────────────────────────────────────────────────

const STATUS_EXPR = `CASE WHEN UPPER(TRIM(COALESCE(status,'')))='OK' THEN 'OK' WHEN UPPER(TRIM(COALESCE(status,'')))='NFF' THEN 'NFF' WHEN UPPER(TRIM(COALESCE(status,''))) IN ('SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 'SCRAP' ELSE 'WIP' END`
const DEFECT_EXPR = `INITCAP(LOWER(TRIM(BOTH ' .,' FROM COALESCE(NULLIF(TRIM(defect_normalized),''), COALESCE(NULLIF(TRIM(defect),''),'Unspecified')))))`

export const queryRepairRows = async (pool, filters = {}) => {
  const { where, params } = buildRepairWhereClause(filters)
  const r = await pool.query(`
    SELECT
      INITCAP(LOWER(TRIM(branch)))                    AS branch,
      part_code::text                                 AS part_code,
      ${STATUS_EXPR}                                  AS status,
      COALESCE(MAX(NULLIF(product_description,'')), 'PCB') AS product_description,
      COUNT(*)::int                                   AS count
    FROM pcb_data ${where}
    GROUP BY INITCAP(LOWER(TRIM(branch))), part_code, ${STATUS_EXPR}
  `, params)
  return r.rows
}

export const queryAnalyticsTotals = async (pool, filters = {}) => {
  const { where, params } = buildRepairWhereClause({ ...filters, requireBranch: false })
  const r = await pool.query(`
    SELECT
      COUNT(*)::int                                                                             AS total_records,
      COUNT(DISTINCT part_code)::int                                                            AS unique_part_codes,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,'')))='OK'  THEN 1 ELSE 0 END)::int             AS ok_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,'')))='NFF' THEN 1 ELSE 0 END)::int             AS nff_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) IN ('SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS scrap_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) NOT IN ('OK','NFF','SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS wip_count,
      -- Unmapped breakdown
      SUM(CASE WHEN branch IS NULL OR TRIM(branch)='' THEN 1 ELSE 0 END)::int                  AS branch_null_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(branch,''))) IN ('NA','N/A','NAN','NULL') THEN 1 ELSE 0 END)::int AS branch_na_count
    FROM pcb_data ${where}
  `, params)
  return r.rows[0] || { total_records:0, unique_part_codes:0, ok_count:0, nff_count:0, scrap_count:0, wip_count:0, branch_null_count:0, branch_na_count:0 }
}

export const queryPartCodeSummary = async (pool, filters = {}, limit = 20) => {
  const { where, params } = buildRepairWhereClause({ ...filters, requireBranch: false })
  params.push(limit)
  const r = await pool.query(`
    SELECT
      part_code::text                                                                           AS part_code,
      COALESCE(MAX(NULLIF(product_description,'')), 'PCB')                                     AS product_description,
      COUNT(*)::int                                                                             AS total,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,'')))='OK'  THEN 1 ELSE 0 END)::int             AS ok,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,'')))='NFF' THEN 1 ELSE 0 END)::int             AS nff,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) IN ('SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS scrap,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) NOT IN ('OK','NFF','SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS wip
    FROM pcb_data ${where}
    GROUP BY part_code
    ORDER BY total DESC
    LIMIT $${params.length}
  `, params)
  return r.rows.map(row => finalizeMetric({
    partCode: row.part_code,
    productDescription: row.product_description,
    total: integer(row.total), ok: integer(row.ok), nff: integer(row.nff), scrap: integer(row.scrap), wip: integer(row.wip),
  }))
}

export const queryTrends = async (pool, filters = {}) => {
  const { where, params } = buildRepairWhereClause({ ...filters, requireBranch: false })
  const r = await pool.query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', repair_date), 'Mon YYYY') AS month,
      DATE_TRUNC('month', repair_date)                       AS month_date,
      COUNT(*)::int                                          AS total,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,'')))='OK'  THEN 1 ELSE 0 END)::int  AS ok_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,'')))='NFF' THEN 1 ELSE 0 END)::int  AS nff_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) IN ('SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS scrap_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(status,''))) NOT IN ('OK','NFF','SCRAP','SCRAPPED','DUMPED','WASTE','REJECTED') THEN 1 ELSE 0 END)::int AS wip_count
    FROM pcb_data
    ${where} ${where ? 'AND' : 'WHERE'} repair_date IS NOT NULL
    GROUP BY DATE_TRUNC('month', repair_date)
    ORDER BY month_date DESC LIMIT 12
  `, params)
  return r.rows.reverse()
}

export const queryComponents = async (pool, filters = {}, limit = 12) => {
  const params = []
  const conditions = [`component IS NOT NULL`, `TRIM(component)<>''`, `UPPER(TRIM(component)) NOT IN ('NA','N/A','NULL','NAN','-')`]
  if (filters.partCode && filters.partCode !== 'all') { params.push(filters.partCode); conditions.push(`part_code=$${params.length}`) }
  params.push(limit)
  const r = await pool.query(`
    SELECT component, COALESCE(NULLIF(description,''), component) AS description,
           SUM(count)::int AS total_count, COUNT(DISTINCT part_code)::int AS pcb_count
    FROM component_data WHERE ${conditions.join(' AND ')}
    GROUP BY component, COALESCE(NULLIF(description,''), component)
    ORDER BY total_count DESC LIMIT $${params.length}
  `, params)
  return r.rows
}

export const queryPartCodeDetail = async (pool, { partCode, city } = {}) => {
  const params = [partCode]
  const branchFilter = city ? ` AND TRIM(branch)=$2` : ''
  if (city) params.push(city)

  const [components, defects, sampleRows, wipSummary, wipCities] = await Promise.all([
    pool.query(`
      SELECT component, COALESCE(NULLIF(description,''),component) AS description, SUM(count)::int AS total_count
      FROM component_data WHERE part_code=$1 AND component IS NOT NULL AND TRIM(component)<>''
        AND UPPER(TRIM(component)) NOT IN ('NA','NULL','N/A','-')
      GROUP BY component, COALESCE(NULLIF(description,''),component)
      ORDER BY total_count DESC LIMIT 15
    `, [partCode]),
    pool.query(`
      SELECT ${DEFECT_EXPR} AS defect,
             SUM(cnt)::int AS total_count
      FROM (
        SELECT COALESCE(NULLIF(TRIM(defect_normalized),''), COALESCE(NULLIF(TRIM(defect),''),'Unspecified')) AS defect, COUNT(*)::int AS cnt
        FROM pcb_data WHERE part_code=$1 ${branchFilter}
        GROUP BY 1
      ) raw
      GROUP BY 1 ORDER BY total_count DESC LIMIT 8
    `, params),
    pool.query(`
      SELECT COALESCE(NULLIF(TRIM(analysis),''),'No analysis') AS analysis,
             COALESCE(NULLIF(TRIM(failure),''),'—') AS failure,
             COALESCE(NULLIF(TRIM(branch),''),'Unknown') AS branch,
             ${STATUS_EXPR} AS status, repair_date
      FROM pcb_data WHERE part_code=$1 ${branchFilter}
      ORDER BY repair_date DESC NULLS LAST, id DESC LIMIT 6
    `, params),
    pool.query(`
      SELECT COUNT(*)::int AS total_records,
             SUM(CASE WHEN ${STATUS_EXPR} NOT IN ('OK','NFF','SCRAP') THEN 1 ELSE 0 END)::int AS total_wip,
             SUM(CASE WHEN ${STATUS_EXPR} = 'SCRAP' THEN 1 ELSE 0 END)::int AS total_scrap,
             SUM(CASE WHEN UPPER(TRIM(COALESCE(component_change,'NA'))) IN ('NA','N/A','NULL','NAN','-','') THEN 1 ELSE 0 END)::int AS missing_component_rows,
             SUM(CASE WHEN UPPER(TRIM(COALESCE(analysis,'NA'))) IN ('NA','N/A','NULL','NAN','-','') THEN 1 ELSE 0 END)::int AS missing_analysis_rows
      FROM pcb_data WHERE part_code=$1 ${branchFilter}
    `, params),
    pool.query(`
        AND branch IS NOT NULL AND TRIM(branch) NOT IN ('','NA','nan','N/A')
        AND ${STATUS_EXPR} NOT IN ('OK','NFF','SCRAP')
      GROUP BY COALESCE(branch_normalized, TRIM(branch))
      ORDER BY total_wip DESC LIMIT 5
    `, params),
  ])

  return {
    components: components.rows,
    defects: defects.rows,
    samples: sampleRows.rows,
    wipSummary: {
      totalRecords: integer(wipSummary.rows[0]?.total_records),
      totalWip: integer(wipSummary.rows[0]?.total_wip),
      totalScrap: integer(wipSummary.rows[0]?.total_scrap),
      missingComponentRows: integer(wipSummary.rows[0]?.missing_component_rows),
      missingAnalysisRows: integer(wipSummary.rows[0]?.missing_analysis_rows),
    },
    wipCities: wipCities.rows,
  }
}

export const queryLastUpload = async (pool) => {
  return queryLatestSuccessfulUpload(pool)
}

export const queryLatestUploadSummary = queryLastUpload

const toPercent = (v, t) => (t > 0 ? Number(((v / t) * 100).toFixed(1)) : 0)

export const buildDashboardAlerts = ({ totals, mappedTotal, lastUpload }) => {
  const alerts = []
  const total   = integer(totals.total_records)
  const wip     = integer(totals.wip_count)
  const nff     = integer(totals.nff_count)
  const uploaded = integer(lastUpload?.total_rows)
  const flagged  = integer(lastUpload?.flagged)

  const wipPct     = toPercent(wip, total)
  const nffPct     = toPercent(nff, total)
  const mappedPct  = toPercent(mappedTotal, total)
  const flaggedPct = toPercent(flagged, uploaded || total)

  if (wipPct >= 30) alerts.push({
    severity: 'warning',
    title: `⚠ High WIP — ${wipPct}% records are pending`,
    description: `${wip.toLocaleString('en-IN')} records have no repair status. Analysis reflects only ${(100-wipPct).toFixed(1)}% of data.`,
  })
  if (nffPct >= 20) alerts.push({
    severity: 'warning',
    title: `⚠ High NFF rate — ${nffPct}%`,
    description: `${nff.toLocaleString('en-IN')} records show No Fault Found. May indicate field-tech misdiagnosis.`,
  })
  if (mappedPct > 0 && mappedPct < 75) alerts.push({
    severity: 'info',
    title: `ℹ Geographic coverage at ${mappedPct}%`,
    description: `${(100-mappedPct).toFixed(1)}% of records lack valid city/state data — map analytics covers partial view only.`,
  })
  if (flaggedPct >= 1) alerts.push({
    severity: flaggedPct >= 3 ? 'warning' : 'info',
    title: `ℹ ${flagged} values need correction review`,
    description: `Auto-Corrections page has pending items that affect data accuracy.`,
  })
  return alerts
}

export const buildDashboardInsights = ({ hierarchy, components, partCodes, totals }) => {
  const comp      = components?.[0]
  const nffCity   = [...(hierarchy?.cities||[])].sort((a,b) => b.nff-a.nff)[0]
  const wipPart   = [...(partCodes||[])].sort((a,b) => b.wip-a.wip)[0]
  const topState  = hierarchy?.states?.[0]
  return [
    { label:'Top State by PCB Volume', value: topState?.state||'No data', detail: topState ? `${topState.total.toLocaleString('en-IN')} mapped records` : 'Upload branch-mapped data', color:'#3b82f6', icon:'📍' },
    { label:'Highest NFF Location',    value: nffCity?.city||'No data',   detail: nffCity  ? `${nffCity.nff.toLocaleString('en-IN')} NFF records`    : 'No NFF pattern yet',          color:'#f59e0b', icon:'⚠️' },
    { label:'Most Used Component',     value: comp?.component||'No data',  detail: comp     ? `${integer(comp.total_count).toLocaleString('en-IN')} replacements` : 'Component data after upload', color:'#22c55e', icon:'🔧' },
    { label:'Highest WIP Part Code',   value: wipPart?.partCode ? `Part ${wipPart.partCode}` : 'No data', detail: wipPart ? `${wipPart.wip.toLocaleString('en-IN')} pending of ${wipPart.total.toLocaleString('en-IN')}` : `${integer(totals.wip_count).toLocaleString('en-IN')} total WIP`, color:'#a78bfa', icon:'⏳' },
  ]
}

export const buildDataHealth = ({ totals, mappedTotal, lastUpload }) => {
  const total    = integer(totals.total_records)
  const uploaded = integer(lastUpload?.total_rows)
  const wipPct     = toPercent(integer(totals.wip_count), total)
  const mappedPct  = toPercent(mappedTotal, total)
  const flaggedPct = toPercent(integer(lastUpload?.flagged), uploaded||total)
  const score = Math.max(0, Math.round(100 - wipPct*0.6 - (100-mappedPct)*0.25 - flaggedPct*2))
  const tone  = score>=80 ? 'healthy' : score>=60 ? 'watch' : 'risk'
  return {
    score, tone, wipPct, mappedPct, flaggedPct,
    message: tone==='healthy' ? 'Data quality looks stable for enterprise reporting.'
            : tone==='watch'  ? 'Some pending or unmapped records may affect analysis.'
            : 'High WIP or low mapping coverage is reducing analysis confidence.',
  }
}
