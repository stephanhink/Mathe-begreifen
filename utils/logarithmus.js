// Logarithmen — die Umkehrfrage der Potenz.
//
// An 2³ = 8 lassen sich drei Fragen stellen, und nur die dritte heißt
// Logarithmus:
//
//   Was ist 2³?                 → 8    das ist die Potenz
//   Welche Zahl hoch 3 ist 8?   → 2    das ist die Wurzel
//   2 hoch WAS ist 8?           → 3    das ist der Logarithmus
//
// Der Logarithmus ist also nichts Neues, sondern die dritte Frage an
// dieselbe Gleichung. Genau so ist diese Datei gebaut: Jeder Rechenweg
// beginnt mit  b^x = a  — der Definition — und nicht mit einer Formel,
// die man auswendig können müsste. Wer den ersten Schritt hinschreibt,
// hat den Logarithmus verstanden; alles andere sind Potenzgesetze.
//
// Schreibweise wie im deutschen Unterricht:
//
//   log₂(8)   allgemein, die Basis steht tiefgestellt
//   lg(1000)  Basis 10 — der Zehnerlogarithmus
//   ln(5)     Basis e — der natürliche Logarithmus
//
// ---------------------------------------------------------------------
// Wo hier exakt gerechnet wird und wo nicht
// ---------------------------------------------------------------------
//
// Dieselbe Frage wie in geometrie.js, und sie wird genauso beantwortet:
// exakt, wo es exakt geht — und wo nicht, wird es gesagt.
//
//   log₂(8) = 3       EXAKT. 8 ist eine Potenz von 2.
//   log₈(4) = 2/3     EXAKT. Beide sind Potenzen von 2: 8 = 2³, 4 = 2².
//                     Der Exponent ist ein Bruch, aber ein genauer.
//   log₂(1/8) = −3    EXAKT. Ein negativer Exponent ist ein Kehrwert.
//   lg(2) ≈ 0,30103   GERUNDET, und die Datei sagt es dazu. 2 ist keine
//                     Potenz von 10.
//
// Dass die letzte Sorte wirklich irrational ist — und nicht bloß von
// dieser Datei nicht gefunden wurde —, ist beweisbar und nicht geraten:
// Wäre log_b(a) = p/q, dann wäre a^q = b^p. Zerlegt man beide Seiten in
// Primfaktoren, müssen a und b dieselbe "primitive" Wurzel haben (oder
// deren Kehrwert). Genau danach sucht exponentVon() — findet es nichts,
// gibt es auch keinen Bruch. Deshalb darf diese Datei "das ist keine
// Bruchzahl" behaupten, statt "das habe ich nicht hinbekommen".
//
// Für die Basis e gilt dasselbe aus einem anderen Grund: ln(a) = p/q
// hieße a = e^(p/q), und Potenzen von e mit rationalem Exponenten sind
// nach Lindemann transzendent, also keine Bruchzahlen. Exakt ist beim
// natürlichen Logarithmus deshalb nur ln(1) = 0.
//
// ---------------------------------------------------------------------
// Was hier NICHT steht
// ---------------------------------------------------------------------
//
// Dezibel und pH — die beiden Physik- und Chemie-Brücken aus CLAUDE.md —
// gehören als Anwendung hierher, aber nicht in diese Runde. Diese Datei
// legt die Grundlage dafür: lg() ist da, die Rechenwege sind benannt,
// und die Rückgabe sagt, ob gerundet wurde. Eine Anwendung, die einen
// gerundeten Wert für exakt hielte, wäre der schlimmste Fall.

import {
  bruch,
  mal,
  geteilt,
  kehrwert,
  istNull,
  istNegativ,
  vergleiche,
  gleich as bruchGleich,
  alsZahl as bruchAlsZahl,
  ausText as bruchAusText,
} from './bruch.js';

const EINS = bruch(1);
const ZEHN = bruch(10);

// Die eulersche Zahl als Basis. Sie ist keine Bruchzahl, deshalb ist sie
// hier ein eigenes Zeichen und kein Wert — sonst müsste irgendwo eine
// gerundete Zahl als "die Basis" stehen, und dann wäre nichts mehr exakt.
export const E = Object.freeze({ symbol: 'e', naeherung: Math.E });

