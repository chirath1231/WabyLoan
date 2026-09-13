import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'seed-data.json'), 'utf8')
);

async function seedBankRows(client) {
  for (const bank of seedData.BANKS_DEFAULT) {
    await client.query(
      `insert into banks (
        id, name, short, type, active, sponsored, base_rate, max_term_years,
        doc_charge_pct, doc_charge_min, doc_charge_cap, color, allowed_sectors,
        target_occupation, remarks, special_scheme_remarks, special_rate,
        special_doc_charge_pct, special_max_term_years
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      on conflict (id) do update set
        name = excluded.name, short = excluded.short, type = excluded.type,
        active = excluded.active, sponsored = excluded.sponsored, base_rate = excluded.base_rate,
        max_term_years = excluded.max_term_years, doc_charge_pct = excluded.doc_charge_pct,
        doc_charge_min = excluded.doc_charge_min, doc_charge_cap = excluded.doc_charge_cap,
        color = excluded.color, allowed_sectors = excluded.allowed_sectors,
        target_occupation = excluded.target_occupation, remarks = excluded.remarks,
        special_scheme_remarks = excluded.special_scheme_remarks, special_rate = excluded.special_rate,
        special_doc_charge_pct = excluded.special_doc_charge_pct,
        special_max_term_years = excluded.special_max_term_years,
        updated_at = now()`,
      [
        bank.id, bank.name, bank.short, bank.type, bank.active, bank.sponsored,
        bank.baseRate, JSON.stringify(bank.maxTermYears), bank.docChargePct,
        bank.docChargeMin, bank.docChargeCap, bank.color, bank.allowedSectors,
        bank.targetOccupation, JSON.stringify(bank.remarks),
        JSON.stringify(bank.specialSchemeRemarks), bank.specialRate,
        bank.specialDocChargePct, bank.specialMaxTermYears,
      ]
    );
  }
}

async function seedProducts(client) {
  for (const bank of seedData.BANKS_DEFAULT) {
    for (const product of bank.products) {
      await client.query(
        `insert into products (
          bank_id, slug, name, category, status, rate, interest_rate_type,
          doc_charge_basis, doc_charge_value, doc_charge_min, doc_charge_max,
          max_term_years, dti_override, ot_included, other_income_pct,
          loan_amount_min, loan_amount_max, min_net_monthly_income,
          target_occupation, target_gender, common_loan, companies_list_required,
          companies_list_id, age_min, age_max_at_maturity, min_employment_months,
          guarantor_required, collateral_required, insurance_required,
          balloon_allowed, balloon_pct, early_settlement_allowed,
          early_settlement_charge_pct, late_payment_penalty_pct, grace_period_days,
          processing_days, crib_check_required, salary_credit_required,
          co_applicant_allowed, top_up_after_months, currency, remarks
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
          $39,$40,$41,$42
        )
        on conflict do nothing`,
        [
          bank.id, product.id, product.name, product.category, product.status,
          product.rate, product.interestRateType, product.docChargeBasis,
          product.docChargeValue, product.docChargeMin, product.docChargeMax,
          product.maxTermYears, product.dtiOverride, product.otIncluded,
          product.otherIncomePct, product.loanAmountMin, product.loanAmountMax,
          product.minNetMonthlyIncome, JSON.stringify(product.targetOccupation),
          product.targetGender, product.commonLoan, product.companiesListRequired,
          product.companiesListId, product.ageMin, product.ageMaxAtMaturity,
          product.minEmploymentMonths, product.guarantorRequired,
          product.collateralRequired, product.insuranceRequired,
          product.balloonAllowed, product.balloonPct, product.earlySettlementAllowed,
          product.earlySettlementChargePct, product.latePaymentPenaltyPct,
          product.gracePeriodDays, product.processingDays, product.cribCheckRequired,
          product.salaryCreditRequired, product.coApplicantAllowed,
          product.topUpAfterMonths, product.currency, JSON.stringify(product.remarks || []),
        ]
      );
    }
  }
}

async function seedCompanyLists(client) {
  for (const list of seedData.COMPANY_LISTS_DEFAULT) {
    await client.query(
      `insert into company_lists (id, bank_id, name) values ($1,$2,$3)
       on conflict (id) do update set name = excluded.name`,
      [list.id, list.bankId, list.name]
    );
    await client.query(`delete from company_list_entries where list_id = $1`, [list.id]);
    for (const entry of list.entries) {
      await client.query(
        `insert into company_list_entries (list_id, name, tier, sector) values ($1,$2,$3,$4)`,
        [list.id, entry.name, entry.tier, entry.sector]
      );
    }
  }
}

async function seedOccupations(client) {
  for (const occ of seedData.OCCUPATIONS_DEFAULT) {
    await client.query(
      `insert into occupations (id, label, special) values ($1,$2,$3)
       on conflict (id) do update set label = excluded.label, special = excluded.special`,
      [occ.id, occ.label, occ.special]
    );
  }
}

async function seedAdminSettings(client) {
  await client.query(
    `insert into admin_settings (id) values (true) on conflict (id) do nothing`
  );
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await seedBankRows(client);
    await seedCompanyLists(client);
    await seedProducts(client);
    await seedOccupations(client);
    await seedAdminSettings(client);
    await client.query('commit');
    console.log('Seed complete:', {
      banks: seedData.BANKS_DEFAULT.length,
      products: seedData.BANKS_DEFAULT.reduce((n, b) => n + b.products.length, 0),
      companyLists: seedData.COMPANY_LISTS_DEFAULT.length,
      occupations: seedData.OCCUPATIONS_DEFAULT.length,
    });
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
