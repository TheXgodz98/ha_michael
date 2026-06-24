import React, { useEffect, useState } from "react";
import { fetchWeather } from "../ha.js";
import { describeWeather } from "../weather.js";
import { ROOMS } from "../rooms.js";
import { ZONES } from "../zones.js";
import { HEATING } from "../heating.js";
import Icon from "../Icon.jsx";
import HouseIllustration from "../HouseIllustration.jsx";

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon name={icon} size={18} />
      </div>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

export default function OverviewPage({ byId }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetchWeather().then(setWeather).catch(console.error);
    const t = setInterval(() => fetchWeather().then(setWeather).catch(console.error), 10 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const allLightIds = ROOMS.flatMap((r) => r.entities.filter((id) => id.startsWith("light.")));
  const lightsOn = allLightIds.filter((id) => byId.get(id)?.state === "on").length;

  const allCoverIds = ROOMS.flatMap((r) => r.entities.filter((id) => id.startsWith("cover.")));

  const zonesActive = ZONES.filter((z) => {
    const e = byId.get(z.entity);
    return e && e.state !== "off";
  }).length;

  const pdcActive = byId.get(HEATING.pdc.request)?.state === "on";
  const esterna = byId.get(HEATING.pdc.esterna);

  const current = weather?.current;
  const today = weather?.daily;
  const desc = current ? describeWeather(current.weather_code) : null;
  const isNight = current ? current.is_day === 0 : false;
  const rainy = desc?.icon === "rain" || desc?.icon === "storm";
  const snowy = desc?.icon === "snow";

  return (
    <div className="overview-page">
      <div className="hero-banner">
        <HouseIllustration
          weatherIcon={desc?.icon ?? "clear"}
          isNight={isNight}
          lightsOn={lightsOn}
          pdcActive={pdcActive}
          rainy={rainy}
          snowy={snowy}
        />
        {current ? (
          <div className="hero-weather">
            <div className="hero-weather-main">
              <Icon name={desc.icon} size={30} />
              <span className="weather-temp">{Math.round(current.temperature_2m)}°</span>
            </div>
            <span className="weather-desc">{desc.label} · Mareno di Piave</span>
            <div className="weather-meta">
              {today && (
                <span>
                  Min {Math.round(today.temperature_2m_min?.[0])}° · Max{" "}
                  {Math.round(today.temperature_2m_max?.[0])}°
                </span>
              )}
              <span>Umidità {Math.round(current.relative_humidity_2m)}%</span>
              <span>Vento {Math.round(current.wind_speed_10m)} km/h</span>
            </div>
          </div>
        ) : (
          <span className="empty-state hero-weather">Meteo non disponibile</span>
        )}
      </div>

      <div className="stats-grid">
        <StatCard icon="bulb" label="Luci accese" value={`${lightsOn}/${allLightIds.length}`} />
        <StatCard icon="blinds" label="Tapparelle" value={allCoverIds.length} sub="comando manuale" />
        <StatCard icon="thermometer" label="Zone clima attive" value={`${zonesActive}/${ZONES.length}`} />
        <StatCard
          icon="loop"
          label="PDC"
          value={pdcActive ? "Attiva" : "Spenta"}
          sub={esterna ? `Esterna ${esterna.state}°` : null}
        />
      </div>
    </div>
  );
}