// ---------------------------------------------------------------------
// Die drei Sorten Fehler (siehe CLAUDE.md)
// ---------------------------------------------------------------------

// "Das gibt es nicht" — log von null, log von einer negativen Zahl, die
// Basis 1. Alle drei sind keine Rechenfehler, sondern Fragen ohne
// Antwort, und die App rät dafür keine Zahl.
function werfeUndefiniert(nachricht) {
  const fehler = new Error(nachricht);
  fehler.undefiniert = true;
  return fehler;
}

// "Das ist kein Bruch — aber es gibt es." Dieselbe Sorte wie √2.
function werfeIrrational(nachricht) {
  const fehler = new Error(nachricht);
  fehler.irrational = true;
  return fehler;
}

// ---------------------------------------------------------------------
// Eingaben
// ---------------------------------------------------------------------

function alsBruch(wert, name) {
  if (typeof wert === 'object' && wert !== null && Number.isInteger(wert.z)) {
    return wert;
  }
  if (typeof wert === 'string') {
    return bruchAusText(wert);
  }
  if (typeof wert === 'number' && Number.isFinite(wert)) {
    return Number.isInteger(wert) ? bruch(wert) : ausKommazahl(wert);
  }
  throw new Error(`logarithmus: ${name} ist keine Zahl`);
}

// Exakt umrechnen, nicht über den gespeicherten Gleitkommawert: 2,5 soll
// 5/2 werden und nicht 5629499534213120/2251799813685248.
function ausKommazahl(wert) {
  const text = String(wert);
  const punkt = text.indexOf('.');
  if (punkt === -1) {
    return bruch(Number(text));
  }
  const nenner = 10 ** (text.length - punkt - 1);
  return bruch(Math.round(wert * nenner), nenner);
}

// Die Basis: entweder eine positive Bruchzahl ungleich 1 — oder e.
export function alsBasis(wert) {
  if (wert === E || wert === 'e' || wert === 'E') {
    return E;
  }
  const b = alsBruch(wert, 'Die Basis');
  if (istNull(b) || istNegativ(b)) {
    throw werfeUndefiniert(
      `Die Basis ${zahlText(b)} gibt es nicht: Ein Logarithmus braucht eine positive Basis. ` +
        'Bei einer negativen Basis springt das Vorzeichen bei jedem Schritt hin und her — ' +
        'dazwischen gäbe es nichts.'
    );
  }
  if (bruchGleich(b, EINS)) {
    throw werfeUndefiniert(
      'Die Basis 1 gibt es nicht: 1 hoch irgendetwas ist immer 1. ' +
        'Die Frage „1 hoch was ist 8?" hat keine Antwort, und die Frage „1 hoch was ist 1?" hat jede.'
    );
  }
  return b;
}

// Der Numerus — die Zahl, deren Logarithmus gesucht ist. Er muss positiv
// sein, und das ist keine Willkür: b^x ist für jede positive Basis wieder
// positiv, egal welches x man einsetzt. Es gibt also gar kein x, das null
// oder eine negative Zahl ergäbe.
export function alsNumerus(wert) {
  const a = alsBruch(wert, 'Der Numerus');
  if (istNull(a)) {
    throw werfeUndefiniert(
      'log(0) gibt es nicht: Keine Potenz einer positiven Basis wird jemals null. ' +
        'Man kommt der Null nur immer näher — 10⁻¹ = 0,1, 10⁻² = 0,01 —, erreicht sie aber nie.'
    );
  }
  if (istNegativ(a)) {
    throw werfeUndefiniert(
      `log(${zahlText(a)}) gibt es nicht: Eine Potenz einer positiven Basis ist immer positiv. ` +
        'Ein negativer Numerus hat deshalb keinen Logarithmus — auch keinen negativen.'
    );
  }
  return a;
}

// ---------------------------------------------------------------------
// Schreibweise
// ---------------------------------------------------------------------

const TIEF = '₀₁₂₃₄₅₆₇₈₉';

function tiefgestellt(text) {
  return text
    .split('')
    .map((z) => (z >= '0' && z <= '9' ? TIEF[Number(z)] : null))
    .reduce((aus, z) => (aus === null || z === null ? null : aus + z), '');
}

