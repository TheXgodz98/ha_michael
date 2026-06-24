import React, { useEffect, useState } from "react";
import { fetchStates, callService, subscribeLiveUpdates } from "./ha.js";

function isLight(entity) {
  return entity.entity_id.startsWith("light.");
}

function isCover(entity) {
  return entity.entity_id.startsWith("cover.");
}

function LightRow({ entity }) {
  const on = entity.state === "on";
  const toggle = () =>
    callService("light", on ? "turn_off" : "turn_on", {
      entity_id: entity.entity_id,
    });

  return (
    <div className={`row ${on ? "row-on" : ""}`} onClick={toggle}>
      <span>{entity.attributes.friendly_name}</span>
      <span className="state">{on ? "Acceso" : "Spento"}</span>
    </div>
  );
}

function CoverRow({ entity }) {
  const open = () =>
    callService("cover", "open_cover", { entity_id: entity.entity_id });
  const close = () =>
    callService("cover", "close_cover", { entity_id: entity.entity_id });

  return (
    <div className="row">
      <span>{entity.attributes.friendly_name}</span>
      <div className="actions">
        <button onClick={open}>Apri</button>
        <button onClick={close}>Chiudi</button>
      </div>
    </div>
  );
}

export default function App() {
  const [entities, setEntities] = useState([]);

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
    return () => socket.close();
  }, []);

  const lights = entities.filter(isLight);
  const covers = entities.filter(isCover);

  return (
    <main>
      <h1>Casa</h1>
      <section>
        <h2>Luci</h2>
        {lights.map((e) => (
          <LightRow key={e.entity_id} entity={e} />
        ))}
      </section>
      <section>
        <h2>Tapparelle</h2>
        {covers.map((e) => (
          <CoverRow key={e.entity_id} entity={e} />
        ))}
      </section>
    </main>
  );
}
