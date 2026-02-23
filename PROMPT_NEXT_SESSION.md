# Continuación: Implementación de Seguridad UI (PBAC)

## Contexto

En la sesión anterior, establecimos los patrones definitivos para asegurar la UI utilizando el sistema de permisos (PBAC).

- Skill creada: `.agent/skills/securing-ui-features/SKILL.md`
- Componentes clave: `PermissionsGate` (con soporte OR/AND), `usePermission` hook.
- Página de error: `/forbidden`.

## Objetivo

Aplicar sistemáticamente estos patrones al resto de la aplicación para garantizar que todas las acciones sensibles estén protegidas visualmente.

## Tareas Pendientes

1.  **Auditoría de Módulos:** Revisar módulo por módulo (Inventory, Finance, HR) e identificar botones de acción (Crear, Editar, Eliminar, Aprobar).
2.  **Aplicar PermissionsGate:** Envolver estos botones con el componente `PermissionsGate` usando los permisos definidos en `apps/web/config/permissions.ts`.
3.  **Filtrado de Tablas:** Asegurar que los menús desplegables en tablas (acciones de fila) usen `usePermission` para ocultar opciones no permitidas.
4.  **Protección de Rutas:** Verificar si alguna página crítica necesita redirección automática a `/forbidden` si el usuario entra por URL directa.

## Guía de Ejecución

Por favor, lee la skill `securing-ui-features` y procede a auditar y asegurar los siguientes módulos prioritarios:

- [ ] **Inventario:** Creación/Edición de Productos y Almacenes.
- [ ] **Finanzas:** Acciones en Cuentas Bancarias y Métodos de Pago.
- [ ] **RRHH:** Gestión de Empleados y Nómina.

Usa `grep` para buscar componentes `Link`, `Button` o `DropdownMenuItem` que realicen acciones de mutación y verifícalos contra `PERMISSIONS`.
