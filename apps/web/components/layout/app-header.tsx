import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  className?: string;
  customLabels?: Record<string, string>;
}

export function AppHeader({ className, customLabels }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/80 backdrop-blur-md sticky top-0 z-10",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DynamicBreadcrumb customLabels={customLabels} />
      </div>
    </header>
  );
}
