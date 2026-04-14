const { getConfig } = require("./env");

const required = [
  "RETAIL_CRM_BASE_URL",
  "RETAIL_CRM_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_IDS",
  "TELEGRAM_ORDER_THRESHOLD"
];

function main() {
  const config = getConfig({ required });

  console.log("Environment loaded successfully.");
  console.log(`Root .env: ${config.envPath}`);
  console.log(`Telegram chats: ${config.telegramChatIds.length}`);
  console.log(`RetailCRM site: ${config.retailCrmSite || "auto-detect"}`);
  console.log(
    `Order poll interval: ${config.orderPollIntervalMinutes} minute(s)`
  );
  console.log(
    `Supabase sync interval: ${config.supabaseSyncIntervalMinutes} minute(s)`
  );
}

main();
