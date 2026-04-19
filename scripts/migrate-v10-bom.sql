-- V10 Migration — Run this if upgrading from V9
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT DO NOTHING)

CREATE TABLE IF NOT EXISTS bom (
  id          SERIAL PRIMARY KEY,
  part_code   BIGINT        NOT NULL,
  component   VARCHAR(50)   NOT NULL,
  description TEXT,
  created_at  TIMESTAMP     DEFAULT NOW(),
  UNIQUE(part_code, component)
);

CREATE INDEX IF NOT EXISTS idx_bom_part_code ON bom(part_code);
CREATE INDEX IF NOT EXISTS idx_bom_component ON bom(component);

ALTER TABLE component_data ADD COLUMN IF NOT EXISTS description TEXT;

SELECT 'V10 BOM migration complete ✅' AS result;
