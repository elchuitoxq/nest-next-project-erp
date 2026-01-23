CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"is_base" boolean DEFAULT false,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"currency_id" uuid NOT NULL,
	"rate" numeric(20, 6) NOT NULL,
	"date" timestamp DEFAULT now(),
	"source" text DEFAULT 'MANUAL'
);
--> statement-breakpoint
CREATE TABLE "organization_modules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"module_key" text NOT NULL,
	"is_enabled" boolean DEFAULT false,
	"branch_id" uuid
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_app_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_modules" ADD CONSTRAINT "organization_modules_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_app_settings" ADD CONSTRAINT "user_app_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;