// Terme darstellen, auswerten und umformen — mit benannten Schritten.
//
// Das ist die technische Hauptarbeit der App. Die eiserne Regel aus
// CLAUDE.md lautet:
//
//   Jeder Rechenschritt wird hergeleitet, nie nachgeschlagen — und jeder
//   Schritt hat einen Namen.
//
// Deshalb gibt keine Funktion hier einfach ein Ergebnis zurück. Sie gibt
// den Weg zurück: eine Liste von Schritten, jeder mit dem Namen der
// Regel, die angewandt wurde, und dem Term danach. Was man vorlesen kann,
// hat man verstanden.
//
// Ein Term ist ein Baum aus eingefrorenen Objekten. Gerechnet wird
// ausschließlich über utils/bruch.js, also exakt — ein Zwischenergebnis
// wie 0,30000000000000004 würde einem Schüler die ganze Rechnung
// kaputtmachen.
//
// Was hier NICHT steht: Gleichungen lösen. Das ist utils/gleichung.js und
// baut hierauf auf ("beide Seiten − 5" ist eine Aussage über eine
// Gleichung, nicht über einen Term).

import {
  bruch,
  ggT,
  kgV,
  plus,
  mal,
  geteilt,
  hoch,
  negativ,
  kehrwert,
  istBruch,
  istNull,
  istGanz,
  istNegativ,
  betrag as bruchBetrag,
  gleich as bruchGleich,
  alsZahl,
  ausDezimal,
  alsText as bruchAlsText,
} from './bruch.js';

// ---------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------
//
// summe und produkt sind mehrstellig, nicht zweistellig. a + b + c ist
// EINE Summe mit drei Gliedern, kein verschachteltes (a + b) + c. Das ist
// keine Kosmetik: "gleichartige Glieder zusammenfassen" muss alle Glieder
// gleichzeitig sehen können, sonst findet die Regel 3x + 5 + 2x nicht.
//
// Deshalb ziehen die Konstruktoren verschachtelte Summen und Produkte
// sofort flach und lassen entartete Fälle gar nicht erst entstehen.

export function zahl(wert) {
  const b = istBruch(wert) ? wert : bruch(wert);
  return Object.freeze({ art: 'zahl', wert: b });
}

export function variable(name) {
  if (typeof name !== 'string' || !/^[a-zA-Zα-ωΑ-Ω][0-9]?$/.test(name)) {
    throw new Error(`variable: "${name}" ist kein zulässiger Variablenname`);
  }
  return Object.freeze({ art: 'variable', name });
}

export function summe(...teile) {
  const flach = [];
  for (const t of teile) {
    pruefeTerm(t, 'summe');
    if (t.art === 'summe') {
      flach.push(...t.teile);
    } else {
      flach.push(t);
    }
  }
  if (flach.length === 0) {
    return zahl(0);
  }
  if (flach.length === 1) {
    return flach[0];
  }
  return Object.freeze({ art: 'summe', teile: Object.freeze(flach) });
}

export function produkt(...teile) {
  const flach = [];
  for (const t of teile) {
    pruefeTerm(t, 'produkt');
    if (t.art === 'produkt') {
      flach.push(...t.teile);
    } else {
      flach.push(t);
    }
  }
  if (flach.length === 0) {
    return zahl(1);
  }
  if (flach.length === 1) {
    return flach[0];
  }
  return Object.freeze({ art: 'produkt', teile: Object.freeze(flach) });
}

export function potenz(basis, exponent) {
  pruefeTerm(basis, 'potenz');
  pruefeTerm(exponent, 'potenz');
  return Object.freeze({ art: 'potenz', basis, exponent });
}

export function quotient(zaehler, nenner) {
  pruefeTerm(zaehler, 'quotient');
  pruefeTerm(nenner, 'quotient');
  return Object.freeze({ art: 'quotient', zaehler, nenner });
}

// Der Wurzelgrad ist eine feste Zahl, kein Term: In der Schule steht dort
// immer eine konkrete Zahl (2, 3, gelegentlich 4). Ein Term als
// Wurzelexponent wäre etwas anderes und käme über x^(1/n).
export function wurzel(radikand, grad = 2) {
  pruefeTerm(radikand, 'wurzel');
  if (!Number.isInteger(grad) || grad < 1) {
    throw new Error(`wurzel: Grad ${grad} muss eine ganze Zahl ≥ 1 sein`);
  }
  return Object.freeze({ art: 'wurzel', radikand, grad });
}

// Der Betrag. Er steht hier nicht als Zierde, sondern weil es ohne ihn
// keine ehrliche Antwort auf √(x²) gibt: Das ist |x|, nicht x. Bei
// x = −3 liefert √((−3)²) = √9 = 3, und das ist eben nicht −3.
//
// Diese eine Stelle ist der Grund, warum Wurzeln im Konzept als offene
// Frage vermerkt waren.
export function betrag(inhalt) {
  pruefeTerm(inhalt, 'betrag');
  return Object.freeze({ art: 'betrag', inhalt });
}

const ARTEN = [
  'zahl',
  'variable',
  'summe',
  'produkt',
  'potenz',
  'quotient',
  'wurzel',
  'betrag',
];

export function istTerm(wert) {
  return typeof wert === 'object' && wert !== null && ARTEN.includes(wert.art);
}

function pruefeTerm(wert, wo) {
  if (!istTerm(wert)) {
    throw new Error(`${wo}: "${kurz(wert)}" ist kein Term`);
  }
  return wert;
}

function kurz(wert) {
  if (wert === null || wert === undefined) {
    return String(wert);
  }
  return typeof wert === 'object' ? JSON.stringify(wert).slice(0, 60) : String(wert);
}

// ---------------------------------------------------------------------
// Durch den Baum laufen
// ---------------------------------------------------------------------

