-- Migration 0007: Create project_templates table
CREATE TABLE IF NOT EXISTS project_templates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT false,
    metadata JSONB,
    template_data JSONB,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_templates_org ON project_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_templates_public ON project_templates(is_public) WHERE is_public = true;

