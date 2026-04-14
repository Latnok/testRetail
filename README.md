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

More details are in [docs/setup.md](/C:/Users/latno/Documents/testRetail/docs/setup.md).

Коментарии

Основной промпт в режиме планирования
Разработай Node.js проект (modular monorepo) из 4 сервисов.
Общие настройки и ключи — в .env (корень).
API-документация — в /docs.

1. Импорт заказов в RetailCRM
Есть mock_orders.json (≈50 заказов)
Проанализируй структуру → предложи нормализованную схему БД
Оформи документацию по БД
Загрузи заказы в RetailCRM через API
2. Синхронизация RetailCRM → Supabase
Скрипт: выгрузка заказов из RetailCRM за период
Сохранение в Supabase
Допустимо использовать supabase/agent-skills
3. Дашборд
Веб-страница (Material Design)
График заказов + фильтр по дате
Источник данных — Supabase
4. Telegram-бот
Уведомление при новом заказе > заданной суммы
Порог задаётся в .env
Интеграция с Telegram
Требования
Чёткая структура папок
README + инструкции запуска
Типизация (по возможности)
Логирование и обработка ошибок

После обсуждение вопросов. В основном про бд.
Далее в режиме диалога по одной части за раз.
Он спотыкнулся на том чтоб бот забирал данные из retailCRM, какбы не ошибка, но решил что лучше из supabase. Перенаправил его дав точные инструкции. Ну вот в документацию пытался рекомендованые константы запихнуть, ничего критичного там не было, но убрал.

