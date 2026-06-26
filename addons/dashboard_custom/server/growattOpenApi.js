import { readFileSync } from "fs";

const BASE = "https://openapi.growatt.com";

function loadToken() {
  try {
    const opts = JSON.parse(readFileSync("/data/options.json", "utf-8"));
    return (opts.growatt_api_token || "").trim();
  } catch {
    return "";
  }
}

async function apiGet(path, params = {}) {
  const token = loadToken();
  if (!token) throw new Error("growatt OpenAPI token not configured");

  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const r = await fetch(url, { headers: { token } });
  const json = await r.json().catch(() => ({}));
  if (json.error_code && json.error_code !== 0) {
    throw new Error(`growatt OpenAPI error on ${path}: ${JSON.stringify(json)}`);
  }
  return json.data ?? json;
}

let discovered = null; // { plantId, deviceSn }

async function discover() {
  if (discovered) return discovered;

  const plants = await apiGet("/v1/plant/list");
  const plantId = plants?.plants?.[0]?.plant_id ?? plants?.[0]?.plant_id;
  if (!plantId) throw new Error("no plant found via Growatt OpenAPI");

  const devices = await apiGet("/v1/device/list", { plant_id: plantId });
  const deviceSn = devices?.devices?.[0]?.device_sn ?? devices?.[0]?.device_sn;
  if (!deviceSn) throw new Error("no device found via Growatt OpenAPI");

  discovered = { plantId, deviceSn };
  return discovered;
}

// Official Growatt OpenAPI v1 (token-based) - endpoint paths and field names
// below follow the public documentation for "mix" (SPH hybrid) devices, but
// haven't been exercised against this account yet. Raw payloads are kept in
// the response for calibration.
export async function readGrowattOpenApiSnapshot() {
  const { plantId, deviceSn } = await discover();

  const [status, total] = await Promise.all([
    apiGet("/v1/device/mix/mix_last_data", { device_sn: deviceSn }),
    apiGet("/v1/device/mix/mix_total_data", { device_sn: deviceSn, plant_id: plantId }),
  ]);

  return {
    source: "openapi",
    deviceSn,
    pvPowerW: Number(status.ppv ?? status.pPv ?? 0) * 1000,
    pv1VoltageV: Number(status.vpv1 ?? status.v_pv1 ?? 0),
    pv1CurrentA: Number(status.ipv1 ?? status.i_pv1 ?? 0),
    pv2VoltageV: Number(status.vpv2 ?? status.v_pv2 ?? 0),
    pv2CurrentA: Number(status.ipv2 ?? status.i_pv2 ?? 0),
    outputPowerW: Number(status.pac_to_user ?? status.pactouser ?? 0) * 1000,
    energyTodayKWh: Number(total.eac_today ?? total.eacToday ?? 0),
    energyTotalKWh: Number(total.eac_total ?? total.eacTotal ?? 0),
    storage: {
      socPercent: Number(status.soc ?? status.SOC ?? 0),
      batteryDischargeW: Number(status.pdischarge1 ?? 0) * 1000,
      batteryChargeW: Number(status.pcharge1 ?? 0) * 1000,
      loadConsumptionW: Number(status.plocal_load ?? status.pLocalLoad ?? 0) * 1000,
      gridExportW: Number(status.pac_to_grid ?? status.pactogrid ?? 0) * 1000,
      gridImportW: Number(status.pac_to_user ?? status.pactouser ?? 0) * 1000,
    },
    rawStatus: status,
    rawTotal: total,
  };
}

export function invalidateGrowattOpenApiSession() {
  discovered = null;
}
