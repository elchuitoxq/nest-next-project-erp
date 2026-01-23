"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, LoginFormValues } from "@/modules/auth/schemas/login.schema"
import { useAuthStore } from "@/stores/use-auth-store"
import api from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    try {
      const response = await api.post("/auth/login", data)
      login(response.data.access_token, response.data.user)

      toast.success("Inicio de sesión exitoso")
      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Inicia Sesión</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Ingresa tu correo para acceder a tu cuenta
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Contraseña</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando
            </>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </div>
      <div className="text-center text-sm">
        ¿No tienes cuenta?{" "}
        <a href="#" className="underline underline-offset-4">
          Regístrate
        </a>
      </div>
    </form>
  )
}