function kinderVon(term) {
  switch (term.art) {
    case 'summe':
    case 'produkt':
      return term.teile;
    case 'potenz':
      return [term.basis, term.exponent];
    case 'quotient':
      return [term.zaehler, term.nenner];
    case 'wurzel':
      return [term.radikand];
    case 'betrag':
      return [term.inhalt];
    default:
      return [];
  }
}

function mitKind(term, index, neu) {
  switch (term.art) {
    case 'summe': {
      const teile = [...term.teile];
      teile[index] = neu;
      return summe(...teile);
    }
    case 'produkt': {
      const teile = [...term.teile];
      teile[index] = neu;
      return produkt(...teile);
    }
    case 'potenz':
      return index === 0 ? potenz(neu, term.exponent) : potenz(term.basis, neu);
    case 'quotient':
      return index === 0 ? quotient(neu, term.nenner) : quotient(term.zaehler, neu);
    case 'wurzel':
      return wurzel(neu, term.grad);
    case 'betrag':
      return betrag(neu);
    default:
      throw new Error(`mitKind: ${term.art} hat keine Kinder`);
  }
}

// Alle Variablennamen im Term, alphabetisch und ohne Wiederholung.
export function variablen(term) {
  pruefeTerm(term, 'variablen');
  const gefunden = new Set();
  (function sammle(t) {
    if (t.art === 'variable') {
      gefunden.add(t.name);
    }
    kinderVon(t).forEach(sammle);
  })(term);
  return [...gefunden].sort();
}

// Strukturelle Gleichheit. Bewusst NICHT mathematische Gleichheit:
// x + 1 und 1 + x sind hier verschieden. Wer wissen will, ob zwei Terme
// denselben Wert haben, wertet sie aus — das ist eine andere Frage, und
// sie zu verwechseln ist der Anfang aller Fehler in so einem Modul.
export function istGleich(a, b) {
  pruefeTerm(a, 'istGleich');
  pruefeTerm(b, 'istGleich');
  return alsText(a) === alsText(b);
}

// ---------------------------------------------------------------------
// Auswerten
// ---------------------------------------------------------------------

// Exakt, in Brüchen. Die Belegung ordnet jedem Variablennamen einen Bruch
// zu: auswerteExakt(t, { x: bruch(1, 2) }).
//
// Wirft, wo es nichts zu rechnen gibt: unbelegte Variable, Division durch
// null, gebrochener Exponent. Nie eine Zahl raten — das ist dieselbe
// Haltung wie in der Chemie-App, wo kein Reaktionsprodukt erfunden wird.
export function auswerteExakt(term, belegung = {}) {
  pruefeTerm(term, 'auswerteExakt');

  switch (term.art) {
    case 'zahl':
      return term.wert;

    case 'variable': {
      const wert = belegung[term.name];
      if (wert === undefined) {
        throw new Error(`auswerteExakt: Variable "${term.name}" ist nicht belegt`);
      }
      if (!istBruch(wert)) {
        throw new Error(
          `auswerteExakt: Belegung für "${term.name}" ist kein Bruch — bitte bruch(z, n) benutzen`
        );
      }
      return wert;
    }

    case 'summe':
      return term.teile.reduce((s, t) => plus(s, auswerteExakt(t, belegung)), bruch(0));

    case 'produkt':
      return term.teile.reduce((p, t) => mal(p, auswerteExakt(t, belegung)), bruch(1));

    case 'potenz': {
      const e = auswerteExakt(term.exponent, belegung);
      if (!istGanz(e)) {
        throw new Error(
          `auswerteExakt: Exponent ${bruchAlsText(e)} ist keine ganze Zahl — ` +
            'gebrochene Exponenten sind Wurzeln und im Allgemeinen keine Brüche'
        );
      }
      return hoch(auswerteExakt(term.basis, belegung), e.z);
    }

    case 'quotient':
      return geteilt(auswerteExakt(term.zaehler, belegung), auswerteExakt(term.nenner, belegung));

    case 'wurzel':
      return wurzelExakt(auswerteExakt(term.radikand, belegung), term.grad);

    case 'betrag':
      return bruchBetrag(auswerteExakt(term.inhalt, belegung));

    default:
      throw new Error(`auswerteExakt: unbekannte Art "${term.art}"`);
  }
}

// Die n-te Wurzel eines Bruchs — exakt oder gar nicht.
//
// √(4/9) ist 2/3, das geht. √2 ist irrational und damit KEIN Bruch;
// dafür hat diese App keine Zahlendarstellung. Sie liefert dann auch
// keinen Näherungswert, sondern wirft — mit einem Kennzeichen, damit
// der Aufrufer "das ist keine rationale Zahl" von "das gibt es nicht"
// unterscheiden kann. Wer eine Kommazahl will, nimmt auswerte().
function wurzelExakt(wert, grad) {
  if (grad === 1) {
    return wert;
  }
  if (istNegativ(wert) && grad % 2 === 0) {
    const fehler = new Error(
      `Die ${grad}. Wurzel aus ${bruchAlsText(wert)} gibt es im Reellen nicht — ` +
        'aus einer negativen Zahl lässt sich keine Wurzel mit geradem Grad ziehen'
    );
    fehler.undefiniert = true;
    throw fehler;
  }

  const z = ganzeWurzel(wert.z, grad);
  const n = ganzeWurzel(wert.n, grad);
  if (z === null || n === null) {
    const fehler = new Error(
      `Die ${grad}. Wurzel aus ${bruchAlsText(wert)} ist irrational und lässt sich nicht als Bruch schreiben`
    );
    fehler.irrational = true;
    throw fehler;
  }
  return bruch(z, n);
}

