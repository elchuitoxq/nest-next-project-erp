# Database Schema Reference (Drizzle)

All primary keys use **UUID v7** for sortable unicidad and performance.

## 🔑 Core & Identity

- **`users`**: name, email, password, refresh_token.
- **`roles`**: name, description.
- **`branches`**: name, address, is_active.
- **`users_branches`**: Junction table for multi-branch access control.
- **`users_roles`**: Junction table for RBAC.

## 💰 Finance & Currencies

- **`currencies`**: code (USD, VES), name, symbol, is_base, **branch_id**. (Unique per code+branch).
- **`exchange_rates`**: currency_id, rate, date, source (BCV/Manual), **branch_id**.
- **`payment_methods`**: name, code, is_digital, currency_id, **branch_id**. (Unique per code+branch).
- **`bank_accounts`**: name, number, type, currency_id, balance, **branch_id**.

## 📦 Partners & Products

- **`partners`**: tax_id (RIF/CI), name, type (Customer/Supplier), taxpayer_type, credit_limit.
- **`products`**: sku, name, price, cost, tax_rate, is_exempt, currency_id.
- **`product_categories`**: name, parent_id.

## 🚜 Inventory

- **`warehouses`**: branch_id, name, address.
- **`stock`**: warehouse_id, product_id, quantity.
- **`inventory_moves`**: code, type (IN/OUT/TRANSFER/ADJUST), from_warehouse_id, to_warehouse_id.
- **`inventory_move_lines`**: move_id, product_id, quantity, cost.

## 📋 Operations

- **`orders`**: code, partner_id, branch_id, warehouse_id, status, total, exchange_rate.
- **`order_items`**: order_id, product_id, quantity, price.
- **`invoices`**: code, partner_id, branch_id, currency_id, exchange_rate, total_base, total_tax, total_igtf, status.
- **`payments`**: invoice_id, partner_id, branch_id, method_id, amount, exchange_rate, bank_account_id.

## 🤝 Relations

- Most entities are linked to a `branch_id` to enforce data segregation.
- `inventory_moves` and `orders` track the `user_id` who created the record.
