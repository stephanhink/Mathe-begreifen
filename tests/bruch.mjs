// Prüfungen für die exakte Bruchrechnung.
//
// Zwei Sorten stehen hier nebeneinander:
//
//   1. Feste Beispiele — "1/2 + 1/3 muss 5/6 sein". Die fängt man mit
//      dem Kopf, und sie sagen bei einem Fehler sofort, was kaputt ist.
//
//   2. Rechenregeln an Zufallszahlen — Kommutativität, Assoziativität,
//      Distributivität, Umkehrungen. Die decken die Fälle ab, an die
//      beim Schreiben niemand gedacht hat.
//
// Der Zufall ist ein gesteuerter: Der Generator unten startet immer mit
// demselben Wert. Schlägt eine Prüfung fehl, schlägt sie beim nächsten
// Lauf wieder fehl — sonst könnte man den Fehler nicht suchen.

import { pruefung, wahr, zahl, gleich as gleichText, wirft } from './pruefer.mjs';
import {
  ggT,
  kgV,
  bruch,
  istBruch,
  plus,
  minus,
  mal,
  geteilt,
  hoch,
  negativ,
  kehrwert,
  betrag,
  istNull,
  istGanz,
  istNegativ,
  vergleiche,
  gleich,
  alsZahl,
  ausDezimal,
  ausText,
  alsText,
  gemischt,
  alsGemischterText,
} from '../utils/bruch.js';

// Ein winziger Zufallsgenerator mit festem Startwert (xorshift32).
// Math.random() wäre hier falsch: Eine Prüfung, die mal durchgeht und
// mal nicht, ist keine Prüfung.
function wuerfel(startwert = 20260801) {
  let zustand = startwert;
  return function naechste(bis) {
    zustand ^= zustand << 13;
    zustand ^= zustand >>> 17;
    zustand ^= zustand << 5;
    zustand |= 0;
    return Math.abs(zustand) % bis;
  };
}

// Ein zufälliger Bruch mit kleinen Zahlen. Klein bleiben sie, damit die
// Zwischenergebnisse der Rechenregeln nicht an die 2^53-Grenze stoßen —
// dass die Grenze überhaupt bewacht wird, prüft weiter unten ein eigener
// Abschnitt.
function zufallsbruch(naechste, ohneNull = false) {
  let z = naechste(41) - 20;
  if (ohneNull && z === 0) {
    z = 7;
  }
  return bruch(z, naechste(20) + 1);
}

// ---------------------------------------------------------------------

pruefung('ggT und kgV', () => {
  zahl('ggT(12, 18)', ggT(12, 18), 6);
  zahl('ggT(17, 5)', ggT(17, 5), 1);
  zahl('ggT(-12, 18)', ggT(-12, 18), 6, 0);
  zahl('ggT(0, 7)', ggT(0, 7), 7);
  zahl('ggT(0, 0)', ggT(0, 0), 0);
  zahl('kgV(4, 6)', kgV(4, 6), 12);
  zahl('kgV(-4, 6)', kgV(-4, 6), 12);
  zahl('kgV(7, 0)', kgV(7, 0), 0);

  wirft('ggT von einer Kommazahl', () => ggT(1.5, 2));
  wirft('kgV von Unendlich', () => kgV(Infinity, 2));
});

pruefung('Brüche bauen und kürzen', () => {
  gleichText('bruch(6, 8) kürzt', alsText(bruch(6, 8)), '3/4');
  gleichText('bruch(4, 2) wird ganz', alsText(bruch(4, 2)), '2');
  gleichText('bruch(5) ist 5/1', alsText(bruch(5)), '5');
  gleichText('bruch(0, 7) ist 0', alsText(bruch(0, 7)), '0');

  // Das Vorzeichen gehört in den Zähler — sonst wären 1/-2 und -1/2
  // zwei verschiedene Objekte für dieselbe Zahl.
  gleichText('bruch(1, -2) zieht das Minus nach vorn', alsText(bruch(1, -2)), '-1/2');
  gleichText('bruch(-1, -2) hebt sich auf', alsText(bruch(-1, -2)), '1/2');

  wahr('ein Bruch ist eingefroren', Object.isFrozen(bruch(1, 2)));
  wahr('istBruch erkennt einen Bruch', istBruch(bruch(1, 2)));
  wahr('istBruch lehnt eine Zahl ab', !istBruch(0.5));
  wahr('istBruch lehnt ein Zahlenpaar ab', !istBruch([1, 2]));
  wahr('istBruch lehnt negativen Nenner ab', !istBruch({ z: 1, n: -2 }));
});

