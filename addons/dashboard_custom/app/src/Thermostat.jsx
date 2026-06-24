import React from "react";
import { callService } from "./ha.js";
import Icon from "./Icon.jsx";

const ACTION_COLOR = {
  cooling: "var(--cold)",
  heating: "var(--hot)",
  idle: "var(--text-muted)",
  off: "var(--text-muted)",
};

export default function Thermostat({ entity, name, icon }) {
  const { min_temp, max_temp, target_temp_step = 0.5 } = entity.attributes;
  const current = entity.attributes.current_temperature;
  const target = entity.attributes.temperature;
  const humidity = entity.attributes.current_humidity;
  const action = entity.attributes.hvac_action || "off";
  const color = ACTION_COLOR[action] || ACTION_COLOR.off;

  const ratio = Math.min(1, Math.max(0, (target - min_temp) / (max_temp - min_temp)));
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

  return (
    <div className="thermo-card" style={{ "--zone-color": color }}>
      <div className="thermo-head">
        <Icon name={icon} size={18} />
        <span>{name}</span>
      </div>

      <div className="thermo-dial">
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
          <span className="thermo-action">{action === "off" ? "Spento" : action}</span>
        </div>
      </div>

      <div className="thermo-target">
        <button onClick={() => setTemp(-target_temp_step)} aria-label="Diminuisci">
          <Icon name="minus" size={16} />
        </button>
        <span>{target?.toFixed(1)}°</span>
        <button onClick={() => setTemp(target_temp_step)} aria-label="Aumenta">
          <Icon name="plus" size={16} />
        </button>
      </div>

      {humidity != null && (
        <div className="thermo-humidity">
          <Icon name="droplet" size={14} /> {Math.round(humidity)}%
        </div>
      )}
    </div>
  );
}
