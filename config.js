/* ==========================================================================
   SERIE Z · CONFIGURAZIONE DEL MERCATO
   --------------------------------------------------------------------------
   Questo è l'UNICO file in cui modificare le date delle finestre.
   Tutto il resto del sito (countdown, calendario, stati, statistiche)
   si aggiorna da solo a partire da qui.

   Regole:
   - le date si scrivono nel formato  "AAAA-MM-GG"  (es. "2026-10-09")
   - "start" è il primo giorno della finestra, "end" l'ultimo (inclusi)
   - tutti gli orari sono nel fuso indicato in "timeZone" (ora di Roma)
   ========================================================================== */

const MARKET_CONFIG = {
  // Nome della lega e stagione: compaiono in header, titolo della pagina, ecc.
  leagueName: "Serie Z",
  season: "2026/27",

  // Fuso orario ufficiale: tutte le aperture/chiusure sono calcolate qui,
  // qualunque sia il fuso orario del dispositivo di chi visita il sito.
  timeZone: "Europe/Rome",

  // Ora di apertura (del primo giorno) e di chiusura (dell'ultimo giorno).
  opensAt: "00:00:00",
  closesAt: "23:59:59",

  // Le finestre di mercato. Puoi aggiungerne, toglierne o rinominarle:
  // l'"id" è il numero che collega gli scambi alla finestra (vedi trades.js).
  windows: [
    { id: 1, name: "1ª Finestra", start: "2026-09-03", end: "2026-10-09" },
    { id: 2, name: "2ª Finestra", start: "2026-11-06", end: "2026-11-20" },
    { id: 3, name: "3ª Finestra", start: "2026-12-22", end: "2027-01-01" },
    { id: 4, name: "4ª Finestra", start: "2027-02-03", end: "2027-02-26" },
    { id: 5, name: "5ª Finestra", start: "2027-03-23", end: "2027-04-02" }
  ]
};
