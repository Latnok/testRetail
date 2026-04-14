# Supabase Database Schema

## Tables

### `orders`

- `retailcrm_order_id text primary key`
- `retailcrm_order_number text`
- `created_at timestamptz`
- `updated_at timestamptz`
- `status text`
- `order_type text`
- `order_method text`
- `total_amount numeric(12,2)`
- `currency text`
- `first_name text`
- `last_name text`
- `phone text`
- `email text`
- `city text`
- `address_text text`
- `custom_fields jsonb`
- `payload jsonb`
- `synced_at timestamptz`

### `order_items`

- `id bigint generated always as identity primary key`
- `retailcrm_order_id text references orders(retailcrm_order_id) on delete cascade`
- `line_index integer`
- `product_name text`
- `quantity numeric(12,2)`
- `unit_price numeric(12,2)`
- `subtotal numeric(12,2)`
- `payload jsonb`
- unique key on `retailcrm_order_id, line_index`

### `notification_log`

- `id bigint generated always as identity primary key`
- `retailcrm_order_id text`
- `chat_id text`
- `threshold_value numeric(12,2)`
- `message_status text`
- `notified_at timestamptz`
- `payload jsonb`
- unique key on `retailcrm_order_id, chat_id, threshold_value`

## Notes

- `orders.payload` stores the raw RetailCRM order JSON for debugging and future reporting.
- `notification_log` prevents duplicate Telegram messages when the poller re-reads overlapping windows.
