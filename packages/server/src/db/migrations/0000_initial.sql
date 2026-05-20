CREATE TYPE "source" AS ENUM ('web', 'telegram');

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) UNIQUE,
	"password_hash" varchar(255),
	"display_name" varchar(255) NOT NULL,
	"github_id" varchar(50) UNIQUE,
	"telegram_id" bigint UNIQUE,
	"currency" varchar(3) DEFAULT 'ARS',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#6366f1' NOT NULL,
	"icon" varchar(10),
	"is_default" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"amount" decimal(12,2) NOT NULL,
	"description" text,
	"expense_date" date DEFAULT CURRENT_DATE NOT NULL,
	"source" "source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(6) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "link_tokens_token_unique" UNIQUE("token")
);

DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "link_tokens" ADD CONSTRAINT "link_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "categories_user_deleted_sort_idx" ON "categories" ("user_id","is_deleted","sort_order");
CREATE UNIQUE INDEX IF NOT EXISTS "categories_user_name_unique" ON "categories" ("user_id","name") WHERE "is_deleted" = false;
CREATE INDEX IF NOT EXISTS "expenses_user_date_idx" ON "expenses" ("user_id","expense_date");
CREATE INDEX IF NOT EXISTS "expenses_user_category_idx" ON "expenses" ("user_id","category_id");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses" ("category_id");
CREATE INDEX IF NOT EXISTS "link_tokens_token_idx" ON "link_tokens" ("token");
CREATE INDEX IF NOT EXISTS "link_tokens_expires_at_idx" ON "link_tokens" ("expires_at");
