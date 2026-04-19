// =============================================
// Fuzzy matching engine
// Learns from review decisions without contaminating core normalization
// =============================================

import Fuse from 'fuse.js'
import stringSimilarity from 'string-similarity'
import { CANONICAL_CITIES, CANONICAL_DEFECTS } from './normalize'
import { updateUploadQualityMetrics } from './upload-quality'

export const KNOWN_CITIES = CANONICAL_CITIES
export const KNOWN_DEFECTS = CANONICAL_DEFECTS
export const KNOWN_STATUSES = ['OK', 'NFF', 'WIP']

const AUTO_FIX_THRESHOLD = 85
const SUGGEST_THRESHOLD = 60
const AUTO_APPROVED_STATUS = 'auto-approved'

export const fuzzyMatch = (input, candidates, threshold = SUGGEST_THRESHOLD) => {
  if (!input || !Array.isArray(candidates) || candidates.length === 0) return null

  const cleanInput = String(input).trim().toUpperCase()
  if (!cleanInput) return null

  const exact = candidates.find((candidate) => candidate.toUpperCase() === cleanInput)
  if (exact) return { matched: exact, confidence: 100, method: 'exact' }

  const upperCandidates = candidates.map((candidate) => candidate.toUpperCase())
  const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(cleanInput, upperCandidates)

  if (bestMatch.rating * 100 >= threshold) {
    return {
      matched: candidates[bestMatchIndex],
      confidence: Math.round(bestMatch.rating * 100),
      method: 'fuzzy',
    }
  }

  const fuse = new Fuse(candidates, {
    threshold: 1 - threshold / 100,
    includeScore: true,
    minMatchCharLength: 2,
  })
  const results = fuse.search(cleanInput)

  if (results.length > 0) {
    const confidence = Math.round((1 - results[0].score) * 100)
    if (confidence >= threshold) {
      return {
        matched: results[0].item,
        confidence,
        method: 'fuse',
      }
    }
  }

  return null
}

export class AutoCorrector {
  constructor(pool) {
    this.pool = pool
    this.dbCorrections = {}
    this.session = {
      autoFixed: 0,
      fuzzyFixed: 0,
      flagged: 0,
      newCorrections: [],
      newFlags: [],
    }
  }

  async loadCorrections() {
    const result = await this.pool.query(`
      SELECT field, original_value, corrected_value, confidence, method, status
      FROM corrections
      WHERE status IN ('approved', 'auto-approved')
    `)

    for (const row of result.rows) {
      if (!this.dbCorrections[row.field]) this.dbCorrections[row.field] = {}
      this.dbCorrections[row.field][row.original_value.trim()] = {
        corrected: row.corrected_value,
        confidence: row.confidence,
        method: row.method,
        status: row.status,
      }
    }
  }

  correctValue(field, rawValue, knownCandidates) {
    if (!rawValue) return { value: null, wasFixed: false, flagged: false }

    const input = String(rawValue).trim()
    if (!input || ['NULL', 'null', 'NA', 'N/A', 'na', ''].includes(input)) {
      return { value: null, wasFixed: false, flagged: false }
    }

    const dbFix = this.dbCorrections[field]?.[input]
    if (dbFix) {
      if (input !== dbFix.corrected) this.session.autoFixed++
      return {
        value: dbFix.corrected,
        wasFixed: input !== dbFix.corrected,
        confidence: dbFix.confidence,
        method: 'db-correction',
        flagged: false,
      }
    }

    const exact = knownCandidates?.find((candidate) => candidate.toUpperCase() === input.toUpperCase())
    if (exact) {
      return { value: exact, wasFixed: false, confidence: 100, method: 'exact', flagged: false }
    }

    if (!Array.isArray(knownCandidates) || knownCandidates.length === 0) {
      return { value: input, wasFixed: false, flagged: false }
    }

    const match = fuzzyMatch(input, knownCandidates, SUGGEST_THRESHOLD)
    if (!match) {
      this.session.flagged++
      this.session.newFlags.push({
        field,
        original: input,
        suggested: null,
        confidence: 0,
      })
      return { value: input, wasFixed: false, confidence: 0, method: 'unknown', flagged: true }
    }

    if (match.confidence >= AUTO_FIX_THRESHOLD) {
      this.session.fuzzyFixed++
      this.session.newCorrections.push({
        field,
        original: input,
        corrected: match.matched,
        confidence: match.confidence,
        method: match.method,
        status: AUTO_APPROVED_STATUS,
      })
      return {
        value: match.matched,
        wasFixed: true,
        confidence: match.confidence,
        method: 'fuzzy-auto',
        flagged: false,
      }
    }

    this.session.flagged++
    this.session.newFlags.push({
      field,
      original: input,
      suggested: match.matched,
      confidence: match.confidence,
    })
    return {
      value: input,
      wasFixed: false,
      confidence: match.confidence,
      method: 'fuzzy-suggest',
      flagged: true,
      suggestion: match.matched,
    }
  }

  async saveSessionResults(uploadId, filename) {
    for (const correction of this.session.newCorrections) {
      await this.pool.query(
        `
          INSERT INTO corrections (
            field, original_value, corrected_value, confidence, method, status, approved_by, times_applied
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'system', 1)
          ON CONFLICT (field, original_value)
          DO UPDATE SET corrected_value = EXCLUDED.corrected_value,
                        confidence = EXCLUDED.confidence,
                        method = EXCLUDED.method,
                        status = EXCLUDED.status,
                        times_applied = corrections.times_applied + 1,
                        updated_at = NOW()
        `,
        [correction.field, correction.original, correction.corrected, correction.confidence, correction.method, correction.status]
      )
    }

    for (const flag of this.session.newFlags) {
      await this.pool.query(
        `
          INSERT INTO flagged_values (
            field, original_value, suggested_value, confidence, upload_filename, occurrences
          )
          VALUES ($1, $2, $3, $4, $5, 1)
          ON CONFLICT (field, original_value)
          DO UPDATE SET occurrences = flagged_values.occurrences + 1,
                        suggested_value = COALESCE(EXCLUDED.suggested_value, flagged_values.suggested_value),
                        confidence = GREATEST(EXCLUDED.confidence, flagged_values.confidence),
                        updated_at = NOW()
        `,
        [flag.field, flag.original, flag.suggested, flag.confidence, filename]
      )
    }

    await updateUploadQualityMetrics(this.pool, uploadId, {
      autoFixed: this.session.autoFixed,
      fuzzyFixed: this.session.fuzzyFixed,
      flagged: this.session.flagged,
    })
  }

  getStats() {
    return this.session
  }
}
