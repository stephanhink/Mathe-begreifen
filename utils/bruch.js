// Exakte Bruchrechnung.
//
// Das ist die unterste Schicht der App. Terme, Gleichungen und
// Wahrscheinlichkeiten rechnen alle hierüber — und zwar aus einem Grund:
// Mit Kommazahlen käme bei 1/3 + 1/3 + 1/3 nicht 1 heraus, sondern
// 0,9999999999999998. In einer App, die Schritt für Schritt vorrechnet,
// wäre das tödlich: Der Schüler sieht eine krumme Zahl und glaubt, er
// habe sich verrechnet.
//
// Ein Bruch ist hier ein eingefrorenes Objekt { z, n }:
//   - immer gekürzt
//   - der Nenner immer positiv (das Vorzeichen sitzt im Zähler)
//   - Zähler und Nenner immer ganze Zahlen
//
// Warum ein Objekt und nicht [zaehler, nenner]? Weil in einer Mathe-App
// ein Zahlenpaar viel zu leicht ein Punkt oder ein Vektor ist. { z, n }
// kann man nicht verwechseln.
//
// Die Herkunft ist utils/gleichung.js aus dem Chemie-Projekt, wo dieselbe
// Rechnerei privat für den Ausgleich von Reaktionsgleichungen steckte.

// ---------------------------------------------------------------------
// Grundlagen
// ---------------------------------------------------------------------

// Größter gemeinsamer Teiler, euklidischer Algorithmus.
// ggT(0, 0) ist 0 — das ist die übliche Festlegung und wird unten
// abgefangen, wo es stört.
export function ggT(a, b) {
  a = Math.abs(pruefeGanz(a, 'ggT'));
  b = Math.abs(pruefeGanz(b, 'ggT'));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

// Kleinstes gemeinsames Vielfaches. Erst teilen, dann malnehmen — sonst
// wird das Zwischenergebnis unnötig groß.
export function kgV(a, b) {
  a = pruefeGanz(a, 'kgV');
  b = pruefeGanz(b, 'kgV');
  if (a === 0 || b === 0) {
    return 0;
  }
  return Math.abs((a / ggT(a, b)) * b);
}

// Eine ganze Zahl, die in JavaScript noch exakt darstellbar ist.
// Jenseits von 2^53 rechnet JavaScript ungenau — und ein Bruchmodul, das
// unbemerkt ungenau wird, ist schlimmer als gar keins.
function pruefeGanz(wert, wo) {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) {
    throw new Error(`${wo}: "${wert}" ist keine Zahl`);
  }
  if (!Number.isInteger(wert)) {
    throw new Error(`${wo}: ${wert} ist keine ganze Zahl`);
  }
  if (!Number.isSafeInteger(wert)) {
    // Dieser Fehler trägt ein Kennzeichen, weil er etwas anderes bedeutet
    // als die übrigen: Nicht "das gibt es nicht", sondern "das kann ich
    // nicht ausrechnen". Wer beides gleich behandelt, antwortet auf eine
    // Überlauf-Frage mit einem sachlichen Nein — und das wäre geraten.
    const fehler = new Error(
      `${wo}: ${wert} ist zu groß — jenseits von 2^53 rechnet JavaScript nicht mehr exakt`
    );
    fehler.zuGross = true;
    throw fehler;
  }
  return wert;
}

// ---------------------------------------------------------------------
// Brüche bauen
// ---------------------------------------------------------------------

// Der einzige Weg, einen Bruch zu erzeugen. Kürzt sofort und legt das
// Vorzeichen in den Zähler.
export function bruch(zaehler, nenner = 1) {
  pruefeGanz(zaehler, 'bruch');
  pruefeGanz(nenner, 'bruch');

  if (nenner === 0) {
    throw new Error('Division durch null: ein Bruch mit Nenner 0 ist nicht definiert');
  }
  if (nenner < 0) {
    zaehler = -zaehler;
    nenner = -nenner;
  }

  const t = ggT(zaehler, nenner) || 1;
  return Object.freeze({ z: zaehler / t, n: nenner / t });
}

// Erkennt, ob etwas ein Bruch aus diesem Modul ist. Wird von allen
// Rechenfunktionen benutzt, damit eine versehentlich übergebene Kommazahl
// nicht stillschweigend als NaN durchrutscht.
export function istBruch(wert) {
  return (
    typeof wert === 'object' &&
    wert !== null &&
    Number.isInteger(wert.z) &&
    Number.isInteger(wert.n) &&
    wert.n > 0
  );
}

