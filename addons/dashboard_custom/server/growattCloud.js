import { createHash } from "crypto";
import { readFileSync } from "fs";

// Confirmed by the user: the account logs in fine on server.growatt.com
// via browser, so that's the only real candidate.
const BASE_CANDIDATES = ["https://server.growatt.com"];

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

let session = null; // { base, cookie, plantId, mixSn }

const BROWSER_HEADERS = (base, cookie) => ({
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/javascript, */*; q=0.01",
  Origin: base,
  Referer: `${base}/login`,
  "X-Requested-With": "XMLHttpRequest",
  ...(cookie ? { Cookie: cookie } : {}),
});

// Fetches the login page first to pick up whatever session cookie the
// server hands out before it will accept a POST /login - some backends
// reject "cookie-less" login attempts with a generic credentials error
// instead of a clearer security message.
async function primeSession(base) {
  const r = await fetch(`${base}/login`, { headers: BROWSER_HEADERS(base) });
  const setCookie = r.headers.getSetCookie?.() ?? [];
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function post(base, path, body, cookie) {
  const r = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...BROWSER_HEADERS(base, cookie),
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

  const attempts = [];
  for (const base of BASE_CANDIDATES) {
    try {
      const primedCookie = await primeSession(base).catch(() => "");
      const { json, setCookie } = await post(
        base,
        "/login",
        {
          account: username,
          userName: username,
          password: hashPassword(password),
          validateCode: "",
          is_local: "true",
        },
        primedCookie
      );
      if (json.result === 1) {
        const cookie =
          [primedCookie, setCookie.map((c) => c.split(";")[0]).join("; ")].filter(Boolean).join("; ");

        const plants = await post(base, "/index/getPlantListTitle", {}, cookie);
        const plantId = plants.json?.[0]?.id ?? plants.json?.[0]?.plantId;
        if (!plantId) throw new Error(`no Growatt plant found on this account (${base})`);

        const devices = await post(base, "/panel/getDevicesByPlantList", { plantId, currPage: 1 }, cookie);
        const mixSn = devices.json?.datas?.[0]?.deviceSn ?? devices.json?.obj?.datas?.[0]?.deviceSn;
        if (!mixSn) throw new Error(`no device found on this Growatt plant (${base})`);

        session = { base, cookie, plantId, mixSn };
        return session;
      }
      attempts.push(`${base}: ${JSON.stringify(json)}`);
    } catch (err) {
      attempts.push(`${base}: ${err}`);
    }
  }

  const masked = username ? `${username[0]}***${username.slice(-1)} (len ${username.length})` : "(empty)";
  throw new Error(
    `growatt cloud login failed on all servers [${attempts.join(" | ")}] - using account ${masked}, password length ${password.length}`
  );
}

async function getSession() {
  if (session) return session;
  return login();
}

export async function readGrowattCloudSnapshot() {
  let { base, cookie, plantId, mixSn } = await getSession();

  let status = await post(base, "/panel/mix/getMIXStatusData", { mixSn }, cookie);
  let total = await post(base, "/panel/mix/getMIXTotalData", { mixSn, plantId }, cookie);

  if (status.json?.result === 0 || total.json?.result === 0) {
    // session likely expired, log in again once
    session = null;
    ({ base, cookie, plantId, mixSn } = await getSession());
    status = await post(base, "/panel/mix/getMIXStatusData", { mixSn }, cookie);
    total = await post(base, "/panel/mix/getMIXTotalData", { mixSn, plantId }, cookie);
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
