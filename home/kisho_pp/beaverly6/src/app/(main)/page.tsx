import DashboardClient from '@/components/dashboard/dashboard-client';

// ---- SSR / Dynamic flags ----
// These flags ensure the page is always dynamically rendered on the server
// and that it's never cached. This is crucial for real-time data to show up.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function DashboardPage() {
  return <DashboardClient />;
}