pruefung('Was ein Bruch nicht sein darf', () => {
  wirft('Nenner 0', () => bruch(1, 0));
  wirft('Zähler als Kommazahl', () => bruch(0.5, 2));
  wirft('Nenner als Kommazahl', () => bruch(1, 2.5));
  wirft('Zähler als Text', () => bruch('1', 2));
  wirft('NaN als Zähler', () => bruch(NaN, 2));
  wirft('Unendlich als Nenner', () => bruch(1, Infinity));

  // Jenseits von 2^53 rechnet JavaScript ungenau. Lieber verweigern als
  // stillschweigend falsch rechnen.
  wirft('Zähler jenseits von 2^53', () => bruch(2 ** 53 + 2, 1));
  wirft('Nenner jenseits von 2^53', () => bruch(1, 2 ** 60));
});

pruefung('Grundrechenarten an festen Beispielen', () => {
  gleichText('1/2 + 1/3', alsText(plus(bruch(1, 2), bruch(1, 3))), '5/6');
  gleichText('1/3 + 1/3 + 1/3', alsText(plus(plus(bruch(1, 3), bruch(1, 3)), bruch(1, 3))), '1');
  gleichText('3/4 − 1/4', alsText(minus(bruch(3, 4), bruch(1, 4))), '1/2');
  gleichText('1/4 − 3/4', alsText(minus(bruch(1, 4), bruch(3, 4))), '-1/2');
  gleichText('2/3 · 3/4', alsText(mal(bruch(2, 3), bruch(3, 4))), '1/2');
  gleichText('1/2 : 1/4', alsText(geteilt(bruch(1, 2), bruch(1, 4))), '2');
  gleichText('0 · 5/7', alsText(mal(bruch(0), bruch(5, 7))), '0');

  gleichText('−(3/4)', alsText(negativ(bruch(3, 4))), '-3/4');
  gleichText('Kehrwert von 3/4', alsText(kehrwert(bruch(3, 4))), '4/3');
  gleichText('Kehrwert von −3/4', alsText(kehrwert(bruch(-3, 4))), '-4/3');
  gleichText('|−3/4|', alsText(betrag(bruch(-3, 4))), '3/4');
});

pruefung('Potenzen', () => {
  gleichText('(2/3)^0', alsText(hoch(bruch(2, 3), 0)), '1');
  gleichText('(2/3)^1', alsText(hoch(bruch(2, 3), 1)), '2/3');
  gleichText('(2/3)^3', alsText(hoch(bruch(2, 3), 3)), '8/27');

  // Der negative Exponent ist genau die Stelle, an der laut Konzept die
  // halbe Oberstufe hängen bleibt: x^(−2) ist kein negatives Ergebnis,
  // sondern ein Kehrwert.
  gleichText('(2/3)^(−2)', alsText(hoch(bruch(2, 3), -2)), '9/4');
  gleichText('2^(−1)', alsText(hoch(bruch(2), -1)), '1/2');
  gleichText('(−2/3)^2 ist positiv', alsText(hoch(bruch(-2, 3), 2)), '4/9');
  gleichText('(−2/3)^3 bleibt negativ', alsText(hoch(bruch(-2, 3), 3)), '-8/27');
  gleichText('0^3', alsText(hoch(bruch(0), 3)), '0');

  wirft('0 hoch 0', () => hoch(bruch(0), 0));
  wirft('0 hoch −1', () => hoch(bruch(0), -1));
  wirft('gebrochener Exponent', () => hoch(bruch(2), 0.5));
});

