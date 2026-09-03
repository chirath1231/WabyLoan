import Link from 'next/link';

const CARDS = [
  { href: '/admin/banks', title: 'Banks', desc: 'Manage bank/finance-company products, rates, and scheme overrides.' },
  { href: '/admin/occupations', title: 'Occupations', desc: 'Edit the profession list and dual-scheme eligibility flags.' },
  { href: '/admin/settings', title: 'Settings', desc: 'DTI thresholds, discounts, rounding step, feature flags.' },
  { href: '/admin/leads', title: 'Leads', desc: 'Full consultation leads and callback requests.' },
  { href: '/admin/users', title: 'Users', desc: 'View registered users, change roles, deactivate accounts.' },
  { href: '/admin/audit-log', title: 'Audit Log', desc: 'Every admin mutation, who changed what and when.' },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-text-900">Admin Console</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-2xl border border-line bg-card p-5 hover:border-teal-600 hover:shadow-md">
            <p className="font-display font-semibold text-text-900">{c.title}</p>
            <p className="mt-1 text-[13px] text-text-600">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