// Die ganzzahlige n-te Wurzel, oder null. Der Kandidat aus Math.pow ist
// bei großen Zahlen um eins daneben — deshalb wird die Umgebung geprüft
// und das Ergebnis nachgerechnet, statt ihm zu glauben.
function ganzeWurzel(zahlwert, grad) {
  const vorzeichen = zahlwert < 0 ? -1 : 1;
  const betragWert = Math.abs(zahlwert);
  if (betragWert === 0) {
    return 0;
  }
  const geschaetzt = Math.round(betragWert ** (1 / grad));
  for (const kandidat of [geschaetzt - 1, geschaetzt, geschaetzt + 1]) {
    if (kandidat > 0 && kandidat ** grad === betragWert) {
      return vorzeichen * kandidat;
    }
  }
  return null;
}

// Als Kommazahl — für Funktionsgraphen und alles, was ohnehin nur
// gezeichnet wird. Nicht zum Weiterrechnen.
//
// Solange kein Term eine Wurzel enthält, ist das dasselbe wie
// auswerteExakt, nur eben gerundet. Sobald Wurzeln im Spiel sind, ist es
// der einzige Weg: √2 hat keine Bruchdarstellung, aber sehr wohl einen
// Zahlenwert, den man zeichnen kann.
//
// Undefinierte Stellen werden auch hier geworfen, nicht als NaN
// zurückgegeben. Eine stillschweigende NaN würde sich durch die ganze
// Rechnung ziehen und am Ende als leerer Graph erscheinen, ohne dass
// jemand sagen könnte, wo es schiefging.
export function auswerte(term, belegung = {}) {
  pruefeTerm(term, 'auswerte');

  const zahlwert = (t) => auswerte(t, belegung);

  switch (term.art) {
    case 'zahl':
      return alsZahl(term.wert);

    case 'variable': {
      const wert = belegung[term.name];
      if (wert === undefined) {
        throw new Error(`auswerte: Variable "${term.name}" ist nicht belegt`);
      }
      return istBruch(wert) ? alsZahl(wert) : Number(wert);
    }

    case 'summe':
      return term.teile.reduce((s, t) => s + zahlwert(t), 0);

    case 'produkt':
      return term.teile.reduce((p, t) => p * zahlwert(t), 1);

    case 'potenz': {
      const ergebnis = zahlwert(term.basis) ** zahlwert(term.exponent);
      return endlich(ergebnis, term);
    }

    case 'quotient': {
      const nenner = zahlwert(term.nenner);
      if (nenner === 0) {
        werfeUndefiniert(`Division durch null in "${alsText(term)}"`);
      }
      return zahlwert(term.zaehler) / nenner;
    }

    case 'wurzel': {
      const r = zahlwert(term.radikand);
      if (r < 0 && term.grad % 2 === 0) {
        werfeUndefiniert(
          `Die ${term.grad}. Wurzel aus ${r} gibt es im Reellen nicht`
        );
      }
      // Math.pow(-8, 1/3) ist NaN — negative Basis mit gebrochenem
      // Exponenten kennt JavaScript nicht. Bei ungeradem Grad wird das
      // Vorzeichen deshalb von Hand herausgezogen: ∛(−8) = −∛8 = −2.
      const wurzelwert = Math.abs(r) ** (1 / term.grad);
      return endlich(r < 0 ? -wurzelwert : wurzelwert, term);
    }

    case 'betrag':
      return Math.abs(zahlwert(term.inhalt));

    default:
      throw new Error(`auswerte: unbekannte Art "${term.art}"`);
  }
}

function endlich(wert, term) {
  if (!Number.isFinite(wert)) {
    werfeUndefiniert(`"${alsText(term)}" hat hier keinen Zahlenwert`);
  }
  return wert;
}

function werfeUndefiniert(nachricht) {
  const fehler = new Error(nachricht);
  fehler.undefiniert = true;
  throw fehler;
}

// ---------------------------------------------------------------------
// Aufschreiben
// ---------------------------------------------------------------------

// Das Minuszeichen ist U+2212, nicht der Bindestrich der Tastatur.
// bruch.js liefert "-3" mit Bindestrich; hier wird daraus "−3".
//
// Das ist nicht Pedanterie: In einer Summe steht ohnehin schon "−"
// (a − b), und wenn der Koeffizient daneben einen Bindestrich trüge,
// stünden zwei verschieden lange Striche in derselben Zeile. Auf einem
// Handy-Display sieht das nach Fehler aus.
const MINUS = '−';

// Wird auch von gleichung.js gebraucht: "L = { −3 }" muss dasselbe
// Minuszeichen tragen wie der Term darüber.
export function zahlAlsText(wert) {
  return bruchAlsText(wert).replace('-', MINUS);
}

const zahlText = zahlAlsText;

const HOCHGESTELLT = {
  '-': '⁻',
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
};

// Bindungsstärke, damit nur die Klammern gesetzt werden, die man wirklich
// braucht. Zu viele Klammern sind fast so schlimm wie zu wenige: Sie
// lassen einen einfachen Term kompliziert aussehen.
//
// Die Wurzel steht bewusst NICHT ganz oben, obwohl √x wie ein
// geschlossenes Zeichen aussieht. Grund: In "√x²" wäre nicht zu
// erkennen, ob die Wurzel oder das Quadrat zuerst kommt — auf Papier
// entscheidet das der Wurzelstrich, den es hier nicht gibt. Also muss
// dort "(√x)²" stehen.
//
// Der Betrag darf dagegen ganz oben stehen: |x| bringt seine
// Begrenzungen mit, |x|² ist eindeutig.
// Die Division bindet SCHWÄCHER als die Multiplikation, obwohl beide
// gleichrangig sind. Der Grund ist die Eindeutigkeit beim Wiedereinlesen:
// "3 · x : y" ließe offen, ob 3 · (x : y) oder (3 · x) : y gemeint ist.
// Im Wert ist das dasselbe, im Term nicht — und die Rundreise-Prüfung in
// tests/parser.mjs merkt genau das. Also bekommt eine Division innerhalb
// eines Produkts eine Klammer: "3 · (x : y)".
const STAERKE = {
  summe: 1,
  quotient: 2,
  produkt: 3,
  wurzel: 3,
  potenz: 4,
  zahl: 5,
  variable: 5,
  betrag: 5,
};

