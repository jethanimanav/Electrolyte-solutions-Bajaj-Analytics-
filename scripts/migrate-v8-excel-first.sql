-- Safe migration for existing electrolyte-tracking-system databases
-- Adds the Excel-first upload, WIP, and correction-learning schema without dropping data.

BEGIN;

CREATE TABLE IF NOT EXISTS pcb_master (
  id SERIAL PRIMARY KEY,
  part_code BIGINT UNIQUE NOT NULL,
  product_description VARCHAR(300),
  total_entries INTEGER DEFAULT 0,
  dc_no VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS component_data (
  id SERIAL PRIMARY KEY,
  part_code BIGINT NOT NULL,
  component VARCHAR(100),
  description TEXT,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status_data (
  id SERIAL PRIMARY KEY,
  part_code BIGINT NOT NULL,
  status VARCHAR(20),
  status_description VARCHAR(100),
  status_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upload_history (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  total_rows INTEGER DEFAULT 0,
  ok_rows INTEGER DEFAULT 0,
  nff_rows INTEGER DEFAULT 0,
  wip_rows INTEGER DEFAULT 0,
  pcb_sheets TEXT[],
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS corrections (
  id SERIAL PRIMARY KEY,
  field VARCHAR(50) NOT NULL,
  original_value VARCHAR(255) NOT NULL,
  corrected_value VARCHAR(255) NOT NULL,
  confidence DECIMAL(5,2),
  method VARCHAR(20) DEFAULT 'fuzzy',
  status VARCHAR(20) DEFAULT 'approved',
  times_applied INTEGER DEFAULT 0,
  approved_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(field, original_value)
);

CREATE TABLE IF NOT EXISTS flagged_values (
  id SERIAL PRIMARY KEY,
  field VARCHAR(50) NOT NULL,
  original_value VARCHAR(255) NOT NULL,
  suggested_value VARCHAR(255),
  confidence DECIMAL(5,2),
  occurrences INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',
  upload_filename VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(field, original_value)
);

CREATE TABLE IF NOT EXISTS upload_quality_log (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255),
  issue TEXT,
  severity VARCHAR(20),
  upload_id INTEGER REFERENCES upload_history(id),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS source_id INTEGER;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS sr_no INTEGER;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS dc_no VARCHAR(50);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS branch_normalized VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS bccd_name VARCHAR(200);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS product_description VARCHAR(300);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS product_sr_no VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS date_of_purchase VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS complaint_no VARCHAR(150);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS defect VARCHAR(200);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS defect_normalized VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS visiting_tech_name VARCHAR(150);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS mfg_month_year VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS repair_date DATE;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS pcb_sr_no VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS testing TEXT;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS failure TEXT;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS analysis TEXT;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS validation_result TEXT;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS component_change TEXT;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS engg_name VARCHAR(150);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS tag_entry_by VARCHAR(150);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS consumption_entry_by VARCHAR(150);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS dispatch_entry_by VARCHAR(150);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS dispatch_date DATE;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS source_created_at TIMESTAMPTZ;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;

ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS ok_rows INTEGER DEFAULT 0;
ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS nff_rows INTEGER DEFAULT 0;
ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS wip_rows INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_pcb_data_part_code ON pcb_data(part_code);
CREATE INDEX IF NOT EXISTS idx_pcb_data_status ON pcb_data(status);
CREATE INDEX IF NOT EXISTS idx_pcb_data_branch ON pcb_data(branch_normalized);
CREATE INDEX IF NOT EXISTS idx_pcb_data_repair_date ON pcb_data(repair_date);
CREATE INDEX IF NOT EXISTS idx_component_part_code ON component_data(part_code);
CREATE INDEX IF NOT EXISTS idx_status_part_code ON status_data(part_code);
CREATE INDEX IF NOT EXISTS idx_corrections_field ON corrections(field);
CREATE INDEX IF NOT EXISTS idx_corrections_original ON corrections(field, original_value);
CREATE INDEX IF NOT EXISTS idx_flagged_status ON flagged_values(status);
CREATE INDEX IF NOT EXISTS idx_flagged_field ON flagged_values(field);

COMMIT;
