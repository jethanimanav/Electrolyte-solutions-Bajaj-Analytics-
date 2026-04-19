// =============================================
// Data normalization library
// Single source of truth for Excel-first cleanup
// =============================================

export const NULL_LIKE_VALUES = new Set([
  'NULL',
  'null',
  'NA',
  'N/A',
  'n/a',
  'na',
  '',
  'None',
  'none',
  'undefined',
  '-',
])

export const clean = (value) => {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return NULL_LIKE_VALUES.has(text) ? null : text
}

export const cleanDate = (value) => {
  const text = clean(value)
  if (!text) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }

  if (typeof value === 'number') {
    const parsed = new Date((value - 25569) * 86400 * 1000)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export const normalizeStatus = (value) => {
  const text = clean(value)
  if (!text) return 'WIP'

  const upper = text.toUpperCase()
  if (upper === 'OK') return 'OK'
  if (upper === 'NFF') return 'NFF'
  return 'WIP'
}

const canonicalCities = [
  'LUCKNOW',
  'PATNA',
  'INDORE',
  'RANCHI',
  'GORAKHPUR',
  'RAIPUR',
  'BAREILLY',
  'BHUBANESWAR',
  'BBSR',
  'JABALPUR',
  'NAGPUR',
  'KOLKATA',
  'CHD',
  'KANPUR',
  'VARANASI',
  'DEHRADUN',
  'THANE',
  'AGRA',
  'SHERGHATI',
  'MUMBAI',
  'BHAGALPUR',
  'LATEHAR',
  'JAMSHEDPUR',
  'DELHI',
  'BHOPAL',
  'KUSHINAGAR',
  'PRATAPGARH',
  'DHANBAD',
  'NASHIK',
  'MOTIHARI',
  'DHULE',
  'NOIDA',
  'PUNE',
  'GUWAHATI',
  'SILIGURI',
  'CALICUT',
  'RAJKOT',
  'CHAMPARAN',
  'SURAT',
  'YAVATMAL',
  'SAMBHAJINAGAR',
  'MALDA',
  'SHEIKHPURA',
  'BALASORE',
  'BILASPUR',
  'RAMPUR',
  'GUJARAT',
  'BIHAR',
  'AMRAVATI',
  'AURANGABAD',
  'KOLHAPUR',
  'BARDHAMAN',
  'CUTTACK',
  'DURGAPUR',
  'BARUIPUR',
  'AHMEDABAD',
  'HYDERABAD',
  'BANGALORE',
  'CHENNAI',
  'COIMBATORE',
  'MADURAI',
  'KOCHI',
  'TRIVANDRUM',
  'BHILAI',
]

export const CANONICAL_CITIES = [...new Set(canonicalCities)]

const cityAliases = {
  LKO: 'LUCKNOW',
  'L.K.O': 'LUCKNOW',
  'L.K.O.': 'LUCKNOW',
  LKG: 'LUCKNOW',
  LUCKHOW: 'LUCKNOW',
  LUCKNOW: 'LUCKNOW',
  PATANA: 'PATNA',
  PTNA: 'PATNA',
  PATRA: 'PATNA',
  PATNE: 'PATNA',
  PATNABAI: 'PATNA',
  PATAN: 'PATNA',
  INDOR: 'INDORE',
  INDURE: 'INDORE',
  'INDORE.': 'INDORE',
  'RANCHI - 1': 'RANCHI',
  'RANCHI-1': 'RANCHI',
  'RANCHI 1': 'RANCHI',
  'KONKA ROAD, RANCHI - 1': 'RANCHI',
  RANCHA: 'RANCHI',
  RANCHIT: 'RANCHI',
  GORAKPUR: 'GORAKHPUR',
  'GORAKH PUR': 'GORAKHPUR',
  'G.KP': 'GORAKHPUR',
  KOPRAKHPUR: 'GORAKHPUR',
  RAIPOR: 'RAIPUR',
  BARCILLY: 'BAREILLY',
  BERILLY: 'BAREILLY',
  BAUNILLY: 'BAREILLY',
  'B.B.S.R': 'BBSR',
  'B.B.S R': 'BBSR',
  'B. B. S.R': 'BBSR',
  BBER: 'BBSR',
  BRSR: 'BBSR',
  'BBSR-KOLKATA': 'BBSR',
  'B.B.S.R.': 'BBSR',
  JABAIPUR: 'JABALPUR',
  JABAJPUR: 'JABALPUR',
  'JABALPUR.': 'JABALPUR',
  NAGAPUR: 'NAGPUR',
  NAGPURQ: 'NAGPUR',
  'KOLKATA 2': 'KOLKATA',
  'KOL - 2': 'KOLKATA',
  KOLK: 'KOLKATA',
  KOLKAT: 'KOLKATA',
  BARUIPUR: 'KOLKATA',
  DURGAPUR: 'KOLKATA',
  CHANDIGARH: 'CHD',
  'C.H.D': 'CHD',
  'CHD.': 'CHD',
  'CHD-2': 'CHD',
  'CHD - II': 'CHD',
  'CHD-II': 'CHD',
  'CHD. 2': 'CHD',
  'CHD.2': 'CHD',
  'CMD.2': 'CHD',
  'CHANDIGARH - 2': 'CHD',
  'CHANDIGARH 2': 'CHD',
  KUNDLI: 'CHD',
  'D.DUN': 'DEHRADUN',
  AGRD: 'AGRA',
  SHERGHAT: 'SHERGHATI',
  'SHERGHATI,': 'SHERGHATI',
  'SHERGHATI, GAYA': 'SHERGHATI',
  'SHORGHATI, GAYA': 'SHERGHATI',
  'SHERGNATI, GAYA': 'SHERGHATI',
  'SHERGNATI. GAYA': 'SHERGHATI',
  SHERGNAT: 'SHERGHATI',
  SHERHHATI: 'SHERGHATI',
  MUMBANA: 'MUMBAI',
  MUMNA: 'MUMBAI',
  BHAGAPPUR: 'BHAGALPUR',
  BHAGINE: 'BHAGALPUR',
  LATEMAR: 'LATEHAR',
  LATERAMA: 'LATEHAR',
  'JAMSHEDPUR-1': 'JAMSHEDPUR',
  'JAMSHEDPUB-1': 'JAMSHEDPUR',
  DEHLI: 'DELHI',
  'DELHI 2': 'DELHI',
  'DELHI-2': 'DELHI',
  BHOPALPUR: 'BHOPAL',
  KUSHINAGR: 'KUSHINAGAR',
  PRATAPGAH: 'PRATAPGARH',
  NASHK: 'NASHIK',
  NAIDA: 'NOIDA',
  SILI: 'SILIGURI',
  'CH. SAMBHAJI NAGA': 'SAMBHAJINAGAR',
  'CH.SAMBHAJINAGAR': 'SAMBHAJINAGAR',
  SHEIKHOURA: 'SHEIKHPURA',
  SHEKHPURA: 'SHEIKHPURA',
}

const garbageBranchValues = new Set([
  'A',
  'N',
  'RA',
  'CAD',
  'NA14',
  'NAA',
  'NAQ',
  'NNNA',
  'N A',
  'A1 ELECTRONIC',
  'A1 ELECTRONICS',
  'ELECTRO SUPREME SERVICES',
  'FOR A. S. ENTERPRISES',
  'JAANVI ENTERPRISE',
  'ANANDI BAZAR CHOWK',
  'DIAGONAL ROAD,',
  'RAJEEV NAGAR',
  'RAI BALIWAL',
  'RAJ ELECTRICAL WORKNA',
  'BAMILY',
  'ASHITA',
  'INDAS',
  'INDER',
  'GZB',
  'HATEHAR',
])

const normalizeKey = (value) => {
  const text = clean(value)
  if (!text) return null
  // Strip trailing/leading punctuation (dots, commas), collapse whitespace, uppercase
  return text.toUpperCase()
    .replace(/^[\s,.]+/, '')
    .replace(/[\s,.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim() || null
}

export const normalizeBranch = (value) => {
  const text = clean(value)
  if (!text) return null

  const key = normalizeKey(text)
  if (!key || garbageBranchValues.has(key)) return null

  return cityAliases[key] || key
}

export const CANONICAL_DEFECTS = [
  'DEAD',
  'NOT WORKING',
  'DISPLAY NOT WORKING',
  'DAMAGE',
  'BURN',
  'SHORT CIRCUIT',
  'NO DISPLAY',
  'INTERMITTENT',
]

const defectAliases = {
  DEAD: 'DEAD',
  'DEAD.': 'DEAD',
  DEDA: 'DEAD',
  'NOT WORKING': 'NOT WORKING',
  NOTWORKING: 'NOT WORKING',
  'NOT WORKING.': 'NOT WORKING',
}

export const normalizeDefect = (value) => {
  const text = clean(value)
  if (!text) return null

  const key = normalizeKey(text)?.replace(/\.$/, '')
  if (!key) return null

  return defectAliases[key] || key
}

export const parseComponents = (value) => {
  const text = clean(value)
  if (!text) return []

  return text
    .split(/[/,;+|]/)
    .map((component) => component.trim().toUpperCase())
    .filter((component) => component && !NULL_LIKE_VALUES.has(component))
}