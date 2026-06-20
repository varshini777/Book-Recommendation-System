import AdminGuard from '../../components/AdminGuard';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
