import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/session';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/banks', label: 'Banks' },
  { href: '/admin/loan-products', label: 'Loan Products' },
  { href: '/admin/occupations', label: 'Occupations' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/audit-log', label: 'Audit Log' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  // Admin Console is web-only and gated on role — SRS §5 (managed data is shared with mobile via the same backend).
  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="w-48 flex-shrink-0">
          <p className="mb-3 px-2 font-display text-sm font-bold text-teal-800">Admin Console</p>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm font-semibold text-text-600 hover:bg-teal-50 hover:text-teal-700">
                {item.label}
              </Link>
            ))}
            <Link href="/" className="mt-4 block rounded-lg px-3 py-2 text-[13px] text-text-400 hover:text-teal-700">
              ← Back to site
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
