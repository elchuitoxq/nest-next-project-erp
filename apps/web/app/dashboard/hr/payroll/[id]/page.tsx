import { PayrollDetailView } from "@/modules/hr/components/views/payroll-detail-view";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PayrollDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PayrollDetailView id={id} />;
}
