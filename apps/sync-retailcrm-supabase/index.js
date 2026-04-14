const {
  getConfig,
  parseArgs,
  RetailCrmClient,
  createSupabaseAdminClient,
  mapRetailOrderToDb,
  upsertOrders,
  replaceOrderItems
} = require("@testretail/shared");

function toIsoRangeBoundary(dateString, endOfDay = false) {
  if (!dateString) {
    return null;
  }

  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  return `${dateString}${suffix}`;
}

function getPollingWindow(intervalMinutes, overlapMinutes = 2) {
  const now = new Date();
  const from = new Date(
    now.getTime() - (intervalMinutes + overlapMinutes) * 60 * 1000
  );

  return {
    from: from.toISOString(),
    to: now.toISOString()
  };
}

function validateSyncInterval(intervalMinutes) {
  if (intervalMinutes < 10 || intervalMinutes > 50) {
    throw new Error(
      "SUPABASE_SYNC_INTERVAL_MINUTES must be between 10 and 50 minutes."
    );
  }
}

async function syncOrders({ retailClient, supabase, args, filters }) {
  console.log("Fetching orders from RetailCRM...");
  const orders = await retailClient.listAllOrders(filters);
  console.log(`Fetched ${orders.length} order(s) from RetailCRM.`);

  const orderRows = [];
  const itemBatches = [];
  const notificationRows = [];

  for (const order of orders) {
    const { orderRow, itemRows } = mapRetailOrderToDb(order);
    orderRows.push(orderRow);
    itemBatches.push({
      retailcrmOrderId: orderRow.retailcrm_order_id,
      itemRows
    });

    if (args["message-status"]) {
      notificationRows.push({
        retailcrm_order_id: orderRow.retailcrm_order_id,
        chat_id: "supabase-sync",
        threshold_value: 0,
        message_status: String(args["message-status"]),
        notified_at: new Date().toISOString(),
        payload: {
          source: "sync-retailcrm-supabase",
          sync_range: filters.filter
        }
      });
    }
  }

  await upsertOrders(supabase, orderRows);

  for (const batch of itemBatches) {
    await replaceOrderItems(supabase, batch.retailcrmOrderId, batch.itemRows);
  }

  if (notificationRows.length) {
    const { error } = await supabase.from("notification_log").upsert(notificationRows, {
      onConflict: "retailcrm_order_id,chat_id,threshold_value"
    });

    if (error) {
      throw error;
    }
  }

  console.log(
    `Supabase sync finished. Upserted ${orderRows.length} order(s). Notification marks: ${notificationRows.length}.`
  );
}

async function main() {
  const args = parseArgs();
  const config = getConfig({
    required: [
      "RETAIL_CRM_BASE_URL",
      "RETAIL_CRM_KEY",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY"
    ]
  });
  const retailClient = new RetailCrmClient({
    baseUrl: config.retailCrmBaseUrl,
    apiKey: config.retailCrmKey
  });
  const supabase = createSupabaseAdminClient({
    url: config.supabaseUrl,
    serviceRoleKey: config.supabaseServiceRoleKey
  });

  if (args.watch) {
    validateSyncInterval(config.supabaseSyncIntervalMinutes);

    let isSyncRunning = false;

    const runSync = async () => {
      if (isSyncRunning) {
        console.log("[SYNC] Previous cycle is still running. Skipping this interval.");
        return;
      }

      isSyncRunning = true;

      try {
        const window = getPollingWindow(config.supabaseSyncIntervalMinutes);

        console.log(
          `[SYNC] Polling RetailCRM updates between ${window.from} and ${window.to}`
        );

        await syncOrders({
          retailClient,
          supabase,
          args: {
            ...args,
            "message-status": args["message-status"] || "sent"
          },
          filters: {
            filter: {
              updatedAtFrom: window.from,
              updatedAtTo: window.to
            }
          }
        });
      } finally {
        isSyncRunning = false;
      }
    };

    console.log(
      `Starting automatic Supabase sync every ${config.supabaseSyncIntervalMinutes} minute(s).`
    );

    await runSync();

    setInterval(runSync, config.supabaseSyncIntervalMinutes * 60 * 1000);
    return;
  }

  if (!args.from || !args.to) {
    throw new Error("Use --from=YYYY-MM-DD and --to=YYYY-MM-DD, or pass --watch");
  }

  await syncOrders({
    retailClient,
    supabase,
    args,
    filters: {
      filter: {
        createdAtFrom: toIsoRangeBoundary(args.from),
        createdAtTo: toIsoRangeBoundary(args.to, true)
      }
    }
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