function pruefeBruch(wert, wo) {
  if (!istBruch(wert)) {
    throw new Error(`${wo}: "${beschreibe(wert)}" ist kein Bruch — bitte bruch(z, n) benutzen`);
  }
  return wert;
}

function beschreibe(wert) {
  if (wert === null || wert === undefined) {
    return String(wert);
  }
  return typeof wert === 'object' ? JSON.stringify(wert) : String(wert);
}

// ---------------------------------------------------------------------
// Rechnen
// ---------------------------------------------------------------------
//
// Überall wird vor dem Malnehmen gekürzt. Das ist nicht Kosmetik: Ohne
// dieses Kürzen wachsen die Nenner beim Gauß-Verfahren so schnell, dass
// die 2^53-Grenze schon bei harmlosen Gleichungssystemen erreicht wird.

export function plus(a, b) {
  pruefeBruch(a, 'plus');
  pruefeBruch(b, 'plus');
  const g = ggT(a.n, b.n);
  const nenner = (a.n / g) * b.n;
  const zaehler = a.z * (b.n / g) + b.z * (a.n / g);
  return bruch(zaehler, nenner);
}

export function minus(a, b) {
  return plus(a, negativ(b));
}

export function mal(a, b) {
  pruefeBruch(a, 'mal');
  pruefeBruch(b, 'mal');
  // Über Kreuz kürzen, bevor multipliziert wird.
  const g1 = ggT(a.z, b.n) || 1;
  const g2 = ggT(b.z, a.n) || 1;
  return bruch((a.z / g1) * (b.z / g2), (a.n / g2) * (b.n / g1));
}

export function geteilt(a, b) {
  pruefeBruch(a, 'geteilt');
  pruefeBruch(b, 'geteilt');
  if (b.z === 0) {
    throw new Error('Division durch null');
  }
  return mal(a, kehrwert(b));
}

// Ganzzahlige Potenz. Ein Bruch hoch einer nicht-ganzen Zahl ist im
// Allgemeinen kein Bruch mehr (2^(1/2) = √2 ist irrational) — dafür ist
// dieses Modul nicht zuständig, und es rät auch nichts.
export function hoch(a, exponent) {
  pruefeBruch(a, 'hoch');
  pruefeGanz(exponent, 'hoch');

  if (a.z === 0) {
    if (exponent < 0) {
      throw new Error('0 hoch einer negativen Zahl ist nicht definiert (Division durch null)');
    }
    if (exponent === 0) {
      throw new Error('0 hoch 0 ist nicht definiert');
    }
    return bruch(0);
  }

  const basis = exponent < 0 ? kehrwert(a) : a;
  const n = Math.abs(exponent);

  let ergebnis = bruch(1);
  for (let i = 0; i < n; i++) {
    ergebnis = mal(ergebnis, basis);
  }
  return ergebnis;
}

export function negativ(a) {
  pruefeBruch(a, 'negativ');
  return bruch(-a.z, a.n);
}

export function kehrwert(a) {
  pruefeBruch(a, 'kehrwert');
  if (a.z === 0) {
    throw new Error('Der Kehrwert von 0 ist nicht definiert');
  }
  return bruch(a.n, a.z);
}

export function betrag(a) {
  pruefeBruch(a, 'betrag');
  return bruch(Math.abs(a.z), a.n);
}

// ---------------------------------------------------------------------
// Vergleichen
// ---------------------------------------------------------------------

export function istNull(a) {
  return pruefeBruch(a, 'istNull').z === 0;
}

export function istGanz(a) {
  return pruefeBruch(a, 'istGanz').n === 1;
}

export function istNegativ(a) {
  return pruefeBruch(a, 'istNegativ').z < 0;
}

// -1, 0 oder 1 — wie der Vergleich in einer Sortierfunktion.
// Verglichen wird über a.z * b.n gegen b.z * a.n; weil beide Nenner
// positiv sind, dreht sich das Ungleichheitszeichen dabei nicht um.
export function vergleiche(a, b) {
  pruefeBruch(a, 'vergleiche');
  pruefeBruch(b, 'vergleiche');
  const differenz = minus(a, b);
  return Math.sign(differenz.z);
}

