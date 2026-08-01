// Ein sehr kleiner Prüfrahmen — bewusst ohne Bibliothek.
//
// Warum nicht Jest oder Vitest? Weil die Prüfungen hier reines
// JavaScript gegen reines JavaScript sind. Eine Testbibliothek brächte
// Hunderte Abhängigkeiten, eine Konfigurationsdatei und einen
// Transpiler mit — für Vergleiche der Art "M(H₂SO₄) muss 98,07 sein".
// Diese Datei kostet achtzig Zeilen und läuft mit `node` allein.
//
// Verwendung in einer Prüfdatei:
//
//   import { pruefung, gleich, zahl } from './pruefer.mjs';
//
//   pruefung('Molare Massen', () => {
//     zahl('M(H2O)', molareMasse('H2O'), 18.015, 0.01);
//   });
//
// Der Bericht wird beim Programmende automatisch ausgegeben. Dadurch
// lässt sich jede Prüfdatei einzeln aufrufen (`node tests/formel.mjs`)
// und genauso gut gebündelt über `tests/alle.mjs`.

const laeufe = [];
let aktuell = null;

export function pruefung(name, fn) {
  aktuell = { name, anzahl: 0, fehler: [] };
  laeufe.push(aktuell);
  try {
    fn();
  } catch (f) {
    aktuell.fehler.push(`Abbruch: ${f.message}`);
  }
  aktuell = null;
}

function melde(beschreibung, bestanden, details) {
  if (!aktuell) {
    throw new Error('pruefe() außerhalb von pruefung() aufgerufen');
  }
  aktuell.anzahl++;
  if (!bestanden) {
    aktuell.fehler.push(details ? `${beschreibung} — ${details}` : beschreibung);
  }
}

// Eine Bedingung, die wahr sein muss.
export function wahr(beschreibung, bedingung, details) {
  melde(beschreibung, Boolean(bedingung), details);
}

// Ein Zahlenwert gegen einen Sollwert, mit Toleranz. Ohne Toleranz
// vergleicht die Funktion exakt — bei Gleitkommazahlen fast nie sinnvoll,
// deshalb ist ein kleiner Standardwert gesetzt.
export function zahl(beschreibung, ist, soll, toleranz = 1e-9) {
  const abweichung = Math.abs(ist - soll);
  melde(
    beschreibung,
    abweichung <= toleranz,
    `${formatiere(ist)} statt ${formatiere(soll)} (Abweichung ${formatiere(abweichung)})`
  );
}

// Ein Text oder ein anderer exakt vergleichbarer Wert.
export function gleich(beschreibung, ist, soll) {
  melde(beschreibung, ist === soll, `"${ist}" statt "${soll}"`);
}

// Ein Aufruf, der fehlschlagen MUSS. Ungültige Eingaben stillschweigend
// zu akzeptieren ist gefährlicher als sie abzulehnen — deshalb wird das
// hier ausdrücklich geprüft.
export function wirft(beschreibung, fn) {
  let geworfen = false;
  try {
    fn();
  } catch {
    geworfen = true;
  }
  melde(beschreibung, geworfen, 'wurde ohne Fehler akzeptiert');
}

function formatiere(wert) {
  return typeof wert === 'number' && !Number.isInteger(wert)
    ? wert.toPrecision(6)
    : String(wert);
}

// Der Bericht läuft beim Programmende von selbst. Schlägt etwas fehl,
// endet der Prozess mit Code 1 — daran erkennen npm und GitHub Actions,
// dass etwas nicht stimmt, und brechen ab.
let berichtet = false;

export function bericht() {
  if (berichtet) {
    return 0;
  }
  berichtet = true;

  let gesamt = 0;
  let fehlerhaft = 0;

  for (const lauf of laeufe) {
    gesamt += lauf.anzahl;
    fehlerhaft += lauf.fehler.length;
    const zeichen = lauf.fehler.length === 0 ? '✅' : '❌';
    console.log(`${zeichen} ${lauf.name} (${lauf.anzahl} Prüfungen)`);
    for (const fehler of lauf.fehler) {
      console.log(`     ${fehler}`);
    }
  }

  console.log('');
  if (fehlerhaft === 0) {
    console.log(`Alle ${gesamt} Prüfungen bestanden.`);
    return 0;
  }
  console.log(`${fehlerhaft} von ${gesamt} Prüfungen fehlgeschlagen.`);
  return 1;
}

process.on('exit', () => {
  const code = bericht();
  if (code !== 0) {
    process.exitCode = code;
  }
});
