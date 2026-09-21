# Serie Z · Mercato scambi

Il portale del mercato scambi della Serie Z: countdown in tempo reale, calendario delle finestre e archivio di tutti gli scambi.

Solo HTML, CSS e JavaScript. Nessun backend, nessuna installazione.

## I file del progetto

```text
serie-z-market/
├── index.html      la pagina
├── styles.css      l'aspetto grafico
├── script.js       la logica (countdown, filtri, statistiche): non serve toccarlo
├── config.js       ⭐ DATE DELLE FINESTRE  ← qui si cambiano le date
├── trades.js       ⭐ GLI SCAMBI           ← qui si aggiungono gli scambi
├── assets/
│   └── favicon.svg
└── README.md
```

Ti bastano due file: **`config.js`** e **`trades.js`**.

---

## 1. Come modificare le date delle finestre

Apri `config.js`. Ogni finestra è una riga:

```js
{ id: 1, name: "1ª Finestra", start: "2026-09-03", end: "2026-10-09" },
```

- `start` = primo giorno, `end` = ultimo giorno (entrambi inclusi)
- le date si scrivono così: **anno-mese-giorno** (`"2026-10-09"`)
- la finestra si apre alle **00:00:00** del primo giorno e si chiude alle **23:59:59** dell'ultimo, ora di Roma. Se vuoi cambiare gli orari, modifica `opensAt` e `closesAt` in cima al file.

Salva: countdown, calendario, stati e statistiche si aggiornano da soli.
Puoi anche rinominare una finestra (`name`) o aggiungerne una nuova copiando una riga.

## 2. Come aggiungere uno scambio

Apri `trades.js`, copia un blocco qualsiasi, incollalo in fondo alla lista (con la virgola tra un blocco e l'altro) e cambia i valori:

```js
{
  id: 7,
  date: "2026-09-25",
  window: 1,
  teamA: { name: "Nome Squadra A", gives: ["Giocatore 1"], receives: ["Giocatore 2", "Giocatore 3"] },
  teamB: { name: "Nome Squadra B", gives: ["Giocatore 2", "Giocatore 3"], receives: ["Giocatore 1"] }
},
```

- `id`: numero progressivo (il prossimo dopo l'ultimo)
- `date`: data dello scambio, **anno-mese-giorno**
- `gives`: i giocatori che la squadra **cede**
- `receives`: i giocatori che la squadra **riceve**
- più giocatori = più nomi separati da virgola dentro le parentesi quadre
- `window` è facoltativo: se lo togli, il sito capisce da solo la finestra dalla data
- anche `receives` è facoltativo: se lo togli, il sito usa i giocatori ceduti dall'altra squadra

L'ordine nel file non conta: il sito li mostra sempre dal più recente al più vecchio.
Se scrivi qualcosa di sbagliato (una data non valida, un nome squadra vuoto), lo scambio viene saltato: apri la console del browser (F12) per vedere quale.

## 3. Come modificare i nomi delle squadre

I nomi sono scritti dentro `trades.js`, in ogni scambio (`name: "TEAM DEMO 1"`).
Usa **Cerca e sostituisci** del tuo editor (Ctrl+H, oppure Cmd+Opt+F su Mac) e sostituisci `TEAM DEMO 1` con il nome vero, per tutte le occorrenze.

Meglio scrivere ogni squadra sempre allo stesso modo: il sito ignora maiuscole e spazi doppi, ma non gli errori di battitura.

Anche i giocatori "Demo" vanno sostituiti allo stesso modo.

## 4. Come avviare il progetto

**Il modo più semplice:** fai doppio clic su `index.html`. Si apre nel browser e funziona.
(Serve internet solo per caricare i font; senza, il sito usa font di sistema.)

**Se preferisci un piccolo server locale:**

```bash
python3 -m http.server 8000
```

poi apri http://localhost:8000

### Provare il sito in un'altra data

Aggiungi `?now=` all'indirizzo, con la data e l'ora **di Roma**:

```text
index.html?now=2026-10-09T23:59:50     ultimi 10 secondi della 1ª finestra
index.html?now=2026-10-10T00:00:00     mercato chiuso, countdown verso la 2ª
index.html?now=2027-04-03T00:00:00     stagione conclusa
```

In basso a sinistra compare il badge "Simulazione". Il countdown continua a scorrere da quel momento.

## 5. Come pubblicarlo su GitHub Pages

1. Crea un account su [github.com](https://github.com) (se non ce l'hai).
2. Clicca **New repository**, scegli un nome (es. `serie-z-market`), lascialo **Public** e crea il repository.
3. Nel repository clicca **Add file → Upload files** e trascina **tutto il contenuto** della cartella `serie-z-market` (i file, non la cartella; includi `assets`). Poi **Commit changes**.
4. Vai su **Settings → Pages**.
5. In **Build and deployment**, alla voce **Source** scegli **Deploy from a branch**. Come branch seleziona `main` e cartella `/ (root)`, poi **Save**.
6. Dopo 1-2 minuti il sito è online all'indirizzo `https://TUO-UTENTE.github.io/serie-z-market/`.

**Per aggiornarlo in futuro** (nuovo scambio o nuove date): apri `trades.js` o `config.js` su GitHub, clicca l'icona della matita ✏️, modifica, poi **Commit changes**. Dopo un minuto il sito è aggiornato. Se non vedi la modifica, ricarica la pagina forzando la cache (Ctrl+Shift+R).

## Note tecniche

- Il fuso orario è sempre **Europe/Rome**, indipendentemente da dove si trova chi visita il sito. Ora legale e solare sono gestite automaticamente.
- Il countdown misura il tempo realmente trascorso: nei giorni in cui cambia l'ora legale (ultima domenica di ottobre e di marzo) un giorno dura 25 o 23 ore, ed è corretto così.
- Il countdown si basa sull'orologio del dispositivo: se l'orologio di un telefono è sbagliato, lo sarà anche il countdown.