export function gleich(a, b) {
  return vergleiche(a, b) === 0;
}

// ---------------------------------------------------------------------
// Umwandeln
// ---------------------------------------------------------------------

// Als Kommazahl — für Diagramme, für numerische Kontrollen und überall
// dort, wo ohnehin nur gezeichnet wird. Nicht zum Weiterrechnen.
export function alsZahl(a) {
  pruefeBruch(a, 'alsZahl');
  return a.z / a.n;
}

// Aus einer Kommazahl einen exakten Bruch machen: 0,75 → 3/4.
//
// Der Umweg über die Textdarstellung ist Absicht. 0.1 ist im Rechner
// nicht genau ein Zehntel, sondern minimal daneben; wer den gespeicherten
// Wert direkt umrechnet, bekommt 3602879701896397/36028797018963968.
// toString() liefert dagegen "0.1" — die Zahl, die der Mensch gemeint
// hat.
export function ausDezimal(wert) {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) {
    throw new Error(`ausDezimal: "${wert}" ist keine Zahl`);
  }

  const text = String(wert);
  if (text.includes('e') || text.includes('E')) {
    throw new Error(
      `ausDezimal: ${text} steht in Exponentialschreibweise — bitte Zähler und Nenner direkt angeben`
    );
  }

  const punkt = text.indexOf('.');
  if (punkt === -1) {
    return bruch(wert);
  }

  const nachkommastellen = text.length - punkt - 1;
  const nenner = 10 ** nachkommastellen;
  return bruch(Math.round(wert * nenner), nenner);
}

// Aus Text: "3/4", "-3/4", "1 3/4", "2,5", "2.5", "7".
// Das Komma als Dezimaltrennzeichen ist die deutsche Schreibweise und
// damit das, was in ein Eingabefeld getippt wird.
export function ausText(eingabe) {
  const text = String(eingabe).trim().replace(/\s+/g, ' ');
  if (text === '') {
    throw new Error('ausText: leere Eingabe');
  }

  // Gemischte Zahl: "1 3/4" oder "-1 3/4"
  const gemischt = text.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (gemischt) {
    const [, vorzeichen, ganz, zaehler, nenner] = gemischt;
    const betragTeil = plus(bruch(Number(ganz)), bruch(Number(zaehler), Number(nenner)));
    return vorzeichen === '-' ? negativ(betragTeil) : betragTeil;
  }

  // Gewöhnlicher Bruch: "3/4"
  const geteiltDurch = text.match(/^(-?\d+)\/(-?\d+)$/);
  if (geteiltDurch) {
    return bruch(Number(geteiltDurch[1]), Number(geteiltDurch[2]));
  }

  // Ganze Zahl oder Kommazahl
  const zahl = text.match(/^-?\d+([.,]\d+)?$/);
  if (zahl) {
    return ausDezimal(Number(text.replace(',', '.')));
  }

  throw new Error(`ausText: "${eingabe}" ist keine Zahl und kein Bruch`);
}

// Als Text, wie man ihn hinschreibt: "3/4", "-3/4", "7".
export function alsText(a) {
  pruefeBruch(a, 'alsText');
  return a.n === 1 ? String(a.z) : `${a.z}/${a.n}`;
}

// Zerlegt einen unechten Bruch in Ganzes und Rest: 7/4 → 1 und 3/4.
// Der Rest trägt kein eigenes Vorzeichen; das steht am Ganzen. Sonst
// läse sich -7/4 als "-1 -3/4", und das schreibt niemand so.
export function gemischt(a) {
  pruefeBruch(a, 'gemischt');
  const vorzeichen = a.z < 0 ? -1 : 1;
  const zaehler = Math.abs(a.z);
  const ganz = Math.floor(zaehler / a.n);
  return {
    negativ: vorzeichen === -1,
    ganz,
    rest: bruch(zaehler - ganz * a.n, a.n),
  };
}

// Gemischte Zahl als Text: "1 3/4", "-1 3/4", "3".
export function alsGemischterText(a) {
  const { negativ: istMinus, ganz, rest } = gemischt(a);
  const vorne = istMinus ? '-' : '';

  if (istNull(rest)) {
    return `${vorne}${ganz}`;
  }
  if (ganz === 0) {
    return `${vorne}${alsText(rest)}`;
  }
  return `${vorne}${ganz} ${alsText(rest)}`;
}
