import { AuthGuard } from "@/components/auth/auth-guard"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
       <SidebarProvider>
          <AppSidebar />
          {children}
       </SidebarProvider>
    </AuthGuard>
  )
}