pruefung('Was nicht definiert ist, wird abgelehnt', () => {
  wirft('Division durch 0', () => geteilt(bruch(1, 2), bruch(0)));
  wirft('Kehrwert von 0', () => kehrwert(bruch(0)));

  // Eine Kommazahl statt eines Bruchs ist der wahrscheinlichste
  // Programmierfehler im ganzen Modul — deshalb prüft jede
  // Rechenfunktion ihre Eingaben.
  wirft('plus mit einer Kommazahl', () => plus(bruch(1, 2), 0.5));
  wirft('mal mit einer Kommazahl', () => mal(0.5, bruch(1, 2)));
  wirft('geteilt mit null als Argument', () => geteilt(bruch(1, 2), null));
  wirft('vergleiche mit einem Zahlenpaar', () => vergleiche(bruch(1, 2), [1, 2]));
  wirft('alsText von etwas anderem', () => alsText({ z: 1 }));
});

pruefung('Vergleichen', () => {
  wahr('1/2 = 2/4', gleich(bruch(1, 2), bruch(2, 4)));
  wahr('1/3 ≠ 1/4', !gleich(bruch(1, 3), bruch(1, 4)));
  zahl('1/3 < 1/2', vergleiche(bruch(1, 3), bruch(1, 2)), -1);
  zahl('1/2 > 1/3', vergleiche(bruch(1, 2), bruch(1, 3)), 1);
  zahl('1/2 = 1/2', vergleiche(bruch(1, 2), bruch(1, 2)), 0);

  // Bei negativen Zahlen ist der größere Betrag der kleinere Wert —
  // eine der häufigsten Verwechslungen überhaupt.
  zahl('−3/4 < −1/2', vergleiche(bruch(-3, 4), bruch(-1, 2)), -1);
  zahl('−1/2 > −3/4', vergleiche(bruch(-1, 2), bruch(-3, 4)), 1);

  wahr('istNull(0/5)', istNull(bruch(0, 5)));
  wahr('istNull(1/5) ist falsch', !istNull(bruch(1, 5)));
  wahr('istGanz(4/2)', istGanz(bruch(4, 2)));
  wahr('istGanz(1/2) ist falsch', !istGanz(bruch(1, 2)));
  wahr('istNegativ(−1/2)', istNegativ(bruch(-1, 2)));
  wahr('istNegativ(0) ist falsch', !istNegativ(bruch(0)));
});

pruefung('Umwandeln in Zahlen und Text', () => {
  zahl('3/4 als Kommazahl', alsZahl(bruch(3, 4)), 0.75);
  zahl('−1/8 als Kommazahl', alsZahl(bruch(-1, 8)), -0.125);

  gleichText('0,75 als Bruch', alsText(ausDezimal(0.75)), '3/4');
  gleichText('0,1 als Bruch', alsText(ausDezimal(0.1)), '1/10');
  gleichText('−2,5 als Bruch', alsText(ausDezimal(-2.5)), '-5/2');
  gleichText('7 als Bruch', alsText(ausDezimal(7)), '7');

  wirft('ausDezimal von NaN', () => ausDezimal(NaN));
  wirft('ausDezimal von Unendlich', () => ausDezimal(Infinity));
  wirft('ausDezimal von Text', () => ausDezimal('0,5'));
  // 1e-7 schreibt JavaScript als "1e-7"; ohne Zifferndarstellung kann
  // ausDezimal die Nachkommastellen nicht zählen und verweigert.
  wirft('ausDezimal in Exponentialschreibweise', () => ausDezimal(1e-7));
});

pruefung('Eingaben aus einem Textfeld', () => {
  gleichText('"3/4"', alsText(ausText('3/4')), '3/4');
  gleichText('"6/8" wird gekürzt', alsText(ausText('6/8')), '3/4');
  gleichText('"-3/4"', alsText(ausText('-3/4')), '-3/4');
  gleichText('"3/-4"', alsText(ausText('3/-4')), '-3/4');
  gleichText('"1 3/4" gemischt', alsText(ausText('1 3/4')), '7/4');
  gleichText('"-1 3/4" gemischt negativ', alsText(ausText('-1 3/4')), '-7/4');
  gleichText('"7"', alsText(ausText('7')), '7');
  // Das Komma ist die deutsche Schreibweise und das, was getippt wird.
  gleichText('"2,5" mit Komma', alsText(ausText('2,5')), '5/2');
  gleichText('"2.5" mit Punkt', alsText(ausText('2.5')), '5/2');
  gleichText('"  3/4  " mit Leerzeichen', alsText(ausText('  3/4  ')), '3/4');

  wirft('leere Eingabe', () => ausText(''));
  wirft('nur Leerzeichen', () => ausText('   '));
  wirft('"drei viertel"', () => ausText('drei viertel'));
  wirft('"3/0"', () => ausText('3/0'));
  wirft('"3/4/5"', () => ausText('3/4/5'));
  wirft('"1,2,3"', () => ausText('1,2,3'));
});