const WURZELZEICHEN = { 2: '√', 3: '∛', 4: '∜' };

export function alsText(term) {
  pruefeTerm(term, 'alsText');

  switch (term.art) {
    case 'zahl':
      return zahlText(term.wert);

    case 'variable':
      return term.name;

    case 'summe':
      return term.teile
        .map((t, i) => {
          const text = geklammert(t, 'summe');
          if (i === 0) {
            return text;
          }
          // Ein negatives Glied wird als Minus geschrieben, nicht als
          // "+ −3". So schreibt es auch der Unterricht.
          return text.startsWith(MINUS) ? ` ${MINUS} ${text.slice(1)}` : ` + ${text}`;
        })
        .join('');

    case 'produkt':
      return produktAlsText(term);

    case 'potenz':
      return potenzAlsText(term);

    case 'quotient':
      return `${geklammert(term.zaehler, 'quotient')} : ${geklammert(term.nenner, 'potenz')}`;

    case 'wurzel':
      return wurzelAlsText(term);

    case 'betrag':
      return `|${alsText(term.inhalt)}|`;

    default:
      throw new Error(`alsText: unbekannte Art "${term.art}"`);
  }
}

function wurzelAlsText(term) {
  const zeichen = WURZELZEICHEN[term.grad] ?? `${hochgestellt(term.grad)}√`;

  // Unter der Wurzel steht auf Papier ein Strich, der zusammenhält, was
  // dazugehört. In einer Textzeile gibt es den nicht — also muss alles
  // in Klammern, was mehr als ein Zeichen ist. "√2x" wäre sonst nicht
  // von "√(2x)" zu unterscheiden, und die beiden sind verschieden.
  //
  // Ohne Klammern kommen deshalb nur ein Buchstabe und eine nicht
  // negative ganze Zahl aus. Ein Bruch nicht: "√4/9" läse sich als
  // (√4)/9 und wäre 2/9 statt 2/3. Eine negative Zahl auch nicht,
  // damit das Minus nicht zwischen Wurzelzeichen und Ziffer verloren
  // geht.
  const r = term.radikand;
  const einfach =
    r.art === 'variable' || (r.art === 'zahl' && istGanz(r.wert) && !istNegativ(r.wert));
  return einfach ? `${zeichen}${alsText(r)}` : `${zeichen}(${alsText(r)})`;
}

function hochgestellt(zahlwert) {
  const ziffern = String(zahlwert);
  return [...ziffern].every((z) => z in HOCHGESTELLT)
    ? [...ziffern].map((z) => HOCHGESTELLT[z]).join('')
    : ziffern;
}

function geklammert(term, umgebung) {
  const text = alsText(term);
  return STAERKE[term.art] < STAERKE[umgebung] ? `(${text})` : text;
}

function produktAlsText(term) {
  // Jeder Faktor wird einzeln aufgeschrieben, in der Reihenfolge, in der
  // er dasteht. Hier wird NICHT gerechnet.
  //
  // Das klingt selbstverständlich, war es aber nicht: Eine frühere
  // Fassung fasste alle Zahlfaktoren zusammen und schrieb für 3 · 4
  // schlicht "12". Damit sah der Term vor und nach dem Schritt "Zahlen
  // zusammenrechnen" gleich aus — und der Schritt verschwand
  // stillschweigend aus dem Rechenweg, weil der Antrieb ihn für einen
  // Leerlauf hielt. Aufgefallen ist das erst der Rundreise-Prüfung in
  // tests/parser.mjs.
  const stuecke = term.teile.map((t) => geklammert(t, 'produkt'));
  const [erster, zweiter] = term.teile;

  // 1 · x ist x, (−1) · x ist −x. Das ist keine Rechnung, sondern
  // Schreibweise — aber nur vor einem Faktor, der keine Zahl ist.
  // "1 · 2" bleibt "1 · 2", sonst wäre wieder gerechnet.
  if (erster.art === 'zahl' && zweiter !== undefined && zweiter.art !== 'zahl') {
    if (bruchGleich(erster.wert, bruch(1))) {
      return stuecke.slice(1).join(' · ');
    }
    if (bruchGleich(erster.wert, bruch(-1))) {
      return `${MINUS}${stuecke.slice(1).join(' · ')}`;
    }

    // Zwischen Zahl und Buchstabe steht kein Malpunkt: 3x, nicht 3 · x.
    // Das gilt auch, wenn weitere Faktoren folgen — 2x · (1 + 3x) liest
    // sich wie im Heft.
    //
    // Vor einer Klammer bleibt der Punkt stehen: 2 · (x + 3). Ohne ihn
    // stünde dort 2(x + 3), und dann müsste man erklären, warum hier ein
    // unsichtbares Mal steht und bei f(x) nicht.
    //
    // Vor allem NICHT bei einem Bruch als Koeffizient: "1/2x" liest sich
    // wie 1/(2x) und meint das Gegenteil.
    //
    // Vor einer Wurzel dagegen schon: 5√2, nicht 5 · √2.
    const ohnePunkt =
      istGanz(erster.wert) &&
      (zweiter.art === 'variable' || zweiter.art === 'potenz' || zweiter.art === 'wurzel');
    if (ohnePunkt) {
      return [`${stuecke[0]}${stuecke[1]}`, ...stuecke.slice(2)].join(' · ');
    }
  }

  return stuecke.join(' · ');
}

