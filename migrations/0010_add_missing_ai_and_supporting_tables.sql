-- Migration 0010: Add missing AI and supporting tables
-- This migration adds tables that were missed during initial Cloud deployment

-- AI Conversations table (required for AI project creation)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- AI Messages table
CREATE TABLE IF NOT EXISTS ai_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- AI Usage table
CREATE TABLE IF NOT EXISTS ai_usage (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id),
    organization_id INTEGER REFERENCES organizations(id),
    tokens_input INTEGER,
    tokens_output INTEGER,
    model VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- AI Action Logs table (for tracking AI actions)
CREATE TABLE IF NOT EXISTS ai_action_logs (
    id SERIAL PRIMARY KEY,
    action_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id),
    function_name VARCHAR(100) NOT NULL,
    args JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    executed_at TIMESTAMP
);

-- User Organizations (if missing)
CREATE TABLE IF NOT EXISTS user_organizations (
    user_id VARCHAR(100) NOT NULL REFERENCES users(id),
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, organization_id)
);

-- User Activity Logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User Invitations
CREATE TABLE IF NOT EXISTS user_invitations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    token VARCHAR(255) NOT NULL UNIQUE,
    invited_by VARCHAR(100) NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Sent Emails
CREATE TABLE IF NOT EXISTS sent_emails (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    template_id INTEGER REFERENCES email_templates(id),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Email Usage
CREATE TABLE IF NOT EXISTS email_usage (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    month VARCHAR(7) NOT NULL,
    emails_sent INTEGER NOT NULL DEFAULT 0,
    UNIQUE(organization_id, month)
);

-- Google Connections
CREATE TABLE IF NOT EXISTS google_connections (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id),
    organization_id INTEGER REFERENCES organizations(id),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    scopes TEXT[],
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Project Files
CREATE TABLE IF NOT EXISTS project_files (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    object_path VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    uploaded_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Storage Quotas
CREATE TABLE IF NOT EXISTS storage_quota (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) UNIQUE,
    used_bytes BIGINT NOT NULL DEFAULT 0,
    max_bytes BIGINT NOT NULL DEFAULT 5368709120
);

-- Task Documents (linking tasks to documents)
CREATE TABLE IF NOT EXISTS task_documents (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(task_id, document_id)
);

-- Task Risks (linking tasks to risks)
CREATE TABLE IF NOT EXISTS task_risks (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    risk_id INTEGER NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(task_id, risk_id)
);

-- Task Issues (linking tasks to issues)
CREATE TABLE IF NOT EXISTS task_issues (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(task_id, issue_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Project Events
CREATE TABLE IF NOT EXISTS project_events (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    user_id VARCHAR(100) REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    all_day BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Stakeholder RACI
CREATE TABLE IF NOT EXISTS stakeholder_raci (
    id SERIAL PRIMARY KEY,
    stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    responsibility VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(stakeholder_id, task_id)
);

-- Resource Time Entries
CREATE TABLE IF NOT EXISTS resource_time_entries (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    date DATE NOT NULL,
    hours NUMERIC(5, 2) NOT NULL,
    description TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Resource Group Members
CREATE TABLE IF NOT EXISTS resource_group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES resource_groups(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    UNIQUE(group_id, resource_id)
);

-- Task Materials
CREATE TABLE IF NOT EXISTS task_materials (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    material_type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit VARCHAR(50),
    unit_cost NUMERIC,
    status VARCHAR(50) DEFAULT 'pending',
    vendor VARCHAR(255),
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Material Consumptions
CREATE TABLE IF NOT EXISTS material_consumptions (
    id SERIAL PRIMARY KEY,
    task_material_id INTEGER NOT NULL REFERENCES task_materials(id),
    consumed_quantity NUMERIC NOT NULL,
    consumed_date DATE NOT NULL,
    consumed_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Material Deliveries
CREATE TABLE IF NOT EXISTS material_deliveries (
    id SERIAL PRIMARY KEY,
    task_material_id INTEGER NOT NULL REFERENCES task_materials(id),
    delivered_quantity NUMERIC NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_note VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Task Dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
    id SERIAL PRIMARY KEY,
    predecessor_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    successor_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) NOT NULL DEFAULT 'FS',
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(predecessor_id, successor_id)
);

-- Kanban Columns
CREATE TABLE IF NOT EXISTS kanban_columns (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    wip_limit INTEGER,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate NUMERIC NOT NULL,
    date DATE NOT NULL,
    source VARCHAR(50),
    UNIQUE(from_currency, to_currency, date)
);

-- Exchange Rate Syncs
CREATE TABLE IF NOT EXISTS exchange_rate_sync (
    id SERIAL PRIMARY KEY,
    last_sync TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT
);

-- Cost Breakdown Structure
CREATE TABLE IF NOT EXISTS cost_breakdown_structure (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES cost_breakdown_structure(id),
    level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Cost Item CBS Links
CREATE TABLE IF NOT EXISTS cost_item_cbs_links (
    id SERIAL PRIMARY KEY,
    cost_item_id INTEGER NOT NULL REFERENCES cost_items(id) ON DELETE CASCADE,
    cbs_id INTEGER NOT NULL REFERENCES cost_breakdown_structure(id) ON DELETE CASCADE,
    UNIQUE(cost_item_id, cbs_id)
);

-- Procurement Requisitions
CREATE TABLE IF NOT EXISTS procurement_requisitions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    requester_id VARCHAR(100) NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    priority VARCHAR(20),
    required_date DATE,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Resource Requirements
CREATE TABLE IF NOT EXISTS resource_requirements (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    task_id INTEGER REFERENCES tasks(id),
    resource_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    skill_level VARCHAR(50),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    role VARCHAR(100),
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Contact Logs
CREATE TABLE IF NOT EXISTS contact_logs (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    logged_by VARCHAR(100) NOT NULL,
    logged_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Chat Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    project_id INTEGER REFERENCES projects(id),
    type VARCHAR(20) NOT NULL DEFAULT 'direct',
    name VARCHAR(255),
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by VARCHAR(100) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(100) NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id),
    emoji VARCHAR(10) NOT NULL,
    UNIQUE(message_id, user_id, emoji)
);

-- Change Request Approvals
CREATE TABLE IF NOT EXISTS change_request_approvals (
    id SERIAL PRIMARY KEY,
    change_request_id INTEGER NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    approver_id VARCHAR(100) NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Change Request Tasks
CREATE TABLE IF NOT EXISTS change_request_tasks (
    id SERIAL PRIMARY KEY,
    change_request_id INTEGER NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(change_request_id, task_id)
);

-- Change Request Templates
CREATE TABLE IF NOT EXISTS change_request_templates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notification Logs (if missing)
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES notification_rules(id),
    user_id VARCHAR(100) NOT NULL REFERENCES users(id),
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_project_id ON ai_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_project_events_project_id ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_id);

