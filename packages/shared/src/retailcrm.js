function buildQuery(params = {}, prefix = "") {
  const pairs = [];

  Object.entries(params).forEach(([key, value]) => {
    const compoundKey = prefix ? `${prefix}[${key}]` : key;

    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        pairs.push([`${compoundKey}[]`, String(item)]);
      });
      return;
    }

    if (typeof value === "object") {
      pairs.push(...buildQuery(value, compoundKey));
      return;
    }

    pairs.push([compoundKey, String(value)]);
  });

  return pairs;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class RetailCrmClient {
  constructor({ baseUrl, apiKey, fetchImpl = fetch }) {
    this.baseUrl = String(baseUrl || "").replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
    this.minIntervalMs = 110;
    this.lastRequestAt = 0;
    this.queue = Promise.resolve();
  }

  buildUrl(pathname, params = {}) {
    const url = new URL(`${this.baseUrl}${pathname}`);
    url.searchParams.set("apiKey", this.apiKey);

    buildQuery(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url;
  }

  async request(pathname, options = {}) {
    return this.schedule(async () => {
      const url = this.buildUrl(pathname, options.query);
      const response = await this.fetchImpl(url, options.fetchOptions || {});
      const text = await response.text();
      let payload;

      try {
        payload = text ? JSON.parse(text) : {};
      } catch (error) {
        throw new Error(`RetailCRM returned non-JSON response: ${text}`);
      }

      if (!response.ok || payload.success === false) {
        const message = payload.errorMsg || payload.errors || response.statusText;
        throw new Error(`RetailCRM request failed: ${message}`);
      }

      return payload;
    });
  }

  async createOrder(order, site = null) {
    return this.schedule(async () => {
      const formData = new URLSearchParams();
      formData.set("order", JSON.stringify(order));

      if (site) {
        formData.set("site", site);
      }

      const url = this.buildUrl("/api/v5/orders/create");
      const response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      });

      const payload = await response.json();

      if (!response.ok || payload.success === false) {
        const details =
          payload.errors || payload.error || payload.errorMsg || response.statusText;
        throw new Error(
          `RetailCRM create order failed: ${JSON.stringify(details)}`
        );
      }

      return payload;
    });
  }

  async listOrders(filters = {}) {
    return this.request("/api/v5/orders", {
      query: filters
    });
  }

  async listSites() {
    return this.request("/api/v5/reference/sites");
  }

  async listOrderTypes() {
    return this.request("/api/v5/reference/order-types");
  }

  async listOrderMethods() {
    return this.request("/api/v5/reference/order-methods");
  }

  async listStatuses() {
    return this.request("/api/v5/reference/statuses");
  }

  async resolveSite(explicitSite = null) {
    if (explicitSite) {
      return explicitSite;
    }

    const response = await this.listSites();
    const sites = response.sites || {};
    const siteCodes = Object.keys(sites);

    if (siteCodes.length === 1) {
      return siteCodes[0];
    }

    const defaultSite = Object.values(sites).find((site) => site.defaultForCrm);

    if (defaultSite?.code) {
      return defaultSite.code;
    }

    throw new Error(
      "RetailCRM site is required. Set RETAIL_CRM_SITE in .env or limit the API key to one site."
    );
  }

  async listAllOrders(filters = {}) {
    const allOrders = [];
    let page = 1;
    let totalPageCount = 1;

    do {
      const response = await this.listOrders({
        ...filters,
        page,
        limit: filters.limit || 100
      });

      const orders = response.orders || [];
      const pagination = response.pagination || {};

      allOrders.push(...orders);
      totalPageCount = pagination.totalPageCount || pagination.totalPageCount || 1;
      page += 1;
    } while (page <= totalPageCount);

    return allOrders;
  }

  async schedule(task) {
    const runTask = async () => {
      const now = Date.now();
      const waitMs = Math.max(0, this.minIntervalMs - (now - this.lastRequestAt));

      if (waitMs > 0) {
        await sleep(waitMs);
      }

      this.lastRequestAt = Date.now();
      return task();
    };

    const scheduledTask = this.queue.then(runTask, runTask);
    this.queue = scheduledTask.then(
      () => undefined,
      () => undefined
    );

    return scheduledTask;
  }
}

module.exports = {
  RetailCrmClient,
  buildQuery
};
