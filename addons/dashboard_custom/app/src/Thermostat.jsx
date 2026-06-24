import React from "react";
import { callService } from "./ha.js";
import Icon from "./Icon.jsx";

const ACTION_COLOR = {
  cooling: "var(--cold)",
  heating: "var(--hot)",
  idle: "var(--text-muted)",
  off: "var(--text-muted)",
};

const MODE_META = {
  off: { label: "Off", icon: "power" },
  cool: { label: "Freddo", icon: "snow" },
  heat: { label: "Caldo", icon: "flame" },
  auto: { label: "Auto", icon: "loop" },
};

export default function Thermostat({ entity, name, icon, vocEntity }) {
  const { min_temp, max_temp, target_temp_step = 0.5, hvac_modes = [] } = entity.attributes;
  const current = entity.attributes.current_temperature;
  const target = entity.attributes.temperature;
  const humidity = entity.attributes.current_humidity;
  const mode = entity.state;
  const action = entity.attributes.hvac_action || "off";
  const color = ACTION_COLOR[action] || ACTION_COLOR.off;
  const isOff = mode === "off";

  const ratio =
    target != null ? Math.min(1, Math.max(0, (target - min_temp) / (max_temp - min_temp))) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const offset = arcLength * (1 - ratio);

  const setTemp = (delta) => {
    const next = Math.round((target + delta) * 2) / 2;
    callService("climate", "set_temperature", {
      entity_id: entity.entity_id,
      temperature: Math.min(max_temp, Math.max(min_temp, next)),
    });
  };

  const setMode = (next) =>
    callService("climate", "set_hvac_mode", { entity_id: entity.entity_id, hvac_mode: next });

  return (
    <div className="thermo-card" style={{ "--zone-color": color }}>
      <div className="thermo-head">
        <Icon name={icon} size={18} />
        <span>{name}</span>
      </div>

      <div className={`thermo-dial ${isOff ? "thermo-dial-off" : ""}`}>
        <svg viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--surface-muted)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform="rotate(135 70 70)"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(135 70 70)"
            className="thermo-arc"
          />
        </svg>
        <div className="thermo-readout">
          <span className="thermo-current">{current?.toFixed(1)}°</span>
          <span className="thermo-action">{isOff ? "Spento" : action}</span>
        </div>
      </div>

      <div className="thermo-modes">
        {hvac_modes.map((m) => {
          const meta = MODE_META[m] || { label: m, icon: "power" };
          return (
            <button
              key={m}
              className={`thermo-mode ${mode === m ? "thermo-mode-active" : ""}`}
              onClick={() => setMode(m)}
              aria-label={meta.label}
            >
              <Icon name={meta.icon} size={14} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {!isOff && (
        <div className="thermo-target">
          <button onClick={() => setTemp(-target_temp_step)} aria-label="Diminuisci">
            <Icon name="minus" size={16} />
          </button>
          <span>{target?.toFixed(1)}°</span>
          <button onClick={() => setTemp(target_temp_step)} aria-label="Aumenta">
            <Icon name="plus" size={16} />
          </button>
        </div>
      )}

      {(humidity != null || vocEntity) && (
        <div className="thermo-meta">
          {humidity != null && (
            <span className="thermo-meta-item">
              <Icon name="droplet" size={14} /> {Math.round(humidity)}%
            </span>
          )}
          {vocEntity && (
            <span className="thermo-meta-item">
              <Icon name="wind" size={14} /> {vocEntity.state}
              {vocEntity.attributes.unit_of_measurement ?? ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
