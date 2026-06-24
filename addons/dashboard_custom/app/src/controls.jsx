import React from "react";
import { callService } from "./ha.js";
import Icon from "./Icon.jsx";

export function NumberField({ entity, label }) {
  if (!entity) return null;
  const { min, max, step = 1, unit_of_measurement } = entity.attributes;
  const value = parseFloat(entity.state);

  const set = (next) => {
    const clamped = Math.min(max ?? next, Math.max(min ?? next, next));
    callService("number", "set_value", { entity_id: entity.entity_id, value: clamped });
  };

  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <div className="field-stepper">
        <button onClick={() => set(value - step)} aria-label="Diminuisci">
          <Icon name="minus" size={14} />
        </button>
        <span className="field-value">
          {value}
          {unit_of_measurement ?? ""}
        </span>
        <button onClick={() => set(value + step)} aria-label="Aumenta">
          <Icon name="plus" size={14} />
        </button>
      </div>
    </div>
  );
}

export function SwitchField({ entity, label }) {
  if (!entity) return null;
  const on = entity.state === "on";
  const toggle = () =>
    callService("switch", on ? "turn_off" : "turn_on", { entity_id: entity.entity_id });

  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <button className={`field-switch ${on ? "field-switch-on" : ""}`} onClick={toggle}>
        <span className="field-switch-knob" />
      </button>
    </div>
  );
}

export function SelectField({ entity, label }) {
  if (!entity) return null;
  const options = entity.attributes.options || [];

  const select = (option) =>
    callService("select", "select_option", { entity_id: entity.entity_id, option });

  return (
    <div className="field-row field-row-wrap">
      <span className="field-label">{label}</span>
      <div className="field-options">
        {options.map((opt) => (
          <button
            key={opt}
            className={`field-option ${entity.state === opt ? "field-option-active" : ""}`}
            onClick={() => select(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReadField({ entity, label }) {
  if (!entity) return null;
  const unit = entity.attributes.unit_of_measurement ?? "";
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <span className="field-value">
        {entity.state}
        {unit}
      </span>
    </div>
  );
}
