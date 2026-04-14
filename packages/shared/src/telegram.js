class TelegramClient {
  constructor({ botToken, fetchImpl = fetch }) {
    this.botToken = botToken;
    this.fetchImpl = fetchImpl;
  }

  async sendMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    });

    const payload = await response.json();

    if (!response.ok || payload.ok === false) {
      throw new Error(`Telegram sendMessage failed: ${payload.description || response.statusText}`);
    }

    return payload;
  }
}

module.exports = {
  TelegramClient
};
