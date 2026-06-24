import React from "react";
import { ZONES } from "../zones.js";
import Thermostat from "../Thermostat.jsx";

export default function ClimatePage({ byId }) {
  const cards = ZONES.map((z) => byId.get(z.entity)).filter(Boolean);

  if (cards.length === 0) {
    return <p className="empty-state">Nessuna zona clima trovata.</p>;
  }

  return (
    <div className="climate-grid">
      {ZONES.map((zone) => {
        const entity = byId.get(zone.entity);
        if (!entity) return null;
        return <Thermostat key={zone.entity} entity={entity} name={zone.name} icon={zone.icon} />;
      })}
    </div>
  );
}
