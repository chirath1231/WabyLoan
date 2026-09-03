-- Plain-SQL schema for WabyLoan (replaces Prisma migrations). Safe to re-run: every statement is
-- idempotent, so this can run on every deploy without touching data in tables that already exist.

DO $$ BEGIN
  CREATE TYPE "BankType" AS ENUM ('bank', 'finance');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "Sector" AS ENUM ('government', 'semi_government', 'private', 'self_employed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TargetOccupation" AS ENUM ('all', 'doctor', 'engineer', 'gov_exec');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LoanCategory" AS ENUM ('personal', 'professional', 'housing', 'vehicle', 'business');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AuthProvider" AS ENUM ('email', 'google', 'facebook');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SRS Appendix B.1 — one row per bank/finance-company product record.
CREATE TABLE IF NOT EXISTS banks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "shortName" TEXT NOT NULL,
  type "BankType" NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sponsored BOOLEAN NOT NULL DEFAULT false,
  "baseRate" DECIMAL(5, 2) NOT NULL,
  "docChargePct" DECIMAL(5, 2) NOT NULL,
  "docChargeMin" INTEGER NOT NULL,
  "docChargeCap" INTEGER NOT NULL,
  "maxTermPersonal" INTEGER NOT NULL DEFAULT 0,
  "maxTermProfessional" INTEGER NOT NULL DEFAULT 0,
  "maxTermHousing" INTEGER NOT NULL DEFAULT 0,
  "maxTermVehicle" INTEGER NOT NULL DEFAULT 0,
  "maxTermBusiness" INTEGER NOT NULL DEFAULT 0,
  "specialRate" DECIMAL(5, 2),
  "specialDocChargePct" DECIMAL(5, 2),
  "specialMaxTermYears" INTEGER,
  "allowedSectors" "Sector"[] NOT NULL DEFAULT '{}',
  "targetOccupation" "TargetOccupation",
  remarks TEXT[] NOT NULL DEFAULT '{}',
  "specialSchemeRemarks" TEXT[] NOT NULL DEFAULT '{}',
  color TEXT,
  "updatedDate" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- SRS Appendix B.2 — admin-editable profession list, drives Step 2 dropdown + dual-scheme gating.
CREATE TABLE IF NOT EXISTS occupations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  "isSpecialSchemeEligible" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- SRS §5.3 — global engine configuration. Single row, id always 1.
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  "dtiGovernment" INTEGER NOT NULL DEFAULT 70,
  "dtiSemiGovernment" INTEGER NOT NULL DEFAULT 65,
  "dtiPrivate" INTEGER NOT NULL DEFAULT 60,
  "dtiSelfEmployed" INTEGER NOT NULL DEFAULT 55,
  "specialOccupationDiscount" DECIMAL(5, 2) NOT NULL DEFAULT 0.75,
  "specialOccupationEnabled" BOOLEAN NOT NULL DEFAULT true,
  "professionalSchemeDiscount" DECIMAL(5, 2) NOT NULL DEFAULT 1.5,
  "professionalSchemeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "loanRoundingStep" INTEGER NOT NULL DEFAULT 50000,
  "businessLoanEnabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- SRS §6.1 — auth records. A guest has no row here at all (isRestricted = !user).
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  "passwordHash" TEXT,
  name TEXT,
  role "UserRole" NOT NULL DEFAULT 'user',
  active BOOLEAN NOT NULL DEFAULT true,
  "authProvider" "AuthProvider" NOT NULL DEFAULT 'email',
  "oauthId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  UNIQUE ("authProvider", "oauthId")
);

-- SRS Appendix B.3 — one row per completed/abandoned eligibility session (never for guests).
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  "loanCategory" "LoanCategory" NOT NULL,
  sector "Sector" NOT NULL,
  "occupationId" TEXT,
  age INTEGER NOT NULL,
  "retirementAge" INTEGER NOT NULL,
  "incomeProfile" JSONB NOT NULL,
  "categoryDetails" JSONB NOT NULL,
  "resultsSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- SRS Appendix B.4 — full consultation lead requests.
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  "applicationId" TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  branch TEXT,
  "bankId" TEXT REFERENCES banks(id) ON DELETE SET NULL,
  "variantKey" TEXT,
  "loanCategory" "LoanCategory" NOT NULL,
  "requestedAmount" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- SRS Appendix B.5 — lightweight soft-leads (name + phone only).
CREATE TABLE IF NOT EXISTS callback_requests (
  id TEXT PRIMARY KEY,
  "applicationId" TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  "loanCategory" "LoanCategory" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- SRS Appendix B.6 — every Admin Console mutation, required for compliance (§5.5).
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  "adminUserId" TEXT NOT NULL REFERENCES users(id),
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  field TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
