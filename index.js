const express = require("express");
const mqtt = require("mqtt");

const app = express();
app.use(express.json());

// === Настройки ===
const BOT_TOKEN = "8929039458:AAF20YzcnQ8tN5FN_TBjK9PDlSrOxJo-QYE";
const MQTT_BROKER = "mqtt://broker.hivemq.com:1883";
const MQTT_TOPIC = "constructus_andrey_wave_2026";

// === Подключение к MQTT ===
const mqttClient = mqtt.connect(MQTT_BROKER, {
  clientId: "render-bridge-" + Math.random().toString(16).slice(2),
});

mqttClient.on("connect", () => {
  console.log("MQTT подключен к", MQTT_BROKER);
});

mqttClient.on("error", (err) => {
  console.error("MQTT ошибка:", err.message);
});

// === Отправка сообщения в Telegram ===
async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

// === Webhook от Telegram ===
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.message;
    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    console.log("Получено сообщение:", text, "от", chatId);

    if (text === "/wave" || text === "/move") {
      mqttClient.publish(MQTT_TOPIC, "wave");
      await sendTelegramMessage(chatId, "✅ Command sent!");
    } else if (text === "/start") {
      await sendTelegramMessage(
        chatId,
        "Hi! Send /wave to trigger the mechanism."
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Ошибка обработки webhook:", err);
    res.sendStatus(200);
  }
});

// === Проверка что сервис жив ===
app.get("/", (req, res) => {
  res.send("Constructus Wave Bot is running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Сервер запущен на порту " + PORT);
});
