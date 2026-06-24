import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const CANVAS = { w: 640, h: 300 };

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

function Pipe({ x1, y1, x2, y2, active, hot }) {
  const path = `M${x1} ${y1} L${x2} ${y2}`;
  const len = Math.hypot(x2 - x1, y2 - y1);
  return (
    <>
      <div
        className="pid-pipe"
        style={{
          left: x1,
          top: y1 - 1.5,
          width: len,
          transform: `rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI}deg)`,
          background: hot
            ? "linear-gradient(90deg, rgba(255,122,89,.15), rgba(255,122,89,.4))"
            : "linear-gradient(90deg, rgba(79,209,255,.4), rgba(79,209,255,.15))",
        }}
      />
      {active &&
        [0, 0.4, 0.8].map((d) => (
          <div
            key={d}
            className="pid-orb"
            style={{
              offsetPath: `path('${path}')`,
              background: hot ? "var(--hot)" : "var(--cold)",
              boxShadow: `0 0 7px 2px ${hot ? "var(--hot)" : "var(--cold)"}`,
              animationDelay: `${d * 1.7}s`,
              animationDirection: hot ? "normal" : "reverse",
            }}
          />
        ))}
    </>
  );
}

function Pump({ x, y, active, label }) {
  return (
    <div className="pid-pump" style={{ left: x - 12, top: y - 12 }}>
      <svg viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="var(--surface-strong)" stroke={active ? "var(--accent)" : "var(--border)"} strokeWidth="1.6" />
        <motion.g
          animate={{ rotate: active ? 360 : 0 }}
          transition={{ duration: 1, repeat: active ? Infinity : 0, ease: "linear" }}
          style={{ originX: "12px", originY: "12px" }}
        >
          <path
            d="M12 12 L12 5 M12 12 L17.5 15.5 M12 12 L6.5 15.5"
            stroke={active ? "var(--accent)" : "var(--text-muted)"}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </motion.g>
      </svg>
      {label && <span className="pid-pump-label">{label}</span>}
    </div>
  );
}

function MixValve({ x, y, percent = 0 }) {
  const r = 11;
  const c = 2 * Math.PI * r;
  return (
    <div className="pid-valve" style={{ left: x - 16, top: y - 30 }}>
      <svg viewBox="0 0 32 56" width="32" height="56">
        <line x1="16" y1="0" x2="16" y2="14" stroke="var(--border)" strokeWidth="2" />
        <rect x="9" y="0" width="14" height="9" rx="2" fill="var(--surface-strong)" stroke="var(--border)" strokeWidth="1.2" />
        <circle cx="16" cy="30" r={r} fill="var(--surface-strong)" stroke="var(--border)" strokeWidth="3" />
        <motion.circle
          cx="16"
          cy="30"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - Math.min(100, Math.max(0, percent)) / 100) }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
          transform="rotate(-90 16 30)"
        />
        <text x="16" y="34" textAnchor="middle" className="pid-valve-text">
          {Math.round(percent)}
        </text>
      </svg>
    </div>
  );
}

function Tank({ x, y, w, h, label, value, unit, hot }) {
  return (
    <div className="pid-tank" style={{ left: x, top: y, width: w, height: h }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <rect x="1" y="6" width={w - 2} height={h - 12} rx={w / 2.4} fill="var(--surface-strong)" stroke="var(--border)" strokeWidth="1.6" />
        <ellipse cx={w / 2} cy="6" rx={w / 2 - 1} ry="5" fill="none" stroke="var(--border)" strokeWidth="1.2" />
      </svg>
      <div className="pid-tank-label">{label}</div>
      {value != null && (
        <div className="pid-tank-value" style={{ color: hot ? "var(--hot)" : "var(--cold)" }}>
          {value}
          {unit}
        </div>
      )}
    </div>
  );
}

function Manifold({ x, y, h }) {
  return <div className="pid-manifold" style={{ left: x, top: y, height: h }} />;
}

function TempTag({ x, y, value, hot }) {
  if (value == null || Number.isNaN(value)) return null;
  return (
    <span className="pid-temp" style={{ left: x, top: y, color: hot ? "var(--hot)" : "var(--cold)" }}>
      {value.toFixed(1)}°
    </span>
  );
}

function RadiantFloorIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14">
      <path
        d="M2 4h10a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VentIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14">
      <circle cx="10" cy="10" r="2" fill="currentColor" />
      <path
        d="M10 10c0-3 1.5-5 4-5s2.5 2 1 3.5-4 1-4 1zM10 10c3 0 5 1.5 5 4s-2 2.5-3.5 1-1-4-1-4zM10 10c0 3-1.5 5-4 5s-2.5-2-1-3.5 4-1 4-1zM10 10c-3 0-5-1.5-5-4s2-2.5 3.5-1 1 4 1 4z"
        fill="currentColor"
      />
    </svg>
  );
}