export function zahlText(wert) {
  if (wert === E) {
    return 'e';
  }
  const zaehler = String(wert.z).replace('-', '−');
  return wert.n === 1 ? zaehler : `${zaehler}/${wert.n}`;
}

// "log₂(8)", "lg(1000)", "ln(5)". Der Numerus darf auch als fertiger Text
// hereinkommen — dann steht dort "log₂(8 · 4)" statt der ausgerechneten
// Zahl. Der Renderer rechnet nicht: Was dasteht, ist das, was gefragt
// wurde.
export function schreibweise(basis, numerus) {
  const innen = typeof numerus === 'string' ? numerus : zahlText(numerus);
  if (basis === E) {
    return `ln(${innen})`;
  }
  if (bruchGleich(basis, ZEHN)) {
    return `lg(${innen})`;
  }
  const tief = basis.n === 1 && basis.z > 0 ? tiefgestellt(String(basis.z)) : null;
  return tief === null ? `log_(${zahlText(basis)})(${innen})` : `log${tief}(${innen})`;
}

// Eine Potenz im Fließtext: "2^5", "2^(−3)", "2^(3x)". Bewusst mit Dach
// und nicht mit Hochzahl — der unbekannte Exponent x ließe sich sonst
// nicht danebenschreiben, und ein halb hochgestellter Term liest sich
// schlechter als gar keiner. Das Dach steht ohnehin auf der Tastatur der
// App.
function potenzText(basisText, exponentText) {
  return `${einfach(basisText)}^${einfach(exponentText)}`;
}

// Geklammert wird alles, was nicht aus einem Stück besteht. Ohne diese
// Klammern stünde bei log₈(4) die Zeile "2^3^x" da — und die ist
// zweideutig. Genau der Fund aus tests/parser.mjs, nur an einer anderen
// Stelle: Die Schreibweise muss eindeutig sein, sonst liest der Leser
// etwas anderes, als dasteht.
function einfach(text) {
  return /^[0-9]+$/.test(text) || /^[a-zA-Z]$/.test(text) ? text : `(${text})`;
}

// Eine kleine Hochzahl für den Fließtext: 8³ statt 8^3. Nur dort, wo der
// Exponent eine feste Zahl ist — für den unbekannten Exponenten x bleibt
// es beim Dach, siehe potenzText().
const HOCH = '⁰¹²³⁴⁵⁶⁷⁸⁹';

export function hochzahl(n) {
  return String(n)
    .split('')
    .map((z) => (z === '-' ? '⁻' : HOCH[Number(z)]))
    .join('');
}

// Eine gerundete Zahl, mit Komma und typografischem Minus.
export function naeherungText(wert, stellen = 6) {
  const faktor = 10 ** stellen;
  const gerundet = Math.round(wert * faktor) / faktor;
  return String(gerundet).replace('.', ',').replace('-', '−');
}

function schritt(regel, text) {
  return { regel, text };
}

// ---------------------------------------------------------------------
// Der exakte Kern
// ---------------------------------------------------------------------

// Die k-te ganzzahlige Wurzel — oder null, wenn es keine gibt.
// Über Math.pow allein ginge es nicht: 125^(1/3) ist in Gleitkomma
// 4,999999999999999, und Math.round darauf trifft zwar, aber nur mit
// Glück. Deshalb wird der Kandidat anschließend nachgerechnet.
function ganzeWurzel(zahl, k) {
  if (zahl === 1) {
    return 1;
  }
  const grob = Math.round(zahl ** (1 / k));
  for (const kandidat of [grob - 1, grob, grob + 1]) {
    if (kandidat >= 1 && kandidat ** k === zahl) {
      return kandidat;
    }
  }
  return null;
}

// Die primitive Wurzel einer positiven Bruchzahl: das kleinste c, aus dem
// sich a als Potenz aufbauen lässt, samt Exponent.
//
//   8   → c = 2,   k = 3
//   1/8 → c = 1/2, k = 3
//   6   → c = 6,   k = 1   (6 ist keine Potenz von etwas Kleinerem)
//
// Darauf steht die ganze Exaktheit dieser Datei: Zwei Zahlen sind genau
// dann durch einen Bruch-Exponenten verbunden, wenn ihre primitiven
// Wurzeln übereinstimmen — oder Kehrwerte voneinander sind.
export function primitivwurzel(a) {
  const groesste = Math.max(a.z, a.n);
  const grenze = groesste < 2 ? 1 : Math.floor(Math.log2(groesste));

  for (let k = grenze; k >= 2; k--) {
    const z = ganzeWurzel(a.z, k);
    const n = ganzeWurzel(a.n, k);
    if (z !== null && n !== null) {
      return { basis: bruch(z, n), exponent: k };
    }
  }
  return { basis: a, exponent: 1 };
}

