import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fetchStates, subscribeLiveUpdates } from "./ha.js";
import Icon from "./Icon.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import RoomsPage from "./pages/RoomsPage.jsx";
import ClimatePage from "./pages/ClimatePage.jsx";
import HeatingPage from "./pages/HeatingPage.jsx";
import SolarPage from "./pages/SolarPage.jsx";

const PAGES = [
  { id: "overview", label: "Home", icon: "grid" },
  { id: "rooms", label: "Stanze", icon: "home" },
  { id: "climate", label: "Clima", icon: "thermometer" },
  { id: "heating", label: "Centrale", icon: "loop" },
  { id: "solar", label: "Solare", icon: "sun" },
];

const SUBTITLES = {
  overview: "Riepilogo casa e meteo",
  rooms: null,
  climate: "Stato impianto climatico",
  heating: "PDC, mix giorno/notte, VMC, ricircolo",
  solar: "Produzione fotovoltaica (Growatt)",
};

export default function App() {
  const [entities, setEntities] = useState([]);
  const [now, setNow] = useState(new Date());
  const [page, setPage] = useState("overview");

  useEffect(() => {
    fetchStates().then(setEntities).catch(console.error);
    const socket = subscribeLiveUpdates((msg) => {
      if (msg.type === "event" && msg.event?.event_type === "state_changed") {
        const changed = msg.event.data.new_state;
        setEntities((prev) =>
          prev.map((e) => (e.entity_id === changed.entity_id ? changed : e))
        );
      }
    });
    const clock = setInterval(() => setNow(new Date()), 30000);
    return () => {
      socket.close();
      clearInterval(clock);
    };
  }, []);

  const byId = useMemo(() => {
    const map = new Map();
    entities.forEach((e) => map.set(e.entity_id, e));
    return map;
  }, [entities]);

  const totalLightsOn = entities.filter(
    (e) => e.entity_id.startsWith("light.") && e.state === "on"
  ).length;

  const subtitle =
    page === "rooms"
      ? totalLightsOn > 0
        ? `${totalLightsOn} luci accese`
        : "Tutto spento"
      : SUBTITLES[page];

  return (
    <div className="app-shell">
      <div className="ambient-glow" />

      <nav className="side-nav">
        <span className="side-nav-title">Casa</span>
        {PAGES.map((p) => (
          <button
            key={p.id}
            className={`nav-item ${page === p.id ? "nav-item-active" : ""}`}
            onClick={() => setPage(p.id)}
          >
            <Icon name={p.icon} size={20} />
            <span>{p.label}</span>
          </button>
        ))}
      </nav>

      <main>
        <header className="hero">
          <span className="hero-time">
            {now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <h1>{PAGES.find((p) => p.id === page)?.label}</h1>
          <p className="hero-sub">{subtitle}</p>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {page === "overview" && <OverviewPage byId={byId} />}
            {page === "rooms" && <RoomsPage byId={byId} />}
            {page === "climate" && <ClimatePage byId={byId} />}
            {page === "heating" && <HeatingPage byId={byId} />}
            {page === "solar" && <SolarPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="tab-bar">
        {PAGES.map((p) => (
          <button
            key={p.id}
            className={`tab-item ${page === p.id ? "tab-item-active" : ""}`}
            onClick={() => setPage(p.id)}
          >
            <Icon name={p.icon} size={22} />
            <span>{p.label}</span>
            {page === p.id && <motion.span layoutId="tab-dot" className="tab-dot" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
