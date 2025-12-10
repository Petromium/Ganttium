-- Migration 0009: Fix change_requests table schema
-- Drop and recreate with correct Drizzle schema

DROP TABLE IF EXISTS change_requests CASCADE;

CREATE TABLE change_requests (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    priority VARCHAR(20) DEFAULT 'medium',
    reason TEXT,
    impact_analysis TEXT,
    cost_impact NUMERIC,
    schedule_impact INTEGER,
    requested_by VARCHAR(100),
    requested_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_requests_project_id ON change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);

