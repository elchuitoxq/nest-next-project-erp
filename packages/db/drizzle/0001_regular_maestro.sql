CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"identity_card" text NOT NULL,
	"email" text,
	"phone" text,
	"position" text NOT NULL,
	"hire_date" timestamp DEFAULT now(),
	"base_salary" numeric(20, 2) NOT NULL,
	"pay_frequency" text DEFAULT 'BIWEEKLY',
	"status" text DEFAULT 'ACTIVE',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_identity_card_unique" UNIQUE("identity_card")
);
--> statement-breakpoint
CREATE TABLE "inventory_move_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"move_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(20, 4) NOT NULL,
	"cost" numeric(20, 2)
);
--> statement-breakpoint
CREATE TABLE "inventory_moves" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"from_warehouse_id" uuid,
	"to_warehouse_id" uuid,
	"date" timestamp DEFAULT now(),
	"note" text,
	"user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(20, 4) NOT NULL,
	"price" numeric(20, 2) NOT NULL,
	"cost" numeric(20, 2),
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"total" numeric(20, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"partner_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"currency_id" uuid NOT NULL,
	"exchange_rate" numeric(20, 6) NOT NULL,
	"status" text DEFAULT 'DRAFT',
	"fiscal_status" text DEFAULT 'PENDING',
	"total_base" numeric(20, 2) DEFAULT '0',
	"total_tax" numeric(20, 2) DEFAULT '0',
	"total_igtf" numeric(20, 2) DEFAULT '0',
	"total" numeric(20, 2) DEFAULT '0',
	"date" timestamp DEFAULT now(),
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "loan_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"loan_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(20, 4) NOT NULL,
	"serial_number" text,
	"condition" text DEFAULT 'GOOD'
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"partner_id" uuid NOT NULL,
	"status" text DEFAULT 'ACTIVE',
	"start_date" timestamp DEFAULT now(),
	"due_date" timestamp,
	"return_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "loans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(20, 4) NOT NULL,
	"price" numeric(20, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"partner_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"warehouse_id" uuid,
	"status" text DEFAULT 'PENDING',
	"total" numeric(20, 2) DEFAULT '0',
	"date" timestamp DEFAULT now(),
	"user_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"tax_id" text NOT NULL,
	"address" text,
	"phone" text,
	"type" text DEFAULT 'CUSTOMER',
	"is_special_taxpayer" boolean DEFAULT false,
	"credit_limit" numeric(20, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "partners_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_digital" boolean DEFAULT false,
	"currency_id" uuid,
	CONSTRAINT "payment_methods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invoice_id" uuid,
	"partner_id" uuid NOT NULL,
	"method_id" uuid NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"currency_id" uuid NOT NULL,
	"exchange_rate" numeric(20, 6) NOT NULL,
	"reference" text,
	"date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"base_amount" numeric(20, 2) NOT NULL,
	"bonuses" numeric(20, 2) DEFAULT '0',
	"deductions" numeric(20, 2) DEFAULT '0',
	"net_total" numeric(20, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_amount" numeric(20, 2) DEFAULT '0',
	"status" text DEFAULT 'DRAFT',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payroll_runs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" uuid
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" uuid,
	"cost" numeric(20, 2) DEFAULT '0',
	"price" numeric(20, 2) DEFAULT '0',
	"is_exempt" boolean DEFAULT false,
	"tax_rate" numeric(5, 2) DEFAULT '16.00',
	"type" text DEFAULT 'PHYSICAL',
	"min_stock" numeric(20, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "stock" (
	"id" uuid PRIMARY KEY NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(20, 4) DEFAULT '0',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "users_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"branch_id" uuid,
	"name" text NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_move_lines" ADD CONSTRAINT "inventory_move_lines_move_id_inventory_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."inventory_moves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_move_lines" ADD CONSTRAINT "inventory_move_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_moves" ADD CONSTRAINT "inventory_moves_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_moves" ADD CONSTRAINT "inventory_moves_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_moves" ADD CONSTRAINT "inventory_moves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_method_id_payment_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_run_id_payroll_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;