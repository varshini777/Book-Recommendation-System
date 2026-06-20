import AdminGuard from '../../components/AdminGuard';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
