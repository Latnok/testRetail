import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env")
});

function buildSeries(orders) {
  const byDay = new Map();

  for (const order of orders) {
    const date = new Date(order.created_at);
    const key = date.toISOString().slice(0, 10);
    const current = byDay.get(key) || { date: key, orders: 0, revenue: 0 };

    current.orders += 1;
    current.revenue += Number(order.total_amount || 0);
    byDay.set(key, current);
  }

  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  let query = supabase
    .from("orders")
    .select(
      "retailcrm_order_id, retailcrm_order_number, created_at, status, total_amount, city, first_name, last_name"
    )
    .order("created_at", { ascending: false });

  if (from) {
    query = query.gte("created_at", `${from}T00:00:00.000Z`);
  }

  if (to) {
    query = query.lte("created_at", `${to}T23:59:59.999Z`);
  }

  const { data, error } = await query.limit(500);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const [syncMeta, telegramMeta] = await Promise.all([
    supabase
      .from("orders")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("notification_log")
      .select("notified_at")
      .eq("message_status", "sent")
      .neq("chat_id", "supabase-sync")
      .order("notified_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (syncMeta.error) {
    return Response.json({ error: syncMeta.error.message }, { status: 500 });
  }

  if (telegramMeta.error) {
    return Response.json({ error: telegramMeta.error.message }, { status: 500 });
  }

  const orders = data || [];
  const revenue = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  return Response.json({
    summary: {
      totalOrders: orders.length,
      revenue,
      avgCheck: orders.length ? revenue / orders.length : 0
    },
    meta: {
      lastSyncedAt: syncMeta.data?.synced_at || null,
      lastTelegramSentAt: telegramMeta.data?.notified_at || null
    },
    series: buildSeries(orders),
    recentOrders: orders.slice(0, 15)
  });
}
