// Eine Formel nach einer anderen Größe umstellen.
//
//   v = s : t        nach t umstellen
//            | beide Seiten · t          (gilt nur für t ≠ 0)
//   v · t = s
//            | beide Seiten : v          (gilt nur für v ≠ 0)
//   t = s : v
//
// Aus CLAUDE.md, beim Tab „Terme": „Formeln umstellen" — und als
// Beispielmaterial ausdrücklich „v = s/t nach t umstellen". Das ist die
// Fertigkeit, an der die Physik hängt: Wer eine Formel nicht umstellen
// kann, kann sie nur in einer Richtung benutzen.
//
// ---------------------------------------------------------------------
// Warum das nicht gleichung.js erledigt
// ---------------------------------------------------------------------
//
// gleichung.js lehnt mehrere Variablen ab, und das zu Recht: Es SUCHT
// eine Zahl. Hier ist das Ziel ein anderes — die Formel soll nach einer
// Größe aufgelöst werden, und alle anderen Buchstaben bleiben stehen.
// Aus "eine Lösung finden" wird "anders hinschreiben".
//
// Das Verfahren ist Schälen: Man sieht sich an, was ZULETZT mit der
// gesuchten Größe gemacht wurde, und macht es rückgängig — auf beiden
// Seiten. Solange, bis sie allein dasteht.
//
// ---------------------------------------------------------------------
// Vorbehalte werden mitgeführt, nicht verschwiegen
// ---------------------------------------------------------------------
//
// Mit t zu multiplizieren ist nur erlaubt, wenn t nicht null ist; durch
// v zu teilen nur, wenn v nicht null ist. Eine Formelsammlung schreibt
// das nicht dazu, weil dort ohnehin nur positive Größen vorkommen. Eine
// App, die rechnen lehrt, sollte es sagen — sonst lernt man eine Regel
// mit einem stillschweigenden Loch.

import { bruch, istNull } from './bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  quotient,
  wurzel,
  variablen,
  alsText as termAlsText,
  vereinfache,
  multipliziereAus,
} from './term.js';
import { gleichung, alsText as gleichungAlsText } from './gleichung.js';

const HOECHSTENS_SCHRITTE = 30;

// Kommt die gesuchte Größe in diesem Term vor?
function enthaelt(term, name) {
  return variablen(term).includes(name);
}

// Wie oft? Mehr als einmal heißt: erst zusammenfassen, und das ist eine
// andere Aufgabe.
function zaehle(term, name) {
  if (term.art === 'variable') {
    return term.name === name ? 1 : 0;
  }
  return kinder(term).reduce((s, k) => s + zaehle(k, name), 0);
}

