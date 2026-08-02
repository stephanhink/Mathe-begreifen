// Übungsaufgaben erzeugen und Antworten prüfen.
//
// Zu jedem Thema aus utils/lernpfad.js gehört genau ein Generator. Ohne
// ihn könnte der Lückenfinder dort nicht nachfragen — deshalb prüft
// tests/aufgaben.mjs, dass keines fehlt.
//
// Zwei Dinge sind hier wichtiger als die Menge der Aufgaben:
//
// 1. **Die Zahlen sind gebaut, nicht gewürfelt.** Eine Gleichung wird
//    aus ihrer Lösung heraus konstruiert, eine quadratische aus ihren
//    beiden Nullstellen. Sonst käme bei jeder zweiten Aufgabe etwas wie
//    x = 17/23 heraus, und der Schüler scheitert am Bruchrechnen statt
//    an dem, was gefragt war.
//
// 2. **Geprüft wird der WERT, nicht die Schreibweise.** Wer "5 + 5x"
//    statt "5x + 5" schreibt, hat recht. Wer "5(x + 1)" schreibt, auch.
//    Das ist nur möglich, weil term.js exakt auswerten kann — und es
//    ist der Unterschied zwischen einer App, die Mathematik prüft, und
//    einer, die Tippfehler prüft.

import { bruch, gleich as bruchGleich, istGanz, alsText as bruchAlsText } from './bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  quotient,
  wurzel,
  variablen,
  auswerteExakt,
  auswerte,
  alsText as termAlsText,
  vereinfache,
} from './term.js';
import { gleichung, alsText as gleichungAlsText } from './gleichung.js';
import { parseTerm } from './parser.js';
import { alleThemen, holeThema } from './lernpfad.js';

const x = variable('x');

// x¹ schreibt niemand. Bei Exponent 1 steht einfach x da.
function xHoch(n) {
  return n === 1 ? x : potenz(x, zahl(n));
}

// Eine Zufallszahl aus einem Bereich, ohne die Null. "Berechne 0 · 7"
// ist keine Aufgabe.
function ohneNull(naechste, bis) {
  const wert = naechste(2 * bis) - bis;
  return wert === 0 ? bis : wert;
}

function ausListe(naechste, liste) {
  return liste[naechste(liste.length)];
}

// ---------------------------------------------------------------------
// Die Generatoren
// ---------------------------------------------------------------------
//
// Jeder gibt zurück:
//   frage     der Aufgabentext
//   art       'zahl' | 'term' | 'zahlen'  — was erwartet wird
//   loesung   Term (bei 'zahlen': Array von Termen)
//   term      optional: der Term, der umgeformt werden soll. Wer ihn
//             unverändert abschreibt, hat die Aufgabe nicht gelöst —
//             das prüft pruefeAntwort.

