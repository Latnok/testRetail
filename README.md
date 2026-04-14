# TestRetail Monorepo

Node.js monorepo with four parts:

- `apps/ingest-retailcrm` - import `mock_orders.json` into RetailCRM
- `apps/sync-retailcrm-supabase` - sync orders from RetailCRM to Supabase
- `apps/dashboard` - Next.js dashboard with Material UI
- `apps/telegram-bot` - Telegram notifications for large orders
- `packages/shared` - shared config, API clients, and data mappers

## Quick start

1. Fill the root `.env` using `.env.example`.
If your RetailCRM account uses multiple stores, set `RETAIL_CRM_SITE`.

2. Install dependencies:

```bash
npm install
```

3. Validate configuration:

```bash
npm run check:env
```

4. Import mock orders to RetailCRM:

```bash
npm run import:retailcrm
```

5. Sync orders from RetailCRM to Supabase:

```bash
npm run sync:supabase -- --from=2026-04-01 --to=2026-04-14
```

6. Run automatic Supabase sync every `10-50` minutes:

```bash
npm run sync:supabase:watch
```

7. Start the dashboard:

```bash
npm run dashboard:dev
```

8. Start the Telegram watcher:

```bash
npm run telegram:watch
```

The Telegram watcher reads only newly synced orders from Supabase by `synced_at`.

## Recommended `.env` values

```env
RETAIL_CRM_SITE=latnok
TELEGRAM_CHAT_IDS=130884732
TELEGRAM_ORDER_THRESHOLD=50000
SUPABASE_SYNC_INTERVAL_MINUTES=10
ORDER_POLL_INTERVAL_MINUTES=5
```

More details are in [docs/setup.md](/C:/Users/latno/Documents/testRetail/docs/setup.md).
