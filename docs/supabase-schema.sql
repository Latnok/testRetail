create table if not exists public.orders (
  retailcrm_order_id text primary key,
  retailcrm_order_number text,
  created_at timestamptz,
  updated_at timestamptz,
  status text,
  order_type text,
  order_method text,
  total_amount numeric(12, 2),
  currency text,
  first_name text,
  last_name text,
  phone text,
  email text,
  city text,
  address_text text,
  custom_fields jsonb default '{}'::jsonb,
  payload jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  retailcrm_order_id text not null references public.orders(retailcrm_order_id) on delete cascade,
  line_index integer not null,
  product_name text not null,
  quantity numeric(12, 2) not null,
  unit_price numeric(12, 2) not null,
  subtotal numeric(12, 2) not null,
  payload jsonb not null,
  unique(retailcrm_order_id, line_index)
);

create table if not exists public.notification_log (
  id bigint generated always as identity primary key,
  retailcrm_order_id text not null,
  chat_id text not null,
  threshold_value numeric(12, 2) not null,
  message_status text not null,
  notified_at timestamptz default now(),
  payload jsonb default '{}'::jsonb,
  unique(retailcrm_order_id, chat_id, threshold_value)
);

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_notification_log_order on public.notification_log(retailcrm_order_id);
