"use client";

import { useAccountStatement } from "@/modules/treasury/hooks/use-treasury";
import { usePartner } from "@/modules/partners/hooks/use-partners";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function AccountStatementPage() {
  const router = useRouter();
  const params = useParams() as { partnerId: string };
  const { data: partner, isLoading: isLoadingPartner } = usePartner(
    params.partnerId,
  );
  const { data: statement, isLoading: isLoadingStatement } =
    useAccountStatement(params.partnerId);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INVOICE":
        return <Badge variant="default">Factura</Badge>;
      case "PAYMENT":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Pago
          </Badge>
        );
      case "CREDIT_NOTE":
        return <Badge variant="destructive">Nota de Crédito</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getTranslatedType = (type: string) => {
    switch (type) {
      case "INVOICE":
        return "Factura";
      case "PAYMENT":
        return "Pago";
      case "CREDIT_NOTE":
        return "Nota de Crédito";
      default:
        return type;
    }
  };

  if (isLoadingPartner || isLoadingStatement) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!partner) {
    return <div>Cliente no encontrado</div>;
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Operaciones</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  onClick={() => router.push("/dashboard/partners")}
                >
                  Clientes
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Estado de Cuenta</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {partner.name}
            </h2>
            <p className="text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Estado de Cuenta
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Global (Deuda)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-3xl font-bold",
                  statement?.balance > 0 ? "text-red-600" : "text-green-600",
                )}
              >
                {statement?.balance
                  ? formatCurrency(statement.balance)
                  : formatCurrency(0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {statement?.balance > 0
                  ? "Cuentas por Cobrar"
                  : "Pasivo (Saldo a Favor)"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Sin Ocupar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {statement?.unusedBalance
                  ? formatCurrency(statement.unusedBalance)
                  : formatCurrency(0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Disponible para cruce
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Movimientos</CardTitle>
            <CardDescription>
              Detalle de facturas, pagos y notas de crédito ordenados
              cronológicamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Debe (Cargo)</TableHead>
                  <TableHead className="text-right">Haber (Abono)</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement?.transactions.map((t: any) => (
                  <TableRow key={t.type + t.id}>
                    <TableCell className="font-medium">
                      {format(new Date(t.date), "dd/MM/yyyy HH:mm", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>{getTypeBadge(t.type)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {t.reference}
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium whitespace-nowrap">
                      {t.debit > 0 ? formatCurrency(t.debit) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium whitespace-nowrap">
                      {t.credit > 0 ? (
                        formatCurrency(t.credit)
                      ) : t.realAmount > 0 && t.type === "PAYMENT" ? (
                        <span
                          className="text-muted-foreground italic"
                          title="Uso de Saldo a Favor"
                        >
                          {formatCurrency(t.realAmount)}*
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-bold whitespace-nowrap",
                        t.balance > 0 ? "text-red-600" : "text-gray-900",
                        t.credit === 0 && t.realAmount > 0 && "opacity-50",
                      )}
                    >
                      {formatCurrency(t.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                {!statement?.transactions.length && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No hay movimientos registrados para este cliente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
