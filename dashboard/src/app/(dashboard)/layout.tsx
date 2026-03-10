import CreditWarning from '@/components/CreditWarning';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CreditWarning />
      {children}
    </>
  );
}
