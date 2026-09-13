import { useEffect, useState } from 'react';
import ProductDrawer from './ProductDrawer.jsx';
import { api } from '../api/client.js';

// The flat listing endpoint returns raw snake_case DB rows (joined with bank
// name/short) — reshape to the camelCase product shape ProductDrawer expects
// (same shape BankDrawer already gets from the nested banks-with-products call).
function mapRow(row) {
  return {
    dbId: row.id, bankId: row.bank_id, bankName: row.bank_name, bankShort: row.bank_short,
    name: row.name, category: row.category, status: row.status, rate: Number(row.rate),
    interestRateType: row.interest_rate_type, docChargeBasis: row.doc_charge_basis,
    docChargeValue: Number(row.doc_charge_value), docChargeMin: Number(row.doc_charge_min), docChargeMax: Number(row.doc_charge_max),
    maxTermYears: row.max_term_years, dtiOverride: row.dti_override != null ? Number(row.dti_override) : null,
    otIncluded: row.ot_included, otherIncomePct: Number(row.other_income_pct),
    loanAmountMin: Number(row.loan_amount_min), loanAmountMax: Number(row.loan_amount_max),
    minNetMonthlyIncome: Number(row.min_net_monthly_income), targetOccupation: row.target_occupation,
    targetGender: row.target_gender, commonLoan: row.common_loan,
    companiesListRequired: row.companies_list_required, companiesListId: row.companies_list_id,
    ageMin: row.age_min, ageMaxAtMaturity: row.age_max_at_maturity, minEmploymentMonths: row.min_employment_months,
    guarantorRequired: row.guarantor_required, collateralRequired: row.collateral_required, insuranceRequired: row.insurance_required,
    balloonAllowed: row.balloon_allowed, balloonPct: Number(row.balloon_pct),
    earlySettlementAllowed: row.early_settlement_allowed, earlySettlementChargePct: Number(row.early_settlement_charge_pct),
    latePaymentPenaltyPct: Number(row.late_payment_penalty_pct), gracePeriodDays: row.grace_period_days,
    processingDays: row.processing_days, cribCheckRequired: row.crib_check_required,
    salaryCreditRequired: row.salary_credit_required, coApplicantAllowed: row.co_applicant_allowed,
    topUpAfterMonths: row.top_up_after_months, currency: row.currency, remarks: row.remarks || [],
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [companyLists, setCompanyLists] = useState([]);
  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState('');
  const [bankFilter, setBankFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [productsRes, listsRes, banksRes] = await Promise.all([
      api.get('/admin/products'), api.get('/admin/company-lists'), api.get('/admin/banks'),
    ]);
    setProducts(productsRes.data.products.map(mapRow));
    setCompanyLists(listsRes.data.companyLists);
    setBanks(banksRes.data.banks);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) => {
    if (bankFilter !== 'all' && p.bankId !== bankFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <p style={{ color: 'var(--color-adm-text-dim)' }}>Loading…</p>;

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-5">Loan Products</h1>

      <div className="flex gap-3 mb-4">
        <input className="admin-input max-w-xs" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="admin-select max-w-[200px]" value={bankFilter} onChange={(e) => setBankFilter(e.target.value)}>
          <option value="all">All banks</option>
          {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="admin-card overflow-x-auto">
        <table className="w-full admin-table">
          <thead>
            <tr><th>Product</th><th>Bank</th><th>Category</th><th>Rate</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.dbId}>
                <td className="font-semibold">{p.name}</td>
                <td>{p.bankName}</td>
                <td className="capitalize">{p.category}</td>
                <td className="font-mono">{p.rate}%</td>
                <td><span className={`admin-badge ${p.status === 'active' ? 'admin-badge-active' : p.status === 'promotional' ? 'admin-badge-sponsored' : 'admin-badge-inactive'}`}>{p.status}</span></td>
                <td className="text-right"><button onClick={() => setEditing(p)} className="admin-btn-ghost px-3 py-1.5 text-xs">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductDrawer
          bankId={editing.bankId} product={editing} companyLists={companyLists}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
