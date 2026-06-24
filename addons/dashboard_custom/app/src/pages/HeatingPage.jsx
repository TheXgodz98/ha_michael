import React from "react";
import { HEATING } from "../heating.js";
import HeatingSchematic from "../HeatingSchematic.jsx";
import { NumberField, SwitchField, SelectField, ReadField } from "../controls.jsx";

function CircuitPanel({ byId, zone }) {
  return (
    <div className="panel">
      <h3>{zone.label}</h3>
      <div className="panel-section">
        <ReadField entity={byId.get(zone.mandata)} label="Mandata" />
        <ReadField entity={byId.get(zone.ritorno)} label="Ritorno" />
        <ReadField entity={byId.get(zone.valve)} label="Valvola mix" />
      </div>
      <div className="panel-section">
        <NumberField entity={byId.get(zone.setpointInv)} label="Setpoint invernale" />
        <NumberField entity={byId.get(zone.setpointEst)} label="Setpoint estivo" />
      </div>
      <div className="panel-section">
        <NumberField entity={byId.get(zone.prop)} label="Proporzionale" />
        <NumberField entity={byId.get(zone.integ)} label="Integrale" />
        <SwitchField entity={byId.get(zone.manualSwitch)} label="Manuale valvola" />
        <NumberField entity={byId.get(zone.manualValue)} label="Valore manuale" />
      </div>
    </div>
  );
}

export default function HeatingPage({ byId }) {
  return (
    <div className="heating-page">
      <HeatingSchematic byId={byId} config={HEATING} />

      <div className="panel">
        <h3>PDC</h3>
        <div className="panel-section">
          <ReadField entity={byId.get(HEATING.pdc.mandata)} label="Mandata" />
          <ReadField entity={byId.get(HEATING.pdc.ritorno)} label="Ritorno" />
          <ReadField entity={byId.get(HEATING.pdc.acs)} label="ACS" />
          <ReadField entity={byId.get(HEATING.pdc.esterna)} label="Esterna" />
        </div>
        <div className="panel-section">
          <SelectField entity={byId.get(HEATING.pdc.stagione)} label="Stagione" />
        </div>
      </div>

      <div className="panel">
        <h3>VMC</h3>
        <div className="panel-section">
          <ReadField entity={byId.get(HEATING.vmc.mandata)} label="Mandata" />
          <ReadField entity={byId.get(HEATING.vmc.ritorno)} label="Ritorno" />
        </div>
      </div>

      <div className="panels-grid">
        <CircuitPanel byId={byId} zone={HEATING.giorno} />
        <CircuitPanel byId={byId} zone={HEATING.notte} />
      </div>

      <div className="panel">
        <h3>Ricircolo</h3>
        <div className="panel-section">
          <ReadField entity={byId.get(HEATING.ricircolo.temp)} label="Temperatura" />
          <SwitchField entity={byId.get(HEATING.ricircolo.enable)} label="Abilitato" />
          <NumberField entity={byId.get(HEATING.ricircolo.tOn)} label="Tempo ON" />
          <NumberField entity={byId.get(HEATING.ricircolo.tOff)} label="Tempo OFF" />
        </div>
      </div>
    </div>
  );
}
