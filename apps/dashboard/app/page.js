"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function StatCard({ title, value, hint, icon }) {
  return (
    <Card
      sx={{
        borderRadius: 4,
        minHeight: 170,
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(223,245,239,0.85) 100%)",
        boxShadow: "0 16px 40px rgba(24,33,47,0.08)"
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              backgroundColor: "rgba(0, 105, 92, 0.12)",
              color: "#00695c"
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography sx={{ fontSize: 32, fontWeight: 700 }}>
              {value}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {hint}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return date.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/dashboard?from=${from}&to=${to}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load dashboard data");
        }

        if (active) {
          setData(payload);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [from, to]);

  const summary = data?.summary || {
    totalOrders: 0,
    revenue: 0,
    avgCheck: 0
  };
  const meta = data?.meta || {
    lastSyncedAt: null,
    lastTelegramSentAt: null
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Box>
          <Typography sx={{ fontSize: { xs: 34, md: 48 }, fontWeight: 800 }}>
            Retail Orders Dashboard
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 720 }}>
            Orders from Supabase with a compact Material-inspired view for revenue,
            average check, and daily dynamics.
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: 4,
            p: 2,
            backgroundColor: "rgba(255,255,255,0.88)",
            boxShadow: "0 18px 40px rgba(24,33,47,0.06)"
          }}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="From"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="To"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))"
                }
              }}
            >
              <Box
                sx={{
                  borderRadius: 3,
                  p: 2,
                  backgroundColor: "rgba(0, 105, 92, 0.08)"
                }}
              >
                <Typography color="text.secondary" variant="body2">
                  Last Supabase Sync
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {formatDateTime(meta.lastSyncedAt)}
                </Typography>
              </Box>
              <Box
                sx={{
                  borderRadius: 3,
                  p: 2,
                  backgroundColor: "rgba(24, 33, 47, 0.05)"
                }}
              >
                <Typography color="text.secondary" variant="body2">
                  Last Telegram Message
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {formatDateTime(meta.lastTelegramSentAt)}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))"
            }
          }}
        >
          <Box>
            <StatCard
              title="Orders"
              value={summary.totalOrders}
              hint="Number of orders in the selected period"
              icon={<ShoppingBagRoundedIcon />}
            />
          </Box>
          <Box>
            <StatCard
              title="Revenue"
              value={formatMoney(summary.revenue)}
              hint="Total order amount"
              icon={<PaidRoundedIcon />}
            />
          </Box>
          <Box>
            <StatCard
              title="Average Check"
              value={formatMoney(summary.avgCheck)}
              hint="Average order amount"
              icon={<QueryStatsRoundedIcon />}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 2fr) minmax(320px, 1fr)"
            }
          }}
        >
          <Box>
            <Card
              sx={{
                borderRadius: 4,
                backgroundColor: "rgba(255,255,255,0.92)",
                boxShadow: "0 18px 40px rgba(24,33,47,0.06)"
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Orders by Day
                </Typography>
                {loading ? (
                  <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Typography color="error">{error}</Typography>
                ) : (
                  <Box sx={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <LineChart data={data?.series || []}>
                        <CartesianGrid stroke="#d9e1ea" strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="orders"
                          stroke="#00695c"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card
              sx={{
                borderRadius: 4,
                height: "100%",
                background:
                  "linear-gradient(160deg, rgba(0,105,92,0.96), rgba(38,50,56,0.96))",
                color: "white",
                boxShadow: "0 18px 40px rgba(24,33,47,0.12)"
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Date Filter
                </Typography>
                <Typography sx={{ mt: 2, opacity: 0.8 }}>
                  The dashboard loads up to 500 orders from Supabase and rebuilds the
                  daily series every time you change the period.
                </Typography>
                <Typography sx={{ mt: 4, opacity: 0.8 }}>
                  Current range: {from} to {to}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Card
          sx={{
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,0.92)",
            boxShadow: "0 18px 40px rgba(24,33,47,0.06)"
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Recent Orders
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.recentOrders || []).map((order) => (
                    <TableRow key={order.retailcrm_order_id}>
                      <TableCell>{order.retailcrm_order_number}</TableCell>
                      <TableCell>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString("ru-RU")
                          : "n/a"}
                      </TableCell>
                      <TableCell>
                        {[order.first_name, order.last_name].filter(Boolean).join(" ")}
                      </TableCell>
                      <TableCell>{order.city || "n/a"}</TableCell>
                      <TableCell>{order.status || "n/a"}</TableCell>
                      <TableCell align="right">
                        {formatMoney(order.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