function potenzAlsText(term) {
  // Zwei Fälle brauchen eine Klammer, die die Bindungsstärke allein
  // nicht erzwingt — beide von der Rundreise-Prüfung gefunden:
  //
  //   (x⁰)²   sonst stünde "x⁰²", und das läse sich als x⁰²  = x²
  //   (−4)²   sonst stünde "−4²", und das läse sich als −(4²) = −16
  //
  // Der zweite ist der gefährlichere: Das Ergebnis wäre nicht nur
  // anders, sondern hätte das falsche Vorzeichen.
  const basisBrauchtKlammer =
    term.basis.art === 'potenz' ||
    (term.basis.art === 'zahl' && istNegativ(term.basis.wert));

  const basisText = basisBrauchtKlammer
    ? `(${alsText(term.basis)})`
    : geklammert(term.basis, 'potenz');

  if (term.exponent.art === 'zahl' && istGanz(term.exponent.wert)) {
    const ziffern = String(term.exponent.wert.z);
    if ([...ziffern].every((z) => z in HOCHGESTELLT)) {
      return basisText + [...ziffern].map((z) => HOCHGESTELLT[z]).join('');
    }
  }
  return `${basisText}^(${alsText(term.exponent)})`;
}

// ---------------------------------------------------------------------
// Monome zerlegen
// ---------------------------------------------------------------------
//
// Ein Produkt wie 6x²y wird zerlegt in den Zahlfaktor 6 und die
// Potenzen { x: 2, y: 1 }. Darauf stützen sich gleich drei Regeln:
// Zahlen zusammenrechnen, Potenzgesetze, gleichartige Glieder finden.
//
// Als Schlüssel für "gleichartig" dient der Text der Basis. Zwei Terme,
// die verschieden geschrieben sind, gelten dabei als verschieden — das
// verhindert nichts Richtiges, es lässt nur eine Zusammenfassung aus.
// Ein Fehler in diese Richtung ist harmlos, in die andere wäre er es
// nicht.

function zerlegeMonom(term) {
  let koeffizient = bruch(1);
  const potenzen = new Map();

  const faktoren = term.art === 'produkt' ? term.teile : [term];

  for (const f of faktoren) {
    if (f.art === 'zahl') {
      koeffizient = mal(koeffizient, f.wert);
      continue;
    }

    let basis = f;
    let exponent = 1;
    if (f.art === 'potenz' && f.exponent.art === 'zahl' && istGanz(f.exponent.wert)) {
      basis = f.basis;
      exponent = f.exponent.wert.z;
    }

    const schluessel = alsText(basis);
    const vorhanden = potenzen.get(schluessel);
    if (vorhanden) {
      vorhanden.exponent += exponent;
    } else {
      potenzen.set(schluessel, { basis, exponent });
    }
  }

  return { koeffizient, potenzen };
}

function baueMonom({ koeffizient, potenzen }) {
  if (istNull(koeffizient)) {
    return zahl(0);
  }

  const faktoren = [];
  for (const { basis, exponent } of [...potenzen.values()].sort((a, b) =>
    alsText(a.basis) < alsText(b.basis) ? -1 : 1
  )) {
    if (exponent === 0) {
      continue;
    }
    faktoren.push(exponent === 1 ? basis : potenz(basis, zahl(exponent)));
  }

  if (faktoren.length === 0) {
    return zahl(koeffizient);
  }
  if (bruchGleich(koeffizient, bruch(1))) {
    return produkt(...faktoren);
  }
  return produkt(zahl(koeffizient), ...faktoren);
}

// Der Schlüssel, an dem "gleichartig" hängt: alles außer dem Zahlfaktor.
function monomSchluessel({ potenzen }) {
  return [...potenzen.values()]
    .filter((p) => p.exponent !== 0)
    .map((p) => `${alsText(p.basis)}^${p.exponent}`)
    .sort()
    .join('·');
}

// ---------------------------------------------------------------------
// Die Regeln
// ---------------------------------------------------------------------
//
// Jede Regel bekommt einen Term und gibt entweder einen umgeformten Term
// zurück oder null ("hier bin ich nicht zuständig"). Jede trägt einen
// Namen, der im Rechenweg erscheint — auf Deutsch, so wie man ihn
// vorlesen würde.
//
// Und jede muss den Wert des Terms unverändert lassen. Das ist keine
// Absichtsbekundung, sondern geprüft: tests/term.mjs wertet vor und nach
// jedem Schritt an 200 zufälligen Stellen exakt aus und vergleicht.

const NEUTRALE_ELEMENTE = {
  name: 'neutrale Elemente weglassen',
  anwenden(t) {
    if (t.art === 'summe') {
      const ohneNull = t.teile.filter((x) => !(x.art === 'zahl' && istNull(x.wert)));
      if (ohneNull.length !== t.teile.length) {
        return ohneNull.length === 0 ? zahl(0) : summe(...ohneNull);
      }
    }

    if (t.art === 'produkt') {
      // Ein einziger Faktor 0 macht das ganze Produkt zu 0.
      if (t.teile.some((x) => x.art === 'zahl' && istNull(x.wert))) {
        return zahl(0);
      }
      const ohneEins = t.teile.filter((x) => !(x.art === 'zahl' && bruchGleich(x.wert, bruch(1))));
      if (ohneEins.length !== t.teile.length) {
        return ohneEins.length === 0 ? zahl(1) : produkt(...ohneEins);
      }
    }

    if (t.art === 'potenz' && t.exponent.art === 'zahl' && istGanz(t.exponent.wert)) {
      const e = t.exponent.wert.z;
      if (e === 1) {
        return t.basis;
      }
      // x⁰ ist 1 — außer für x = 0, wo 0⁰ nicht definiert ist. Diese
      // Regel darf deshalb nur greifen, wenn die Basis sicher nicht null
      // ist, also bei einer Zahl ungleich null. Bei x⁰ mit unbekanntem x
      // bleibt der Term stehen. Genau daran scheitern große
      // Computeralgebra-Systeme regelmäßig, und für eine Lern-App wäre
      // ein stillschweigend falscher Definitionsbereich das Schlimmste.
      if (e === 0 && t.basis.art === 'zahl' && !istNull(t.basis.wert)) {
        return zahl(1);
      }
    }

    if (t.art === 'quotient' && t.nenner.art === 'zahl' && bruchGleich(t.nenner.wert, bruch(1))) {
      return t.zaehler;
    }

    // Die erste Wurzel einer Zahl ist die Zahl selbst.
    if (t.art === 'wurzel' && t.grad === 1) {
      return t.radikand;
    }

    // ||x|| ist |x| — der Betrag eines Betrags bringt nichts Neues.
    if (t.art === 'betrag' && t.inhalt.art === 'betrag') {
      return t.inhalt;
    }

    return null;
  },
};

