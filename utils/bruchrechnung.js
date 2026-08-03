// Bruchrechnen mit sichtbaren Zwischenschritten.
//
// term.js kann 1/2 + 1/3 längst ausrechnen — aber in einem einzigen
// Schritt ("Zahlen zusammenrechnen"). Genau das hilft niemandem: Wer
// Brüche nicht addieren kann, scheitert am GLEICHNAMIG MACHEN, und
// dieser Schritt ist dort unsichtbar.
//
//   1/2 + 1/3
//            | Hauptnenner ist 6 — beide Brüche erweitern
//   3/6 + 2/6
//            | Zähler addieren, Nenner behalten
//   5/6
//
// ---------------------------------------------------------------------
// Warum hier nicht mit bruch.js gerechnet wird
// ---------------------------------------------------------------------
//
// bruch() kürzt sofort — das ist dort richtig und hier hinderlich: Der
// Zwischenschritt 3/6 + 2/6 würde beim Bauen zu 1/2 + 1/3 zurückgekürzt
// und wäre nicht mehr zu sehen. Deshalb wird intern mit ungekürzten
// Paaren gerechnet und erst am Ende in einen Bruch überführt.
//
// Geprüft wird trotzdem gegen bruch.js: Jeder Zwischenschritt muss
// denselben Wert haben wie der Anfang. Das ist dieselbe Invariante wie
// bei den Termen — nur auf Zahlen statt auf Variablen.

import {
  bruch,
  ggT,
  kgV,
  plus,
  minus,
  mal,
  geteilt,
  gleich as bruchGleich,
  alsText as bruchAlsText,
} from './bruch.js';

// Ein ungekürztes Paar. Bewusst kein Bruch aus bruch.js: Das hier darf
// 3/6 sein und bleiben.
function paar(z, n) {
  if (!Number.isSafeInteger(z) || !Number.isSafeInteger(n)) {
    throw new Error('bruchrechnung: Zähler und Nenner müssen ganze Zahlen sein');
  }
  if (n === 0) {
    throw new Error('Ein Bruch mit Nenner 0 ist nicht definiert');
  }
  // Das Vorzeichen gehört nach vorn, sonst steht später "3/−4" da.
  return n < 0 ? { z: -z, n: -n } : { z, n };
}

function wertVon(p) {
  return bruch(p.z, p.n);
}

// Der Wert der GANZEN Rechnung, nicht der einer Seite.
//
// Diese Unterscheidung ist beim Bauen schiefgegangen und wurde von der
// Invariantenprüfung gefunden: Nach dem Kehrwert-Schritt steht
// "2/3 · 5/4" da, und der Wert davon ist 5/6 — nicht 2/3. Wer beim
// Notieren die linke Seite nimmt, behauptet an dieser Stelle etwas
// Falsches, ohne dass man es der Anzeige ansieht.
function wertDerRechnung(a, zeichen, b) {
  const links = wertVon(a);
  const rechts = wertVon(b);
  switch (zeichen) {
    case '+':
      return plus(links, rechts);
    case '−':
      return minus(links, rechts);
    case '·':
      return mal(links, rechts);
    default:
      return geteilt(links, rechts);
  }
}

// Wie ein Paar dasteht. Ein Nenner 1 wird weggelassen, ein negativer
// Zähler bekommt das typografische Minus — dasselbe Zeichen wie überall
// sonst in der App.
export function paarAlsText(p) {
  const zaehler = String(p.z).replace('-', '−');
  return p.n === 1 ? zaehler : `${zaehler}/${p.n}`;
}

function rechnungAlsText(a, zeichen, b) {
  return `${paarAlsText(a)} ${zeichen} ${paarAlsText(b)}`;
}

// ---------------------------------------------------------------------
// Die vier Rechenarten
// ---------------------------------------------------------------------

const ZEICHEN = { '+': '+', '−': '−', '·': '·', ':': ':' };

// Rückgabe ist immer { ergebnis, schritte, anfang } — nie nur das
// Ergebnis. Jeder Schritt trägt seinen Namen und den Stand danach.
export function rechne(zaehlerA, nennerA, zeichen, zaehlerB, nennerB) {
  if (!(zeichen in ZEICHEN)) {
    throw new Error(`bruchrechnung: "${zeichen}" ist keine der vier Rechenarten`);
  }

  const a = paar(zaehlerA, nennerA);
  const b = paar(zaehlerB, nennerB);
  const anfang = rechnungAlsText(a, zeichen, b);
  const schritte = [];

  const notiere = (regel, text, wert) => schritte.push({ regel, text, wert });

  let ergebnis;

  switch (zeichen) {
    case '+':
    case '−':
      ergebnis = strichrechnung(a, b, zeichen, notiere);
      break;
    case '·':
      ergebnis = malnehmen(a, b, notiere);
      break;
    default:
      ergebnis = teilen(a, b, notiere);
  }

  const gekuerzt = kuerzeMitSchritt(ergebnis, notiere);
  return { anfang, ergebnis: wertVon(gekuerzt), schritte };
}

