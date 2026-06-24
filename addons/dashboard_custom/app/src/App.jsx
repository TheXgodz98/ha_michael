import React, { useEffect, useMemo, useState } from "react";
import { fetchStates, callService, subscribeLiveUpdates } from "./ha.js";
import { ROOMS } from "./rooms.js";
import Icon from "./Icon.jsx";

function isLight(e) {
  return e.entity_id.startsWith("light.");
}
function isCover(e) {
  return e.entity_id.startsWith("cover.");
}

function LightTile({ entity }) {
  const on = entity.state === "on";
  const toggle = () =>
    callService("light", on ? "turn_off" : "turn_on", { entity_id: entity.entity_id });

  return (
    <button className={`tile ${on ? "tile-on" : ""}`} onClick={toggle}>
      <Icon name="bulb" className="tile-icon" />
      <span className="tile-label">{entity.attributes.friendly_name}</span>
      <span className="tile-state">{on ? "Acceso" : "Spento"}</span>
    </button>
  );
}

function CoverTile({ entity }) {
  const position = entity.attributes.current_position ?? (entity.state === "open" ? 100 : 0);
  const open = (e) => {
    e.stopPropagation();
    callService("cover", "open_cover", { entity_id: entity.entity_id });
  };
  const close = (e) => {
    e.stopPropagation();
    callService("cover", "close_cover", { entity_id: entity.entity_id });
  };

  return (
    <div className="tile tile-cover">
      <div className="cover-head">
        <Icon name="blinds" className="tile-icon" />
        <span className="tile-label">{entity.attributes.friendly_name}</span>
      </div>
      <div className="cover-track">
        <div className="cover-fill" style={{ width: `${position}%` }} />
      </div>
      <div className="cover-actions">
        <button onClick={open}>
          <Icon name="chevron" size={16} className="icon-up" /> Apri
        </button>
        <button onClick={close}>
          <Icon name="chevron" size={16} className="icon-down" /> Chiudi
        </button>
      </div>
    </div>
  );
}

function RoomCard({ room, entities }) {
  const [expanded, setExpanded] = useState(false);
  const lights = entities.filter(isLight);
  const covers = entities.filter(isCover);
  const lightsOn = lights.filter((l) => l.state === "on").length;
  const active = lightsOn > 0;

  return (
    <div className={`room-card ${active ? "room-active" : ""} ${expanded ? "room-expanded" : ""}`}>
      <button className="room-head" onClick={() => setExpanded((v) => !v)}>
        <div className="room-icon-wrap">
          <Icon name={room.icon} size={22} className="room-icon" />
        </div>
        <div className="room-info">
          <span className="room-name">{room.name}</span>
          <span className="room-sub">
            {lights.length > 0 ? `${lightsOn}/${lights.length} luci accese` : `${covers.length} tapparelle`}
          </span>
        </div>
        <Icon name="chevron" className={`room-chevron ${expanded ? "rotated" : ""}`} />
      </button>
      <div className="room-body">
        <div className="room-grid">
          {lights.map((e) => (
            <LightTile key={e.entity_id} entity={e} />
          ))}
          {covers.map((e) => (
            <CoverTile key={e.entity_id} entity={e} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [entities, setEntities] = useState([]);
  const [now, setNow] = useState(new Date());

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

  const totalLightsOn = entities.filter((e) => isLight(e) && e.state === "on").length;

  return (
    <main>
      <header className="hero">
        <span className="hero-time">
          {now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <h1>Casa</h1>
        <p className="hero-sub">
          {totalLightsOn > 0 ? `${totalLightsOn} luci accese` : "Tutto spento"}
        </p>
      </header>

      <div className="rooms">
        {ROOMS.map((room) => {
          const entities = room.entities.map((id) => byId.get(id)).filter(Boolean);
          if (entities.length === 0) return null;
          return <RoomCard key={room.name} room={room} entities={entities} />;
        })}
      </div>
    </main>
  );
}