// Gibt es eine Bruchzahl x mit basis^x = numerus? Dann steht sie hier,
// sonst null. Null heißt: Es gibt sie WIRKLICH nicht (siehe der Beweis
// oben im Kopf der Datei) — nicht "hier hört mein Verfahren auf".
export function exponentVon(basis, numerus) {
  if (basis === E) {
    return bruchGleich(numerus, EINS) ? bruch(0) : null;
  }
  if (bruchGleich(numerus, EINS)) {
    return bruch(0);
  }

  const a = primitivwurzel(numerus);
  const b = primitivwurzel(basis);

  if (bruchGleich(a.basis, b.basis)) {
    return bruch(a.exponent, b.exponent);
  }
  // 1/8 und 2 haben die primitiven Wurzeln 1/2 und 2 — Kehrwerte
  // voneinander. Dann steht dasselbe da, nur mit negativem Exponenten.
  if (bruchGleich(a.basis, kehrwert(b.basis))) {
    return bruch(-a.exponent, b.exponent);
  }
  return null;
}

// Der Wert als Kommazahl. Für Diagramme, für Vergleiche, für die Stelle
// im Bildschirm, an der ausdrücklich "gerundet" darübersteht — nicht zum
// Weiterrechnen.
export function naeherung(basis, numerus) {
  const a = bruchAlsZahl(numerus);
  if (basis === E) {
    return Math.log(a);
  }
  const b = bruchAlsZahl(basis);
  // Math.log2 und Math.log10 sind genauer als der Umweg über den
  // Quotienten zweier Logarithmen: lg(1000) kommt so als glatte 3 heraus
  // und nicht als 2,9999999999999996.
  if (b === 2) {
    return Math.log2(a);
  }
  if (b === 10) {
    return Math.log10(a);
  }
  return Math.log(a) / Math.log(b);
}

// Zwischen welche beiden ganzen Zahlen fällt der Logarithmus?
//
//   10⁰ = 1  und  10¹ = 10,  und  1 < 2 < 10
//   also liegt lg(2) zwischen 0 und 1.
//
// Das ist der Schritt, den man im Unterricht als Erstes macht, und er ist
// exakt — auch wenn der Logarithmus selbst es nicht ist. Wer ihn geht,
// merkt sofort, wenn der Taschenrechner etwas völlig anderes anzeigt.
export function einordnung(basis, numerus) {
  if (basis === E || vergleiche(basis, EINS) < 0) {
    return null;
  }

  let k = 0;
  let unten = EINS;
  try {
    while (vergleiche(unten, numerus) > 0 && k > -40) {
      unten = geteilt(unten, basis);
      k--;
    }
    while (vergleiche(mal(unten, basis), numerus) <= 0 && k < 40) {
      unten = mal(unten, basis);
      k++;
    }
    if (k <= -40 || k >= 40) {
      return null;
    }
    return { unten: k, oben: k + 1, wertUnten: unten, wertOben: mal(unten, basis) };
  } catch {
    // Über 2^53 hinaus rechnet die Bruchrechnung nicht mehr exakt. Dann
    // gibt es hier eben keine Einordnung — geraten wird nichts.
    return null;
  }
}

// ---------------------------------------------------------------------
// Der Logarithmus mit Rechenweg
// ---------------------------------------------------------------------

// Nur der Wert, exakt — oder ein gekennzeichneter Fehler. Das Gegenstück
// zu auswerteExakt() in term.js, und mit denselben Kennzeichen: Wer
// `irrational` und `undefiniert` gleich behandelt, antwortet auf eine
// offene Frage mit einem sachlichen Nein.
export function logarithmusExakt(basisEingabe, numerusEingabe) {
  const basis = alsBasis(basisEingabe);
  const numerus = alsNumerus(numerusEingabe);
  const x = exponentVon(basis, numerus);
  if (x === null) {
    throw werfeIrrational(
      `${schreibweise(basis, numerus)} ist keine Bruchzahl — ${zahlText(numerus)} ist keine Potenz von ${zahlText(basis)}.`
    );
  }
  return x;
}

