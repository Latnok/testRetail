const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function findRepoRoot(startDir = process.cwd()) {
  let currentDir = startDir;

  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, "package.json");
    const envPath = path.join(currentDir, ".env");

    if (fs.existsSync(packageJsonPath) && fs.existsSync(envPath)) {
      return currentDir;
    }

    currentDir = path.dirname(currentDir);
  }

  return startDir;
}

function loadRootEnv(startDir) {
  const repoRoot = findRepoRoot(startDir);
  const envPath = path.join(repoRoot, ".env");

  dotenv.config({ path: envPath });

  return { repoRoot, envPath };
}

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getConfig(options = {}) {
  const { repoRoot, envPath } = loadRootEnv(options.startDir);
  const required = options.required || [];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables in ${envPath}: ${missing.join(", ")}`
    );
  }

  return {
    repoRoot,
    envPath,
    retailCrmBaseUrl: process.env.RETAIL_CRM_BASE_URL,
    retailCrmKey: process.env.RETAIL_CRM_KEY,
    retailCrmSite: process.env.RETAIL_CRM_SITE || null,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatIds: parseCsv(process.env.TELEGRAM_CHAT_IDS),
    telegramOrderThreshold: parseNumber(process.env.TELEGRAM_ORDER_THRESHOLD, 0),
    orderPollIntervalMinutes: parseNumber(
      process.env.ORDER_POLL_INTERVAL_MINUTES,
      5
    ),
    supabaseSyncIntervalMinutes: parseNumber(
      process.env.SUPABASE_SYNC_INTERVAL_MINUTES,
      10
    )
  };
}

module.exports = {
  findRepoRoot,
  loadRootEnv,
  getConfig,
  parseCsv,
  parseNumber
};
