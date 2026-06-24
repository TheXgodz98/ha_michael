import React from "react";

function pts(arr) {
  return arr.map((p) => p.join(",")).join(" ");
}

function extrudeRect(x, y, w, h, dx, dy) {
  return {
    front: pts([
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ]),
    top: pts([
      [x, y],
      [x + w, y],
      [x + w + dx, y + dy],
      [x + dx, y + dy],
    ]),
    side: pts([
      [x + w, y],
      [x + w, y + h],
      [x + w + dx, y + h + dy],
      [x + w + dx, y + dy],
    ]),
  };
}

const SKY = {
  night: ["#0a1330", "#1c2750"],
  clear: ["#5bb6e8", "#bfe6f7"],
  cloud: ["#7c8fa3", "#c2cdd6"],
  rain: ["#4d5868", "#8a96a3"],
  snow: ["#9fb7c9", "#dfeaf0"],
  storm: ["#383f50", "#5e6577"],
};

function skyFor(kind, isNight) {
  if (isNight) return SKY.night;
  return SKY[kind] || SKY.clear;
}

export default function HouseIllustration({ weatherIcon, isNight, lightsOn, pdcActive, rainy, snowy }) {
  const [skyTop, skyBottom] = skyFor(weatherIcon, isNight);
  const body = extrudeRect(210, 130, 130, 75, 34, -22);
  const roofApex = [275, 55];
  const roofBaseL = [196, 130];
  const roofBaseR = [354, 130];
  const roofFront = pts([roofApex, roofBaseL, roofBaseR]);
  const roofSide = pts([
    roofBaseR,
    roofApex,
    [roofApex[0] + 34, roofApex[1] - 22],
    [roofBaseR[0] + 34, roofBaseR[1] - 22],
  ]);
  const chimney = extrudeRect(320, 75, 14, 35, 34, -22);

  return (
    <svg viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" className="house-svg">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBottom} />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-soft)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--surface-strong)" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="600" height="240" fill="url(#sky)" />

      {!isNight && weatherIcon === "clear" && <circle cx="500" cy="55" r="26" fill="#ffe3a3" opacity="0.9" />}
      {isNight && <circle cx="500" cy="50" r="18" fill="#eef2ff" opacity="0.85" />}

      {rainy &&
        Array.from({ length: 14 }).map((_, i) => (
          <line
            key={i}
            x1={20 + i * 42}
            y1={-10}
            x2={10 + i * 42}
            y2={30}
            stroke="#cfe3f5"
            strokeWidth="2"
            opacity="0.55"
            className="rain-drop"
            style={{ animationDelay: `${(i % 7) * 0.15}s` }}
          />
        ))}

      {snowy &&
        Array.from({ length: 16 }).map((_, i) => (
          <circle
            key={i}
            cx={15 + i * 38}
            cy={-10}
            r="2.4"
            fill="#ffffff"
            opacity="0.8"
            className="snow-dot"
            style={{ animationDelay: `${(i % 8) * 0.3}s` }}
          />
        ))}

      <polygon points={pts([[0, 195], [600, 195], [600, 240], [0, 240]])} fill="url(#ground)" />
      <polygon points={pts([[0, 195], [600, 195], [566, 175], [-34, 175]])} fill="var(--surface-strong)" opacity="0.7" />

      {[[90, 178], [470, 182]].map(([tx, ty], i) => (
        <g key={i}>
          <rect x={tx} y={ty} width="6" height="18" fill="var(--text-muted)" opacity="0.5" />
          <circle cx={tx + 3} cy={ty - 6} r="14" fill="var(--accent)" opacity="0.35" />
        </g>
      ))}

      <polygon points={roofSide} fill="var(--text-muted)" opacity="0.55" />
      <polygon points={roofFront} fill="var(--text-muted)" opacity="0.75" />

      <polygon points={chimney.side} fill="var(--surface-muted)" opacity="0.8" />
      <polygon points={chimney.front} fill="var(--surface-strong)" />
      {pdcActive &&
        [0, 1, 2].map((i) => (
          <circle key={i} cx="327" cy="70" r="5" fill="#ffffff" opacity="0.5" className="smoke-puff" style={{ animationDelay: `${i * 0.7}s` }} />
        ))}

      <polygon points={body.top} fill="var(--surface-muted)" opacity="0.9" />
      <polygon points={body.side} fill="var(--surface-strong)" />
      <polygon points={body.front} fill="var(--surface-strong)" />

      <rect x="262" y="168" width="20" height="37" rx="2" fill="var(--surface)" stroke="var(--border)" />
      {[[225, 150], [225, 178]].map(([wx, wy], i) => (
        <rect
          key={i}
          x={wx}
          y={wy}
          width="18"
          height="18"
          rx="2"
          fill={lightsOn > 0 ? "var(--accent)" : "var(--surface)"}
          opacity={lightsOn > 0 ? 0.85 : 0.6}
          stroke="var(--border)"
        />
      ))}
      <rect x="305" y="150" width="18" height="18" rx="2" fill={lightsOn > 1 ? "var(--accent)" : "var(--surface)"} opacity={lightsOn > 1 ? 0.85 : 0.6} stroke="var(--border)" />
    </svg>
  );
}
