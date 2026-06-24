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
  home: "M4 11.5 12 4l8 7.5 M6 10.5V20h12v-9.5",
  thermometer: "M14 14.76V3.5a2 2 0 0 0-4 0v11.26a4 4 0 1 0 4 0z M12 9h0",
  bolt: "M13 3 4 14h6l-1 7 9-11h-6z",
  droplet: "M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z",
  wind: "M5 8h11a3 3 0 1 0-3-3 M3 12h13a3 3 0 1 1-3 3 M5 16h8a2 2 0 1 1-2 2",
  minus: "M5 12h14",
  plus: "M12 5v14 M5 12h14",
  loop: "M4 4v5h5 M4 9a8 8 0 0 1 14-5l2 2 M20 20v-5h-5 M20 15a8 8 0 0 1-14 5l-2-2",
  fan: "M12 12a2 2 0 1 0 0-4 M12 8c0-3 1.5-5 4-5s3 2 1 4-5 1-5 1z M16 12c3 0 5 1.5 5 4s-2 3-4 1-1-5-1-5z M12 16c0 3-1.5 5-4 5s-3-2-1-4 5-1 5-1z M8 12c-3 0-5-1.5-5-4s2-3 4-1 1 5 1 5z",
  power: "M12 2v8 M5.6 5.6a8 8 0 1 0 12.8 0",
  snow: "M12 2v20 M5 6l14 12 M19 6 5 18 M2 12h20",
  flame: "M12 2c-3 4-7 6-7 11a7 7 0 0 0 14 0c0-2.5-1.5-4-3-5.5.7 2.5-1 4-2 3 .7-2.5-.5-5.5-2-8.5z",
  up: "M18 15 12 9 6 15",
  down: "M6 9l6 6 6-6",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 2v2 M12 20v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M2 12h2 M20 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
  cloud: "M7 18a4.5 4.5 0 0 1-1-8.9A5.5 5.5 0 0 1 16.5 8 4 4 0 0 1 17 16H7",
  rain: "M7 16a4.5 4.5 0 0 1-1-8.9A5.5 5.5 0 0 1 16.5 6 4 4 0 0 1 17 14H7z M8 18v2 M12 18v2 M16 18v2",
  storm: "M7 14a4.5 4.5 0 0 1-1-8.9A5.5 5.5 0 0 1 16.5 4 4 4 0 0 1 17 12H7z M13 14l-3 5h4l-2 4",
  fog: "M5 10h14 M3 14h18 M5 18h14",
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
