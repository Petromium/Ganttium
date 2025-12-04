CREATE TABLE "communication_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"stakeholder_id" integer,
	"user_id" integer,
	"response_time_avg" integer,
	"overdue_count" integer DEFAULT 0,
	"message_count" integer DEFAULT 0,
	"escalation_count" integer DEFAULT 0,
	"health_status" varchar(20) DEFAULT 'healthy',
	"health_score" integer DEFAULT 100,
	"last_interaction_date" timestamp,
	"last_response_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stakeholders" ADD COLUMN "communication_style" varchar(50);--> statement-breakpoint
ALTER TABLE "stakeholders" ADD COLUMN "preferred_channel" varchar(50);--> statement-breakpoint
ALTER TABLE "stakeholders" ADD COLUMN "update_frequency" varchar(50);--> statement-breakpoint
ALTER TABLE "stakeholders" ADD COLUMN "engagement_level" integer;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD COLUMN "last_interaction_date" timestamp;--> statement-breakpoint
ALTER TABLE "communication_metrics" ADD CONSTRAINT "communication_metrics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_metrics" ADD CONSTRAINT "communication_metrics_stakeholder_id_stakeholders_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Note: user_id foreign key skipped due to type mismatch (users.id is varchar in actual DB)
CREATE INDEX "comm_metrics_project_stakeholder_idx" ON "communication_metrics" USING btree ("project_id","stakeholder_id");--> statement-breakpoint
CREATE INDEX "comm_metrics_project_user_idx" ON "communication_metrics" USING btree ("project_id","user_id");