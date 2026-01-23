CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"account_number" text,
	"type" text NOT NULL,
	"currency_id" uuid NOT NULL,
	"current_balance" numeric(20, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_note_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"credit_note_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(20, 4) NOT NULL,
	"price" numeric(20, 2) NOT NULL,
	"total" numeric(20, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"invoice_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"warehouse_id" uuid,
	"currency_id" uuid NOT NULL,
	"exchange_rate" numeric(20, 6) NOT NULL,
	"status" text DEFAULT 'DRAFT',
	"total_base" numeric(20, 2) DEFAULT '0',
	"total_tax" numeric(20, 2) DEFAULT '0',
	"total_igtf" numeric(20, 2) DEFAULT '0',
	"total" numeric(20, 2) DEFAULT '0',
	"date" timestamp DEFAULT now(),
	"user_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "credit_notes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "is_special_taxpayer" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "exchange_rate" numeric(20, 6) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "taxpayer_type" text DEFAULT 'ORDINARY';--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "retention_rate" numeric(3, 0) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "bank_account_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "currency_id" uuid;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_credit_note_id_credit_notes_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."credit_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;