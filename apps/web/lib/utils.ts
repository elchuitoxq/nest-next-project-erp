import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (
  amount: number | string,
  currency: string = "VES",
) => {
  const value = Number(amount);
  if (isNaN(value)) return "0.00";

  let code = currency;
  // Legacy symbol mapping
  if (currency === "$") code = "USD";
  if (currency === "Bs" || currency === "Bs.") code = "VES";

  try {
    if (code === "VES") {
      return new Intl.NumberFormat("es-VE", {
        style: "currency",
        currency: "VES",
      }).format(value);
    }
    if (code === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }

    // Attempt standard Intl for other codes
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(value);
  } catch (e) {
    // Fallback if code is invalid
    return `${currency} ${value.toFixed(2)}`;
  }
};
