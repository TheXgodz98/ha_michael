import ModbusRTU from "modbus-serial";

// ShineMaster Modbus TCP gateway. UNIT_ID is the slave address of the first
// inverter behind it - if readings come back as all zero, try 2, 3...
const HOST = "192.168.1.120";
const PORT = 502;
const UNIT_ID = 1;

let client = null;
let cache = { data: null, fetchedAt: 0 };

async function getClient() {
  if (client && client.isOpen) return client;
  client = new ModbusRTU();
  await client.connectTCP(HOST, { port: PORT });
  client.setID(UNIT_ID);
  client.setTimeout(3000);
  return client;
}

function combine32(hi, lo) {
  return (hi << 16) | lo;
}

// Register layout follows the common Growatt Modbus RTU Protocol v1.20/1.24
// used by most single-phase MIN/TL-X inverters. Not verified against this
// specific inverter model yet - the "raw" array is included in the response
// so offsets can be corrected if values look wrong once live.
export async function readGrowattSnapshot({ skipCache = false } = {}) {
  if (!skipCache && cache.data && Date.now() - cache.fetchedAt < 10 * 1000) {
    return cache.data;
  }

  const c = await getClient();
  const r = await c.readInputRegisters(0, 70);
  const d = r.data;

  const data = {
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
    raw: d,
  };

  cache = { data, fetchedAt: Date.now() };
  return data;
}

export function invalidateGrowattConnection() {
  client = null;
}
