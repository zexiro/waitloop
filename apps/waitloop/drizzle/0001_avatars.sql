ALTER TABLE "signups" ADD COLUMN "avatar" jsonb;--> statement-breakpoint
ALTER TABLE "waitlists" ADD COLUMN "avatars_enabled" boolean DEFAULT true NOT NULL;