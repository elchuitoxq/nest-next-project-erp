import "dotenv/config";
import { db } from "../src/index";
import { permissions, roles, rolesPermissions } from "../src/schema";
import { eq } from "drizzle-orm";

const PERMISSIONS = [
  // Treasury
  {
    code: "treasury:view",
    description: "Ver módulo de tesorería",
    module: "treasury",
  },
  {
    code: "treasury:create_account",
    description: "Crear cuentas bancarias",
    module: "treasury",
  },
  {
    code: "treasury:edit_account",
    description: "Editar cuentas bancarias",
    module: "treasury",
  },
  // Settings
  {
    code: "settings:view",
    description: "Ver configuraciones",
    module: "settings",
  },
  {
    code: "settings:manage_users",
    description: "Gestionar usuarios",
    module: "settings",
  },
];

async function main() {
  console.log("🌱 Seeding Permissions...");

  // 1. Insert Component Permissions
  for (const perm of PERMISSIONS) {
    await db
      .insert(permissions)
      .values(perm)
      .onConflictDoUpdate({
        target: permissions.code,
        set: { description: perm.description, module: perm.module },
      });
  }

  // 2. Assign ALL permissions to ADMIN role
  const adminRole = await db.query.roles.findFirst({
    where: eq(roles.name, "ADMIN"),
  });

  if (adminRole) {
    const allPermissions = await db.select().from(permissions);

    for (const p of allPermissions) {
      await db
        .insert(rolesPermissions)
        .values({ roleId: adminRole.id, permissionId: p.id })
        .onConflictDoNothing();
    }
  }

  console.log("✅ Permissions Seeded!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
