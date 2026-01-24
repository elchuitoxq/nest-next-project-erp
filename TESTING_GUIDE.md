# Guía de Pruebas y Datos Semilla

Esta guía explica cómo poblar la base de datos con datos de prueba realistas para desarrollo, demostraciones y QA.

## 🚀 Inicio Rápido (Desarrollo)

Para reiniciar la base de datos y cargar la **Suite de Pruebas Robusta** (recomendado para desarrollo):

```bash
npm run db:setup:test
```

Este comando realiza:
1.  **Reinicio (Reset):** Elimina todas las tablas (TRUNCATE CASCADE).
2.  **Push:** Aplica el esquema de Drizzle más reciente.
3.  **Seed Test:** Ejecuta la estrategia híbrida (`seed-test.ts` + `seed:transactions`).

## 🧪 ¿Qué datos se incluyen?

La semilla robusta crea una simulación completa de una estructura empresarial venezolana.

### 1. Infraestructura
*   **Sucursales:** 2 Sucursales Activas ("Sucursal Caracas", "Sucursal Valencia").
*   **Usuarios:**
    *   `admin@erp.com` (Contraseña: `admin123`) - Acceso Total.
    *   `ventas.ccs@erp.com` - Representante de Ventas (Solo Caracas).
    *   `almacen.val@erp.com` - Gerente de Almacén (Solo Valencia).
    *   `tesoreria@erp.com` - Tesorero (Multisucursal).

### 2. Finanzas y Economía
*   **Monedas:** USD ($) y VES (Bs).
*   **Tasa de Cambio:** Tasa base fijada en **~352.7063** (a la fecha de simulación).
*   **Historial:** Incluye 30 días de tasas históricas (calculadas hacia atrás desde 352.7 bajando hasta ~340) para simular una inflación realista.
*   **Tesorería:**
    *   **Efectivo:** Cajas chicas en USD y VES por sucursal.
    *   **Banco:** "Banesco" (VES) y "Zelle Corp" (USD).

### 3. Inventario y Operaciones
*   **Productos:** 30 Artículos (Laptops, Accesorios, Servicios) con diferentes reglas de impuestos.
*   **Stock:** Ajuste de inventario inicial realizado hace 30 días.
*   **Transacciones (Vía API):**
    *   **10 Compras:** Compras históricas simuladas respetando el flujo de pedidos.
    *   **20-50 Ventas:** Mezcla de facturas pagadas, pendientes y anuladas distribuidas en los últimos 30 días.
    *   **Pagos:** Pagos parciales y totales registrados automáticamente para ~70% de las ventas.

## 🧹 Configuración Limpia (Tipo Producción)

Si solo deseas el mínimo indispensable (Roles, Usuario Admin, Configuración Base) sin datos falsos:

```bash
npm run db:setup
```

## ⚠️ Solución de Problemas

Si encuentras errores de clave foránea o "relation does not exist":
1.  Asegúrate de que tu `.env` tenga la `DATABASE_URL` correcta.
2.  Ejecuta el comando de configuración completo nuevamente (`npm run db:setup:test`) ya que maneja el orden de las operaciones estrictamente.
