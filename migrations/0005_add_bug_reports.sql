-- Migration: Add Bug Reports Table
-- Description: Creates bug_reports table for user bug reports and feedback with sanitization and backlog integration

CREATE TABLE IF NOT EXISTS "bug_reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar(100) NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "organization_id" integer REFERENCES "organizations"("id") ON DELETE set null,
  
  -- Report Details
  "title" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "category" varchar(50) NOT NULL, -- bug, feature-request, feedback, other
  "severity" varchar(20) DEFAULT 'medium', -- low, medium, high, critical
  "status" varchar(20) DEFAULT 'pending', -- pending, reviewing, in-progress, resolved, rejected, duplicate
  
  -- Additional Context
  "steps_to_reproduce" text,
  "expected_behavior" text,
  "actual_behavior" text,
  "screenshots" jsonb, -- Array of URLs or base64
  "browser_info" jsonb, -- { name, version, os, userAgent }
  "device_info" jsonb, -- { type, screenSize, etc }
  
  -- Sanitization & Moderation
  "sanitized" boolean DEFAULT false,
  "sanitized_at" timestamp,
  "sanitized_by" varchar(100), -- User ID of admin who sanitized
  "moderation_notes" text, -- Internal notes from moderation
  
  -- Backlog Integration
  "backlog_item_id" integer, -- Reference to backlog item if created
  "backlog_status" varchar(50), -- Synced from backlog
  
  -- Resolution
  "resolved_at" timestamp,
  "resolved_by" varchar(100), -- User ID of admin who resolved
  "resolution_notes" text, -- Public resolution notes
  "internal_resolution_notes" text, -- Private admin notes
  
  -- Notifications
  "initial_notification_sent" boolean DEFAULT false,
  "resolution_notification_sent" boolean DEFAULT false,
  
  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "bug_reports_user_id_idx" ON "bug_reports"("user_id");
CREATE INDEX IF NOT EXISTS "bug_reports_status_idx" ON "bug_reports"("status");
CREATE INDEX IF NOT EXISTS "bug_reports_created_at_idx" ON "bug_reports"("created_at");
CREATE INDEX IF NOT EXISTS "bug_reports_category_idx" ON "bug_reports"("category");