pruefung('Gemischte Zahlen', () => {
  const siebenViertel = gemischt(bruch(7, 4));
  zahl('7/4 hat 1 Ganzes', siebenViertel.ganz, 1);
  gleichText('7/4 hat Rest 3/4', alsText(siebenViertel.rest), '3/4');
  wahr('7/4 ist nicht negativ', !siebenViertel.negativ);

  const minusSiebenViertel = gemischt(bruch(-7, 4));
  zahl('−7/4 hat 1 Ganzes', minusSiebenViertel.ganz, 1);
  gleichText('−7/4 hat Rest 3/4', alsText(minusSiebenViertel.rest), '3/4');
  wahr('−7/4 ist negativ', minusSiebenViertel.negativ);

  gleichText('7/4 als gemischte Zahl', alsGemischterText(bruch(7, 4)), '1 3/4');
  gleichText('−7/4 als gemischte Zahl', alsGemischterText(bruch(-7, 4)), '-1 3/4');
  gleichText('3/4 hat kein Ganzes', alsGemischterText(bruch(3, 4)), '3/4');
  gleichText('8/4 hat keinen Rest', alsGemischterText(bruch(8, 4)), '2');
  gleichText('0 als gemischte Zahl', alsGemischterText(bruch(0)), '0');
});

// ---------------------------------------------------------------------
// Rechenregeln an Zufallszahlen
// ---------------------------------------------------------------------
// Ab hier wird nicht mehr gegen einzelne Sollwerte geprüft, sondern
// gegen Gesetze, die für alle Brüche gelten müssen. 200 Durchgänge je
// Regel — das ist der Ansatz, den später auch das Termumform-System
// bekommt.

const DURCHGAENGE = 200;

// Prüft eine Regel an 200 Zufallsproben und meldet beim ersten Verstoß
// die konkreten Zahlen mit.
//
// Die Meldung ist der eigentliche Punkt: "a·(b+c) = a·b + a·c — verletzt
// bei a = -3/4, b = 5/6, c = 2/7" kann man nachrechnen. "199 statt 200"
// kann man nicht. Wer einen Zufallstest schreibt, muss den Gegenfall
// mitliefern, sonst hat er nur eine rote Lampe ohne Schalter.
function regel(beschreibung, gilt) {
  const naechste = wuerfel(startwertFuer(beschreibung));
  let verstoss = null;

  for (let i = 0; i < DURCHGAENGE && verstoss === null; i++) {
    const a = zufallsbruch(naechste);
    const b = zufallsbruch(naechste, true);
    const c = zufallsbruch(naechste, true);

    let bestanden = false;
    try {
      bestanden = gilt(a, b, c);
    } catch (fehler) {
      verstoss = `${probe(a, b, c)} → Fehler: ${fehler.message}`;
      break;
    }
    if (!bestanden) {
      verstoss = probe(a, b, c);
    }
  }

  wahr(beschreibung, verstoss === null, verstoss ? `verletzt bei ${verstoss}` : undefined);
}

function probe(a, b, c) {
  return `a = ${alsText(a)}, b = ${alsText(b)}, c = ${alsText(c)}`;
}

// Jede Regel bekommt ihre eigene Zahlenfolge, damit nicht alle Regeln
// an denselben 200 Brüchen scheitern oder durchgehen. Abgeleitet wird
// der Startwert aus dem Namen der Regel — fest und damit wiederholbar.
function startwertFuer(text) {
  let wert = 20260801;
  for (const zeichen of text) {
    wert = (wert * 31 + zeichen.codePointAt(0)) | 0;
  }
  return wert || 1;
}

