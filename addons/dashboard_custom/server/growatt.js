import ModbusRTU from "modbus-serial";
import { readFileSync } from "fs";

const UNIT_ID_CANDIDATES = [1, 2, 3, 4, 5, 100, 101];

function loadOptions() {
  try {
    const raw = readFileSync("/data/options.json", "utf-8");
    const opts = JSON.parse(raw);
    return {
      hosts: opts.growatt_hosts?.length ? opts.growatt_hosts : ["192.168.1.3", "192.168.1.8"],
      port: opts.growatt_port || 502,
    };
  } catch {
    return { hosts: ["192.168.1.3", "192.168.1.8"], port: 502 };
  }
}

let client = null;
let working = null; // { host, port, unitId }
let cache = { data: null, fetchedAt: 0 };

async function tryConnect(host, port) {
  const c = new ModbusRTU();
  await c.connectTCP(host, { port });
  c.setTimeout(3000);
  return c;
}

// Neither the ShineMaster's LAN IP nor the inverter's Modbus slave address
// were known with certainty, so probe every host/unit-id combination and
// keep the first one that answers with a non-empty register block.
async function resolveConnection() {
  if (working && client && client.isOpen) {
    client.setID(working.unitId);
    return client;
  }

  const { hosts, port } = loadOptions();
  for (const host of hosts) {
    let c;
    try {
      c = await tryConnect(host, port);
    } catch {
      continue;
    }
    for (const unitId of UNIT_ID_CANDIDATES) {
      try {
        c.setID(unitId);
        const r = await c.readInputRegisters(0, 10);
        if (r.data.some((v) => v !== 0)) {
          working = { host, port, unitId };
          client = c;
          return c;
        }
      } catch {
        // try next unit id
      }
    }
    c.close?.();
  }
  throw new Error(
    `no Growatt inverter responded on hosts [${hosts.join(", ")}] port ${port}`
  );
}

function combine32(hi, lo) {
  return (hi << 16) | lo;
}

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

// Storage/battery block for SPH hybrid inverters, offsets documented
// commonly for the Growatt "Storage" Modbus protocol but unverified against
// this specific SPH10000TL3 unit - sanity-check against raw values once live.
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

  const c = await resolveConnection();

  const base = await c.readInputRegisters(0, 70);
  let storage = null;
  try {
    storage = await c.readInputRegisters(1000, 50);
  } catch {
    storage = null;
  }

  const data = {
    host: working.host,
    unitId: working.unitId,
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
  working = null;
}
