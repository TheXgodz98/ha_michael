import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import { createServer } from "http";

const PORT = process.env.PORT || 8099;
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const HA_CORE_API = "http://supervisor/core/api";
const HA_CORE_WS = "ws://supervisor/core/websocket";

const app = express();
app.use(express.static("public"));

// Mareno di Piave (TV), no API key required.
const WEATHER_LAT = 45.8167;
const WEATHER_LON = 12.45;
let weatherCache = { data: null, fetchedAt: 0 };

app.get("/api/weather", async (req, res) => {
  if (weatherCache.data && Date.now() - weatherCache.fetchedAt < 10 * 60 * 1000) {
    return res.json(weatherCache.data);
  }
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe/Rome`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    weatherCache = { data, fetchedAt: Date.now() };
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "weather_unavailable" });
  }
});

app.get("/api/states", async (req, res) => {
  const r = await fetch(`${HA_CORE_API}/states`, {
    headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}` },
  });
  res.status(r.status).json(await r.json());
});

app.post("/api/services/:domain/:service", express.json(), async (req, res) => {
  const { domain, service } = req.params;
  const r = await fetch(`${HA_CORE_API}/services/${domain}/${service}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPERVISOR_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json().catch(() => ({})));
});

const httpServer = createServer(app);

// Bridges the browser to HA's live event stream without ever exposing the
// supervisor token to the client.
const wss = new WebSocketServer({ server: httpServer, path: "/api/live" });
wss.on("connection", (client) => {
  const upstream = new WebSocket(HA_CORE_WS);
  let authed = false;

  upstream.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "auth_required") {
      upstream.send(JSON.stringify({ type: "auth", access_token: SUPERVISOR_TOKEN }));
      return;
    }
    if (msg.type === "auth_ok" && !authed) {
      authed = true;
      upstream.send(JSON.stringify({ id: 1, type: "subscribe_events", event_type: "state_changed" }));
      return;
    }
    client.send(JSON.stringify(msg));
  });

  client.on("close", () => upstream.close());
  upstream.on("close", () => client.close());
});

httpServer.listen(PORT, () => {
  console.log(`dashboard_custom server listening on ${PORT}`);
});