const ZAHLEN_ZUSAMMENRECHNEN = {
  name: 'Zahlen zusammenrechnen',
  anwenden(t) {
    if (t.art === 'summe') {
      const zahlen = t.teile.filter((x) => x.art === 'zahl');
      if (zahlen.length < 2) {
        return null;
      }
      const wert = zahlen.reduce((s, x) => plus(s, x.wert), bruch(0));
      const rest = t.teile.filter((x) => x.art !== 'zahl');
      return summe(...rest, zahl(wert));
    }

    if (t.art === 'produkt') {
      const zahlen = t.teile.filter((x) => x.art === 'zahl');
      if (zahlen.length < 2) {
        return null;
      }
      const wert = zahlen.reduce((p, x) => mal(p, x.wert), bruch(1));
      const rest = t.teile.filter((x) => x.art !== 'zahl');
      return produkt(zahl(wert), ...rest);
    }

    // Eine Null im Nenner ist kein Grund abzustürzen. "5 : 0" ist ein
    // Term, den man hinschreiben kann — er hat nur keinen Wert. Also
    // bleibt er beim Umformen stehen und wirft erst beim Auswerten.
    // Andernfalls brächte ein Tippfehler im Eingabefeld die App zu Fall,
    // noch bevor irgendetwas gerechnet wurde.
    if (
      t.art === 'quotient' &&
      t.zaehler.art === 'zahl' &&
      t.nenner.art === 'zahl' &&
      !istNull(t.nenner.wert)
    ) {
      return zahl(geteilt(t.zaehler.wert, t.nenner.wert));
    }

    if (
      t.art === 'potenz' &&
      t.basis.art === 'zahl' &&
      t.exponent.art === 'zahl' &&
      istGanz(t.exponent.wert) &&
      !(istNull(t.basis.wert) && t.exponent.wert.z <= 0)
    ) {
      return zahl(hoch(t.basis.wert, t.exponent.wert.z));
    }

    if (t.art === 'betrag' && t.inhalt.art === 'zahl') {
      return zahl(bruchBetrag(t.inhalt.wert));
    }

    return null;
  },
};

const WURZEL_ZIEHEN = {
  name: 'Wurzel ziehen',
  anwenden(t) {
    if (t.art !== 'wurzel' || t.radikand.art !== 'zahl') {
      return null;
    }
    try {
      return zahl(wurzelExakt(t.radikand.wert, t.grad));
    } catch {
      // Irrational (√2) oder im Reellen nicht vorhanden (√−4): Beides
      // ist kein Grund umzuformen. Der Term bleibt stehen und sagt
      // damit die Wahrheit — geraten wird nichts.
      return null;
    }
  },
};

const TEILWEISE_WURZEL = {
  name: 'teilweise Wurzel ziehen',
  anwenden(t) {
    if (t.art !== 'wurzel' || t.radikand.art !== 'zahl') {
      return null;
    }
    const wert = t.radikand.wert;
    if (!istGanz(wert) || istNegativ(wert) || istNull(wert)) {
      return null;
    }

    // Den größten Faktor k herausziehen, dessen grad-te Potenz im
    // Radikanden steckt: √50 = √(25 · 2) = 5√2.
    let heraus = 1;
    let rest = wert.z;
    for (let teiler = 2; teiler ** t.grad <= rest; teiler++) {
      const potenzWert = teiler ** t.grad;
      while (rest % potenzWert === 0) {
        rest /= potenzWert;
        heraus *= teiler;
      }
    }

    if (heraus === 1) {
      return null;
    }
    return produkt(zahl(heraus), wurzel(zahl(rest), t.grad));
  },
};

const WURZEL_AUS_POTENZ = {
  name: 'Wurzel aus einer Potenz ziehen',
  anwenden(t) {
    if (t.art !== 'wurzel' || t.radikand.art !== 'potenz') {
      return null;
    }
    const e = t.radikand.exponent;
    if (e.art !== 'zahl' || !istGanz(e.wert) || e.wert.z !== t.grad) {
      return null;
    }

    // Hier sitzt die Falle, wegen der Wurzeln im Konzept als offene
    // Frage vermerkt waren:
    //
    //   √(x²) ist NICHT x, sondern |x|.
    //
    // Bei x = −3 ist √((−3)²) = √9 = 3, und das ist nicht −3. Wer die
    // Wurzel gegen das Quadrat einfach wegkürzt, macht aus einer immer
    // richtigen Aussage eine, die für die halbe Zahlengerade falsch
    // ist. Bei ungeradem Grad gibt es das Problem nicht: ∛(x³) ist x,
    // auch für negative x.
    return t.grad % 2 === 0 ? betrag(t.radikand.basis) : t.radikand.basis;
  },
};

