import { useState, useEffect } from "react";

// <T> permite que el hook acepte strings, números, o lo que necesites.
export function useDebounce<T>(value: T, delay: number): T {
  // Estado interno que mantendrá el valor con retraso
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Actualizamos el valor después del tiempo de espera (delay)
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancelamos el timeout si el valor cambia (el usuario sigue escribiendo)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
