import ModbusRTU from "modbus-serial";

// ShineMaster Modbus TCP gateway, inverter is a Growatt SPH10000TL3 BH-UP
// (three-phase hybrid with battery).
const HOST = "192.168.1.120";
const PORT = 502;
const CANDIDATE_UNIT_IDS = [1, 2, 3, 4, 5, 100, 101];

let client = null;
let discoveredUnitId = null;
let cache = { data: null, fetchedAt: 0 };

async function connect() {
  if (client && client.isOpen) return client;
  client = new ModbusRTU();
  await client.connectTCP(HOST, { port: PORT });
  client.setTimeout(3000);
  return client;
}

// The slave address of the inverter behind the ShineMaster isn't known yet,
// so probe a handful of common addresses and keep the first one that
// answers with a non-empty register block.
async function resolveUnitId(c) {
  if (discoveredUnitId != null) {
    c.setID(discoveredUnitId);
    return discoveredUnitId;
  }
  for (const id of CANDIDATE_UNIT_IDS) {
    try {
      c.setID(id);
      const r = await c.readInputRegisters(0, 10);
      if (r.data.some((v) => v !== 0)) {
        discoveredUnitId = id;
        return id;
      }
    } catch {
      // try next candidate
    }
  }
  throw new Error("no responding Modbus unit id found among candidates");
}

function combine32(hi, lo) {
  return (hi << 16) | lo;
}

// Base PV/inverter block: consistent across most Growatt models including
// SPH hybrids (Growatt Modbus RTU Protocol v1.20/1.24).
function parseBaseBlock(d) {
  return {
    status: d[0],
    pvPowerW: combine32(d[1], d[2]) / 10,
    pv1VoltageV: d[3] / 10,
    pv1CurrentA: d[4] / 10,
    pv1PowerW: combine32(d[5], d[6]) / 10,
    pv2VoltageV: d[7] / 10,
    pv2CurrentA: d[8] / 10,
    pv2PowerW: combine32(d[9], d[10]) / 10,
    outputPowerW: combine32(d[35], d[36]) / 10,
    gridFreqHz: d[37] / 100,
    energyTodayKWh: combine32(d[53], d[54]) / 10,
    energyTotalKWh: combine32(d[55], d[56]) / 10,
  };
}

// Storage/battery block for SPH hybrid inverters starts around register
// 1000 (Growatt "Storage" Modbus protocol). Offsets below are the commonly
// documented ones but UNVERIFIED against this specific unit - sanity-check
// against the raw arrays once live (SOC should read 0-100, powers should be
// plausible Watt values).
function parseStorageBlock(s) {
  const at = (reg) => s[reg - 1000];
  return {
    socPercent: at(1009),
    batteryDischargeW: combine32(at(1011), at(1012)) / 10,
    batteryChargeW: combine32(at(1013), at(1014)) / 10,
    loadConsumptionW: combine32(at(1021), at(1022)) / 10,
    gridExportW: combine32(at(1029), at(1030)) / 10,
    gridImportW: combine32(at(1031), at(1032)) / 10,
  };
}

export async function readGrowattSnapshot({ skipCache = false } = {}) {
  if (!skipCache && cache.data && Date.now() - cache.fetchedAt < 10 * 1000) {
    return cache.data;
  }

  const c = await connect();
  const unitId = await resolveUnitId(c);

  const base = await c.readInputRegisters(0, 70);
  let storage = null;
  try {
    storage = await c.readInputRegisters(1000, 50);
  } catch {
    storage = null;
  }

  const data = {
    unitId,
    ...parseBaseBlock(base.data),
    storage: storage ? parseStorageBlock(storage.data) : null,
    raw: base.data,
    rawStorage: storage ? storage.data : null,
  };

  cache = { data, fetchedAt: Date.now() };
  return data;
}

export function invalidateGrowattConnection() {
  client = null;
  discoveredUnitId = null;
}
