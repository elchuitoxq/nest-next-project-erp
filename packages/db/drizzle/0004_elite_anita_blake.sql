CREATE TABLE "users_branches" (
	"user_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false,
	CONSTRAINT "users_branches_user_id_branch_id_pk" PRIMARY KEY("user_id","branch_id")
);
--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "is_special_taxpayer" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "branch_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users_branches" ADD CONSTRAINT "users_branches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_branches" ADD CONSTRAINT "users_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;