const ZAHL_NACH_VORN = {
  name: 'die Zahl vor den Buchstaben schreiben',
  anwenden(t) {
    if (t.art !== 'produkt') {
      return null;
    }
    const zahlen = t.teile.filter((f) => f.art === 'zahl');
    const rest = t.teile.filter((f) => f.art !== 'zahl');
    if (zahlen.length === 0 || rest.length === 0) {
      return null;
    }
    // Stehen die Zahlen schon vorn, ist nichts zu tun.
    if (t.teile.slice(0, zahlen.length).every((f) => f.art === 'zahl')) {
      return null;
    }

    // Reine Schreibweise, kein Rechnen — erlaubt ist es, weil bei der
    // Multiplikation die Reihenfolge egal ist.
    //
    // Nötig ist es, weil beim Ausmultiplizieren beides nebeneinander
    // entsteht: (x + 3)(x + 3) liefert unter anderem "x · 3" und
    // "3 · x". In einer Zeile beides zu sehen ist für jemanden, der
    // gerade lernt, unnötig verwirrend — im Heft steht die Zahl vorn.
    return produkt(...zahlen, ...rest);
  },
};

const KEHRWERT_STATT_TEILEN = {
  name: 'durch eine Zahl teilen heißt mit dem Kehrwert malnehmen',
  anwenden(t) {
    if (t.art !== 'quotient' || t.nenner.art !== 'zahl' || istNull(t.nenner.wert)) {
      return null;
    }
    // Nur bei einer Zahl im Nenner. Steht dort ein Term mit Variablen,
    // hat er womöglich Nullstellen — dann wäre der Kehrwert an genau
    // diesen Stellen nicht definiert, und die Umformung würde den
    // Definitionsbereich verschieben.
    return produkt(zahl(kehrwert(t.nenner.wert)), t.zaehler);
  },
};

const POTENZGESETZ = {
  name: 'Potenzgesetz: gleiche Basis, Exponenten addieren',
  anwenden(t) {
    if (t.art !== 'produkt') {
      return null;
    }
    const zerlegt = zerlegeMonom(t);
    // Nur zuständig, wenn dabei wirklich Potenzen verschmelzen.
    const anzahlVorher = t.teile.filter((x) => x.art !== 'zahl').length;
    const anzahlNachher = [...zerlegt.potenzen.values()].filter((p) => p.exponent !== 0).length;
    if (anzahlNachher >= anzahlVorher) {
      return null;
    }
    return baueMonom(zerlegt);
  },
};

const GLEICHARTIGE_GLIEDER = {
  name: 'gleichartige Glieder zusammenfassen',
  anwenden(t) {
    if (t.art !== 'summe') {
      return null;
    }

    const gruppen = new Map();
    for (const glied of t.teile) {
      const zerlegt = zerlegeMonom(glied);
      const schluessel = monomSchluessel(zerlegt);
      const vorhanden = gruppen.get(schluessel);
      if (vorhanden) {
        vorhanden.koeffizient = plus(vorhanden.koeffizient, zerlegt.koeffizient);
      } else {
        gruppen.set(schluessel, zerlegt);
      }
    }

    if (gruppen.size === t.teile.length) {
      return null;
    }
    return summe(...[...gruppen.values()].map(baueMonom));
  },
};

const AUSMULTIPLIZIEREN = {
  name: 'Klammer ausmultiplizieren',
  anwenden(t) {
    if (t.art !== 'produkt') {
      return null;
    }
    const klammern = t.teile.filter((x) => x.art === 'summe');
    if (klammern.length === 0) {
      return null;
    }
    const uebrig = t.teile.filter((x) => x.art !== 'summe');

    // Alle Klammern auf einmal, nicht eine nach der anderen.
    //
    // Das ist der Weg, den der Unterricht geht: "jedes Glied der einen
    // Klammer mit jedem Glied der anderen". Eine Klammer je Schritt
    // aufzulösen wäre technisch dasselbe, läse sich aber wie eine
    // Maschine — und bei (x + y + 1)⁴ bräuchte es Hunderte Schritte,
    // wo einer genügt.
    let kombinationen = [[]];
    for (const klammer of klammern) {
      const naechste = [];
      for (const bisher of kombinationen) {
        for (const glied of klammer.teile) {
          naechste.push([...bisher, glied]);
        }
      }
      kombinationen = naechste;
    }

    return summe(...kombinationen.map((glieder) => produkt(...uebrig, ...glieder)));
  },
};

const POTENZ_AUSSCHREIBEN = {
  name: 'Potenz als Produkt schreiben',
  anwenden(t) {
    if (t.art !== 'potenz' || t.basis.art !== 'summe') {
      return null;
    }
    if (t.exponent.art !== 'zahl' || !istGanz(t.exponent.wert)) {
      return null;
    }
    const e = t.exponent.wert.z;
    // Nur kleine positive Exponenten. (a + b)¹⁰ auszuschreiben hilft
    // niemandem beim Verstehen, und der Term würde unlesbar.
    if (e < 2 || e > 4) {
      return null;
    }
    return produkt(...Array.from({ length: e }, () => t.basis));
  },
};

const AUSKLAMMERN = {
  name: 'gemeinsamen Faktor ausklammern',
  anwenden(t) {
    if (t.art !== 'summe') {
      return null;
    }

    const zerlegt = t.teile.map(zerlegeMonom);
    if (zerlegt.some((m) => istNull(m.koeffizient))) {
      return null;
    }

    // Gemeinsamer Zahlfaktor: ggT der Zähler über kgV der Nenner.
    let faktor = zerlegt[0].koeffizient;
    for (const m of zerlegt.slice(1)) {
      faktor = bruch(
        ggT(Math.abs(faktor.z), Math.abs(m.koeffizient.z)),
        kgV(faktor.n, m.koeffizient.n)
      );
    }
    // Sind alle Glieder negativ, wandert das Minus mit nach vorn.
    if (zerlegt.every((m) => istNegativ(m.koeffizient))) {
      faktor = negativ(faktor);
    }

    // Gemeinsame Potenzen: kleinster Exponent, den alle Glieder haben.
    const gemeinsam = new Map();
    for (const [schluessel, eintrag] of zerlegt[0].potenzen) {
      let kleinster = eintrag.exponent;
      let inAllen = true;
      for (const m of zerlegt.slice(1)) {
        const andere = m.potenzen.get(schluessel);
        if (!andere) {
          inAllen = false;
          break;
        }
        kleinster = Math.min(kleinster, andere.exponent);
      }
      if (inAllen && kleinster > 0) {
        gemeinsam.set(schluessel, { basis: eintrag.basis, exponent: kleinster });
      }
    }

    const nichtsZuHolen = bruchGleich(faktor, bruch(1)) && gemeinsam.size === 0;
    if (nichtsZuHolen) {
      return null;
    }

    const vorne = baueMonom({ koeffizient: faktor, potenzen: gemeinsam });
    const drinnen = zerlegt.map((m) => {
      const potenzen = new Map();
      for (const [schluessel, eintrag] of m.potenzen) {
        const abzug = gemeinsam.get(schluessel);
        const exponent = eintrag.exponent - (abzug ? abzug.exponent : 0);
        if (exponent !== 0) {
          potenzen.set(schluessel, { basis: eintrag.basis, exponent });
        }
      }
      return baueMonom({ koeffizient: geteilt(m.koeffizient, faktor), potenzen });
    });

    return produkt(vorne, summe(...drinnen));
  },
};