export function logarithmus(basisEingabe, numerusEingabe) {
  const basis = alsBasis(basisEingabe);
  const numerus = alsNumerus(numerusEingabe);

  const anfang = schreibweise(basis, numerus);
  const basisText = zahlText(basis);
  const numerusZeichen = zahlText(numerus);

  const gemeinsam = [
    schritt(
      'Der Logarithmus fragt nach dem Exponenten',
      `${potenzText(basisText, 'x')} = ${numerusZeichen}`
    ),
  ];

  // Der einfachste Fall, und er gilt für jede Basis: b⁰ = 1.
  if (bruchGleich(numerus, EINS)) {
    return fertigExakt(basis, numerus, anfang, bruch(0), [
      ...gemeinsam,
      schritt('jede Zahl hoch 0 ist 1', 'x = 0'),
    ]);
  }

  const x = exponentVon(basis, numerus);
  if (x === null) {
    return fertigGerundet(basis, numerus, anfang, gemeinsam);
  }

  // Beide Zahlen sind Potenzen derselben primitiven Wurzel c. Genau
  // daraus entsteht der Rechenweg — und zwar hergeleitet, nicht
  // nachgeschlagen.
  const b = primitivwurzel(basis);
  const a = primitivwurzel(numerus);
  const c = b.basis;
  const cText = zahlText(c);
  const m = b.exponent;
  const k = bruchGleich(a.basis, c) ? a.exponent : -a.exponent;

  const schritte = [...gemeinsam];

  schritte.push(
    schritt(
      m === 1
        ? `${numerusZeichen} als Potenz von ${cText} schreiben: ${numerusZeichen} = ${potenzText(cText, String(k).replace('-', '−'))}`
        : `beide Zahlen als Potenz von ${cText} schreiben: ${basisText} = ${potenzText(cText, String(m))} und ${numerusZeichen} = ${potenzText(cText, String(k).replace('-', '−'))}`,
      `${m === 1 ? potenzText(cText, 'x') : potenzText(potenzText(cText, String(m)), 'x')} = ${potenzText(cText, String(k).replace('-', '−'))}`
    )
  );

  if (m !== 1) {
    schritte.push(
      schritt(
        `Potenzgesetz: eine Potenz von einer Potenz — die Exponenten werden malgenommen`,
        `${potenzText(cText, `${m}x`)} = ${potenzText(cText, String(k).replace('-', '−'))}`
      )
    );
  }

  schritte.push(
    schritt(
      'gleiche Basis heißt gleicher Exponent',
      `${m === 1 ? 'x' : `${m}x`} = ${String(k).replace('-', '−')}`
    )
  );

  if (m !== 1) {
    schritte.push(schritt(`beide Seiten : ${m}`, `x = ${zahlText(x)}`));
  }

  return fertigExakt(basis, numerus, anfang, x, schritte);
}

function fertigExakt(basis, numerus, anfang, ergebnis, schritte) {
  return {
    art: 'exakt',
    basis,
    numerus,
    anfang,
    formel: 'log_b(a) = x   bedeutet   b^x = a',
    ergebnis,
    ergebnisText: zahlText(ergebnis),
    naeherung: bruchAlsZahl(ergebnis),
    exakt: true,
    gerundet: false,
    hinweis: null,
    schritte,
  };
}

