import stringSimilarity from 'string-similarity'

const STATE_MAPPING = {
  'Andaman and Nicobar': 'Andaman & Nicobar Islands',
  'Arunachal Pradesh': 'Arunachal Pradesh',
  'Dadra and Nagar Haveli': 'Dadra & Nagar Haveli',
  'Daman and Diu': 'Daman & Diu',
  'Jammu and Kashmir': 'Jammu & Kashmir',
  'Odisha': 'Orissa', // Some DBs still use Orissa
  'Puducherry': 'Pondicherry',
  'Telangana': 'Telangana',
  'Uttarakhand': 'Uttaranchal' // Some DBs still use Uttaranchal
}

/**
 * Normalizes a state name to match common GeoJSON name formats
 * @param {string} name - Input state name
 * @returns {string} - Normalized name
 */
export function normalizeStateName(name) {
  if (!name) return ''
  let cleaned = name.trim()
  
  // Direct mapping check
  if (STATE_MAPPING[cleaned]) return cleaned
  
  // Reverse mapping check
  const reverseMatch = Object.keys(STATE_MAPPING).find(key => STATE_MAPPING[key] === cleaned)
  if (reverseMatch) return reverseMatch

  return cleaned
}

/**
 * Finds the best match for a state name from a list of candidates
 * @param {string} name - State name to match
 * @param {string[]} candidates - List of GeoJSON state names
 * @returns {string} - Best matching candidate
 */
export function findBestStateMatch(name, candidates) {
  if (!name || !candidates?.length) return null
  
  const normalizedInput = normalizeStateName(name)
  
  // Exact match first
  const exactMatch = candidates.find(c => c.toLowerCase() === normalizedInput.toLowerCase())
  if (exactMatch) return exactMatch

  // Fuzzy match
  const matches = stringSimilarity.findBestMatch(normalizedInput, candidates)
  if (matches.bestMatch.rating > 0.6) {
    return matches.bestMatch.target
  }

  return null
}
