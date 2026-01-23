"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/use-auth-store"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, hasHydrated } = useAuthStore()

  useEffect(() => {
    // Only check auth once hydration is complete
    if (hasHydrated && !isAuthenticated) {
        router.push(`/login?from=${pathname}`)
    }
  }, [isAuthenticated, hasHydrated, router, pathname])

  // Show loader while rehydrating
  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If hydrated but not authenticated, return null while redirect happens
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