function fertigGerundet(basis, numerus, anfang, gemeinsam) {
  const schritte = [...gemeinsam];
  const grenzen = einordnung(basis, numerus);

  if (grenzen) {
    schritte.push(
      schritt(
        `einordnen: ${potenzText(zahlText(basis), String(grenzen.unten).replace('-', '−'))} = ${zahlText(grenzen.wertUnten)} ` +
          `und ${potenzText(zahlText(basis), String(grenzen.oben).replace('-', '−'))} = ${zahlText(grenzen.wertOben)}`,
        `${String(grenzen.unten).replace('-', '−')} < x < ${String(grenzen.oben).replace('-', '−')}`
      )
    );
  }

  const wert = naeherung(basis, numerus);
  schritte.push(
    schritt(
      `${zahlText(numerus)} ist keine Potenz von ${zahlText(basis)} — dazwischen liegt keine Bruchzahl`,
      `x ≈ ${naeherungText(wert)}`
    )
  );

  return {
    art: 'gerundet',
    basis,
    numerus,
    anfang,
    formel: 'log_b(a) = x   bedeutet   b^x = a',
    ergebnis: null,
    ergebnisText: `≈ ${naeherungText(wert)}`,
    naeherung: wert,
    exakt: false,
    gerundet: true,
    hinweis:
      `Dieser Wert ist gerundet. ${anfang} lässt sich nicht als Bruch schreiben — ` +
      'genau wie √2. Jede Zahl, die man dafür hinschreibt, ist eine Näherung.',
    grenzen,
    schritte,
  };
}

// Die beiden Logarithmen mit eigenem Namen. Sie stehen so auf jedem
// Taschenrechner und in jeder Formelsammlung.
export function lg(numerus) {
  return logarithmus(10, numerus);
}

export function ln(numerus) {
  return logarithmus(E, numerus);
}

// ---------------------------------------------------------------------
// Die Logarithmusgesetze
// ---------------------------------------------------------------------
//
// Sie fallen nicht vom Himmel, sondern sind die Potenzgesetze von der
// anderen Seite gelesen. Deshalb steht bei jedem `warum` dabei, aus
// welchem Potenzgesetz es kommt — und deshalb hängt das Thema im
// Lernpfad unter potenzgesetzMal.
//
//   c^m · c^n = c^(m+n)     →   log(a · b) = log a + log b
//   c^m : c^n = c^(m−n)     →   log(a : b) = log a − log b
//   (c^m)^n  = c^(m·n)      →   log(aⁿ)    = n · log a
//
// Der Logarithmus IST der Exponent. Was mit Exponenten passiert, passiert
// deshalb mit Logarithmen — eine Stufe einfacher: Aus Malnehmen wird
// Addieren, aus Teilen Subtrahieren, aus Potenzieren Malnehmen. Genau
// dafür wurde er erfunden, dreihundert Jahre vor dem Taschenrechner.

// Ein Teilstück eines Gesetzes: der Logarithmus einer der beteiligten
// Zahlen, exakt oder gerundet.
function teil(basis, wert) {
  const x = exponentVon(basis, wert);
  return {
    numerus: wert,
    schreibweise: schreibweise(basis, wert),
    wert: x,
    exakt: x !== null,
    text: x === null ? naeherungText(naeherung(basis, wert)) : zahlText(x),
  };
}

// "3 + 2" — oder "≈ 0,30103 + 0,69897". Das Ungefähr-Zeichen steht EINMAL
// vorne für die ganze Zeile. An jeden Summanden geschrieben sähe es aus,
// als wären es verschiedene Sorten Zahl.
function zeile(teile, zeichen) {
  const text = teile.map((t) => t.text).join(` ${zeichen} `);
  return teile.every((t) => t.exakt) ? text : `≈ ${text}`;
}

// Der gemeinsame Bau aller drei Gesetze: Regel anwenden, Teile bestimmen,
// zusammenrechnen. Das Ergebnis kommt dabei NICHT aus den Teilen, sondern
// aus dem Ganzen — sonst wäre es gerundet, sobald ein Teil es ist.
//
// Und genau daran hängt der schönste Fall: lg(2) und lg(5) sind beide
// irrational, ihre Summe ist glatt 1. Wer aus zwei gerundeten Zahlen
// addiert, bekommt 0,999999…; wer weiß, dass 2 · 5 = 10 ist, bekommt 1.
function gesetz({ name, formel, warum, basis, ganzes, anfangText, schritte, teile }) {
  const x = exponentVon(basis, ganzes);
  const exakt = x !== null;
  const wert = exakt ? bruchAlsZahl(x) : naeherung(basis, ganzes);
  const teilweiseGerundet = teile.some((t) => !t.exakt);

  return {
    name,
    formel,
    warum,
    basis,
    anfang: anfangText,
    ergebnis: x,
    ergebnisText: exakt ? zahlText(x) : `≈ ${naeherungText(wert)}`,
    naeherung: wert,
    exakt,
    gerundet: !exakt,
    schritte,
    hinweis:
      exakt && teilweiseGerundet
        ? 'Die einzelnen Logarithmen sind gerundet, das Ergebnis ist es nicht: ' +
          `${schreibweise(basis, ganzes)} = ${zahlText(x)} genau. So rechnet man mit Logarithmen — ` +
          'die Regel gilt, auch wenn man die Einzelwerte gar nicht hinschreiben kann.'
        : !exakt
          ? `Dieser Wert ist gerundet: ${schreibweise(basis, ganzes)} ist keine Bruchzahl.`
          : null,
  };
}

