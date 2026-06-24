import React from "react";
import Icon from "./Icon.jsx";

const BRANCHES = [
  { key: "giorno", y: 40, label: "Giorno", hasValve: true },
  { key: "notte", y: 112, label: "Notte", hasValve: true },
  { key: "vmc", y: 184, label: "VMC", hasValve: false },
];

function Pipe({ x1, x2, y, active, hot, reverse }) {
  const animClass = active ? (reverse ? "pipe-flow-rev" : "pipe-flow-fwd") : "";
  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke={hot ? "var(--hot)" : "var(--cold)"}
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="6 6"
      opacity={active ? 1 : 0.3}
      className={animClass}
    />
  );
}

function ValveDial({ x, y, percent = 0 }) {
  const r = 13;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="var(--surface)" stroke="var(--surface-muted)" strokeWidth="4" />
      <circle
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90)"
        className="valve-arc"
      />
      <text textAnchor="middle" dominantBaseline="central" className="schematic-valve-text">
        {Math.round(percent)}
      </text>
    </g>
  );
}

export default function HeatingSchematic({ byId, config }) {
  const num = (id) => {
    const e = byId.get(id);
    return e ? parseFloat(e.state) : null;
  };
  const isOn = (id) => byId.get(id)?.state === "on";

  const pdcActive = isOn(config.pdc.request);
  const ricircoloActive = isOn(config.ricircolo.request);

  return (
    <div className="schematic-wrap">
      <svg viewBox="0 0 340 230" className="schematic-svg">
        <line x1="118" y1="20" x2="118" y2="200" stroke="var(--surface-muted)" strokeWidth="3" />

        <g>
          <rect
            x="18"
            y="90"
            width="74"
            height="60"
            rx="14"
            fill="var(--surface)"
            stroke={pdcActive ? "var(--hot)" : "var(--surface-muted)"}
            strokeWidth="2"
          />
          <g
            transform="translate(55 120)"
            className={pdcActive ? "pdc-fan-spin" : ""}
            style={{ color: pdcActive ? "var(--hot)" : "var(--text-muted)" }}
          >
            <Icon name="fan" size={28} />
          </g>
          <text x="55" y="160" textAnchor="middle" className="schematic-label">
            PDC
          </text>
        </g>

        <line x1="92" y1="120" x2="118" y2="120" stroke="var(--surface-muted)" strokeWidth="3" />

        {BRANCHES.map((b) => {
          const branch = config[b.key];
          const active = isOn(branch.request);
          const valvePercent = b.hasValve ? num(branch.valve) ?? 0 : null;
          return (
            <g key={b.key}>
              <Pipe x1={118} x2={300} y={b.y + 4} active={active} hot reverse={false} />
              <Pipe x1={118} x2={300} y={b.y + 14} active={active} hot={false} reverse />
              {b.hasValve && <ValveDial x={205} y={b.y + 9} percent={valvePercent} />}
              <g transform={`translate(300 ${b.y + 9})`}>
                <circle
                  r="15"
                  fill={active ? "var(--accent-soft)" : "var(--surface-muted)"}
                  stroke={active ? "var(--accent)" : "transparent"}
                  strokeWidth="1.5"
                />
              </g>
              <text x="318" y={b.y + 13} className="schematic-label">
                {b.label}
              </text>
            </g>
          );
        })}

        <g>
          <path
            d="M30 150 q-22 0 -22 24 q0 24 22 24"
            fill="none"
            stroke="var(--cold)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="6 6"
            opacity={ricircoloActive ? 1 : 0.3}
            className={ricircoloActive ? "pipe-flow-fwd" : ""}
          />
          <text x="6" y="202" className="schematic-label schematic-label-small">
            Ricirc.
          </text>
        </g>
      </svg>
    </div>
  );
}
