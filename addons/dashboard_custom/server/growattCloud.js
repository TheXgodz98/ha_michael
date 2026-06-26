import { createHash } from "crypto";
import { readFileSync } from "fs";

const BASE = "https://server.growatt.com";

function loadCredentials() {
  try {
    const opts = JSON.parse(readFileSync("/data/options.json", "utf-8"));
    return {
      username: (opts.growatt_username || "").trim(),
      password: (opts.growatt_password || "").trim(),
    };
  } catch {
    return { username: "", password: "" };
  }
}

// Growatt's login doesn't use a plain MD5 hash: every hex-pair (byte) whose
// first nibble is "0" gets that nibble replaced with "c" - a long-standing
// quirk inherited from the original Java client, also implemented this way
// in the community growattServer project.
function hashPassword(value) {
  const plain = createHash("md5").update(value).digest("hex");
  let out = "";
  for (let i = 0; i < plain.length; i += 2) {
    out += plain[i] === "0" ? "c" + plain[i + 1] : plain.slice(i, i + 2);
  }
  return out;
}

let session = null; // { cookie, plantId, mixSn }

async function post(path, body, cookie) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: new URLSearchParams(body),
  });
  const setCookie = r.headers.getSetCookie?.() ?? [];
  return { json: await r.json().catch(() => ({})), setCookie, response: r };
}

// Reverse-engineered Growatt cloud API (same one used by the community
// "growattServer" project and HA's core growatt_server integration) - field
// names below are best-effort, verify against the "raw" payloads once a
// real account is connected.
async function login() {
  const { username, password } = loadCredentials();
  if (!username || !password) {
    throw new Error("growatt cloud credentials not configured");
  }
  const { json, setCookie } = await post("/login", {
    account: username,
    password: hashPassword(password),
    validateCode: "",
    is_local: "true",
  });
  if (json.result !== 1) {
    const masked = username ? `${username[0]}***${username.slice(-1)} (len ${username.length})` : "(empty)";
    throw new Error(
      `growatt cloud login failed: ${JSON.stringify(json)} - using account ${masked}, password length ${password.length}`
    );
  }
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");

  const plants = await post("/index/getPlantListTitle", {}, cookie);
  const plantId = plants.json?.[0]?.id ?? plants.json?.[0]?.plantId;
  if (!plantId) throw new Error("no Growatt plant found on this account");

  const devices = await post("/panel/getDevicesByPlantList", { plantId, currPage: 1 }, cookie);
  const mixSn = devices.json?.datas?.[0]?.deviceSn ?? devices.json?.obj?.datas?.[0]?.deviceSn;
  if (!mixSn) throw new Error("no device found on this Growatt plant");

  session = { cookie, plantId, mixSn };
  return session;
}

async function getSession() {
  if (session) return session;
  return login();
}

export async function readGrowattCloudSnapshot() {
  let { cookie, plantId, mixSn } = await getSession();

  let status = await post("/panel/mix/getMIXStatusData", { mixSn }, cookie);
  let total = await post("/panel/mix/getMIXTotalData", { mixSn, plantId }, cookie);

  if (status.json?.result === 0 || total.json?.result === 0) {
    // session likely expired, log in again once
    session = null;
    ({ cookie, plantId, mixSn } = await getSession());
    status = await post("/panel/mix/getMIXStatusData", { mixSn }, cookie);
    total = await post("/panel/mix/getMIXTotalData", { mixSn, plantId }, cookie);
  }

  const s = status.json?.obj ?? status.json ?? {};
  const t = total.json?.obj ?? total.json ?? {};

  return {
    source: "cloud",
    mixSn,
    pvPowerW: Number(s.pPv ?? s.ppv ?? 0) * 1000,
    outputPowerW: Number(s.pacToUser ?? s.pactouser ?? 0) * 1000,
    energyTodayKWh: Number(t.eacToday ?? t.epvToday ?? 0),
    energyTotalKWh: Number(t.eacTotal ?? t.epvTotal ?? 0),
    storage: {
      socPercent: Number(s.SOC ?? s.soc ?? 0),
      batteryDischargeW: Number(s.pdisCharge1 ?? s.pDischarge1 ?? 0) * 1000,
      batteryChargeW: Number(s.pCharge1 ?? s.pcharge1 ?? 0) * 1000,
      loadConsumptionW: Number(s.pLocalLoad ?? s.plocalload ?? 0) * 1000,
      gridExportW: Number(s.pacToGrid ?? s.pactogrid ?? 0) * 1000,
      gridImportW: Number(s.pacToUser ?? s.pactouser ?? 0) * 1000,
    },
    rawStatus: s,
    rawTotal: t,
  };
}

export function invalidateGrowattCloudSession() {
  session = null;
}