// log_b(a · c) = log_b(a) + log_b(c)
export function produktregel(basisEingabe, ersterEingabe, zweiterEingabe) {
  const basis = alsBasis(basisEingabe);
  const a = alsNumerus(ersterEingabe);
  const c = alsNumerus(zweiterEingabe);
  const ganzes = mal(a, c);

  const links = teil(basis, a);
  const rechts = teil(basis, c);
  const anfangText = schreibweise(basis, `${zahlText(a)} · ${zahlText(c)}`);

  const schritte = [
    schritt(
      'Produktregel: log(a · c) = log a + log c',
      `${links.schreibweise} + ${rechts.schreibweise}`
    ),
    schritt('beide Logarithmen einzeln bestimmen', zeile([links, rechts], '+')),
  ];

  const summe = exponentVon(basis, ganzes);
  schritte.push(
    schritt(
      'zusammenrechnen',
      summe === null ? `≈ ${naeherungText(naeherung(basis, ganzes))}` : zahlText(summe)
    )
  );

  return gesetz({
    name: 'Produktregel',
    formel: 'log_b(a · c) = log_b(a) + log_b(c)',
    warum:
      'Beim Malnehmen von Potenzen mit gleicher Basis werden die Exponenten addiert. ' +
      'Der Logarithmus IST der Exponent — also werden die Logarithmen addiert.',
    basis,
    ganzes,
    anfangText,
    schritte,
    teile: [links, rechts],
  });
}

// log_b(a : c) = log_b(a) − log_b(c)
export function quotientenregel(basisEingabe, ersterEingabe, zweiterEingabe) {
  const basis = alsBasis(basisEingabe);
  const a = alsNumerus(ersterEingabe);
  const c = alsNumerus(zweiterEingabe);
  const ganzes = geteilt(a, c);

  const links = teil(basis, a);
  const rechts = teil(basis, c);
  const anfangText = schreibweise(basis, `${zahlText(a)} : ${zahlText(c)}`);

  const differenz = exponentVon(basis, ganzes);
  const schritte = [
    schritt(
      'Quotientenregel: log(a : c) = log a − log c',
      `${links.schreibweise} − ${rechts.schreibweise}`
    ),
    schritt('beide Logarithmen einzeln bestimmen', zeile([links, rechts], '−')),
    schritt(
      'zusammenrechnen',
      differenz === null ? `≈ ${naeherungText(naeherung(basis, ganzes))}` : zahlText(differenz)
    ),
  ];

  return gesetz({
    name: 'Quotientenregel',
    formel: 'log_b(a : c) = log_b(a) − log_b(c)',
    warum:
      'Beim Teilen von Potenzen mit gleicher Basis werden die Exponenten subtrahiert. ' +
      'Subtrahiert wird der untere vom oberen — die Reihenfolge zählt, anders als beim Produkt.',
    basis,
    ganzes,
    anfangText,
    schritte,
    teile: [links, rechts],
  });
}

