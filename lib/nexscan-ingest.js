// ============================================================
// nexscan-ingest.js
// Shared row-normalization used by BOTH:
//   - dump import (file upload path)
//   - nexscan-sync (live API path)
// ============================================================

import {
  clean, normalizeStatus, normalizeBranch,
  normalizeDefect, parseComponents,
} from './normalize.js'
import { nv, nvInt, nvDate } from './nexscan-schema.js'

// Convert a raw nexscan consolidated_data row (named columns)
// into a clean insert-ready object
export const buildDataRecord = (raw) => {
  const partCode = nvInt(raw.part_code)
  if (!partCode) return null

  const rawBranch = clean(raw.branch) || nv(raw.branch)
  const status = normalizeStatus(raw.status || nv(raw.status))

  return {
    source_id:            nvInt(raw.id) || nvInt(raw.source_id),
    sr_no:                nvInt(raw.sr_no),
    dc_no:                nv(raw.dc_no),
    branch:               rawBranch,
    bccd_name:            nv(raw.bccd_name),
    product_description:  nv(raw.product_description),
    product_sr_no:        nv(raw.product_sr_no),
    date_of_purchase:     nv(raw.date_of_purchase),
    complaint_no:         nv(raw.complaint_no)?.substring(0, 150) ?? null,
    part_code:            partCode,
    defect:               nv(raw.defect),
    visiting_tech_name:   nv(raw.visiting_tech_name),
    mfg_month_year:       nv(raw.mfg_month_year),
    repair_date:          nvDate(raw.repair_date),
    testing:              nv(raw.testing),
    failure:              nv(raw.failure),
    status,
    pcb_sr_no:            nv(raw.pcb_sr_no),
    analysis:             nv(raw.analysis),
    validation_result:    nv(raw.validation_result),
    component_change:     nv(raw.component_change),
    engg_name:            nv(raw.engg_name),
    tag_entry_by:         nv(raw.tag_entry_by),
    consumption_entry_by: nv(raw.consumption_entry_by),
    dispatch_date:        nvDate(raw.dispatch_date),
    source_created_at:    nvDate(raw.created_at || raw.source_created_at),
    source_updated_at:    nvDate(raw.updated_at || raw.source_updated_at),
    _rawBranch:           rawBranch,  // kept for normalization downstream
    _status:              status,
  }
}
