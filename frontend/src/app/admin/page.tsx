'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { useAdminBanks } from '@/hooks/useAdminBanks';
import { useAdminLoanProducts } from '@/hooks/useAdminLoanProducts';
import { useAdminOccupations } from '@/hooks/useAdminOccupations';
import { useAdminUsers } from '@/hooks/useAdminUsers';

const CARDS = [
  { href: '/admin/banks', title: 'Banks', desc: 'Manage bank/finance-company products, rates, and scheme overrides.' },
  { href: '/admin/loan-products', title: 'Loan Products', desc: 'Per-product rates, eligibility, fees, and terms across every bank.' },
  { href: '/admin/occupations', title: 'Occupations', desc: 'Edit the profession list and dual-scheme eligibility flags.' },
  { href: '/admin/settings', title: 'Settings', desc: 'DTI thresholds, discounts, rounding step, feature flags.' },
  { href: '/admin/leads', title: 'Leads', desc: 'Full consultation leads and callback requests.' },
  { href: '/admin/users', title: 'Users', desc: 'View registered users, change roles, deactivate accounts.' },
  { href: '/admin/audit-log', title: 'Audit Log', desc: 'Every admin mutation, who changed what and when.' },
] as const;

export default function AdminDashboardPage() {
  const { data: banks } = useAdminBanks();
  const { data: products } = useAdminLoanProducts();
  const { data: occupations } = useAdminOccupations();
  const { data: users } = useAdminUsers();
  const { data: leads } = useQuery<unknown[]>({ queryKey: ['admin', 'leads'], queryFn: () => api.get('/admin/leads') });
  const { data: auditLog } = useQuery<unknown[]>({ queryKey: ['admin', 'audit-log'], queryFn: () => api.get('/admin/audit-log') });

  const counts: Record<string, number | undefined> = {
    'Banks': banks?.length,
    'Loan Products': products?.length,
    'Occupations': occupations?.length,
    'Leads': leads?.length,
    'Users': users?.length,
    'Audit Log': auditLog?.length,
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-text-900">Admin Console</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-2xl border border-line bg-card p-5 hover:border-teal-600 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display font-semibold text-text-900">{c.title}</p>
              {counts[c.title] !== undefined && (
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-mono text-[12px] font-bold tabular-nums text-teal-800">
                  {counts[c.title]}
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-text-600">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