// ---------------------------------------------------------------------
// Der Antrieb
// ---------------------------------------------------------------------

// Wendet eine Regel an der ersten passenden Stelle an — von innen nach
// außen. Innen zuerst, weil eine äußere Regel oft erst greift, wenn
// innen aufgeräumt ist.
function ersteAnwendung(term, regel) {
  const kinder = kinderVon(term);
  for (let i = 0; i < kinder.length; i++) {
    const neu = ersteAnwendung(kinder[i], regel);
    if (neu !== null) {
      return mitKind(term, i, neu);
    }
  }
  const hier = regel.anwenden(term);
  if (hier === null || alsText(hier) === alsText(term)) {
    return null;
  }
  return hier;
}

// Die Notbremse. Eine Regel, die sich selbst wieder auslöst, würde die
// App sonst einfrieren — auf einem Handy ohne Fehlermeldung. Lieber ein
// klarer Abbruch, den eine Prüfung sichtbar macht.
//
// Die Zahl ist bewusst großzügig. Sie soll eine Regel abfangen, die im
// Kreis läuft, und nicht den Aufwand begrenzen: (x + y + 1)⁴ braucht
// ehrliche 120 Schritte, weil dort 81 Produkte entstehen. Eine zu enge
// Grenze würde eine richtige Rechnung abweisen und damit einen Fehler
// melden, wo keiner ist.
//
// Ursprünglich standen hier 100 — das war ein Aufwandsbudget, kein
// Schleifenschutz, und es schlug bei genau diesem Term an.
const HOECHSTENS_SCHRITTE = 1000;

function laufe(term, regeln) {
  pruefeTerm(term, 'laufe');
  const schritte = [];
  let aktuell = term;

  for (let i = 0; i < HOECHSTENS_SCHRITTE; i++) {
    let etwasGetan = false;
    for (const regel of regeln) {
      const neu = ersteAnwendung(aktuell, regel);
      if (neu !== null) {
        aktuell = neu;
        schritte.push({ regel: regel.name, term: neu, text: alsText(neu) });
        etwasGetan = true;
        break;
      }
    }
    if (!etwasGetan) {
      return { term: aktuell, schritte };
    }
  }

  throw new Error(
    `Umformung kommt nicht zur Ruhe: mehr als ${HOECHSTENS_SCHRITTE} Schritte bei "${alsText(term)}"`
  );
}

const AUFRAEUMEN = [
  NEUTRALE_ELEMENTE,
  ZAHL_NACH_VORN,
  ZAHLEN_ZUSAMMENRECHNEN,
  KEHRWERT_STATT_TEILEN,
  WURZEL_ZIEHEN,
  WURZEL_AUS_POTENZ,
  TEILWEISE_WURZEL,
  POTENZGESETZ,
  GLEICHARTIGE_GLIEDER,
];

// Zusammenfassen, ohne Klammern anzurühren.
//
// Rückgabe ist immer { term, schritte } — nie nur das Ergebnis. Wer nur
// das Ergebnis will, nimmt `.term`; wer den Rechenweg zeigen will, hat
// ihn schon.
export function vereinfache(term) {
  return laufe(term, AUFRAEUMEN);
}

// Klammern auflösen und danach aufräumen. Das ist der Weg, den man im
// Unterricht geht: erst ausmultiplizieren, dann zusammenfassen.
export function multipliziereAus(term) {
  return laufe(term, [POTENZ_AUSSCHREIBEN, AUSMULTIPLIZIEREN, ...AUFRAEUMEN]);
}

// Die Gegenrichtung: erst aufräumen, dann den gemeinsamen Faktor
// herausziehen. Ein einzelner Schritt, kein Lauf bis zur Ruhe — sonst
// würde er sich mit dem Ausmultiplizieren im Kreis drehen.
export function klammereAus(term) {
  const aufgeraeumt = vereinfache(term);
  const neu = ersteAnwendung(aufgeraeumt.term, AUSKLAMMERN);
  if (neu === null) {
    return aufgeraeumt;
  }
  return {
    term: neu,
    schritte: [
      ...aufgeraeumt.schritte,
      { regel: AUSKLAMMERN.name, term: neu, text: alsText(neu) },
    ],
  };
}

// Der Rechenweg als Zeilen, wie man ihn an die Tafel schreibt:
//
//   2 · (x + 3) + 4x
//   = 2x + 6 + 4x       | Klammer ausmultiplizieren
//   = 6x + 6            | gleichartige Glieder zusammenfassen
export function alsRechenweg(term, ergebnis) {
  const zeilen = [alsText(term)];
  for (const schritt of ergebnis.schritte) {
    zeilen.push(`= ${schritt.text}    | ${schritt.regel}`);
  }
  return zeilen;
}
