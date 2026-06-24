# Dashboard Custom

Add-on custom per Home Assistant OS: webapp di controllo casa (React) con
un piccolo backend Node che fa da proxy verso le API di HA, così il token
non arriva mai al browser e l'add-on resta del tutto indipendente dal ciclo
di aggiornamento di HAOS/Supervisor (lo aggiorni solo tu, quando vuoi).

## Installazione su Home Assistant OS

1. Impostazioni → Add-on → Add-on store → menu (⋮) → Repository.
2. Aggiungi l'URL di questo repository Git (`https://github.com/TheXgodz98/ha_michael`).
3. Installa l'add-on "Dashboard Custom" che compare nella lista.
4. Avvialo: comparirà nella sidebar di HA grazie a Ingress.

## Sviluppo locale

```
cd app && npm install && npm run dev      # frontend con hot reload
cd server && npm install && node index.js # backend (richiede SUPERVISOR_TOKEN)
```

## Struttura

- `app/` — frontend React (Vite)
- `server/` — backend Express + proxy WebSocket verso HA Core
- `config.yaml`, `Dockerfile`, `run.sh` — definizione add-on per il Supervisor
