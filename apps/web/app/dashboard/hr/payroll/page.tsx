import { PayrollDashboard } from "@/modules/hr/payroll/payroll-dashboard";

export const metadata = {
  title: "Nómina | ERP",
  description: "Gestión de nómina y pagos",
};

export default function PayrollPage() {
  return <PayrollDashboard />;
}
