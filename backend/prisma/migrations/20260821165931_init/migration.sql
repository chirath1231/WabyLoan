-- CreateEnum
CREATE TYPE "BankType" AS ENUM ('bank', 'finance');

-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('government', 'semi_government', 'private', 'self_employed');

-- CreateEnum
CREATE TYPE "TargetOccupation" AS ENUM ('all', 'doctor', 'engineer', 'gov_exec');

-- CreateEnum
CREATE TYPE "LoanCategory" AS ENUM ('personal', 'professional', 'housing', 'vehicle', 'business');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('email', 'google', 'facebook');

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "type" "BankType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "baseRate" DECIMAL(5,2) NOT NULL,
    "docChargePct" DECIMAL(5,2) NOT NULL,
    "docChargeMin" INTEGER NOT NULL,
    "docChargeCap" INTEGER NOT NULL,
    "maxTermPersonal" INTEGER NOT NULL DEFAULT 0,
    "maxTermProfessional" INTEGER NOT NULL DEFAULT 0,
    "maxTermHousing" INTEGER NOT NULL DEFAULT 0,
    "maxTermVehicle" INTEGER NOT NULL DEFAULT 0,
    "maxTermBusiness" INTEGER NOT NULL DEFAULT 0,
    "specialRate" DECIMAL(5,2),
    "specialDocChargePct" DECIMAL(5,2),
    "specialMaxTermYears" INTEGER,
    "allowedSectors" "Sector"[],
    "targetOccupation" "TargetOccupation",
    "remarks" TEXT[],
    "specialSchemeRemarks" TEXT[],
    "color" TEXT,
    "updatedDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isSpecialSchemeEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "dtiGovernment" INTEGER NOT NULL DEFAULT 70,
    "dtiSemiGovernment" INTEGER NOT NULL DEFAULT 65,
    "dtiPrivate" INTEGER NOT NULL DEFAULT 60,
    "dtiSelfEmployed" INTEGER NOT NULL DEFAULT 55,
    "specialOccupationDiscount" DECIMAL(5,2) NOT NULL DEFAULT 0.75,
    "specialOccupationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "professionalSchemeDiscount" DECIMAL(5,2) NOT NULL DEFAULT 1.5,
    "professionalSchemeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "loanRoundingStep" INTEGER NOT NULL DEFAULT 50000,
    "businessLoanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'email',
    "oauthId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "loanCategory" "LoanCategory" NOT NULL,
    "sector" "Sector" NOT NULL,
    "occupationId" TEXT,
    "age" INTEGER NOT NULL,
    "retirementAge" INTEGER NOT NULL,
    "incomeProfile" JSONB NOT NULL,
    "categoryDetails" JSONB NOT NULL,
    "resultsSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT,
    "branch" TEXT,
    "bankId" TEXT,
    "variantKey" TEXT,
    "loanCategory" "LoanCategory" NOT NULL,
    "requestedAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "callback_requests" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "loanCategory" "LoanCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "callback_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "occupations_slug_key" ON "occupations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_authProvider_oauthId_key" ON "users"("authProvider", "oauthId");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
