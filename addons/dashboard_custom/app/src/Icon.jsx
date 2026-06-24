import React from "react";

const PATHS = {
  door: "M6 3h9v18H6z M15 3l3 1v16l-3 1 M9 12h.01",
  sofa: "M4 16v3h16v-3 M4 16a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 M6 9V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3",
  kitchen: "M5 3v8a3 3 0 0 0 3 3v7 M5 3v4 M8 3v4 M16 3v18 M16 3a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3",
  route: "M4 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M20 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M4 17v-5a4 4 0 0 1 4-4h8a4 4 0 0 0 4-4",
  bath: "M3 11h17a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-1a1 1 0 0 1 1-1z M5 11V6a2 2 0 0 1 2-2c1 0 1.5.6 1.8 1.2 M7 21l1-2 M17 21l-1-2",
  laundry: "M4 4h16v16H4z M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M8 6h.01",
  attic: "M3 12 12 4l9 8 M5 11v8h14v-8",
  bed: "M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6 M3 18v2 M21 18v2 M3 13V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M9 9h6",
  moon: "M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z",
  wardrobe: "M5 3h14v18H5z M12 3v18 M8 10v.01 M16 10v.01",
  tree: "M12 3 7 11h3l-4 7h12l-4-7h3z M12 18v3",
  stairs: "M4 20v-4h4v-4h4v-4h4V4h4",
  bulb: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.4.3.5.7.5 1.1v0h6v0c0-.4.1-.8.5-1.1A6 6 0 0 0 12 3z",
  blinds: "M4 4h16 M4 8h16 M4 12h10 M4 16h7",
  chevron: "M6 9l6 6 6-6",
};

export default function Icon({ name, size = 20, className = "" }) {
  const d = PATHS[name] || PATHS.bulb;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
