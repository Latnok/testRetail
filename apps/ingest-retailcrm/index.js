const fs = require("fs");
const path = require("path");
const {
  getConfig,
  parseArgs,
  RetailCrmClient,
  toRetailCrmOrderPayload
} = require("@testretail/shared");

async function main() {
  const args = parseArgs();
  const config = getConfig({
    required: ["RETAIL_CRM_BASE_URL", "RETAIL_CRM_KEY"]
  });

  const filePath = path.resolve(config.repoRoot, args.file || "mock_orders.json");
  const rawData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const orders = Array.isArray(rawData) ? rawData : rawData.orders || [];
  const limit = args.limit ? Number(args.limit) : orders.length;
  const selectedOrders = orders.slice(0, limit);
  const client = new RetailCrmClient({
    baseUrl: config.retailCrmBaseUrl,
    apiKey: config.retailCrmKey
  });
  const site = await client.resolveSite(config.retailCrmSite);
  const [orderTypesResponse, orderMethodsResponse, statusesResponse] =
    await Promise.all([
      client.listOrderTypes(),
      client.listOrderMethods(),
      client.listStatuses()
    ]);
  const availableOrderTypes = orderTypesResponse.orderTypes || {};
  const availableOrderMethods = orderMethodsResponse.orderMethods || {};
  const availableStatuses = statusesResponse.statuses || {};
  const defaultOrderType =
    Object.values(availableOrderTypes).find((item) => item.defaultForApi)?.code ||
    Object.keys(availableOrderTypes)[0] ||
    null;
  const defaultOrderMethod =
    Object.values(availableOrderMethods).find((item) => item.defaultForApi)?.code ||
    Object.keys(availableOrderMethods)[0] ||
    null;
  const defaultStatus = Object.keys(availableStatuses)[0] || null;

  let successCount = 0;
  let errorCount = 0;

  console.log(`Loaded ${selectedOrders.length} orders from ${filePath}`);
  console.log(`Using RetailCRM site: ${site}`);

  for (const [index, order] of selectedOrders.entries()) {
    const payload = toRetailCrmOrderPayload(order);
    const originalOrderType = payload.orderType;
    const originalOrderMethod = payload.orderMethod;
    const originalStatus = payload.status;

    if (payload.orderType && !availableOrderTypes[payload.orderType] && defaultOrderType) {
      payload.orderType = defaultOrderType;
      console.log(
        `[MAP] #${index + 1} orderType "${originalOrderType}" -> "${payload.orderType}"`
      );
    }

    if (
      payload.orderMethod &&
      !availableOrderMethods[payload.orderMethod] &&
      defaultOrderMethod
    ) {
      payload.orderMethod = defaultOrderMethod;
      console.log(
        `[MAP] #${index + 1} orderMethod "${originalOrderMethod}" -> "${payload.orderMethod}"`
      );
    }

    if (payload.status && !availableStatuses[payload.status] && defaultStatus) {
      payload.status = defaultStatus;
      console.log(`[MAP] #${index + 1} status "${originalStatus}" -> "${payload.status}"`);
    }

    if (args["dry-run"]) {
      console.log(`[DRY RUN] #${index + 1}`, JSON.stringify(payload));
      continue;
    }

    try {
      const result = await client.createOrder(payload, site);
      successCount += 1;
      console.log(
        `[OK] #${index + 1} imported as RetailCRM order ${result.id || result.order?.id || "unknown"}`
      );
    } catch (error) {
      errorCount += 1;
      console.error(`[ERROR] #${index + 1}: ${error.message}`);
    }
  }

  console.log(
    `Import finished. Success: ${successCount}. Errors: ${errorCount}. Dry run: ${Boolean(
      args["dry-run"]
    )}.`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
