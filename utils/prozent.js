// Prozentrechnung mit sichtbarem Rechenweg.
//
// Prozentrechnung ist der Teil der Schulmathematik, den man im Leben am
// häufigsten braucht — und der am zuverlässigsten schiefgeht. Nicht
// weil sie schwer wäre, sondern weil drei Größen im Spiel sind und man
// leicht die falsche sucht.
//
//   Grundwert    G   das Ganze, die 100 %
//   Prozentsatz  p   wie viel Prozent
//   Prozentwert  W   der Teil davon
//
//   W = G · p/100
//
// Gerechnet wird exakt in Brüchen: 19 % von 250 ist genau 47,5 und
// nicht 47,499999999999996.
//
// ---------------------------------------------------------------------
// Der Fall, an dem fast alle scheitern
// ---------------------------------------------------------------------
//
// "Ein Pullover kostet nach 19 % Aufschlag 119 €. Was war der Preis
// vorher?" — Die naheliegende Rechnung "119 minus 19 %" ergibt 96,39 €
// und ist falsch. Richtig sind 100 €.
//
// Der Grund: Die 19 % beziehen sich auf den ALTEN Preis, nicht auf den
// neuen. 119 € sind 119 % des alten Preises. Deshalb gibt es unten eine
// eigene Funktion dafür, und sie sagt diesen Satz auch.

import {
  bruch,
  plus,
  minus,
  mal,
  geteilt,
  istNull,
  istNegativ,
  gleich as bruchGleich,
  alsText as bruchAlsText,
} from './bruch.js';

const HUNDERT = bruch(100);

// Eine Zahl aus dem Eingabefeld: Bruch, ganze Zahl oder Kommazahl.
function alsBruch(wert, wo) {
  if (typeof wert === 'object' && wert !== null && Number.isInteger(wert.z)) {
    return wert;
  }
  if (typeof wert === 'number' && Number.isFinite(wert)) {
    return Number.isInteger(wert) ? bruch(wert) : ausKommazahl(wert);
  }
  throw new Error(`prozent: ${wo} ist keine Zahl`);
}

// Exakt umrechnen, nicht über den gespeicherten Gleitkommawert: 19,5
// soll 39/2 werden und nicht 5488191129485967/281474976710656.
function ausKommazahl(wert) {
  const text = String(wert);
  const punkt = text.indexOf('.');
  if (punkt === -1) {
    return bruch(Number(text));
  }
  const nachkomma = text.length - punkt - 1;
  const nenner = 10 ** nachkomma;
  return bruch(Math.round(wert * nenner), nenner);
}

// Prozentzahlen liest man als Kommazahl, nicht als Bruch: 47,5 % statt
// 95/2 %.
export function alsProzentText(wert) {
  const zahl = wert.z / wert.n;
  const gerundet = Math.round(zahl * 1e6) / 1e6;
  return String(gerundet).replace('.', ',').replace('-', '−');
}

function schritt(regel, text, wert) {
  return { regel, text, wert };
}

// ---------------------------------------------------------------------
// Die drei Grundaufgaben
// ---------------------------------------------------------------------

// Gesucht: der Teil. "Wie viel sind 19 % von 250?"
export function prozentwert(grundwertEingabe, prozentsatzEingabe) {
  const g = alsBruch(grundwertEingabe, 'der Grundwert');
  const p = alsBruch(prozentsatzEingabe, 'der Prozentsatz');

  const anteil = geteilt(p, HUNDERT);
  const ergebnis = mal(g, anteil);

  return {
    gesucht: 'Prozentwert',
    formel: 'W = G · p/100',
    anfang: `${alsProzentText(p)} % von ${alsProzentText(g)}`,
    ergebnis,
    schritte: [
      schritt(
        `${alsProzentText(p)} % heißt ${alsProzentText(p)} von 100`,
        `${alsProzentText(g)} · ${bruchAlsText(p)}/100`,
        ergebnis
      ),
      schritt('ausrechnen', alsProzentText(ergebnis), ergebnis),
    ],
  };
}

// Gesucht: das Ganze. "47,5 sind 19 % — wie viel ist alles?"
export function grundwert(prozentwertEingabe, prozentsatzEingabe) {
  const w = alsBruch(prozentwertEingabe, 'der Prozentwert');
  const p = alsBruch(prozentsatzEingabe, 'der Prozentsatz');

  if (istNull(p)) {
    throw new Error(
      'Bei 0 % lässt sich der Grundwert nicht bestimmen — 0 % von jeder Zahl sind 0.'
    );
  }

  const ergebnis = geteilt(mal(w, HUNDERT), p);

  return {
    gesucht: 'Grundwert',
    formel: 'G = W · 100/p',
    anfang: `${alsProzentText(w)} sind ${alsProzentText(p)} %`,
    ergebnis,
    schritte: [
      schritt(
        'nach dem Grundwert umstellen',
        `${alsProzentText(w)} · 100/${bruchAlsText(p)}`,
        ergebnis
      ),
      schritt('ausrechnen', alsProzentText(ergebnis), ergebnis),
    ],
  };
}

