import { db } from "./src";
import { inventoryMoves } from "./src/schema";

async function main() {
  try {
    console.log("Testing inventoryMoves query...");
    const moves = await db.query.inventoryMoves.findMany({
      with: {
        fromWarehouse: true,
        toWarehouse: true,
        user: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });
    console.log("Query successful:", moves);
  } catch (e) {
    console.error("Query failed:", e);
  }
}

main();
