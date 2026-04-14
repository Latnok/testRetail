function calculateOrderTotal(items = []) {
  return items.reduce((total, item) => {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.initialPrice || item.price || 0);
    return total + quantity * price;
  }, 0);
}

function toRetailCrmOrderPayload(mockOrder) {
  const totalSumm = calculateOrderTotal(mockOrder.items);

  return {
    firstName: mockOrder.firstName,
    lastName: mockOrder.lastName,
    phone: mockOrder.phone,
    email: mockOrder.email,
    orderType: mockOrder.orderType,
    orderMethod: mockOrder.orderMethod,
    status: mockOrder.status,
    items: (mockOrder.items || []).map((item) => ({
      productName: item.productName,
      quantity: Number(item.quantity || 0),
      initialPrice: Number(item.initialPrice || 0)
    })),
    delivery: mockOrder.delivery || {},
    customFields: mockOrder.customFields || {},
    totalSumm
  };
}

function mapRetailOrderToDb(order) {
  const items = order.items || [];
  const orderId = order.id || order.externalId || order.number;
  const totalAmount =
    Number(order.totalSumm || order.summ || order.totalAmount) ||
    calculateOrderTotal(items);

  const createdAt = order.createdAt || order.created || order.created_at || null;
  const updatedAt = order.updatedAt || order.updated || order.updated_at || null;
  const customFields = order.customFields || {};
  const delivery = order.delivery || {};
  const address = delivery.address || {};

  return {
    orderRow: {
      retailcrm_order_id: String(orderId),
      retailcrm_order_number: String(order.number || orderId || ""),
      created_at: createdAt,
      updated_at: updatedAt,
      status: order.status || null,
      order_type: order.orderType || null,
      order_method: order.orderMethod || null,
      total_amount: totalAmount,
      currency: order.currency || "KZT",
      first_name: order.firstName || null,
      last_name: order.lastName || null,
      phone: order.phone || null,
      email: order.email || null,
      city: address.city || null,
      address_text: address.text || null,
      custom_fields: customFields,
      payload: order,
      synced_at: new Date().toISOString()
    },
    itemRows: items.map((item, index) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.initialPrice || item.price || 0);

      return {
        retailcrm_order_id: String(orderId),
        line_index: index,
        product_name: item.productName || item.offer?.displayName || "Unknown product",
        quantity,
        unit_price: unitPrice,
        subtotal: quantity * unitPrice,
        payload: item
      };
    })
  };
}

function buildRetailCrmOrderUrl(baseUrl, orderId) {
  if (!baseUrl || !orderId) {
    return null;
  }

  return `${String(baseUrl).replace(/\/+$/, "")}/orders/${orderId}/edit`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTelegramDateTime(value) {
  if (!value) {
    return "n/a";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatTelegramMessage(order, options = {}) {
  const retailCrmBaseUrl = options.retailCrmBaseUrl || null;
  const isDbRow = Object.prototype.hasOwnProperty.call(order, "retailcrm_order_id");
  const totalAmount = isDbRow
    ? Number(order.total_amount || 0)
    : Number(order.totalSumm || order.summ || order.totalAmount) ||
      calculateOrderTotal(order.items || []);
  const orderNumber = isDbRow
    ? order.retailcrm_order_number || order.retailcrm_order_id
    : order.number || order.id || "n/a";
  const customerName = isDbRow
    ? [order.first_name, order.last_name].filter(Boolean).join(" ")
    : [order.firstName, order.lastName].filter(Boolean).join(" ");
  const phone = isDbRow ? order.phone : order.phone || "n/a";
  const city = isDbRow ? order.city : order.delivery?.address?.city || "n/a";
  const status = isDbRow ? order.status : order.status || "n/a";
  const createdAt = isDbRow ? order.created_at : order.createdAt || "n/a";
  const orderId = isDbRow ? order.retailcrm_order_id : order.id || order.externalId || null;
  const orderUrl = buildRetailCrmOrderUrl(retailCrmBaseUrl, orderId);
  const orderLabel = escapeHtml(`Order #${orderNumber}`);

  return [
    `<b>New large order</b>`,
    `Order: ${orderUrl ? `<a href="${escapeHtml(orderUrl)}">${orderLabel}</a>` : orderLabel}`,
    `Amount: <b>${escapeHtml(totalAmount)}</b>`,
    `Customer: ${escapeHtml(customerName || "n/a")}`,
    `Phone: ${escapeHtml(phone || "n/a")}`,
    `City: ${escapeHtml(city || "n/a")}`,
    `Status: ${escapeHtml(status || "n/a")}`,
    `Created: ${escapeHtml(formatTelegramDateTime(createdAt || "n/a"))}`
  ].join("\n");
}

function formatTelegramBatchMessage(orders, options = {}) {
  const retailCrmBaseUrl = options.retailCrmBaseUrl || null;

  if (!orders.length) {
    return "New large orders: 0";
  }

  if (orders.length === 1) {
    return formatTelegramMessage(orders[0], options);
  }

  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || order.totalAmount || 0),
    0
  );

  const lines = [
    `<b>New large orders: ${orders.length}</b>`,
    `Total amount: <b>${escapeHtml(totalAmount)}</b>`,
    ""
  ];

  for (const order of orders) {
    const orderNumber = order.retailcrm_order_number || order.retailcrm_order_id || "n/a";
    const customerName = [order.first_name, order.last_name]
      .filter(Boolean)
      .join(" ");
    const orderUrl =
      buildRetailCrmOrderUrl(retailCrmBaseUrl, order.retailcrm_order_id) ||
      `#${orderNumber}`;
    const createdAt = formatTelegramDateTime(order.created_at || order.createdAt || "n/a");

    lines.push(
      `${orderUrl ? `<a href="${escapeHtml(orderUrl)}">${escapeHtml(`Order #${orderNumber}`)}</a>` : escapeHtml(`Order #${orderNumber}`)} | ${escapeHtml(Number(order.total_amount || 0))} | ${escapeHtml(customerName || "n/a")} | ${escapeHtml(order.city || "n/a")} | ${escapeHtml(order.status || "n/a")} | ${escapeHtml(createdAt)}`
    );
  }

  return lines.join("\n");
}

module.exports = {
  calculateOrderTotal,
  toRetailCrmOrderPayload,
  mapRetailOrderToDb,
  formatTelegramMessage,
  formatTelegramBatchMessage,
  buildRetailCrmOrderUrl,
  escapeHtml,
  formatTelegramDateTime
};
