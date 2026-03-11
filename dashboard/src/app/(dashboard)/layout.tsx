import CreditWarning from '@/components/CreditWarning';
import ShopGuard from '@/components/ShopGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CreditWarning />
      <ShopGuard />
      {children}
    </>
  );
}
