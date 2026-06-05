import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import { AdminNav } from './AdminNav';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-ink-50">
      <AdminNav username={admin.username} />
      <main className="flex-1 overflow-auto p-5 sm:p-8">{children}</main>
    </div>
  );
}