const GENERATOREN = {
  ganzeZahlenAddieren(naechste) {
    const a = ohneNull(naechste, 12);
    const b = ohneNull(naechste, 12);
    const c = ohneNull(naechste, 12);
    const t = summe(zahl(a), zahl(b), zahl(c));
    return {
      frage: `Berechne: ${termAlsText(t)}`,
      art: 'zahl',
      term: t,
      loesung: zahl(a + b + c),
    };
  },

  ganzeZahlenMultiplizieren(naechste) {
    const a = ohneNull(naechste, 9);
    const b = ohneNull(naechste, 9);
    // Mal die Hälfte der Aufgaben als Division — mit einem Produkt als
    // Dividend, damit sie aufgeht.
    if (naechste(2) === 0) {
      const t = produkt(zahl(a), zahl(b));
      return {
        frage: `Berechne: ${termAlsText(t)}`,
        art: 'zahl',
        term: t,
        loesung: zahl(a * b),
      };
    }
    const t = quotient(zahl(a * b), zahl(b));
    return {
      frage: `Berechne: ${termAlsText(t)}`,
      art: 'zahl',
      term: t,
      loesung: zahl(a),
    };
  },

  bruchKuerzen(naechste) {
    const gekuerzt = bruch(ohneNull(naechste, 9), naechste(9) + 2);
    const faktor = naechste(6) + 2;
    const t = zahl(bruch(gekuerzt.z * faktor, gekuerzt.n * faktor));
    return {
      // Der Term ist schon gekürzt, sobald man ihn baut — deshalb steht
      // die ungekürzte Form hier von Hand im Text.
      frage: `Kürze so weit wie möglich: ${gekuerzt.z * faktor}/${gekuerzt.n * faktor}`,
      art: 'zahl',
      loesung: t,
    };
  },

  bruchAddieren(naechste) {
    const a = bruch(ohneNull(naechste, 6), naechste(5) + 2);
    const b = bruch(ohneNull(naechste, 6), naechste(5) + 2);
    const t = summe(zahl(a), zahl(b));
    return {
      frage: `Berechne: ${termAlsText(t)}`,
      art: 'zahl',
      term: t,
      loesung: zahl(bruch(a.z * b.n + b.z * a.n, a.n * b.n)),
    };
  },

  bruchMultiplizieren(naechste) {
    const a = bruch(ohneNull(naechste, 6), naechste(5) + 2);
    const b = bruch(ohneNull(naechste, 6), naechste(5) + 2);
    const t = produkt(zahl(a), zahl(b));
    return {
      frage: `Berechne: ${termAlsText(t)}`,
      art: 'zahl',
      term: t,
      loesung: zahl(bruch(a.z * b.z, a.n * b.n)),
    };
  },

  bruchDividieren(naechste) {
    const a = bruch(ohneNull(naechste, 6), naechste(5) + 2);
    const b = bruch(ohneNull(naechste, 6), naechste(5) + 2);
    const t = quotient(zahl(a), zahl(b));
    return {
      frage: `Berechne: ${termAlsText(t)}`,
      art: 'zahl',
      term: t,
      loesung: zahl(bruch(a.z * b.n, a.n * b.z)),
    };
  },

  potenzDefinition(naechste) {
    const basis = naechste(4) + 2;
    const e = naechste(3) + 2;
    const t = potenz(zahl(basis), zahl(e));
    return {
      frage: `Schreibe als Zahl: ${termAlsText(t)}`,
      art: 'zahl',
      term: t,
      loesung: zahl(basis ** e),
    };
  },

  potenzgesetzMal(naechste) {
    const a = naechste(4) + 1;
    const b = naechste(4) + 1;
    const t = produkt(xHoch(a), xHoch(b));
    return {
      frage: `Vereinfache: ${termAlsText(t)}`,
      art: 'term',
      term: t,
      loesung: xHoch(a + b),
    };
  },

  potenzgesetzGeteilt(naechste) {
    const b = naechste(3) + 1;
    const a = b + naechste(3) + 1;
    const t = quotient(xHoch(a), xHoch(b));
    return {
      frage: `Vereinfache: ${termAlsText(t)}`,
      art: 'term',
      term: t,
      loesung: xHoch(a - b),
    };
  },

  negativeExponenten(naechste) {
    const basis = naechste(3) + 2;
    const e = naechste(3) + 1;
    const t = potenz(zahl(basis), zahl(-e));
    return {
      frage: `Schreibe als Bruch: ${termAlsText(t)}`,
      art: 'zahl',
      term: t,
      loesung: zahl(bruch(1, basis ** e)),
      hinweis: 'Ein negativer Exponent bedeutet einen Kehrwert, kein negatives Ergebnis.',
    };
  },

  wurzelZiehen(naechste) {
    const w = naechste(11) + 2;
    const t = wurzel(zahl(w * w));
    return {
      frage: `Berechne: ${termAlsText(t)}`,
      art: 'zahl',
      term: t,
      loesung: zahl(w),
    };
  },

  wurzelTeilweise(naechste) {
    const heraus = naechste(4) + 2;
    const rest = ausListe(naechste, [2, 3, 5, 6, 7]);
    const t = wurzel(zahl(heraus * heraus * rest));
    return {
      frage: `Ziehe teilweise die Wurzel: ${termAlsText(t)}`,
      art: 'term',
      term: t,
      loesung: produkt(zahl(heraus), wurzel(zahl(rest))),
    };
  },

  termZusammenfassen(naechste) {
    const a = ohneNull(naechste, 7);
    const b = ohneNull(naechste, 9);
    const c = ohneNull(naechste, 7);
    const t = summe(produkt(zahl(a), x), zahl(b), produkt(zahl(c), x));
    return {
      frage: `Fasse zusammen: ${termAlsText(t)}`,
      art: 'term',
      term: t,
      loesung: summe(produkt(zahl(a + c), x), zahl(b)),
    };
  },

  termMitPotenzen(naechste) {
    const a = ohneNull(naechste, 6);
    const b = ohneNull(naechste, 6);
    const c = ohneNull(naechste, 6);
    const t = summe(produkt(zahl(a), potenz(x, zahl(2))), produkt(zahl(b), x), produkt(zahl(c), potenz(x, zahl(2))));
    return {
      frage: `Fasse zusammen: ${termAlsText(t)}`,
      art: 'term',
      term: t,
      loesung: summe(produkt(zahl(a + c), potenz(x, zahl(2))), produkt(zahl(b), x)),
    };
  },

  ausmultiplizieren(naechste) {
    const a = ohneNull(naechste, 7);
    const b = ohneNull(naechste, 9);
    const t = produkt(zahl(a), summe(x, zahl(b)));
    return {
      frage: `Multipliziere aus: ${termAlsText(t)}`,
      art: 'term',
      term: t,
      loesung: summe(produkt(zahl(a), x), zahl(a * b)),
    };
  },

  binomischeFormeln(naechste) {
    const b = ohneNull(naechste, 7);
    const t = potenz(summe(x, zahl(b)), zahl(2));
    return {
      frage: `Multipliziere aus: ${termAlsText(t)}`,
      art: 'term',
      term: t,
      loesung: summe(potenz(x, zahl(2)), produkt(zahl(2 * b), x), zahl(b * b)),
    };
  },

  ausklammern(naechste) {
    const faktor = naechste(6) + 2;
    const a = ohneNull(naechste, 6);
    const b = ohneNull(naechste, 6);
    const t = summe(produkt(zahl(faktor * a), x), zahl(faktor * b));
    return {
      frage: `Klammere den größten gemeinsamen Faktor aus: ${termAlsText(t)}`,
      art: 'term',
      term: t,
      loesung: produkt(zahl(faktor), summe(produkt(zahl(a), x), zahl(b))),
    };
  },

  gleichungEinschrittig(naechste) {
    const loesung = ohneNull(naechste, 12);
    const b = ohneNull(naechste, 12);
    const g = gleichung(summe(x, zahl(b)), zahl(loesung + b));
    return {
      frage: `Löse die Gleichung: ${gleichungAlsText(g)}`,
      art: 'zahl',
      loesung: zahl(loesung),
    };
  },

  gleichungMehrschrittig(naechste) {
    const loesung = ohneNull(naechste, 9);
    const a = naechste(4) + 2;
    // c muss kleiner als a sein. Wären beide gleich, stünde links und
    // rechts dasselbe: "2x + 7 = 2x + 7" ist für jede Zahl wahr und
    // damit keine Aufgabe mit einer Lösung. Gefunden von der Prüfung,
    // die Generator und Löser gegeneinander laufen lässt.
    const c = naechste(a - 1) + 1;
    const b = ohneNull(naechste, 9);
    // a·x + b = c·x + (a−c)·loesung + b — geht immer auf.
    const g = gleichung(
      summe(produkt(zahl(a), x), zahl(b)),
      summe(produkt(zahl(c), x), zahl((a - c) * loesung + b))
    );
    return {
      frage: `Löse die Gleichung: ${gleichungAlsText(g)}`,
      art: 'zahl',
      loesung: zahl(loesung),
    };
  },

  gleichungMitKlammern(naechste) {
    const loesung = ohneNull(naechste, 8);
    const a = naechste(4) + 2;
    const b = ohneNull(naechste, 7);
    const g = gleichung(produkt(zahl(a), summe(x, zahl(b))), zahl(a * (loesung + b)));
    return {
      frage: `Löse die Gleichung: ${gleichungAlsText(g)}`,
      art: 'zahl',
      loesung: zahl(loesung),
    };
  },

  gleichungMitBruechen(naechste) {
    const nenner = naechste(4) + 2;
    const loesung = (ohneNull(naechste, 6)) * nenner;
    const b = ohneNull(naechste, 9);
    const g = gleichung(summe(quotient(x, zahl(nenner)), zahl(b)), zahl(loesung / nenner + b));
    return {
      frage: `Löse die Gleichung: ${gleichungAlsText(g)}`,
      art: 'zahl',
      loesung: zahl(loesung),
    };
  },

  quadratischeGleichung(naechste) {
    // Aus den Nullstellen gebaut: (x − r₁)(x − r₂) = x² − (r₁+r₂)x + r₁r₂.
    // So bleiben die Lösungen ganzzahlig und die Aufgabe prüft das, was
    // sie prüfen soll — die pq-Formel, nicht das Wurzelziehen aus 17.
    const r1 = ohneNull(naechste, 6);
    let r2 = ohneNull(naechste, 6);
    if (r2 === r1) {
      r2 = r1 + 1;
    }
    // Glieder mit Koeffizient 0 werden weggelassen — "x² + 0x − 4 = 0"
    // sieht nach Maschine aus, im Heft steht "x² − 4 = 0".
    const glieder = [potenz(x, zahl(2))];
    if (r1 + r2 !== 0) {
      glieder.push(produkt(zahl(-(r1 + r2)), x));
    }
    if (r1 * r2 !== 0) {
      glieder.push(zahl(r1 * r2));
    }
    const g = gleichung(summe(...glieder), zahl(0));
    return {
      frage: `Löse die Gleichung: ${gleichungAlsText(g)}`,
      art: 'zahlen',
      loesung: [zahl(Math.max(r1, r2)), zahl(Math.min(r1, r2))],
      hinweis: 'Es gibt zwei Lösungen. Schreibe beide, getrennt durch ein Semikolon.',
    };
  },
};

