import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function DashboardHeader({
  title,
  description,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">{children}</div>
      </div>
      <Separator />
    </div>
  );
}