// log_b(aⁿ) = n · log_b(a)
export function potenzregel(basisEingabe, numerusEingabe, exponentEingabe) {
  const basis = alsBasis(basisEingabe);
  const a = alsNumerus(numerusEingabe);
  const n = alsBruch(exponentEingabe, 'Der Exponent');

  if (n.n !== 1) {
    throw new Error(
      'potenzregel: Der Exponent muss hier eine ganze Zahl sein — ' +
        'ein Bruch im Exponenten ist eine Wurzel, und die kommt eine Stufe später.'
    );
  }

  const ganzes = potenzBruch(a, n.z);
  const innen = teil(basis, a);
  const anfangText = schreibweise(basis, `${zahlText(a)}${hochzahl(n.z)}`);

  const produktWert = exponentVon(basis, ganzes);
  const schritte = [
    schritt(
      'Potenzregel: log(aⁿ) = n · log a — der Exponent kommt als FAKTOR nach vorn',
      `${zahlText(n)} · ${innen.schreibweise}`
    ),
    schritt(
      'den Logarithmus bestimmen',
      zeile([{ text: zahlText(n), exakt: true }, innen], '·')
    ),
    schritt(
      'ausrechnen',
      produktWert === null ? `≈ ${naeherungText(naeherung(basis, ganzes))}` : zahlText(produktWert)
    ),
  ];

  return gesetz({
    name: 'Potenzregel',
    formel: 'log_b(aⁿ) = n · log_b(a)',
    warum:
      'aⁿ heißt: a wird n-mal mit sich selbst malgenommen. Nach der Produktregel wird der ' +
      'Logarithmus dabei n-mal addiert — und n-mal dasselbe addieren heißt mal n nehmen.',
    basis,
    ganzes,
    anfangText,
    schritte,
    teile: [innen],
  });
}

// Ganzzahlige Potenz einer Bruchzahl. bruch.hoch() könnte das auch, aber
// nur mit eigener Fehlermeldung für 0 — und die Null ist hier ohnehin
// schon abgefangen.
function potenzBruch(a, n) {
  let aus = EINS;
  const basis = n < 0 ? kehrwert(a) : a;
  for (let i = 0; i < Math.abs(n); i++) {
    aus = mal(aus, basis);
  }
  return aus;
}

// log_b(a) = log_c(a) : log_c(b)
//
// Das ist die Regel, mit der man einen Taschenrechner benutzt, der nur lg
// und ln kennt — und der Grund, warum log₂ auf keiner Tastatur steht.
export function basiswechsel(basisEingabe, numerusEingabe, neueBasisEingabe = 10) {
  const basis = alsBasis(basisEingabe);
  const numerus = alsNumerus(numerusEingabe);
  const neu = alsBasis(neueBasisEingabe);

  const oben = teil(neu, numerus);
  const unten = teil(neu, basis);
  const x = exponentVon(basis, numerus);
  const wert = x === null ? naeherung(basis, numerus) : bruchAlsZahl(x);

  return {
    name: 'Basiswechsel',
    formel: 'log_b(a) = log_c(a) : log_c(b)',
    warum:
      'Auf dem Taschenrechner gibt es nur lg und ln. Jeder andere Logarithmus lässt sich ' +
      'darauf zurückführen — der Quotient zweier Logarithmen zur selben neuen Basis.',
    basis,
    numerus,
    neueBasis: neu,
    anfang: schreibweise(basis, numerus),
    schritte: [
      schritt(
        `Basiswechsel auf die Basis ${zahlText(neu)}`,
        `${oben.schreibweise} : ${unten.schreibweise}`
      ),
      schritt('beide Logarithmen bestimmen', zeile([oben, unten], ':')),
      schritt(
        'teilen',
        x === null ? `≈ ${naeherungText(wert)}` : zahlText(x)
      ),
    ],
    ergebnis: x,
    ergebnisText: x === null ? `≈ ${naeherungText(wert)}` : zahlText(x),
    naeherung: wert,
    exakt: x !== null,
    gerundet: x === null,
    hinweis:
      x !== null && (!oben.exakt || !unten.exakt)
        ? `Oben und unten stehen gerundete Zahlen — der Wert ist trotzdem genau ${zahlText(x)}. ` +
          'Gerundet ist die Anzeige, nicht die Sache: Der Basiswechsel ändert nichts am Logarithmus, ' +
          'nur an der Art, ihn auszurechnen.'
        : null,
  };
}

// ---------------------------------------------------------------------

// Der Rechenweg als Text, zum Vorlesen und für die Prüfungen. Dieselbe
// Gestalt wie in prozent.js.
export function alsRechenweg(ergebnis) {
  const zeilen = [ergebnis.anfang];
  for (const s of ergebnis.schritte) {
    zeilen.push(`         | ${s.regel}`);
    zeilen.push(s.text);
  }
  zeilen.push(`= ${ergebnis.ergebnisText}`);
  return zeilen;
}
