/* ==========================================================================
   SERIE Z · LOGICA DEL SITO
   --------------------------------------------------------------------------
   Questo file NON contiene dati: le date stanno in config.js, gli scambi in
   trades.js. Qui c'è solo il "motore":

     1. utilità per date e fuso orario (Europe/Rome)
     2. calcolo dello stato del mercato (aperto / chiuso / stagione finita)
     3. preparazione degli scambi e delle statistiche
     4. disegno della pagina
     5. ciclo che aggiorna il countdown ogni secondo

   Per provare il sito in una data diversa, aggiungi all'indirizzo:
       ?now=2026-10-09T23:59:50        (ora di Roma)
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     0. DATI IN INGRESSO
     ------------------------------------------------------------------------ */
  var CONFIG = typeof MARKET_CONFIG !== "undefined" ? MARKET_CONFIG : null;
  var RAW_TRADES = typeof trades !== "undefined" && Array.isArray(trades) ? trades : [];

  if (!CONFIG || !Array.isArray(CONFIG.windows)) {
    console.error("[Serie Z] config.js mancante o non valido.");
    return;
  }

  var TZ = CONFIG.timeZone || "Europe/Rome";
  var LOCALE = "it-IT";
  var OPEN_TIME = normalizeTime(CONFIG.opensAt, "00:00:00");
  var CLOSE_TIME = normalizeTime(CONFIG.closesAt, "23:59:59");

  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  /* ------------------------------------------------------------------------
     1. DATE E FUSO ORARIO
     Le date del calendario ("2026-10-09") vengono trasformate nell'istante
     UTC esatto in cui quel giorno inizia/finisce A ROMA, tenendo conto
     dell'ora legale. Così il countdown è identico per tutti, ovunque siano.
     ------------------------------------------------------------------------ */
  var tzFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  /** Componenti (anno, mese, giorno, ora...) di un istante, letti nel fuso TZ. */
  function tzParts(ms) {
    var out = {};
    tzFormatter.formatToParts(new Date(ms)).forEach(function (p) { out[p.type] = p.value; });
    return out;
  }

  /** Differenza in ms tra l'ora di Roma e UTC in quell'istante (+1h o +2h). */
  function tzOffsetMs(ms) {
    var p = tzParts(ms);
    var asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return asUtc - Math.floor(ms / 1000) * 1000;
  }

  /** "2026-10-09" + "23:59:59" (ora di Roma) -> millisecondi UTC. */
  function romeToUtc(ymd, hms) {
    var d = ymd.split("-").map(Number);
    var t = hms.split(":").map(Number);
    var guess = Date.UTC(d[0], d[1] - 1, d[2], t[0], t[1], t[2] || 0);
    var offset = tzOffsetMs(guess);
    var utc = guess - offset;
    var offset2 = tzOffsetMs(utc);          // ricontrollo: gestisce il cambio ora legale
    if (offset2 !== offset) utc = guess - offset2;
    return utc;
  }

  /** Data di calendario ("AAAA-MM-GG") che è in corso a Roma in quell'istante. */
  function romeYMD(ms) {
    var p = tzParts(ms);
    return p.year + "-" + p.month + "-" + p.day;
  }

  function normalizeTime(value, fallback) {
    var m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(value || ""));
    if (!m) return fallback;
    return pad2(m[1]) + ":" + m[2] + ":" + (m[3] || "00");
  }

  function isValidYMD(s) {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var p = s.split("-").map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
  }

  function ymdToUtcMs(s) {
    var p = s.split("-").map(Number);
    return Date.UTC(p[0], p[1] - 1, p[2]);
  }

  function daysBetween(a, b) {
    return Math.round((ymdToUtcMs(b) - ymdToUtcMs(a)) / 86400000);
  }

  /* Formattatori per l'interfaccia */
  var fmtDate = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  var fmtDay = new Intl.DateTimeFormat(LOCALE, { day: "numeric", timeZone: "UTC" });
  var fmtMonth = new Intl.DateTimeFormat(LOCALE, { month: "long", timeZone: "UTC" });
  var fmtShort = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: "UTC" });
  var fmtHM = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ });
  var fmtHMS = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: TZ });
  var fmtFull = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: TZ });

  function formatYMD(s) { return fmtDate.format(new Date(ymdToUtcMs(s))); }
  function formatShort(s) { return fmtShort.format(new Date(ymdToUtcMs(s))); }
  function formatRange(a, b) {
    var da = new Date(ymdToUtcMs(a)), db = new Date(ymdToUtcMs(b));
    if (a.slice(0, 4) !== b.slice(0, 4)) return formatYMD(a) + " – " + formatYMD(b);
    if (a.slice(5, 7) !== b.slice(5, 7)) return fmtDay.format(da) + " " + fmtMonth.format(da) + " – " + formatYMD(b);
    return fmtDay.format(da) + " – " + formatYMD(b);
  }

  function pad2(n) { return String(n).padStart(2, "0"); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel) { return document.querySelector(sel); }

  /* ------------------------------------------------------------------------
     Orologio (con simulazione opzionale via ?now=...)
     ------------------------------------------------------------------------ */
  var clockSkew = 0;
  var simulated = false;
  (function readSimulation() {
    var raw = new URLSearchParams(window.location.search).get("now");
    if (!raw) return;
    var m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)$/.exec(raw.trim());
    if (!m || !isValidYMD(m[1])) { console.warn("[Serie Z] Parametro ?now non valido:", raw); return; }
    clockSkew = romeToUtc(m[1], normalizeTime(m[2], "00:00:00")) - Date.now();
    simulated = true;
  })();
  function now() { return Date.now() + clockSkew; }

  /* ------------------------------------------------------------------------
     2. FINESTRE E STATO DEL MERCATO
     ------------------------------------------------------------------------ */
  var windows = CONFIG.windows.map(function (w, i) {
    var id = Number.isFinite(Number(w.id)) ? Number(w.id) : i + 1;
    if (!isValidYMD(w.start) || !isValidYMD(w.end) || w.end < w.start) {
      console.warn("[Serie Z] Finestra ignorata (date non valide):", w);
      return null;
    }
    return {
      id: id,
      name: w.name || id + "ª Finestra",
      start: w.start,
      end: w.end,
      opensAt: romeToUtc(w.start, OPEN_TIME),
      // l'ultimo secondo di chiusura è incluso (fino a hh:mm:ss.999)
      closesAt: romeToUtc(w.end, CLOSE_TIME) + 999,
      days: daysBetween(w.start, w.end) + 1
    };
  }).filter(Boolean).sort(function (a, b) { return a.opensAt - b.opensAt; });

  var windowById = new Map(windows.map(function (w) { return [w.id, w]; }));

  function windowStatus(w, t) {
    if (t >= w.opensAt && t <= w.closesAt) return "open";
    return t < w.opensAt ? "upcoming" : "done";
  }

  /** Fotografia del mercato in un dato istante. */
  function getMarketState(t) {
    var current = null, next = null, last = null;
    windows.forEach(function (w) {
      var s = windowStatus(w, t);
      if (s === "open" && !current) current = w;
      if (s === "upcoming" && !next) next = w;      // lista ordinata: la prima è la più vicina
      if (s === "done") last = w;                    // l'ultima "done" è la più recente
    });
    return {
      status: current ? "open" : next ? "closed" : "ended",
      current: current, next: next, last: last
    };
  }

  /* ------------------------------------------------------------------------
     3. SCAMBI: lettura, controllo, ordinamento
     ------------------------------------------------------------------------ */
  function toList(v) {
    if (Array.isArray(v)) return v.map(function (x) { return String(x).trim(); }).filter(Boolean);
    if (typeof v === "string" && v.trim()) return [v.trim()];
    return [];
  }
  function readSide(s) {
    s = s || {};
    return { name: String(s.name || "").trim(), gives: toList(s.gives), receives: toList(s.receives) };
  }
  function teamKey(name) { return name.trim().replace(/\s+/g, " ").toLowerCase(); }

  function windowOfDate(ymd) {
    for (var i = 0; i < windows.length; i++) {
      if (ymd >= windows[i].start && ymd <= windows[i].end) return windows[i].id;
    }
    return null;
  }

  var allTrades = [];
  RAW_TRADES.forEach(function (raw, idx) {
    var label = "#" + (raw && raw.id != null ? raw.id : idx + 1);
    try {
      if (!isValidYMD(raw.date)) throw new Error("data non valida (usa AAAA-MM-GG)");
      var a = readSide(raw.teamA), b = readSide(raw.teamB);
      if (!a.name || !b.name) throw new Error("manca il nome di una squadra");
      if (!a.gives.length && !b.gives.length) throw new Error("nessun giocatore coinvolto");

      // "receives" è facoltativo: se manca, è ciò che cede l'altra squadra
      if (!a.receives.length) a.receives = b.gives.slice();
      if (!b.receives.length) b.receives = a.gives.slice();

      var win = Number(raw.window);
      if (raw.window != null && !windowById.has(win)) {
        console.warn("[Serie Z] Scambio " + label + ": finestra " + raw.window + " inesistente, la ricavo dalla data.");
      }
      if (!windowById.has(win)) win = windowOfDate(raw.date);

      allTrades.push({ id: raw.id != null ? raw.id : idx + 1, date: raw.date, win: win, a: a, b: b });
    } catch (err) {
      console.warn("[Serie Z] Scambio " + label + " ignorato: " + err.message, raw);
    }
  });

  // Dal più recente al più vecchio (a parità di data, vince l'id più alto)
  allTrades.sort(function (x, y) {
    if (x.date !== y.date) return x.date < y.date ? 1 : -1;
    return (Number(y.id) || 0) - (Number(x.id) || 0);
  });

  var tradesPerWindow = new Map();
  var teamNames = new Map();     // chiave normalizzata -> nome da mostrare
  allTrades.forEach(function (tr) {
    if (tr.win != null) tradesPerWindow.set(tr.win, (tradesPerWindow.get(tr.win) || 0) + 1);
    [tr.a.name, tr.b.name].forEach(function (n) {
      if (!teamNames.has(teamKey(n))) teamNames.set(teamKey(n), n);
    });
  });

  /* ------------------------------------------------------------------------
     4. DISEGNO DELLA PAGINA
     ------------------------------------------------------------------------ */
  var el = {
    hero: $("#hero"), title: $("#hero-title"), sub: $("#hero-sub"),
    units: $("#units"), progress: $("#progress"), bar: $("#bar"), barFill: $("#bar-fill"),
    barStart: $("#bar-start"), barEnd: $("#bar-end"),
    deadline: $("#hero-deadline"), note: $("#hero-note"), clock: $("#hero-clock"),
    strip: $("#strip"), timeline: $("#timeline"), calNote: $("#calendario-note"),
    stats: $("#stats"), teamPanel: $("#team-panel"),
    chips: $("#window-filters"), teamSelect: $("#team-filter"),
    count: $("#trades-count"), results: $("#results-note"), trades: $("#trades")
  };

  var ICON = {
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h14"/><path d="m14 4 4 4-4 4"/><path d="M20 16H6"/><path d="m10 12-4 4 4 4"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>',
    inn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 7 7 17"/><path d="M16 17H7V8"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
  };

  /* ---- 4a. Testi statici presi dalla configurazione ---- */
  function applyBranding() {
    document.querySelectorAll("[data-season]").forEach(function (n) { n.textContent = CONFIG.season || ""; });
    document.querySelectorAll("[data-league]").forEach(function (n) { n.textContent = CONFIG.leagueName || "Serie Z"; });
    document.title = (CONFIG.leagueName || "Serie Z") + " · Mercato scambi " + (CONFIG.season || "");
    el.calNote.textContent =
      "Apertura ore " + OPEN_TIME.slice(0, 5) + " del primo giorno, chiusura ore " + CLOSE_TIME.slice(0, 5) + " dell'ultimo · ora di Roma";
  }

  /* ---- 4b. Hero: testi (cambiano solo quando cambia lo stato) ---- */
  function renderHeroCopy(state) {
    el.hero.dataset.state = state.status;
    el.progress.hidden = state.status !== "open";
    el.units.hidden = state.status === "ended";
    el.note.hidden = true;

    if (state.status === "open") {
      var w = state.current;
      el.title.innerHTML = '<span class="dot dot--open" aria-hidden="true"></span>Mercato scambi aperto';
      el.sub.textContent = "Chiusura " + w.name;
      el.deadline.innerHTML = '<span class="k">Chiusura:</span><span class="v">' +
        esc(formatYMD(w.end)) + " · " + fmtHM.format(new Date(w.closesAt)) + "</span>";
      el.barStart.textContent = formatShort(w.start);
      el.barEnd.textContent = formatShort(w.end);
    } else if (state.status === "closed") {
      var n = state.next;
      el.title.innerHTML = '<span class="dot" aria-hidden="true"></span>Mercato scambi chiuso';
      el.sub.textContent = "Prossima finestra · " + n.name;
      el.deadline.innerHTML = '<span class="k">Apertura:</span><span class="v">' +
        esc(formatYMD(n.start)) + " · " + fmtHM.format(new Date(n.opensAt)) + "</span>";
    } else {
      el.title.innerHTML = '<span class="dot" aria-hidden="true"></span>Mercato scambi chiuso';
      el.sub.textContent = "Stagione " + (CONFIG.season || "") + " conclusa";
      el.deadline.innerHTML = state.last
        ? '<span class="k">Ultima finestra chiusa il</span><span class="v">' + esc(formatYMD(state.last.end)) + "</span>"
        : "";
    }
  }

  /* ---- 4c. Hero: numeri del countdown (aggiornati ogni secondo) ---- */
  var unitState = {};

  function setUnit(key, value) {
    var box = el.units.querySelector('[data-unit="' + key + '"]');
    var num = box.querySelector(".num");
    var str = pad2(value);
    var prev = unitState[key];
    if (prev === str) return;

    if (!prev || prev.length !== str.length) {
      // Prima volta (o cambia il numero di cifre): ricostruisco le cifre
      num.innerHTML = str.split("").map(function (c) { return '<span class="d">' + c + "</span>"; }).join("");
      box.dataset.digits = String(str.length);
    } else {
      // Aggiorno solo le cifre che cambiano, con una micro-animazione
      for (var i = 0; i < str.length; i++) {
        if (str[i] !== prev[i]) {
          num.children[i].textContent = str[i];
          animateDigit(num.children[i]);
        }
      }
    }
    unitState[key] = str;
  }

  function animateDigit(node) {
    if (reduceMotion.matches || !node.animate) return;
    node.animate(
      [{ opacity: 0.25, transform: "translateY(14%)" }, { opacity: 1, transform: "none" }],
      { duration: 240, easing: "cubic-bezier(.2,.7,.2,1)" }
    );
  }

  function updateLive(state, t) {
    el.clock.textContent = "Ora di Roma " + fmtHMS.format(new Date(t));
    if (state.status === "ended") return;

    var open = state.status === "open";
    var target = open ? state.current.closesAt : state.next.opensAt;
    var remaining = Math.max(0, target - t);
    var total = Math.ceil(remaining / 1000);

    setUnit("days", Math.floor(total / 86400));
    setUnit("hours", Math.floor((total % 86400) / 3600));
    setUnit("minutes", Math.floor((total % 3600) / 60));
    setUnit("seconds", total % 60);

    if (open) {
      var w = state.current;
      var pct = Math.min(100, Math.max(0, (t - w.opensAt) / (w.closesAt + 1 - w.opensAt) * 100));
      el.barFill.style.width = pct.toFixed(2) + "%";
      el.bar.setAttribute("aria-valuenow", String(Math.round(pct)));
      el.note.hidden = remaining > 86400000;      // ultime 24 ore
    }
  }

  /* ---- 4d. Striscia "prossima finestra / ultima conclusa" ---- */
  function relativeDays(fromYMD, toYMD) {
    var n = daysBetween(fromYMD, toYMD);
    if (n <= 0) return "oggi";
    if (n === 1) return "domani";
    return "tra " + n + " giorni";
  }

  function renderStrip(state, t) {
    var today = romeYMD(t);
    var next = state.next, last = state.last;

    var nextHTML = next
      ? '<p class="info-k">Prossima finestra</p>' +
        '<p class="info-name">' + esc(next.name) + "</p>" +
        '<p class="info-range">' + esc(formatRange(next.start, next.end)) + "</p>" +
        '<p class="info-meta">Apre ' + relativeDays(today, next.start) + " · " + plural(next.days, "giorno", "giorni") + " di mercato</p>"
      : '<p class="info-k">Prossima finestra</p>' +
        '<p class="info-name">Nessuna in programma</p>' +
        '<p class="info-meta">' + (state.status === "open"
          ? "Questa è l'ultima finestra della stagione."
          : "Tutte le finestre della stagione sono concluse.") + "</p>";

    var lastHTML = last
      ? '<p class="info-k">Ultima finestra conclusa</p>' +
        '<p class="info-name">' + esc(last.name) + "</p>" +
        '<p class="info-range">' + esc(formatRange(last.start, last.end)) + "</p>" +
        '<p class="info-meta">' + plural(tradesPerWindow.get(last.id) || 0, "scambio", "scambi") + " registrati</p>"
      : '<p class="info-k">Ultima finestra conclusa</p>' +
        '<p class="info-name">Nessuna</p>' +
        '<p class="info-meta">Non si è ancora conclusa nessuna finestra.</p>';

    el.strip.innerHTML =
      '<article class="info glass">' + nextHTML + "</article>" +
      '<article class="info glass">' + lastHTML + "</article>";
  }

  /* ---- 4e. Calendario / timeline ---- */
  var STATUS_LABEL = { open: "Aperto", upcoming: "In programma", done: "Concluso" };

  function renderTimeline(t) {
    el.timeline.innerHTML = windows.map(function (w) {
      var st = windowStatus(w, t);
      var n = tradesPerWindow.get(w.id) || 0;
      return '<li class="tl-item is-' + st + '">' +
        '<span class="node" aria-hidden="true"></span>' +
        '<button type="button" class="tl-card glass" data-window="' + w.id + '" aria-label="Mostra gli scambi: ' + esc(w.name) + '">' +
          '<span class="tl-top"><span class="tl-num">' + esc(w.id) + '</span>' +
          '<span class="st st--' + st + '">' + STATUS_LABEL[st] + "</span></span>" +
          '<span class="tl-name">' + esc(w.name) + "</span>" +
          '<span class="tl-rows">' +
            '<span class="tl-row"><span class="k">Apertura</span><span class="v">' + esc(formatYMD(w.start)) + "</span></span>" +
            '<span class="tl-row"><span class="k">Chiusura</span><span class="v">' + esc(formatYMD(w.end)) + "</span></span>" +
          "</span>" +
          '<span class="tl-cta"><span>' + plural(n, "scambio", "scambi") + "</span>" + ICON.chevron + "</span>" +
        "</button></li>";
    }).join("");
  }

  /* ---- 4f. Statistiche (calcolate dagli scambi) ---- */
  function topOf(map) {
    var max = 0;
    map.forEach(function (v) { if (v > max) max = v; });
    var keys = [];
    map.forEach(function (v, k) { if (v === max && max > 0) keys.push(k); });
    return { max: max, keys: keys };
  }

  function renderStats() {
    var byWindow = new Map(), byTeam = new Map();
    allTrades.forEach(function (tr) {
      if (tr.win != null) byWindow.set(tr.win, (byWindow.get(tr.win) || 0) + 1);
      [tr.a.name, tr.b.name].forEach(function (nm) {
        var k = teamKey(nm);
        byTeam.set(k, (byTeam.get(k) || 0) + 1);
      });
    });

    var topWin = topOf(byWindow), topTeam = topOf(byTeam);
    var winText = topWin.keys.length
      ? topWin.keys.map(function (id) { return windowById.get(id).name; }).join(" · ") : "—";
    var teamText = topTeam.keys.length
      ? topTeam.keys.map(function (k) { return teamNames.get(k); }).join(" · ") : "—";
    var latest = allTrades[0];

    function card(label, value, sub, isText) {
      return '<article class="stat glass"><p class="stat-k">' + label + "</p><div>" +
        '<p class="stat-v' + (isText ? " is-text" : "") + '">' + esc(value) + "</p>" +
        (sub ? '<p class="stat-sub">' + esc(sub) + "</p>" : "") + "</div></article>";
    }

    el.stats.innerHTML =
      card("Scambi totali", String(allTrades.length), "", false) +
      card("Finestra più attiva", winText, topWin.max ? plural(topWin.max, "scambio", "scambi") : "", true) +
      card("Ultimo scambio", latest ? formatYMD(latest.date) : "—", latest ? latest.a.name + " ↔ " + latest.b.name : "", true) +
      card("Squadra più attiva", teamText, topTeam.max ? plural(topTeam.max, "scambio", "scambi") : "", true);

    // Scambi per squadra
    var rows = [];
    byTeam.forEach(function (v, k) { rows.push({ name: teamNames.get(k), n: v }); });
    rows.sort(function (x, y) { return y.n - x.n || x.name.localeCompare(y.name, LOCALE); });

    if (!rows.length) { el.teamPanel.hidden = true; return; }
    el.teamPanel.hidden = false;
    el.teamPanel.innerHTML = "<h3>Scambi per squadra</h3><ul class=\"bars\">" + rows.map(function (r) {
      return '<li class="bar-row' + (r.n === topTeam.max ? " is-top" : "") + '">' +
        '<span class="bar-name">' + esc(r.name) + "</span>" +
        '<span class="bar-count">' + r.n + "</span>" +
        '<span class="bar-track"><i style="width:' + (r.n / topTeam.max * 100).toFixed(1) + '%"></i></span></li>';
    }).join("") + "</ul>";
  }

  /* ---- 4g. Filtri e lista scambi ---- */
  var filters = { win: "all", team: "all" };

  function renderFilterControls() {
    var chips = [{ key: "all", label: "Tutti", n: allTrades.length }].concat(
      windows.map(function (w) { return { key: String(w.id), label: w.name, n: tradesPerWindow.get(w.id) || 0 }; })
    );
    el.chips.innerHTML = chips.map(function (c) {
      return '<button type="button" class="chip" data-win="' + esc(c.key) + '" aria-pressed="false">' +
        esc(c.label) + '<span class="n">' + c.n + "</span></button>";
    }).join("");

    var teams = [];
    teamNames.forEach(function (name, key) { teams.push({ key: key, name: name }); });
    teams.sort(function (x, y) { return x.name.localeCompare(y.name, LOCALE); });
    el.teamSelect.innerHTML = '<option value="all">Tutte le squadre</option>' +
      teams.map(function (t) { return '<option value="' + esc(t.key) + '">' + esc(t.name) + "</option>"; }).join("");
    el.teamSelect.disabled = !teams.length;
    syncControls();
  }

  function syncControls() {
    el.chips.querySelectorAll(".chip").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.win === filters.win));
    });
    el.teamSelect.value = filters.team;
  }

  function flowHTML(kind, label, players) {
    var items = players.length
      ? players.map(function (p) { return '<li class="player">' + esc(p) + "</li>"; }).join("")
      : '<li class="player is-none">Nessun giocatore</li>';
    return '<div class="flow flow--' + kind + '"><p class="flow-k">' + (kind === "out" ? ICON.out : ICON.inn) +
      "<span>" + label + '</span></p><ul class="players">' + items + "</ul></div>";
  }

  function sideHTML(s) {
    return '<div class="side"><h3 class="team">' + esc(s.name) + "</h3>" +
      flowHTML("out", "Cede", s.gives) + flowHTML("in", "Riceve", s.receives) + "</div>";
  }

  function tradeHTML(tr) {
    var idText = /^\d+$/.test(String(tr.id)) ? String(tr.id).padStart(3, "0") : String(tr.id);
    var w = windowById.get(tr.win);
    return '<article class="trade glass">' +
      '<header class="trade-head"><span class="trade-id">Scambio #' + esc(idText) + "</span>" +
      '<span class="trade-meta"><time datetime="' + tr.date + '">' + esc(formatYMD(tr.date)) + "</time>" +
      '<span class="sep" aria-hidden="true">·</span>' + esc(w ? w.name : "Fuori finestra") + "</span></header>" +
      '<div class="trade-body">' + sideHTML(tr.a) +
      '<div class="swap" role="img" aria-label="scambio reciproco">' + ICON.swap + "</div>" +
      sideHTML(tr.b) + "</div></article>";
  }

  function renderTrades(t) {
    var list = allTrades.filter(function (tr) {
      var okWin = filters.win === "all" || String(tr.win) === filters.win;
      var okTeam = filters.team === "all" || teamKey(tr.a.name) === filters.team || teamKey(tr.b.name) === filters.team;
      return okWin && okTeam;
    });
    var filtered = filters.win !== "all" || filters.team !== "all";

    el.count.textContent = plural(allTrades.length, "scambio", "scambi") + " in totale";
    el.results.textContent = filtered
      ? "Mostrati " + list.length + " di " + allTrades.length + " scambi"
      : "";

    if (!list.length) {
      var msg = "Nessuno scambio corrisponde ai filtri selezionati.";
      if (!allTrades.length) {
        msg = "Nessuno scambio registrato per ora.";
      } else if (filters.win !== "all" && filters.team === "all") {
        var w = windowById.get(Number(filters.win));
        msg = w && windowStatus(w, t) === "upcoming"
          ? "Questa finestra non è ancora aperta: gli scambi compariranno qui."
          : "Nessuno scambio registrato in questa finestra.";
      }
      el.trades.innerHTML = '<div class="empty"><p>' + msg + "</p>" +
        (filtered ? '<button type="button" class="btn" data-reset>Mostra tutti gli scambi</button>' : "") + "</div>";
      return;
    }
    el.trades.innerHTML = list.map(tradeHTML).join("");
  }

  function setWindowFilter(key) {
    filters.win = key;
    syncControls();
    renderTrades(now());
    var chip = el.chips.querySelector('[data-win="' + key + '"]');
    if (chip) {
      el.chips.scrollLeft = chip.offsetLeft - (el.chips.clientWidth - chip.offsetWidth) / 2;
    }
  }

  el.chips.addEventListener("click", function (e) {
    var b = e.target.closest("[data-win]");
    if (b) setWindowFilter(b.dataset.win);
  });

  el.teamSelect.addEventListener("change", function () {
    filters.team = el.teamSelect.value;
    renderTrades(now());
  });

  el.trades.addEventListener("click", function (e) {
    if (!e.target.closest("[data-reset]")) return;
    filters.win = "all";
    filters.team = "all";
    syncControls();
    renderTrades(now());
  });

  // Clic su una finestra del calendario: filtra gli scambi e scorre alla sezione
  el.timeline.addEventListener("click", function (e) {
    var b = e.target.closest("[data-window]");
    if (!b) return;
    setWindowFilter(b.dataset.window);
    var target = document.getElementById("scambi");
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    }
  });

  /* ------------------------------------------------------------------------
     5. CICLO PRINCIPALE
     Ogni secondo: legge l'ora, ricalcola lo stato, aggiorna i numeri.
     Se lo stato cambia (una finestra si apre/chiude, o cambia giorno)
     ridisegna hero, striscia e calendario da solo.
     ------------------------------------------------------------------------ */
  var lastKey = null;
  var timer = null;

  function tick() {
    var t = now();
    var state = getMarketState(t);
    var key = [
      state.status,
      state.current && state.current.id,
      state.next && state.next.id,
      state.last && state.last.id,
      romeYMD(t)
    ].join("|");

    if (key !== lastKey) {
      lastKey = key;
      renderHeroCopy(state);
      renderStrip(state, t);
      renderTimeline(t);
      if (el.trades.querySelector(".empty")) renderTrades(t);   // il messaggio dipende dallo stato
    }
    updateLive(state, t);
    if (simulated) updateSimBadge(t);
    schedule();
  }

  // Il prossimo tick cade poco dopo il cambio di secondo: niente scarti visibili
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(tick, 1000 - (now() % 1000) + 15);
  }

  var simBadge = null;
  function updateSimBadge(t) {
    if (!simBadge) {
      simBadge = document.createElement("div");
      simBadge.className = "sim-badge";
      document.body.appendChild(simBadge);
    }
    simBadge.textContent = "Simulazione · " + fmtFull.format(new Date(t));
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) tick();     // al ritorno sulla scheda, riallinea subito
  });

  /* ------------------------------------------------------------------------
     Avvio
     ------------------------------------------------------------------------ */
  applyBranding();
  renderFilterControls();
  renderStats();
  renderTrades(now());
  tick();
})();
