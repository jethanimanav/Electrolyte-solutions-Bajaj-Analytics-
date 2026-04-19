-- =============================================
-- Electrolyte Bajaj PCB Dashboard
-- PostgreSQL Schema v2 — supports new Excel format
-- =============================================

-- Drop and recreate for clean slate (comment out if keeping data)
-- DROP TABLE IF EXISTS pcb_data, pcb_master, component_data, status_data, upload_history CASCADE;

CREATE TABLE IF NOT EXISTS pcb_master (
  id SERIAL PRIMARY KEY,
  part_code BIGINT UNIQUE NOT NULL,
  product_description VARCHAR(300),
  total_entries INTEGER DEFAULT 0,
  dc_no VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pcb_data (
  id SERIAL PRIMARY KEY,
  source_id INTEGER,                         -- original id from Excel/DB
  sr_no INTEGER,
  dc_no VARCHAR(50),
  dc_date DATE,
  branch VARCHAR(100),
  branch_normalized VARCHAR(100),            -- cleaned branch name
  bccd_name VARCHAR(200),
  product_description VARCHAR(300),
  product_sr_no VARCHAR(100),
  date_of_purchase VARCHAR(100),
  complaint_no VARCHAR(150),
  part_code BIGINT NOT NULL,
  defect VARCHAR(200),
  defect_normalized VARCHAR(100),            -- cleaned defect
  visiting_tech_name VARCHAR(150),
  mfg_month_year VARCHAR(100),
  repair_date DATE,
  pcb_sr_no VARCHAR(100),
  rf_observation VARCHAR(200),
  testing VARCHAR(50),
  failure VARCHAR(200),
  analysis TEXT,
  status VARCHAR(20),                        -- OK | NFF | WIP (null/unknown = WIP)
  validation_result TEXT,                    -- new column
  component_change TEXT,                     -- was "component_consumption"
  engg_name VARCHAR(100),
  tag_entry_by VARCHAR(100),
  consumption_entry_by VARCHAR(100),         -- was "consumption_entry"
  dispatch_entry_by VARCHAR(100),            -- new column
  dispatch_date DATE,                        -- was "send_date"
  source_created_at TIMESTAMP,
  source_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pcb_data_part_code ON pcb_data(part_code);
CREATE INDEX IF NOT EXISTS idx_pcb_data_status ON pcb_data(status);
CREATE INDEX IF NOT EXISTS idx_pcb_data_branch ON pcb_data(branch_normalized);
CREATE INDEX IF NOT EXISTS idx_pcb_data_repair_date ON pcb_data(repair_date);
CREATE INDEX IF NOT EXISTS idx_component_part_code ON component_data(part_code);
CREATE INDEX IF NOT EXISTS idx_component_component ON component_data(component);

-- Unique constraint for upserts (safe to run multiple times)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'component_data_part_code_component_key'
  ) THEN
    ALTER TABLE component_data ADD CONSTRAINT component_data_part_code_component_key
      UNIQUE (part_code, component);
  END IF;
END $$;

-- Add missing columns to existing table (safe to run multiple times)
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS source_id INTEGER;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS branch_normalized VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS defect_normalized VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS validation_result TEXT;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS component_change TEXT;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS consumption_entry_by VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS dispatch_entry_by VARCHAR(100);
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS dispatch_date DATE;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS source_created_at TIMESTAMP;
ALTER TABLE pcb_data ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMP;
ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS ok_rows INTEGER DEFAULT 0;
ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS nff_rows INTEGER DEFAULT 0;
ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS wip_rows INTEGER DEFAULT 0;

SELECT 'Schema v2 ready ✅' AS result;

-- =============================================
-- Corrections System — Fuzzy Matching & Learning
-- =============================================

-- Stores all approved corrections (system learns from these)
CREATE TABLE IF NOT EXISTS corrections (
  id SERIAL PRIMARY KEY,
  field VARCHAR(50) NOT NULL,        -- 'branch' | 'defect' | 'status' | 'component'
  original_value VARCHAR(255) NOT NULL,  -- what came in the Excel
  corrected_value VARCHAR(255) NOT NULL, -- what it should be
  confidence DECIMAL(5,2),           -- fuzzy match confidence 0-100
  method VARCHAR(20) DEFAULT 'fuzzy', -- 'fuzzy' | 'manual' | 'hardcoded'
  status VARCHAR(20) DEFAULT 'approved', -- 'approved' | 'auto-approved' | 'pending' | 'rejected'
  times_applied INTEGER DEFAULT 0,   -- how many times this fix was used
  approved_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(field, original_value)      -- one correction per unique value
);

-- Stores flagged values that need human review
CREATE TABLE IF NOT EXISTS flagged_values (
  id SERIAL PRIMARY KEY,
  field VARCHAR(50) NOT NULL,
  original_value VARCHAR(255) NOT NULL,
  suggested_value VARCHAR(255),      -- fuzzy match suggestion
  confidence DECIMAL(5,2),
  occurrences INTEGER DEFAULT 1,     -- how many times seen in uploads
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'ignored'
  upload_filename VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(field, original_value)
);

-- Upload quality log — tracks data quality per upload
CREATE TABLE IF NOT EXISTS upload_quality_log (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255),
  issue TEXT,
  severity VARCHAR(20),
  upload_id INTEGER REFERENCES upload_history(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_corrections_field ON corrections(field);
CREATE INDEX IF NOT EXISTS idx_corrections_original ON corrections(field, original_value);
CREATE INDEX IF NOT EXISTS idx_flagged_status ON flagged_values(status);
CREATE INDEX IF NOT EXISTS idx_flagged_field ON flagged_values(field);

-- Seed with known corrections from our analysis
INSERT INTO corrections (field, original_value, corrected_value, confidence, method, times_applied) VALUES
-- Branches already known
('branch', 'LKO', 'LUCKNOW', 100, 'hardcoded', 0),
('branch', 'Lko', 'LUCKNOW', 100, 'hardcoded', 0),
('branch', 'L.K.O', 'LUCKNOW', 100, 'hardcoded', 0),
('branch', 'PTNA', 'PATNA', 100, 'hardcoded', 0),
('branch', 'INDOR', 'INDORE', 100, 'hardcoded', 0),
('branch', 'GORAKPUR', 'GORAKHPUR', 100, 'hardcoded', 0),
('branch', 'RAIPOR', 'RAIPUR', 100, 'hardcoded', 0),
('branch', 'JABAIPUR', 'JABALPUR', 100, 'hardcoded', 0),
('branch', 'NAGPURQ', 'NAGPUR', 100, 'hardcoded', 0),
('branch', 'Nagapur', 'NAGPUR', 100, 'hardcoded', 0),
('branch', 'SHERHHATI', 'SHERGHATI', 100, 'hardcoded', 0),
('branch', 'MumbaNA', 'MUMBAI', 100, 'hardcoded', 0),
('branch', 'AGRD', 'AGRA', 100, 'hardcoded', 0),
('branch', 'BBSR', 'BHUBANESWAR', 100, 'hardcoded', 0),
('branch', 'BRSR', 'BHUBANESWAR', 100, 'hardcoded', 0),
('branch', 'BBER', 'BHUBANESWAR', 100, 'hardcoded', 0),
-- Defects
('defect', 'dead', 'DEAD', 100, 'hardcoded', 0),
('defect', 'Dead', 'DEAD', 100, 'hardcoded', 0),
('defect', 'Dead.', 'DEAD', 100, 'hardcoded', 0),
('defect', 'DEDA', 'DEAD', 100, 'hardcoded', 0),
('defect', 'Not working', 'NOT WORKING', 100, 'hardcoded', 0),
('defect', 'not working', 'NOT WORKING', 100, 'hardcoded', 0),
('defect', 'Not Working.', 'NOT WORKING', 100, 'hardcoded', 0)
ON CONFLICT (field, original_value) DO NOTHING;

SELECT 'Corrections system ready ✅' AS result;

-- =============================================
-- BOM (Bill of Materials) Table — V10
-- Stores expected component list per PCB
-- Source: nexscan production database dump
-- =============================================

CREATE TABLE IF NOT EXISTS bom (
  id          SERIAL PRIMARY KEY,
  part_code   BIGINT        NOT NULL,
  component   VARCHAR(50)   NOT NULL,   -- component position: EC1, IC1, R1 etc.
  description TEXT,                     -- what it is: "10uF/500V Electrolytic Cap"
  created_at  TIMESTAMP     DEFAULT NOW(),
  UNIQUE(part_code, component)
);

CREATE INDEX IF NOT EXISTS idx_bom_part_code ON bom(part_code);
CREATE INDEX IF NOT EXISTS idx_bom_component ON bom(component);

ALTER TABLE component_data ADD COLUMN IF NOT EXISTS description TEXT;

SELECT 'BOM table ready ✅' AS result;

-- =============================================
-- Phase 3 — Nexscan Live Sync Support
-- =============================================

-- Tracks sync state watermarks (last pull timestamp etc.)
CREATE TABLE IF NOT EXISTS sync_state (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Log of every sync event (push or pull)
CREATE TABLE IF NOT EXISTS sync_log (
  id          SERIAL PRIMARY KEY,
  source      VARCHAR(50),           -- 'nexscan-push' | 'nexscan-pull'
  rows_synced INTEGER DEFAULT 0,
  ok_rows     INTEGER DEFAULT 0,
  nff_rows    INTEGER DEFAULT 0,
  wip_rows    INTEGER DEFAULT 0,
  mode        VARCHAR(20) DEFAULT 'push',
  synced_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log(synced_at DESC);

-- Add source_id unique constraint to pcb_data (needed for upserts)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pcb_data_source_id_key'
  ) THEN
    ALTER TABLE pcb_data ADD CONSTRAINT pcb_data_source_id_key UNIQUE (source_id);
  END IF;
END $$;

SELECT 'Phase 3 sync tables ready ✅' AS result;

-- =============================================
-- Engineers table (from nexscan dump)
-- =============================================
CREATE TABLE IF NOT EXISTS engineers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS auto_fixed  INTEGER DEFAULT 0;
ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS fuzzy_fixed INTEGER DEFAULT 0;
ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS flagged     INTEGER DEFAULT 0;
ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS scrap_rows  INTEGER DEFAULT 0;

SELECT 'Engineers table ready ✅' AS result;

-- =============================================
-- DC Numbers table (from nexscan dump)
-- Maps DC numbers to part codes
-- =============================================
CREATE TABLE IF NOT EXISTS dc_numbers (
  id         SERIAL PRIMARY KEY,
  dc_no      VARCHAR(100) NOT NULL,
  part_codes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dc_numbers_dc_no ON dc_numbers(dc_no);

-- =============================================
-- Users table (from nexscan dump)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(255) PRIMARY KEY,
  auth_id    VARCHAR(255),
  email      VARCHAR(255),
  name       VARCHAR(255) NOT NULL,
  role       VARCHAR(50) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Sheets table (from nexscan dump)
-- =============================================
CREATE TABLE IF NOT EXISTS sheets (
  id         VARCHAR(255) PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

SELECT 'All tables ready ✅ (including dc_numbers, users, sheets, scrap support)' AS result;