function kinder(term) {
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

// ---------------------------------------------------------------------

export function stelleUm(formel, ziel) {
  if (typeof ziel !== 'string' || ziel === '') {
    throw new Error('umstellen: es fehlt die gesuchte Größe');
  }

  const gesamt = zaehle(formel.links, ziel) + zaehle(formel.rechts, ziel);
  if (gesamt === 0) {
    return unmoeglich(
      `In dieser Formel kommt ${ziel} gar nicht vor.`,
      [],
      formel
    );
  }
  if (gesamt > 1) {
    return unmoeglich(
      `${ziel} kommt mehrfach vor. Dafür müsste man es erst zusammenfassen oder ausklammern — ` +
        'das kann diese Datei noch nicht.',
      [],
      formel
    );
  }

  const schritte = [];
  const vorbehalte = [];
  let aktuell = formel;

  for (let i = 0; i < HOECHSTENS_SCHRITTE; i++) {
    const zielLinks = enthaelt(aktuell.links, ziel);
    const zielSeite = zielLinks ? aktuell.links : aktuell.rechts;
    const andereSeite = zielLinks ? aktuell.rechts : aktuell.links;

    // Steht die Größe allein da, ist man fertig. Auf welcher Seite,
    // ist gleichgültig — eine Gleichung ist symmetrisch.
    if (zielSeite.art === 'variable' && zielSeite.name === ziel) {
      const fertig = zielLinks ? aktuell : gleichung(aktuell.rechts, aktuell.links);
      if (!zielLinks) {
        schritte.push(schritt('beide Seiten tauschen', fertig));
      }
      return {
        art: 'fertig',
        ergebnis: fertig,
        ergebnisText: gleichungAlsText(fertig),
        schritte,
        vorbehalte,
      };
    }

    // Geschält wird die Seite, auf der die Größe steht — egal welche.
    //
    // Das war zuerst anders: Erst wurde die Größe nach links geholt,
    // dann geschält. Bei "v = s : t" ergab das vier Schritte mit zwei
    // Seitentauschen, wo man von Hand zwei schreibt. Das Tauschen ist
    // kein Rechenschritt, sondern nur eine Leserichtung — es gehört
    // nicht in den Weg, wenn es nichts bewirkt.
    const naechster = schaeleAb(zielSeite, andereSeite, ziel);
    if (naechster === null) {
      return unmoeglich(
        `Hier komme ich nicht weiter: ${termAlsText(zielSeite)} lässt sich nicht ` +
          `weiter nach ${ziel} auflösen.`,
        schritte,
        aktuell
      );
    }

    aktuell = zielLinks
      ? gleichung(naechster.zielSeite, naechster.andereSeite)
      : gleichung(naechster.andereSeite, naechster.zielSeite);
    schritte.push(schritt(naechster.operation, aktuell));

    if (naechster.vorbehalt && !vorbehalte.includes(naechster.vorbehalt)) {
      vorbehalte.push(naechster.vorbehalt);
    }
  }

  return unmoeglich('Das Umstellen kommt nicht zur Ruhe.', schritte, aktuell);
}

function schritt(operation, g) {
  return { operation, gleichung: g, text: gleichungAlsText(g) };
}

function unmoeglich(grund, schritte, g) {
  return { art: 'unklar', grund, schritte, vorbehalte: [], ergebnis: g };
}

// ---------------------------------------------------------------------
// Eine Schicht abschälen
// ---------------------------------------------------------------------
//
// Angesehen wird, was ZULETZT mit der gesuchten Größe gemacht wurde —
// die äußerste Rechenoperation auf der linken Seite. Sie wird auf
// beiden Seiten rückgängig gemacht.

function schaeleAb(zielSeite, andereSeite, ziel) {
  const links = zielSeite;
  const rechts = andereSeite;

  switch (links.art) {
    case 'summe': {
      // Alles, was NICHT die gesuchte Größe enthält, wandert hinüber.
      const drin = links.teile.filter((t) => enthaelt(t, ziel));
      const raus = links.teile.filter((t) => !enthaelt(t, ziel));
      if (drin.length !== 1 || raus.length === 0) {
        return null;
      }
      const abzuziehen = summe(...raus);
      return {
        operation: `beide Seiten − (${termAlsText(abzuziehen)})`,
        zielSeite: drin[0],
        andereSeite: aufraeumen(summe(rechts, produkt(zahl(-1), abzuziehen))),
      };
    }

    case 'produkt': {
      const drin = links.teile.filter((t) => enthaelt(t, ziel));
      const raus = links.teile.filter((t) => !enthaelt(t, ziel));
      if (drin.length !== 1 || raus.length === 0) {
        return null;
      }
      const teiler = produkt(...raus);
      return {
        operation: `beide Seiten : (${termAlsText(teiler)})`,
        zielSeite: produkt(...drin),
        andereSeite: aufraeumen(quotient(rechts, teiler)),
        vorbehalt: vorbehaltNichtNull(teiler),
      };
    }

    case 'quotient': {
      // Beide Fälle laufen auf dasselbe hinaus: mit dem Nenner
      // malnehmen. Steht die Größe im Nenner, wechselt sie dabei die
      // Seite — die Schleife findet sie dort wieder und macht weiter.
      return {
        operation: `beide Seiten · (${termAlsText(links.nenner)})`,
        zielSeite: links.zaehler,
        andereSeite: aufraeumen(produkt(rechts, links.nenner)),
        vorbehalt: vorbehaltNichtNull(links.nenner),
      };
    }

    case 'potenz': {
      if (!enthaelt(links.basis, ziel) || links.exponent.art !== 'zahl') {
        return null;
      }
      const n = links.exponent.wert;
      if (n.n !== 1 || n.z < 2) {
        return null;
      }
      const grad = n.z;
      return {
        operation: grad === 2 ? 'auf beiden Seiten die Wurzel ziehen' : `beide Seiten hoch 1/${grad}`,
        zielSeite: links.basis,
        andereSeite: wurzel(rechts, grad),
        // Bei geradem Exponenten gibt es zwei Lösungen. In einer
        // Formelsammlung steht meist nur die positive, weil dort Längen
        // und Zeiten gemeint sind — gesagt werden muss es trotzdem.
        vorbehalt:
          grad % 2 === 0
            ? 'Beim Wurzelziehen gäbe es auch die negative Lösung — hier steht die positive, wie bei Längen und Zeiten üblich.'
            : null,
      };
    }

    case 'wurzel': {
      if (!enthaelt(links.radikand, ziel)) {
        return null;
      }
      return {
        operation: links.grad === 2 ? 'beide Seiten quadrieren' : `beide Seiten hoch ${links.grad}`,
        zielSeite: links.radikand,
        andereSeite: aufraeumen(potenz(rechts, zahl(links.grad))),
        vorbehalt:
          links.grad % 2 === 0
            ? `Quadrieren ist nur erlaubt, solange ${termAlsText(rechts)} nicht negativ ist.`
            : null,
      };
    }

    default:
      return null;
  }
}

// Nach jedem Schritt aufräumen, aber nicht ausmultiplizieren: Aus
// "s : v" soll nicht plötzlich etwas anderes werden. Klammern werden
// nur dort aufgelöst, wo sie ohnehin verschwinden.
function aufraeumen(term) {
  return vereinfache(term).term;
}

function vorbehaltNichtNull(term) {
  const text = termAlsText(term);
  // Eine Zahl ungleich null braucht keinen Vorbehalt — sie IST nicht
  // null, und der Hinweis wäre nur Lärm.
  if (term.art === 'zahl') {
    return istNull(term.wert) ? `Durch 0 lässt sich nicht teilen.` : null;
  }
  return `gilt nur für ${text} ≠ 0`;
}

// ---------------------------------------------------------------------
// Aufschreiben
// ---------------------------------------------------------------------

export function alsRechenweg(formel, ergebnis) {
  const zeilen = [gleichungAlsText(formel)];

  for (const s of ergebnis.schritte) {
    zeilen.push(`         | ${s.operation}`);
    zeilen.push(s.text);
  }

  if (ergebnis.art === 'unklar') {
    zeilen.push('');
    zeilen.push(ergebnis.grund);
    return zeilen;
  }

  for (const v of ergebnis.vorbehalte) {
    zeilen.push(`   (${v})`);
  }
  return zeilen;
}

// ---------------------------------------------------------------------
// Formeln aus Physik und Alltag
// ---------------------------------------------------------------------
//
// Aus CLAUDE.md: Die Physik bekommt keinen eigenen Bereich, sondern ist
// das durchgehende Beispielmaterial. Hier ist sie am unmittelbarsten:
// Eine Formel umzustellen ist die Fertigkeit, ohne die man eine
// Formelsammlung nur in einer Richtung benutzen kann.

function v(name) {
  return variable(name);
}

export const FORMELN = [
  {
    id: 'geschwindigkeit',
    titel: 'Geschwindigkeit',
    formel: gleichung(v('v'), quotient(v('s'), v('t'))),
    text: 'v = s : t',
    groessen: { v: 'Geschwindigkeit', s: 'Weg', t: 'Zeit' },
    erklaerung: 'Das Beispiel aus dem Konzept. Nach t umgestellt beantwortet es: Wie lange dauert es?',
  },
  {
    id: 'dichte',
    titel: 'Dichte',
    formel: gleichung(v('d'), quotient(v('m'), v('V'))),
    text: 'd = m : V',
    groessen: { d: 'Dichte', m: 'Masse', V: 'Volumen' },
    erklaerung: 'Nach m umgestellt: Wie schwer ist ein Körper aus diesem Stoff?',
  },
  {
    id: 'kraft',
    titel: 'Kraft',
    formel: gleichung(v('F'), produkt(v('m'), v('a'))),
    text: 'F = m · a',
    groessen: { F: 'Kraft', m: 'Masse', a: 'Beschleunigung' },
    erklaerung: 'Nach a umgestellt: Wie stark wird etwas beschleunigt?',
  },
  {
    id: 'ohm',
    titel: 'Ohmsches Gesetz',
    formel: gleichung(v('U'), produkt(v('R'), v('I'))),
    text: 'U = R · I',
    groessen: { U: 'Spannung', R: 'Widerstand', I: 'Stromstärke' },
    erklaerung: 'Nach R umgestellt bekommt man den Widerstand aus Spannung und Strom.',
  },
  {
    id: 'rechteck',
    titel: 'Fläche eines Rechtecks',
    formel: gleichung(v('A'), produkt(v('a'), v('b'))),
    text: 'A = a · b',
    groessen: { A: 'Fläche', a: 'Länge', b: 'Breite' },
    erklaerung: 'Nach b umgestellt: Wie breit muss es sein, damit die Fläche stimmt?',
  },
  {
    id: 'kreisflaeche',
    titel: 'Fläche eines Kreises',
    formel: gleichung(v('A'), produkt(v('p'), potenz(v('r'), zahl(2)))),
    text: 'A = p · r²   (p steht für π)',
    groessen: { A: 'Fläche', p: 'die Zahl π', r: 'Radius' },
    erklaerung:
      'Nach r umgestellt braucht es eine Wurzel — und dabei die Frage, ob auch die negative Lösung zählt. Bei einem Radius nicht.',
  },
  {
    id: 'fallweg',
    titel: 'Fallweg',
    formel: gleichung(v('s'), produkt(zahl(bruch(1, 2)), v('g'), potenz(v('t'), zahl(2)))),
    text: 's = ½ · g · t²',
    groessen: { s: 'Fallhöhe', g: 'Fallbeschleunigung', t: 'Zeit' },
    erklaerung: 'Nach t umgestellt: Wie lange fällt etwas aus einer bestimmten Höhe?',
  },
  {
    id: 'zinsen',
    titel: 'Zinsen',
    formel: gleichung(v('Z'), quotient(produkt(v('K'), v('p')), zahl(100))),
    text: 'Z = K · p : 100',
    groessen: { Z: 'Zinsen', K: 'Kapital', p: 'Zinssatz in Prozent' },
    erklaerung: 'Nach p umgestellt: Welcher Zinssatz steckt dahinter?',
  },
];

export function holeFormel(id) {
  return FORMELN.find((f) => f.id === id) ?? null;
}
