import React from "react";
import { useAvailableCreditNotes } from "../hooks/use-treasury";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BalancePickerProps {
  partnerId: string;
  currencyId: string;
  amountToPay: number;
  onApply?: (amount: number) => void;
}

export const BalancePicker: React.FC<BalancePickerProps> = ({
  partnerId,
  currencyId,
  amountToPay,
  onApply,
}) => {
  const { data: creditNotes, isLoading } = useAvailableCreditNotes(
    partnerId,
    currencyId,
  );

  if (isLoading)
    return (
      <div className="flex items-center gap-2 p-3 border rounded bg-gray-50/50 animate-pulse">
        <div className="w-4 h-4 bg-gray-200 rounded-full" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>
    );

  if (!creditNotes || creditNotes.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 text-amber-600 bg-amber-50 rounded border border-amber-100">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <p className="text-[11px] font-semibold leading-tight">
          Sin saldo disponible en esta moneda.
        </p>
      </div>
    );
  }

  const totalAvailable = creditNotes.reduce(
    (sum: number, cn: any) => sum + Number(cn.remainingAmount),
    0,
  );
  const isSufficient = totalAvailable >= amountToPay;

  return (
    <div className="relative border rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-teal-100/50">
      {/* Header with Balance */}
      <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 flex justify-between items-center">
        <div>
          <h4 className="text-[10px] font-black text-teal-900 uppercase tracking-widest">
            Saldo Disponible
          </h4>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-teal-700 tracking-tighter">
              {totalAvailable.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[10px] font-bold text-teal-500 uppercase">
              {creditNotes[0]?.currency?.code || "USD"}
            </span>
          </div>
        </div>

        {onApply && (
          <button
            type="button"
            onClick={() => onApply(totalAvailable)}
            className="px-2 py-1 bg-teal-600 text-white text-[10px] font-black rounded shadow-sm hover:bg-teal-700 active:scale-95 transition-all"
          >
            Aplicar Saldo Total
          </button>
        )}
      </div>

      {/* Logic Feedback */}
      <div
        className={cn(
          "px-3 py-2 flex items-center justify-between gap-2 border-b",
          isSufficient
            ? "bg-green-50/50 border-green-100"
            : "bg-red-50/50 border-red-100",
        )}
      >
        <div className="flex items-center gap-1.5">
          {isSufficient ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          )}
          <span
            className={cn(
              "text-[10px] font-bold leading-none",
              isSufficient ? "text-green-700" : "text-red-700",
            )}
          >
            {isSufficient ? "Cubre el pago" : "Saldo insuficiente"}
          </span>
        </div>

        {!isSufficient && amountToPay > 0 && (
          <span className="text-[9px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
            FALTAN {(amountToPay - totalAvailable).toFixed(2)}
          </span>
        )}
      </div>

      {/* Mini-List of Credits */}
      <div className="p-2 space-y-1.5 max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-teal-100 bg-gray-50/30">
        {creditNotes.map((creditNote: any) => (
          <div
            key={creditNote.id}
            className="flex justify-between items-center text-[10px] bg-white p-1.5 rounded border border-gray-100 shadow-tiny"
          >
            <div className="flex flex-col">
              <span className="font-bold text-gray-700 leading-none">
                {creditNote.code}
              </span>
              <span className="text-[8px] text-gray-400 font-medium">
                {new Date(creditNote.date).toLocaleDateString()}
              </span>
            </div>
            <span className="font-black text-teal-600">
              {Number(creditNote.remainingAmount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
