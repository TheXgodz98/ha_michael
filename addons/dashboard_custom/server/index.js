import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import { createServer } from "http";

const PORT = process.env.PORT || 8099;
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const HA_CORE_API = "http://supervisor/core/api";
const HA_CORE_WS = "ws://supervisor/core/websocket";

const app = express();
app.use(express.static("public"));

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