function ZoneNode({ x, y, label, active, kind }) {
  return (
    <div className="pid-zone" style={{ left: x, top: y }}>
      <motion.div
        className="pid-zone-icon"
        style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
        animate={{ boxShadow: active ? "0 0 16px -2px var(--accent)" : "0 0 0px rgba(0,0,0,0)" }}
      >
        {kind === "vmc" ? <VentIcon /> : <RadiantFloorIcon />}
      </motion.div>
      <span>{label}</span>
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
  const giornoActive = isOn(config.giorno.request);
  const notteActive = isOn(config.notte.request);
  const vmcActive = isOn(config.vmc.request);
  const ricircoloActive = isOn(config.ricircolo.request);

  const acsTemp = num(config.pdc.acs);
  const esternaTemp = num(config.pdc.esterna);
  const pdcMandata = num(config.pdc.mandata);
  const pdcRitorno = num(config.pdc.ritorno);
  const ricircoloTemp = num(config.ricircolo.temp);

  return (
    <div className="schematic-wrap" ref={ref}>
      <div
        className="schematic-canvas"
        style={{ width: CANVAS.w, height: CANVAS.h, transform: `scale(${scale})` }}
      >
        {/* PDC unit */}
        <motion.div
          className="pid-pdc"
          animate={{
            boxShadow: pdcActive
              ? ["0 0 0px rgba(255,122,89,0)", "0 0 28px rgba(255,122,89,.5)", "0 0 0px rgba(255,122,89,0)"]
              : "0 0 0px rgba(255,122,89,0)",
          }}
          transition={{ duration: 2.4, repeat: pdcActive ? Infinity : 0 }}
          style={{ left: 14, top: 116 }}
        >
          <span className="pid-pdc-title">PDC</span>
          <span className="pid-pdc-sub">{esternaTemp != null ? `ext ${esternaTemp}°` : ""}</span>
        </motion.div>
        <Pump x={86} y={130} active={pdcActive} />
        <Pump x={86} y={166} active={pdcActive} />

        {/* PDC -> ACS */}
        <Pipe x1={52} y1={116} x2={52} y2={81} active={pdcActive} hot />
        <Pipe x1={52} y1={81} x2={118} y2={81} active={pdcActive} hot />
        <Tank x={118} y={44} w={36} h={74} label="ACS" value={acsTemp} unit="°" hot />

        {/* ACS recirculation loop */}
        <Pipe x1={154} y1={56} x2={196} y2={56} active={ricircoloActive} hot={false} />
        <Pipe x1={196} y1={56} x2={196} y2={92} active={ricircoloActive} hot={false} />
        <Pipe x1={196} y1={92} x2={154} y2={92} active={ricircoloActive} hot />
        <Pump x={176} y={56} active={ricircoloActive} />
        <span className="pid-inline-label" style={{ left: 176, top: 100 }}>
          Ricircolo
        </span>
        <TempTag x={200} y={68} value={ricircoloTemp} hot={false} />

        {/* PDC -> Compensatore */}
        <Pipe x1={88} y1={148} x2={118} y2={148} active={pdcActive} hot />
        <Pipe x1={118} y1={172} x2={88} y2={172} active={pdcActive} hot={false} />
        <Tank x={118} y={140} w={36} h={86} label="Compens." value={null} unit="" hot />
        <TempTag x={92} y={134} value={pdcMandata} hot />
        <TempTag x={92} y={177} value={pdcRitorno} hot={false} />

        {/* Compensatore -> manifold */}
        <Pipe x1={154} y1={150} x2={206} y2={150} active={pdcActive} hot />
        <Pipe x1={206} y1={172} x2={154} y2={172} active={pdcActive} hot={false} />
        <Manifold x={206} y={60} h={210} />

        {/* Branches */}
        {[
          { key: "giorno", y: 70, label: "Giorno", kind: "floor", active: giornoActive, valve: true },
          { key: "notte", y: 160, label: "Notte", kind: "floor", active: notteActive, valve: true },
          { key: "vmc", y: 250, label: "VMC", kind: "vmc", active: vmcActive, valve: false },
        ].map((b) => {
          const branch = config[b.key];
          const percent = b.valve ? num(branch.valve) ?? 0 : null;
          const mandata = num(branch.mandata);
          const ritorno = num(branch.ritorno);
          return (
            <React.Fragment key={b.key}>
              <Pipe x1={214} y1={b.y} x2={580} y2={b.y} active={b.active} hot />
              <Pipe x1={580} y1={b.y + 12} x2={214} y2={b.y + 12} active={b.active} hot={false} />
              <Pump x={250} y={b.y} active={b.active} />
              {b.valve && <MixValve x={340} y={b.y} percent={percent} />}
              <TempTag x={460} y={b.y - 13} value={mandata} hot />
              <TempTag x={460} y={b.y + 17} value={ritorno} hot={false} />
              <ZoneNode x={584} y={b.y - 8} label={b.label} active={b.active} kind={b.kind} />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
