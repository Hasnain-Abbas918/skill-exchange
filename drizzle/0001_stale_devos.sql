CREATE TABLE "token_blacklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "token_blacklist_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"theme" text DEFAULT 'dark',
	"notif_messages" boolean DEFAULT true,
	"notif_bids" boolean DEFAULT true,
	"notif_updates" boolean DEFAULT false,
	"notif_email" boolean DEFAULT true,
	"notif_sms" boolean DEFAULT false,
	"privacy_show_email" boolean DEFAULT false,
	"privacy_public_profile" boolean DEFAULT true,
	"privacy_allow_messages" boolean DEFAULT true,
	"privacy_show_online" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "messages" RENAME COLUMN "is_read" TO "read";--> statement-breakpoint
ALTER TABLE "otp_tokens" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "occupation" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "institution" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "education" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experience" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;