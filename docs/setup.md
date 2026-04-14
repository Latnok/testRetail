# Setup Guide

## 1. Fill `.env`

Use the root `.env` and set:

- `RETAIL_CRM_BASE_URL`
- `RETAIL_CRM_KEY`
- `RETAIL_CRM_SITE` optional, but recommended
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_IDS`
- `TELEGRAM_ORDER_THRESHOLD`
- `ORDER_POLL_INTERVAL_MINUTES`
- `SUPABASE_SYNC_INTERVAL_MINUTES`

`TELEGRAM_CHAT_IDS` is a comma-separated list.
If `RETAIL_CRM_SITE` is empty and the API key sees exactly one site, the importer auto-detects it.

Recommended runtime values for this project:

```env
RETAIL_CRM_SITE=latnok
TELEGRAM_CHAT_IDS=130884732
TELEGRAM_ORDER_THRESHOLD=50000
SUPABASE_SYNC_INTERVAL_MINUTES=10
ORDER_POLL_INTERVAL_MINUTES=5
```

## 2. Install dependencies

```bash
npm install
```

## 3. Create Supabase tables

Run the SQL from [supabase-schema.sql](/C:/Users/latno/Documents/testRetail/docs/supabase-schema.sql) in the Supabase SQL editor.

## 4. Import mock orders

```bash
npm run import:retailcrm
```

Optional arguments:

- `--file=mock_orders.json`
- `--limit=10`
- `--dry-run`

## 5. Sync orders into Supabase

```bash
npm run sync:supabase -- --from=2026-04-01 --to=2026-04-14
```

## 6. Run automatic sync into Supabase

Set `SUPABASE_SYNC_INTERVAL_MINUTES` in the root `.env` to a value from `10` to `50`.

```bash
npm run sync:supabase:watch
```

The watcher polls RetailCRM by `updatedAt` with a small overlap window and uses upsert in Supabase, so repeated cycles update existing orders instead of creating duplicates.

## 7. Run dashboard

```bash
npm run dashboard:dev
```

## 8. Run Telegram watcher

```bash
npm run telegram:watch
```

Optional one-time run:

```bash
npm run telegram:watch -- --once
```

The watcher polls Supabase every `ORDER_POLL_INTERVAL_MINUTES` minutes and sends notifications for orders above the configured threshold.
The Telegram bot reads only from Supabase `orders` and `notification_log`. It does not call RetailCRM directly.
It checks only newly synced orders by `synced_at`, not arbitrary order updates.

## RetailCRM rate limit

RetailCRM allows no more than 10 requests per second from one IP.

The shared `RetailCrmClient` already throttles all requests with a built-in delay of `110ms` between calls, so importer and RetailCRM -> Supabase sync stay below the limit in a single running process.