// ---------------------------------------------------------------------
// Aufgaben erzeugen
// ---------------------------------------------------------------------

// `naechste(n)` liefert eine ganze Zahl von 0 bis n−1. In den Prüfungen
// ist das ein gesteuerter Würfel (tests/wuerfel.mjs), in der App echter
// Zufall.
export function erzeugeAufgabe(themaId, naechste = zufall) {
  const generator = GENERATOREN[themaId];
  if (!generator) {
    throw new Error(`aufgaben: für "${themaId}" gibt es keinen Generator`);
  }
  const thema = holeThema(themaId);
  const roh = generator(naechste);

  return Object.freeze({
    thema: themaId,
    titel: thema?.titel ?? themaId,
    wissen: thema?.wissen ?? null,
    ...roh,
    loesungText: Array.isArray(roh.loesung)
      ? roh.loesung.map(termAlsText).join('; ')
      : termAlsText(roh.loesung),
  });
}

export function hatGenerator(themaId) {
  return Boolean(GENERATOREN[themaId]);
}

function zufall(n) {
  return Math.floor(Math.random() * n);
}

// ---------------------------------------------------------------------
// Antworten prüfen
// ---------------------------------------------------------------------

// Zwei Terme gelten als gleich, wenn sie überall denselben Wert haben.
// Wo sie sich exakt vergleichen lassen, wird exakt verglichen; sobald
// eine Wurzel im Spiel ist, numerisch mit Toleranz — dieselbe
// Unterscheidung wie in tests/term.mjs.
const STELLEN = [
  bruch(0),
  bruch(1),
  bruch(2),
  bruch(-1),
  bruch(-3),
  bruch(1, 2),
  bruch(-5, 3),
  bruch(7, 4),
  bruch(10),
];

