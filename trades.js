/* ==========================================================================
   SERIE Z · DATABASE DEGLI SCAMBI
   --------------------------------------------------------------------------
   ATTENZIONE: gli scambi qui sotto sono DATI DEMO (TEAM DEMO 1, ecc.).
   Sostituiscili con quelli reali della lega.

   COME AGGIUNGERE UNO SCAMBIO
   Copia un blocco { ... } qualsiasi, incollalo in fondo alla lista
   (ricordati la virgola tra un blocco e l'altro) e cambia i valori.

   Campi:
   - id       numero progressivo dello scambio (1, 2, 3, ...)
   - date     data dello scambio, formato "AAAA-MM-GG"
   - window   numero della finestra (1-5). FACOLTATIVO: se lo togli, il sito
              lo ricava da solo dalla data.
   - teamA / teamB
       name      nome della squadra (scrivilo sempre allo stesso modo)
       gives     giocatori che la squadra CEDE
       receives  giocatori che la squadra RICEVE. FACOLTATIVO: se lo togli,
                 il sito usa quelli ceduti dall'altra squadra.

   L'ordine nella lista non conta: il sito li mostra dal più recente al più vecchio.
   ========================================================================== */

const trades = [
  {
    id: 1,
    date: "2026-09-04",
    window: 1,
    teamA: {
      name: "TEAM DEMO 1",
      gives: ["Demo Difensore 1"],
      receives: ["Demo Attaccante 1", "Demo Centrocampista 1"]
    },
    teamB: {
      name: "TEAM DEMO 2",
      gives: ["Demo Attaccante 1", "Demo Centrocampista 1"],
      receives: ["Demo Difensore 1"]
    }
  },
  {
    id: 2,
    date: "2026-09-07",
    window: 1,
    teamA: {
      name: "TEAM DEMO 3",
      gives: ["Demo Portiere 1"],
      receives: ["Demo Portiere 2"]
    },
    teamB: {
      name: "TEAM DEMO 4",
      gives: ["Demo Portiere 2"],
      receives: ["Demo Portiere 1"]
    }
  },
  {
    id: 3,
    date: "2026-09-11",
    window: 1,
    teamA: {
      name: "TEAM DEMO 1",
      gives: ["Demo Centrocampista 2", "Demo Attaccante 2"],
      receives: ["Demo Difensore 2"]
    },
    teamB: {
      name: "TEAM DEMO 5",
      gives: ["Demo Difensore 2"],
      receives: ["Demo Centrocampista 2", "Demo Attaccante 2"]
    }
  },
  {
    id: 4,
    date: "2026-09-15",
    window: 1,
    teamA: {
      name: "TEAM DEMO 2",
      gives: ["Demo Difensore 3"],
      receives: ["Demo Centrocampista 3"]
    },
    teamB: {
      name: "TEAM DEMO 6",
      gives: ["Demo Centrocampista 3"],
      receives: ["Demo Difensore 3"]
    }
  },
  {
    id: 5,
    date: "2026-09-18",
    window: 1,
    teamA: {
      name: "TEAM DEMO 1",
      gives: ["Demo Attaccante 3"],
      receives: ["Demo Attaccante 4"]
    },
    teamB: {
      name: "TEAM DEMO 3",
      gives: ["Demo Attaccante 4"],
      receives: ["Demo Attaccante 3"]
    }
  },
  {
    id: 6,
    date: "2026-09-20",
    window: 1,
    teamA: {
      name: "TEAM DEMO 4",
      gives: ["Demo Centrocampista 4", "Demo Difensore 4", "Demo Portiere 3"],
      receives: ["Demo Attaccante 5", "Demo Attaccante 6"]
    },
    teamB: {
      name: "TEAM DEMO 5",
      gives: ["Demo Attaccante 5", "Demo Attaccante 6"],
      receives: ["Demo Centrocampista 4", "Demo Difensore 4", "Demo Portiere 3"]
    }
  }
];
