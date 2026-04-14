# Vercel Environment Variables

When you deploy `apps/dashboard` to Vercel later, add:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If you later deploy the Telegram watcher or sync jobs outside Vercel, also add:

- `RETAIL_CRM_BASE_URL`
- `RETAIL_CRM_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_IDS`
- `TELEGRAM_ORDER_THRESHOLD`
- `ORDER_POLL_INTERVAL_MINUTES`
