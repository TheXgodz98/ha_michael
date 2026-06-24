import React, { useEffect, useMemo, useState } from "react";
import { fetchStates, subscribeLiveUpdates } from "./ha.js";
import Icon from "./Icon.jsx";
import RoomsPage from "./pages/RoomsPage.jsx";
import ClimatePage from "./pages/ClimatePage.jsx";
import HeatingPage from "./pages/HeatingPage.jsx";

const PAGES = [
  { id: "rooms", label: "Stanze", icon: "home" },
  { id: "climate", label: "Clima", icon: "thermometer" },
  { id: "heating", label: "Centrale", icon: "loop" },
];

export default function App() {
  const [entities, setEntities] = useState([]);
  const [now, setNow] = useState(new Date());
  const [page, setPage] = useState("rooms");

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

  return (
    <div className="app-shell">
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
          <p className="hero-sub">
            {page === "rooms"
              ? totalLightsOn > 0
                ? `${totalLightsOn} luci accese`
                : "Tutto spento"
              : page === "climate"
              ? "Stato impianto climatico"
              : "PDC, mix giorno/notte, VMC, ricircolo"}
          </p>
        </header>

        {page === "rooms" && <RoomsPage byId={byId} />}
        {page === "climate" && <ClimatePage byId={byId} />}
        {page === "heating" && <HeatingPage byId={byId} />}
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
          </button>
        ))}
      </nav>
    </div>
  );
}
