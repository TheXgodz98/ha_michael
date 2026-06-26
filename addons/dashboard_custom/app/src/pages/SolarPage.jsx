import React, { useEffect, useState } from "react";
import { fetchGrowatt } from "../ha.js";
import Icon from "../Icon.jsx";

export default function SolarPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = () =>
      fetchGrowatt()
        .then((d) => {
          setData(d);
          setError(false);
        })
        .catch(() => setError(true));
    load();
    const t = setInterval(load, 15 * 1000);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return <p className="empty-state">Inverter non raggiungibile (ShineMaster 192.168.1.120)</p>;
  }
  if (!data) {
    return <p className="empty-state">Lettura dati in corso…</p>;
  }

  const producing = data.pvPowerW > 20;
  const battery = data.storage;
  const batteryFlowingOut = battery && battery.batteryDischargeW > 20;
  const batteryFlowingIn = battery && battery.batteryChargeW > 20;
  const exportingToGrid = battery && battery.gridExportW > 20;
  const importingFromGrid = battery && battery.gridImportW > 20;

  return (
    <div className="solar-page">
      <div className="solar-hero">
        <span className="solar-hero-label">Produzione attuale</span>
        <span className="solar-hero-value">{(data.pvPowerW / 1000).toFixed(2)} kW</span>

        <div className="solar-flow">
          <div className="solar-flow-node">
            <Icon name="sun" size={22} />
          </div>
          <Icon name="arrowRight" size={18} className={producing ? "solar-flow-arrow-active" : "solar-flow-arrow"} />
          <div className="solar-flow-node">
            <Icon name="panel" size={22} />
          </div>
          <Icon name="arrowRight" size={18} className={producing ? "solar-flow-arrow-active" : "solar-flow-arrow"} />
          <div className="solar-flow-node">
            <Icon name="home" size={22} />
          </div>
          {battery && (
            <>
              <Icon
                name="arrowRight"
                size={18}
                className={exportingToGrid || importingFromGrid ? "solar-flow-arrow-active" : "solar-flow-arrow"}
              />
              <div className="solar-flow-node">
                <Icon name="grid" size={22} />
              </div>
            </>
          )}
        </div>
      </div>

      {battery && (
        <div className="solar-hero solar-battery">
          <div className="solar-battery-head">
            <Icon name="battery" size={20} />
            <span>Batteria</span>
          </div>
          <span className="solar-hero-value solar-battery-value">{Math.round(battery.socPercent ?? 0)}%</span>
          <span className="solar-flow-arrow" style={{ fontSize: "0.78rem" }}>
            {batteryFlowingOut
              ? `In scarica · ${(battery.batteryDischargeW / 1000).toFixed(2)} kW`
              : batteryFlowingIn
              ? `In carica · ${(battery.batteryChargeW / 1000).toFixed(2)} kW`
              : "In riposo"}
          </span>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="bolt" size={18} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{(data.energyTodayKWh ?? 0).toFixed(1)} kWh</span>
            <span className="stat-label">Energia oggi</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="bolt" size={18} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{(data.energyTotalKWh ?? 0).toFixed(0)} kWh</span>
            <span className="stat-label">Energia totale</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="panel" size={18} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{data.pv1VoltageV?.toFixed(1)} V</span>
            <span className="stat-label">Stringa 1</span>
            <span className="stat-sub">{data.pv1CurrentA?.toFixed(1)} A</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="panel" size={18} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{data.pv2VoltageV?.toFixed(1)} V</span>
            <span className="stat-label">Stringa 2</span>
            <span className="stat-sub">{data.pv2CurrentA?.toFixed(1)} A</span>
          </div>
        </div>
        {battery && (
          <>
            <div className="stat-card">
              <div className="stat-icon">
                <Icon name="home" size={18} />
              </div>
              <div className="stat-body">
                <span className="stat-value">{(battery.loadConsumptionW / 1000).toFixed(2)} kW</span>
                <span className="stat-label">Consumo casa</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Icon name="grid" size={18} />
              </div>
              <div className="stat-body">
                <span className="stat-value">
                  {((battery.gridExportW - battery.gridImportW) / 1000).toFixed(2)} kW
                </span>
                <span className="stat-label">{exportingToGrid ? "Verso rete" : "Da rete"}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <p className="solar-note">
        Lettura via Modbus TCP da {data.host} (unit id {data.unitId}, entrambi auto-rilevati) — mappa registri
        SPH hybrid non ancora verificata sul tuo modello reale: controlla che SOC, potenze e tensioni
        abbiano senso. Stato inverter: {data.status}, frequenza rete: {data.gridFreqHz?.toFixed(2)} Hz.
      </p>
    </div>
  );
}
