# Contesto progetto: Casa Domotica Beckhoff + Home Assistant

## Obiettivo generale
Rifare l'interfaccia Home Assistant ("dashboard figa") e ottimizzare lo
scambio dati con un PLC Beckhoff (TwinCAT, comunicazione via ADS), che
comanda tapparelle, luci, centrale termica, miscelatrici, contabilizzazione
energia, qualità aria.

## Stato attuale dell'impianto
- PLC Beckhoff con TwinCAT, comunicazione verso HA via **ADS nativo**
  (libreria pyads / integrazione `ads` di HA) per luci e tapparelle.
- Un secondo canale via **MQTT nativo TwinCAT** (il PLC stesso pubblica,
  nessun middleware come Node-RED) per: climatizzazione a zone (6 zone),
  miscelatrici (mix giorno/notte), pompa di calore (PDC), ricircolo,
  contabilizzazione energia (2 contatori trifase), qualità aria (CO2/TVOC/IAQ).
- Tutta la configurazione HA oggi è in YAML puro (niente UI config flow).

## Decisioni strategiche già prese (NON rimetterle in discussione senza motivo)
1. **Canale dati finale: ADS, non MQTT.** Il PLC non è potente, ADS è più
   leggero. In una fase futura (Fase 4) anche il ramo oggi su MQTT
   (clima/energia/PDC/IAQ) verrà migrato su variabili ADS-friendly nel PLC.
   Questo lavoro sul PLC si farà SOLO dopo che l'interfaccia HA sarà
   stabilizzata, per non dover rifare il lavoro due volte.
2. Niente "stop" reale sulle tapparelle: il PLC non ha un comando di stop
   dedicato (si ferma solo ridando lo stesso comando di marcia). Per ora le
   cover hanno solo open/close, niente stop. Non aggiungere logiche di stop
   finte o feedback di posizione finché non viene deciso esplicitamente.
3. Luci: `adsvar` e `adsvar_set` puntano alla STESSA variabile
   (es. `MAIN_LUCE.fb_luce_tavolo.out_luce`), perché il programma MAIN del
   PLC forza quell'output sul fronte di pressione pulsante fisico — non è
   una variabile di stato calcolata internamente al FB che si
   auto-sovrascrive. Scrivere da HA è equivalente a premere il pulsante.
4. La luce "Cabina Armadio" è comandata da un sensore di presenza:
   deve restare SOLA LETTURA (binary_sensor), mai esposta come `light`
   comandabile, altrimenti confligge con la logica automatica del sensore.
5. `stato_tapparella_N` (STRING in GVL_MQTT) non è usato nel programma PLC:
   non va mappato in HA.

## Naming e struttura GVL note finora
- GVL principale tapparelle/luci-comando: `GVL_MQTT` (nome storico, ma oggi
  contiene anche logica usata da ADS, non solo MQTT)
  - `rq_apri_tapparella_N`, `rq_chiudi_tapparella_N` (N = 1..7) — comandi cover
  - `stato_tapparella_N` (STRING, NON USATO — ignorare)
  - `rq_accendi_luce_X` / `stato_luce_X` (BOOL) — presenti ma il comando
    reale per HA passa dal function block, non da questi simboli grezzi
  - Variabili già pronte per probabile migrazione futura ADS del ramo
    "clima": `manuale_pompa_1..4`, `manuale_pdc`,
    `stato_uscita_valv_mix_1`, `stato_uscita_valv_mix_2`,
    `abilitazione_ricircolo`
- Function block luci: `MAIN_LUCE.fb_luce_<nome>` con output `.out_luce`
  (stato E comando, stessa variabile — vedi decisione 3 sopra)
- Lista aree/stanze già stabilita per il raggruppamento HA (device + area):
  Ingresso, Soggiorno (tavolo+divano+credenza), Cucina (cucina+cappa),
  Corridoio, Bagno (bagno+doccia), Bagno 2, Lavanderia, Soffitta, Cameretta,
  Camera (camera+applique sx/dx), Cabina Armadio (sola lettura), Esterno,
  Scale

## Piano di lavoro complessivo (fasi)
- **Fase 1 (FATTA, vedi file incluso)**: hardening YAML ADS per luci e
  tapparelle — unique_id, device, suggested_area, fix comandi mancanti,
  rimozione campi non usati.
- **Fase 2 (da fare)**: estendere struttura ad Aree anche alle entità MQTT
  esistenti (clima, energia, IAQ, PDC) così tutto è raggruppato per stanza.
- **Fase 3 (da fare)**: progettare e costruire la dashboard Lovelace finale
  (stack UI ancora da decidere: card HACS tipo Mushroom/Tile vs altro).
- **Fase 4 (da fare, solo a dashboard stabile)**: migrare il ramo MQTT
  (clima/energia/PDC/IAQ) su variabili ADS native nel PLC, aggiornando GVL
  TwinCAT e configurazione HA in parallelo.

## File già pronto da integrare
Il file `fase1_ads_luci_tapparelle.yaml` (incluso in questa cartella)
contiene la configurazione HA validata per `cover`, `light`, e
`binary_sensor` (18 luci, 7 tapparelle, 1 binary_sensor). È già stato
validato sintatticamente con PyYAML. Va integrato nella struttura repo
sostituendo i blocchi YAML equivalenti.

## Struttura cartelle repo suggerita
```
/
├── README.md
├── homeassistant/
│   ├── configuration.yaml
│   ├── automations.yaml
│   ├── scripts.yaml
│   ├── scenes.yaml
│   ├── packages/
│   │   ├── ads_luci_tapparelle.yaml      <- da fase1_ads_luci_tapparelle.yaml
│   │   ├── mqtt_clima.yaml
│   │   ├── mqtt_energia.yaml
│   │   └── template_sensors.yaml
│   ├── themes/
│   └── dashboards/
│       └── lovelace.yaml
├── twincat/
│   ├── PLC/                               <- progetto TwinCAT (POU, GVL...)
│   └── docs/
│       └── mappatura_variabili.md         <- contratto dati GVL <-> HA
└── docs/
    └── piano_lavoro.md                    <- le fasi sopra, tenute aggiornate
```

Usare i `packages` di Home Assistant (`homeassistant: packages: !include_dir_named packages`)
invece di un unico configuration.yaml monolitico, così ogni dominio
funzionale (luci/tapparelle, clima, energia) sta nel suo file e si gestisce
più facilmente in git con commit puliti e mirati.

## Cosa NON fare
- Non passare a MQTT come canale primario per cover/luci: è stato
  deciso esplicitamente di restare su ADS per leggerezza sul PLC.
- Non inventare comandi di stop tapparelle o feedback di posizione non
  richiesti: il PLC non li espone ad oggi.
- Non esporre la luce cabina armadio come entità comandabile.
