import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon.jsx";

const CANVAS = { w: 340, h: 230 };
const BUS_X = 104;
const END_X = 300;

const ROWS = [
  { key: "giorno", y: 29, label: "Giorno", dual: true },
  { key: "notte", y: 89, label: "Notte", dual: true },
  { key: "vmc", y: 149, label: "VMC", dual: true },
  { key: "ricircolo", y: 206, label: "Ricircolo", dual: false },
];

function useScale() {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / CANVAS.w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, scale];
}

function FlowLine({ x1, x2, y, active, hot }) {
  const path = `M${x1} ${y} L${x2} ${y}`;
  return (
    <>
      <div
        className="flow-track"
        style={{
          left: x1,
          top: y - 2,
          width: x2 - x1,
          background: hot
            ? "linear-gradient(90deg, rgba(255,122,89,.12), rgba(255,122,89,.35))"
            : "linear-gradient(90deg, rgba(79,209,255,.35), rgba(79,209,255,.12))",
        }}
      />
      {active &&
        [0, 0.33, 0.66].map((delay) => (
          <div
            key={delay}
            className="flow-orb"
            style={{
              offsetPath: `path('${path}')`,
              offsetRotate: "0deg",
              background: hot ? "var(--hot)" : "var(--cold)",
              boxShadow: `0 0 8px 2px ${hot ? "var(--hot)" : "var(--cold)"}`,
              animationDelay: `${delay * 1.6}s`,
              animationDirection: hot ? "normal" : "reverse",
            }}
          />
        ))}
    </>
  );
}

function ValveDial({ x, y, percent = 0 }) {
  const r = 12;
  const c = 2 * Math.PI * r;
  return (
    <div className="valve-dial" style={{ left: x - 17, top: y - 17 }}>
      <svg viewBox="0 0 34 34" width="34" height="34">
        <circle cx="17" cy="17" r={r} fill="var(--surface)" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <motion.circle
          cx="17"
          cy="17"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - Math.min(100, Math.max(0, percent)) / 100) }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
          transform="rotate(-90 17 17)"
        />
      </svg>
      <span className="valve-dial-text">{Math.round(percent)}</span>
    </div>
  );
}

export default function HeatingSchematic({ byId, config }) {
  const [ref, scale] = useScale();
  const num = (id) => {
    const e = byId.get(id);
    return e ? parseFloat(e.state) : null;
  };
  const isOn = (id) => byId.get(id)?.state === "on";
  const pdcActive = isOn(config.pdc.request);

  return (
    <div className="schematic-wrap" ref={ref}>
      <div
        className="schematic-canvas"
        style={{ width: CANVAS.w, height: CANVAS.h, transform: `scale(${scale})` }}
      >
        <div className="bus-line" style={{ left: BUS_X, top: 18, height: 196 }} />
        <div className="bus-connector" style={{ left: 80, top: 113, width: BUS_X - 80 }} />

        <motion.div
          className="pdc-node"
          animate={{
            boxShadow: pdcActive
              ? [
                  "0 0 0px rgba(255,122,89,0)",
                  "0 0 26px rgba(255,122,89,.55)",
                  "0 0 0px rgba(255,122,89,0)",
                ]
              : "0 0 0px rgba(255,122,89,0)",
          }}
          transition={{ duration: 2.2, repeat: pdcActive ? Infinity : 0, ease: "easeInOut" }}
          style={{ left: 14, top: 86 }}
        >
          <motion.div
            animate={{ rotate: pdcActive ? 360 : 0 }}
            transition={{ duration: 1.4, repeat: pdcActive ? Infinity : 0, ease: "linear" }}
            style={{ color: pdcActive ? "var(--hot)" : "var(--text-muted)" }}
          >
            <Icon name="fan" size={26} />
          </motion.div>
          <span>PDC</span>
        </motion.div>

        {ROWS.map((row) => {
          const branch = config[row.key];
          const active = isOn(branch.request);
          const valvePercent = row.dual && branch.valve ? num(branch.valve) ?? 0 : null;

          return (
            <div key={row.key}>
              {row.dual ? (
                <>
                  <FlowLine x1={BUS_X} x2={END_X} y={row.y} active={active} hot />
                  <FlowLine x1={BUS_X} x2={END_X} y={row.y + 10} active={active} hot={false} />
                </>
              ) : (
                <FlowLine x1={BUS_X} x2={END_X} y={row.y} active={active} hot={false} />
              )}

              {valvePercent !== null && <ValveDial x={195} y={row.y + 5} percent={valvePercent} />}

              <motion.div
                className="end-node"
                animate={{ scale: active ? [1, 1.12, 1] : 1 }}
                transition={{ duration: 1.4, repeat: active ? Infinity : 0, ease: "easeInOut" }}
                style={{ left: END_X - 9, top: row.y - 9 + (row.dual ? 5 : 0), background: active ? "var(--accent-soft)" : "var(--surface-muted)" }}
              />
              <span className="end-label" style={{ left: END_X + 16, top: row.y - 5 + (row.dual ? 5 : 0) }}>
                {row.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