function strichrechnung(a, b, zeichen, notiere) {
  let links = a;
  let rechts = b;

  if (a.n !== b.n) {
    // Der Hauptnenner ist das kleinste gemeinsame Vielfache — nicht
    // einfach das Produkt. Mit dem Produkt käme man auch ans Ziel, aber
    // mit unnötig großen Zahlen, und genau daran scheitert es dann.
    const hauptnenner = kgV(a.n, b.n);
    links = { z: a.z * (hauptnenner / a.n), n: hauptnenner };
    rechts = { z: b.z * (hauptnenner / b.n), n: hauptnenner };
    notiere(
      `Hauptnenner ist ${hauptnenner} — beide Brüche erweitern`,
      rechnungAlsText(links, zeichen, rechts),
      wertDerRechnung(links, zeichen, rechts)
    );
  }

  const summe =
    zeichen === '+'
      ? { z: links.z + rechts.z, n: links.n }
      : { z: links.z - rechts.z, n: links.n };

  notiere(
    zeichen === '+'
      ? 'Zähler addieren, Nenner behalten'
      : 'Zähler subtrahieren, Nenner behalten',
    paarAlsText(summe),
    wertVon(summe)
  );
  return summe;
}

function malnehmen(a, b, notiere) {
  const ergebnis = { z: a.z * b.z, n: a.n * b.n };
  notiere('Zähler mal Zähler, Nenner mal Nenner', paarAlsText(ergebnis), wertVon(ergebnis));
  return ergebnis;
}

function teilen(a, b, notiere) {
  if (b.z === 0) {
    throw new Error('Durch null lässt sich nicht teilen');
  }

  const kehrwert = paar(b.n, b.z);
  notiere(
    'Durch einen Bruch teilen heißt, mit dem Kehrwert malzunehmen',
    rechnungAlsText(a, '·', kehrwert),
    wertDerRechnung(a, '·', kehrwert)
  );
  return malnehmen(a, kehrwert, notiere);
}

function kuerzeMitSchritt(p, notiere) {
  const teiler = ggT(Math.abs(p.z), Math.abs(p.n));
  if (teiler <= 1) {
    return p;
  }

  const gekuerzt = { z: p.z / teiler, n: p.n / teiler };
  notiere(`mit ${teiler} kürzen`, paarAlsText(gekuerzt), wertVon(gekuerzt));
  return gekuerzt;
}

// ---------------------------------------------------------------------
// Nur kürzen
// ---------------------------------------------------------------------

// Für die Aufgabe "Kürze so weit wie möglich". Zeigt zusätzlich den
// größten gemeinsamen Teiler — ihn zu finden ist die eigentliche
// Schwierigkeit, nicht das Teilen danach.
export function kuerze(zaehler, nenner) {
  const p = paar(zaehler, nenner);
  const schritte = [];
  const teiler = ggT(Math.abs(p.z), Math.abs(p.n));

  if (teiler <= 1) {
    return {
      anfang: paarAlsText(p),
      ergebnis: wertVon(p),
      schritte,
      schonGekuerzt: true,
    };
  }

  schritte.push({
    regel: `größter gemeinsamer Teiler von ${Math.abs(p.z)} und ${p.n} ist ${teiler}`,
    text: `${paarAlsText(p)} = (${p.z} : ${teiler}) / (${p.n} : ${teiler})`,
    wert: wertVon(p),
  });

  const gekuerzt = { z: p.z / teiler, n: p.n / teiler };
  schritte.push({
    regel: 'Zähler und Nenner durch den Teiler teilen',
    text: paarAlsText(gekuerzt),
    wert: wertVon(gekuerzt),
  });

  return { anfang: paarAlsText(p), ergebnis: wertVon(gekuerzt), schritte, schonGekuerzt: false };
}

// ---------------------------------------------------------------------
// Aufschreiben
// ---------------------------------------------------------------------

export function alsRechenweg(ergebnis) {
  const zeilen = [ergebnis.anfang];
  for (const s of ergebnis.schritte) {
    zeilen.push(`         | ${s.regel}`);
    zeilen.push(`= ${s.text}`);
  }
  return zeilen;
}

// Ein fertiger Bruch, wie er auf dem Bildschirm steht.
//
// bruch.js liefert "-1/12" mit dem Bindestrich der Tastatur; im
// Rechenweg darüber steht aber "−1/12" mit dem typografischen Minus.
// Zwei verschiedene Striche in derselben Anzeige sehen nach Fehler aus
// — dieselbe Unstimmigkeit gab es schon einmal bei den Termen.
export function wertAlsText(wert) {
  return bruchAlsText(wert).replace('-', '−');
}

// Eine Kommazahl dazu — für das Gefühl, wie groß der Bruch ist. Wird
// nur angezeigt, nie weitergerechnet.
export function alsKommazahl(wert, stellen = 4) {
  const zahl = wert.z / wert.n;
  const gerundet = Math.round(zahl * 10 ** stellen) / 10 ** stellen;
  const text = String(gerundet).replace('.', ',').replace('-', '−');
  return bruchGleich(wert, bruch(Math.round(zahl))) && wert.n === 1
    ? text
    : `${text}${zahl === gerundet ? '' : '…'}`;
}