// Gesucht: wie viel Prozent. "47,5 von 250 — wie viel Prozent sind das?"
export function prozentsatz(prozentwertEingabe, grundwertEingabe) {
  const w = alsBruch(prozentwertEingabe, 'der Prozentwert');
  const g = alsBruch(grundwertEingabe, 'der Grundwert');

  if (istNull(g)) {
    throw new Error(
      'Der Grundwert darf nicht 0 sein — sonst gäbe es kein Ganzes, auf das sich die Prozente beziehen.'
    );
  }

  const ergebnis = mal(geteilt(w, g), HUNDERT);

  return {
    gesucht: 'Prozentsatz',
    formel: 'p = W/G · 100',
    anfang: `${alsProzentText(w)} von ${alsProzentText(g)}`,
    ergebnis,
    einheit: '%',
    schritte: [
      schritt(
        'den Anteil bilden',
        `${bruchAlsText(w)}/${bruchAlsText(g)} = ${bruchAlsText(geteilt(w, g))}`,
        mal(geteilt(w, g), HUNDERT)
      ),
      schritt('mal 100 nehmen', `${alsProzentText(ergebnis)} %`, ergebnis),
    ],
  };
}

// ---------------------------------------------------------------------
// Zunahme und Abnahme
// ---------------------------------------------------------------------

// "250 € werden um 19 % teurer." Ein negativer Prozentsatz bedeutet
// Abnahme.
export function veraendere(grundwertEingabe, prozentsatzEingabe) {
  const g = alsBruch(grundwertEingabe, 'der Grundwert');
  const p = alsBruch(prozentsatzEingabe, 'der Prozentsatz');

  const faktor = plus(bruch(1), geteilt(p, HUNDERT));
  const ergebnis = mal(g, faktor);
  const rauf = !istNegativ(p);

  return {
    gesucht: rauf ? 'Wert nach der Zunahme' : 'Wert nach der Abnahme',
    formel: rauf ? 'neu = G · (1 + p/100)' : 'neu = G · (1 − |p|/100)',
    anfang: `${alsProzentText(g)} ${rauf ? 'plus' : 'minus'} ${alsProzentText(
      istNegativ(p) ? mal(p, bruch(-1)) : p
    )} %`,
    ergebnis,
    schritte: [
      schritt(
        rauf
          ? `nach der Zunahme sind es ${alsProzentText(plus(HUNDERT, p))} % des alten Werts`
          : `nach der Abnahme sind es ${alsProzentText(plus(HUNDERT, p))} % des alten Werts`,
        `${alsProzentText(g)} · ${alsProzentText(plus(HUNDERT, p))}/100`,
        ergebnis
      ),
      schritt('ausrechnen', alsProzentText(ergebnis), ergebnis),
    ],
  };
}

// Rückwärts: "Nach 19 % Aufschlag kostet es 119 €. Was war es vorher?"
//
// Das ist die Aufgabe, an der fast alle scheitern — und der Grund steht
// in den Schritten, nicht nur das Ergebnis.
export function grundwertAusVeraendert(neuerWertEingabe, prozentsatzEingabe) {
  const neu = alsBruch(neuerWertEingabe, 'der neue Wert');
  const p = alsBruch(prozentsatzEingabe, 'der Prozentsatz');

  const faktorProzent = plus(HUNDERT, p);
  if (istNull(faktorProzent)) {
    throw new Error('Bei −100 % bleibt nichts übrig — der alte Wert lässt sich nicht bestimmen.');
  }

  const ergebnis = geteilt(mal(neu, HUNDERT), faktorProzent);
  const naheliegendFalsch = mal(neu, minus(bruch(1), geteilt(p, HUNDERT)));

  return {
    gesucht: 'Wert vorher',
    formel: 'G = neu · 100/(100 + p)',
    anfang: `${alsProzentText(neu)} nach ${alsProzentText(p)} % Veränderung`,
    ergebnis,
    schritte: [
      schritt(
        `der neue Wert ist ${alsProzentText(faktorProzent)} % des alten — nicht 100 %`,
        `${alsProzentText(neu)} entspricht ${alsProzentText(faktorProzent)} %`,
        ergebnis
      ),
      schritt(
        'also durch diesen Prozentsatz teilen und mal 100 nehmen',
        `${alsProzentText(neu)} · 100/${alsProzentText(faktorProzent)}`,
        ergebnis
      ),
      schritt('ausrechnen', alsProzentText(ergebnis), ergebnis),
    ],
    // Der häufigste Fehler, ausdrücklich benannt. Ihn nur zu vermeiden
    // reicht nicht — man muss ihn einmal gesehen haben, um zu verstehen,
    // warum er falsch ist.
    falle: bruchGleich(naheliegendFalsch, ergebnis)
      ? null
      : {
          wert: naheliegendFalsch,
          text:
            `Naheliegend, aber falsch: ${alsProzentText(neu)} minus ` +
            `${alsProzentText(p)} % ergäbe ${alsProzentText(naheliegendFalsch)}. ` +
            'Die Prozente beziehen sich auf den ALTEN Wert, nicht auf den neuen.',
        },
  };
}

// ---------------------------------------------------------------------

export function alsRechenweg(ergebnis) {
  const zeilen = [`${ergebnis.gesucht} gesucht`, ergebnis.formel, '', ergebnis.anfang];
  for (const s of ergebnis.schritte) {
    zeilen.push(`         | ${s.regel}`);
    zeilen.push(`= ${s.text}`);
  }
  return zeilen;
}
