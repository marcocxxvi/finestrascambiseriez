/* ==========================================================================
   SERIE Z · DATABASE DEGLI SCAMBI
   --------------------------------------------------------------------------
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
    date: "2026-10-06",
    window: 1,
    teamA: {
      name: "STRASBURRO",
      gives: ["Manu Koné", "Weston McKennie", "Beto"],
      receives: ["Scott McTominay", "Rodrigo Mora", "Sebastiano Esposito"]
    },
    teamB: {
      name: "SBROCCA JUNIOR",
      gives: ["Scott McTominay", "Rodrigo Mora", "Sebastiano Esposito"],
      receives: ["Manu Koné", "Weston McKennie", "Beto"]
    }
  }
];
