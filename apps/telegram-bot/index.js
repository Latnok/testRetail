const {
  getConfig,
  TelegramClient,
  createSupabaseAdminClient,
  hasNotification,
  logNotification,
  listRecentOrdersForNotifications,
  formatTelegramBatchMessage
} = require("@testretail/shared");

function getWindow(minutes, overlapMinutes = 1) {
  const now = new Date();
  const from = new Date(now.getTime() - (minutes + overlapMinutes) * 60 * 1000);
  return {
    from: from.toISOString(),
    to: now.toISOString()
  };
}

async function pollOnce({ telegramClient, supabase, config }) {
  const window = getWindow(config.orderPollIntervalMinutes);

  console.log(
    `[POLL] Checking newly synced Supabase orders between ${window.from} and ${window.to}`
  );

  const orders = await listRecentOrdersForNotifications(
    supabase,
    window.from,
    config.telegramOrderThreshold
  );

  for (const chatId of config.telegramChatIds) {
    const pendingOrders = [];

    for (const order of orders) {
      const retailcrmOrderId = String(order.retailcrm_order_id);
      const alreadySent = await hasNotification(
        supabase,
        retailcrmOrderId,
        chatId,
        config.telegramOrderThreshold
      );

      if (alreadySent) {
        continue;
      }

      pendingOrders.push(order);
    }

    if (!pendingOrders.length) {
      continue;
    }

    try {
      const payload = await telegramClient.sendMessage(
        chatId,
        formatTelegramBatchMessage(pendingOrders, {
          retailCrmBaseUrl: config.retailCrmBaseUrl
        }),
        {
          parseMode: "HTML",
          disableWebPagePreview: true
        }
      );

      const notifiedAt = new Date().toISOString();

      for (const order of pendingOrders) {
        const retailcrmOrderId = String(order.retailcrm_order_id);
        await logNotification(supabase, {
          retailcrm_order_id: retailcrmOrderId,
          chat_id: chatId,
          threshold_value: config.telegramOrderThreshold,
          message_status: "sent",
          notified_at: notifiedAt,
          payload
        });
      }

      console.log(
        `[NOTIFIED] ${pendingOrders.length} order(s) sent to chat ${chatId}: ${pendingOrders
          .map((order) => order.retailcrm_order_id)
          .join(", ")}`
      );
    } catch (error) {
      for (const order of pendingOrders) {
        const retailcrmOrderId = String(order.retailcrm_order_id);

        await logNotification(supabase, {
          retailcrm_order_id: retailcrmOrderId,
          chat_id: chatId,
          threshold_value: config.telegramOrderThreshold,
          message_status: "error",
          notified_at: new Date().toISOString(),
          payload: { error: error.message }
        });
      }

      console.error(
        `[ERROR] failed to notify chat ${chatId} for ${pendingOrders.length} order(s): ${error.message}`
      );
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const config = getConfig({
    required: [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_CHAT_IDS",
      "TELEGRAM_ORDER_THRESHOLD"
    ]
  });

  const telegramClient = new TelegramClient({
    botToken: config.telegramBotToken
  });
  const supabase = createSupabaseAdminClient({
    url: config.supabaseUrl,
    serviceRoleKey: config.supabaseServiceRoleKey
  });

  console.log(
    `Starting Telegram watcher with interval ${config.orderPollIntervalMinutes} minute(s).`
  );

  let isPolling = false;

  const runPoll = async () => {
    if (isPolling) {
      console.log("[POLL] Previous cycle is still running. Skipping this interval.");
      return;
    }

    isPolling = true;

    try {
      await pollOnce({ telegramClient, supabase, config });
    } catch (error) {
      console.error(`[POLL ERROR] ${error.message}`);
    } finally {
      isPolling = false;
    }
  };

  await runPoll();

  if (args.includes("--once")) {
    return;
  }

  setInterval(runPoll, config.orderPollIntervalMinutes * 60 * 1000);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
