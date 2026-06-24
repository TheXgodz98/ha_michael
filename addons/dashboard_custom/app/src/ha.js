export async function fetchStates() {
  const res = await fetch("api/states");
  if (!res.ok) throw new Error(`states request failed: ${res.status}`);
  return res.json();
}

export async function callService(domain, service, data) {
  const res = await fetch(`api/services/${domain}/${service}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`service call failed: ${res.status}`);
  return res.json();
}

export function subscribeLiveUpdates(onEvent) {
  const wsUrl = new URL("api/live", document.baseURI);
  wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(wsUrl);
  socket.onmessage = (msg) => onEvent(JSON.parse(msg.data));
  return socket;
}
