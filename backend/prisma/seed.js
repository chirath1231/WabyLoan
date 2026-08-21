import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BANKS_DEFAULT, OCCUPATIONS_DEFAULT } from '../src/data/defaultData.js';
import { DEFAULT_SETTINGS } from '../src/services/settingsService.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding settings...');
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, ...DEFAULT_SETTINGS },
  });

  console.log('Seeding occupations...');
  for (const occ of OCCUPATIONS_DEFAULT) {
    await prisma.occupation.upsert({
      where: { slug: occ.slug },
      update: { label: occ.label, isSpecialSchemeEligible: occ.isSpecialSchemeEligible },
      create: occ,
    });
  }

  console.log('Seeding banks...');
  for (const bank of BANKS_DEFAULT) {
    const existing = await prisma.bank.findFirst({ where: { name: bank.name } });
    const data = {
      name: bank.name,
      shortName: bank.shortName,
      type: bank.type,
      active: bank.active,
      sponsored: bank.sponsored,
      baseRate: bank.baseRate,
      docChargePct: bank.docChargePct,
      docChargeMin: bank.docChargeMin,
      docChargeCap: bank.docChargeCap,
      maxTermPersonal: bank.maxTermPersonal,
      maxTermProfessional: bank.maxTermProfessional,
      maxTermHousing: bank.maxTermHousing,
      maxTermVehicle: bank.maxTermVehicle,
      maxTermBusiness: bank.maxTermBusiness,
      specialRate: bank.specialRate,
      specialDocChargePct: bank.specialDocChargePct,
      specialMaxTermYears: bank.specialMaxTermYears,
      allowedSectors: bank.allowedSectors,
      targetOccupation: bank.targetOccupation,
      remarks: bank.remarks,
      specialSchemeRemarks: bank.specialSchemeRemarks,
      color: bank.color,
      updatedDate: new Date(bank.updatedDate),
    };
    if (existing) {
      await prisma.bank.update({ where: { id: existing.id }, data });
    } else {
      await prisma.bank.create({ data });
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@wabyloan.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    console.log(`Seeding default admin user: ${adminEmail}`);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        name: 'Waby Loan Admin',
        role: 'admin',
        authProvider: 'email',
      },
    });
    console.log(`  -> login with ${adminEmail} / ${adminPassword} (change this password after first login)`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