export function wertgleich(a, b) {
  const namen = [...new Set([...variablen(a), ...variablen(b)])];

  if (namen.length === 0) {
    return einStellenVergleich(a, b, {});
  }
  if (namen.length > 1) {
    return false;
  }

  let verglichen = 0;
  for (const stelle of STELLEN) {
    const belegung = { [namen[0]]: stelle };
    const ergebnis = einStellenVergleich(a, b, belegung);
    if (ergebnis === null) {
      continue;
    }
    if (ergebnis === false) {
      return false;
    }
    verglichen++;
  }
  // Ganz ohne auswertbare Stelle wäre "gleich" eine leere Behauptung.
  return verglichen >= 3;
}

// true, false — oder null für "hier lässt es sich nicht vergleichen".
function einStellenVergleich(a, b, belegung) {
  let exaktA;
  let exaktB;
  try {
    exaktA = auswerteExakt(a, belegung);
    exaktB = auswerteExakt(b, belegung);
    return bruchGleich(exaktA, exaktB);
  } catch (fehler) {
    if (!fehler.irrational) {
      return null;
    }
  }

  try {
    const za = auswerte(a, belegung);
    const zb = auswerte(b, belegung);
    return Math.abs(za - zb) <= 1e-9 * Math.max(1, Math.abs(za), Math.abs(zb));
  } catch {
    return null;
  }
}