pruefung('Rechengesetze (je 200 Zufallsproben)', () => {
  regel('a + b = b + a', (a, b) => gleich(plus(a, b), plus(b, a)));
  regel('a · b = b · a', (a, b) => gleich(mal(a, b), mal(b, a)));
  regel('(a + b) + c = a + (b + c)', (a, b, c) =>
    gleich(plus(plus(a, b), c), plus(a, plus(b, c)))
  );
  regel('(a · b) · c = a · (b · c)', (a, b, c) => gleich(mal(mal(a, b), c), mal(a, mal(b, c))));
  regel('a · (b + c) = a·b + a·c', (a, b, c) =>
    gleich(mal(a, plus(b, c)), plus(mal(a, b), mal(a, c)))
  );

  // Die Umkehrungen: (a + b) − b muss wieder a sein, (a · b) : b ebenso.
  regel('(a + b) − b = a', (a, b) => gleich(minus(plus(a, b), b), a));
  regel('(a · b) : b = a', (a, b) => gleich(geteilt(mal(a, b), b), a));

  // Neutrale Elemente und Gegenzahl.
  regel('a + 0 = a', (a) => gleich(plus(a, bruch(0)), a));
  regel('a · 1 = a', (a) => gleich(mal(a, bruch(1)), a));
  regel('a + (−a) = 0', (a) => istNull(plus(a, negativ(a))));
});

pruefung('Darstellung bleibt sauber (je 200 Zufallsproben)', () => {
  // Ein Ergebnis ist immer gekürzt und hat einen positiven Nenner —
  // sonst gäbe es zwei verschiedene Objekte für dieselbe Zahl, und
  // jeder Vergleich im Rest der App wäre unzuverlässig.
  regel('jede Summe ist gekürzt', (a, b) => {
    const summe = plus(a, b);
    return ggT(Math.abs(summe.z), summe.n) === 1 && summe.n > 0;
  });
  regel('jedes Produkt ist gekürzt', (a, b) => {
    const produkt = mal(a, b);
    return ggT(Math.abs(produkt.z), produkt.n) === 1 && produkt.n > 0;
  });

  // Was alsText schreibt, muss ausText wieder einlesen können.
  regel('alsText → ausText ergibt denselben Bruch', (a) => gleich(ausText(alsText(a)), a));
  regel('gemischte Zahl → ausText ergibt denselben Bruch', (a) =>
    gleich(ausText(alsGemischterText(a)), a)
  );
});

pruefung('Exakt und ungefähr stimmen überein (je 200 Zufallsproben)', () => {
  // Die Bruchrechnung muss dasselbe liefern wie die Kommazahl — nur eben
  // exakt. Verglichen wird mit Toleranz, weil hier die Kommazahl die
  // ungenaue Seite ist, nicht der Bruch.
  regel('a + b stimmt mit der Kommazahl überein', (a, b) =>
    Math.abs(alsZahl(plus(a, b)) - (alsZahl(a) + alsZahl(b))) < 1e-9
  );
  regel('a · b stimmt mit der Kommazahl überein', (a, b) =>
    Math.abs(alsZahl(mal(a, b)) - alsZahl(a) * alsZahl(b)) < 1e-9
  );
  regel('der Vergleich stimmt mit der Kommazahl überein', (a, b) =>
    vergleiche(a, b) === Math.sign(alsZahl(a) - alsZahl(b))
  );

  // Die Potenzgesetze — laut Konzept genau die Stelle, an der später die
  // Kettenregel hängt. b ist hier nie null, dafür sorgt zufallsbruch.
  regel('b³ : b² = b', (a, b) => gleich(geteilt(hoch(b, 3), hoch(b, 2)), b));
  regel('b² · b³ = b⁵', (a, b) => gleich(mal(hoch(b, 2), hoch(b, 3)), hoch(b, 5)));
  regel('b^(−2) = 1 : b²', (a, b) => gleich(hoch(b, -2), geteilt(bruch(1), hoch(b, 2))));
});
