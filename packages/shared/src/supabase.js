const { createClient } = require("@supabase/supabase-js");

function createSupabaseAdminClient({ url, serviceRoleKey }) {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function upsertOrders(client, orders) {
  if (!orders.length) {
    return;
  }

  const { error } = await client
    .from("orders")
    .upsert(orders, { onConflict: "retailcrm_order_id" });

  if (error) {
    throw error;
  }
}

async function replaceOrderItems(client, retailcrmOrderId, items) {
  const { error: deleteError } = await client
    .from("order_items")
    .delete()
    .eq("retailcrm_order_id", retailcrmOrderId);

  if (deleteError) {
    throw deleteError;
  }

  if (!items.length) {
    return;
  }

  const { error: insertError } = await client.from("order_items").insert(items);

  if (insertError) {
    throw insertError;
  }
}

async function hasNotification(client, retailcrmOrderId, chatId, thresholdValue) {
  const { data, error } = await client
    .from("notification_log")
    .select("id")
    .eq("retailcrm_order_id", retailcrmOrderId)
    .eq("chat_id", chatId)
    .eq("threshold_value", thresholdValue)
    .eq("message_status", "sent")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function logNotification(client, payload) {
  const { error } = await client
    .from("notification_log")
    .upsert(payload, {
      onConflict: "retailcrm_order_id,chat_id,threshold_value"
    });

  if (error) {
    throw error;
  }
}

async function listRecentOrdersForNotifications(client, fromIso, thresholdValue) {
  let query = client
    .from("orders")
    .select(
      "retailcrm_order_id, retailcrm_order_number, created_at, updated_at, synced_at, status, total_amount, first_name, last_name, phone, city"
    )
    .order("synced_at", { ascending: false });

  if (fromIso) {
    query = query.gte("synced_at", fromIso);
  }

  if (Number.isFinite(Number(thresholdValue))) {
    query = query.gt("total_amount", Number(thresholdValue));
  }

  const { data, error } = await query.limit(200);

  if (error) {
    throw error;
  }

  return data || [];
}

module.exports = {
  createSupabaseAdminClient,
  upsertOrders,
  replaceOrderItems,
  hasNotification,
  logNotification,
  listRecentOrdersForNotifications
};