// Prüft die eingetippte Antwort.
//
// Rückgabe: { richtig, grund }. `grund` steht nur bei falschen Antworten
// und sagt, WAS nicht stimmt — "falsch" allein hilft niemandem.
export function pruefeAntwort(aufgabe, eingabe) {
  const text = String(eingabe).trim();
  if (text === '') {
    return { richtig: false, grund: 'Da steht noch nichts.' };
  }

  if (aufgabe.art === 'zahlen') {
    return pruefeMehrere(aufgabe, text);
  }

  let antwort;
  try {
    antwort = parseTerm(text);
  } catch (fehler) {
    return { richtig: false, grund: `Das kann ich nicht lesen: ${fehler.message}` };
  }

  // Die Aufgabe unverändert abzuschreiben gilt nicht. Bei "Vereinfache
  // x⁵ : x²" wäre "x⁵ : x²" wertgleich und trotzdem keine Antwort.
  if (aufgabe.term && termAlsText(antwort) === termAlsText(aufgabe.term)) {
    return { richtig: false, grund: 'Das ist die Aufgabe selbst — da ist noch nichts passiert.' };
  }

  if (!wertgleich(antwort, aufgabe.loesung)) {
    return { richtig: false, grund: 'Der Wert stimmt nicht.' };
  }

  // Bei einer Zahl als Antwort muss auch wirklich eine Zahl dastehen.
  if (aufgabe.art === 'zahl' && variablen(antwort).length > 0) {
    return { richtig: false, grund: 'Hier ist eine Zahl gesucht, kein Term mit Variablen.' };
  }
  if (aufgabe.art === 'zahl' && vereinfache(antwort).schritte.length > 0) {
    return { richtig: false, grund: 'Das lässt sich noch weiter ausrechnen.' };
  }

  return { richtig: true };
}

function pruefeMehrere(aufgabe, text) {
  const teile = text
    .split(/[;,]|\boder\b|\bund\b/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (teile.length !== aufgabe.loesung.length) {
    return {
      richtig: false,
      grund: `Hier werden ${aufgabe.loesung.length} Lösungen gesucht, du hast ${teile.length} angegeben.`,
    };
  }

  const antworten = [];
  for (const teil of teile) {
    try {
      antworten.push(parseTerm(teil));
    } catch (fehler) {
      return { richtig: false, grund: `"${teil}" kann ich nicht lesen.` };
    }
  }

  // Die Reihenfolge ist egal — es ist eine Menge, keine Liste.
  const offen = [...aufgabe.loesung];
  for (const antwort of antworten) {
    const stelle = offen.findIndex((soll) => wertgleich(antwort, soll));
    if (stelle === -1) {
      return { richtig: false, grund: `${termAlsText(antwort)} ist keine Lösung.` };
    }
    offen.splice(stelle, 1);
  }
  return { richtig: true };
}

// Für Prüfungen und für die Übersicht: Zu welchen Themen gibt es
// Aufgaben? Muss deckungsgleich mit dem Lernpfad sein.
export function themenMitAufgaben() {
  return alleThemen().filter(hatGenerator);
}
