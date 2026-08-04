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
import {
  ungleichung,
  istUngleichung,
  alsText as ungleichungAlsText,
  loese as loeseUngleichung,
  loesungAlsText,
  drehe,
} from './ungleichung.js';
import { parseTerm, parseUngleichung, hatVergleich } from './parser.js';
import { alleThemen, holeThema } from './lernpfad.js';

const x = variable('x');

// x¹ schreibt niemand. Bei Exponent 1 steht einfach x da.
function xHoch(n) {
  return n === 1 ? x : potenz(x, zahl(n));
}

// ---------------------------------------------------------------------
// Fehlerbilder
// ---------------------------------------------------------------------
//
// "Der Wert stimmt nicht" ist ehrlich und nutzlos. Wer 1/2 + 1/3 als 2/5
// beantwortet, hat nicht irgendwie danebengelegen — er hat Zähler und
// Nenner einzeln addiert. Das ist eine BESTIMMTE Vorstellung davon, wie
// Brüche funktionieren, und man kann sie benennen.
//
// Jeder Generator liefert deshalb neben der Lösung auch die typischen
// FALSCHEN Antworten mit ihrer Ursache. Trifft die Eingabe eine davon,
// sagt die App nicht "falsch", sondern was passiert ist.
//
// Zwei Regeln dafür:
//
//   1. Ein Fehlerbild darf nie zufällig die richtige Antwort treffen.
//      Sonst gälte eine richtige Lösung als falsch — der schlimmste
//      Fehler, den eine Übungsapp machen kann. tests/aufgaben.mjs prüft
//      das für jede erzeugte Aufgabe.
//   2. Die Diagnose sagt, WAS gedacht wurde, nicht was fehlt. Nicht
//      "du hast falsch gerechnet", sondern "du hast Zähler und Nenner
//      einzeln addiert".
function fehlerbild(wert, diagnose) {
  return { wert, diagnose };
}

// Eine Zahl im Fließtext. Auch hier gilt das typografische Minus —
// "−12x" und "-12x" nebeneinander sehen nach Fehler aus.
function zahlText(wert) {
  return String(wert).replace('-', '−');
}

// Ein Koeffizient, wie man ihn schreibt: "x" statt "1x", "−x" statt
// "−1x".
function koeffizientText(wert) {
  if (wert === 1) {
    return '';
  }
  return wert === -1 ? '−' : zahlText(wert);
}

// Ein Faktor, der weder 0 noch 1 noch −1 ist. "Multipliziere aus:
// 1 · (x + 3)" ist keine Aufgabe, sondern eine Abschrift.
function echterFaktor(naechste, bis) {
  const wert = naechste(2 * bis) - bis;
  if (wert === 0 || wert === 1) {
    return 2;
  }
  return wert === -1 ? -2 : wert;
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
      fehlerbilder: [
        fehlerbild(
          zahl(Math.abs(a) + Math.abs(b) + Math.abs(c)),
          'Du hast die Vorzeichen übersehen und alles zusammengezählt. Ein Minus vor einer Zahl gehört zu ihr dazu.'
        ),
      ],
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
        fehlerbilder: [
          fehlerbild(
            zahl(-a * b),
            'Das Vorzeichen stimmt nicht. Minus mal Plus gibt Minus, Minus mal Minus gibt Plus.'
          ),
          fehlerbild(zahl(a + b), 'Hier wird malgenommen, nicht addiert.'),
        ],
      };
    }
    const t = quotient(zahl(a * b), zahl(b));
    return {
      frage: `Berechne: ${termAlsText(t)}`,
      art: 'zahl',
      term: t,
      loesung: zahl(a),
      fehlerbilder: [
        fehlerbild(
          zahl(-a),
          'Das Vorzeichen stimmt nicht. Minus geteilt durch Plus gibt Minus, Minus durch Minus gibt Plus.'
        ),
      ],
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
      fehlerbilder:
        faktor % 2 === 0
          ? [
              fehlerbild(
                zahl(bruch(gekuerzt.z * (faktor / 2), gekuerzt.n * (faktor / 2))),
                'Du bist auf dem richtigen Weg, aber noch nicht am Ende: Zähler und Nenner haben immer noch einen gemeinsamen Teiler.'
              ),
            ]
          : [],
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
      fehlerbilder: [
        fehlerbild(
          zahl(bruch(a.z + b.z, a.n + b.n)),
          'Du hast Zähler und Nenner einzeln addiert. So geht es nicht: Erst müssen beide Brüche denselben Nenner bekommen, dann werden nur die Zähler addiert.'
        ),
        fehlerbild(
          zahl(bruch(a.z + b.z, a.n)),
          'Die Nenner sind verschieden — du kannst die Zähler erst addieren, wenn beide Brüche gleichnamig sind.'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          zahl(bruch(a.z * b.z, a.n + b.n)),
          'Beim Malnehmen wird auch der Nenner malgenommen, nicht addiert. Gleichnamig machen muss man nur beim Addieren.'
        ),
        fehlerbild(
          zahl(bruch(a.z * b.n, a.n * b.z)),
          'Du hast über Kreuz gerechnet — das gehört zum Teilen. Beim Malnehmen: Zähler mal Zähler, Nenner mal Nenner.'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          zahl(bruch(a.z * b.z, a.n * b.n)),
          'Du hast einfach malgenommen. Beim Teilen muss der zweite Bruch zuerst umgedreht werden — Zähler und Nenner tauschen.'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          zahl(basis * e),
          `Du hast Basis und Exponent malgenommen. ${basis}^${e} heißt aber: ${basis} ${e}-mal mit sich selbst malnehmen.`
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          xHoch(a * b),
          'Du hast die Exponenten malgenommen. Beim Malnehmen von Potenzen werden sie addiert — malgenommen werden sie erst bei einer Potenz von einer Potenz.'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          xHoch(b - a),
          'Du hast in die falsche Richtung subtrahiert: Vom Exponenten oben wird der untere abgezogen, nicht umgekehrt.'
        ),
        fehlerbild(
          xHoch(a + b),
          'Addiert wird beim Malnehmen. Beim Teilen werden die Exponenten subtrahiert.'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          zahl(-(basis ** e)),
          `Ein negativer Exponent macht das Ergebnis nicht negativ, sondern zu einem Kehrwert: ${basis}^−${e} ist 1 geteilt durch ${basis}^${e}.`
        ),
        fehlerbild(
          zahl(basis ** e),
          'Das Minus im Exponenten ist nicht verschwunden — es bedeutet den Kehrwert.'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          zahl(bruch(w * w, 2)),
          'Die Wurzel ist nicht die Hälfte. Gesucht ist die Zahl, die MIT SICH SELBST malgenommen den Radikanden ergibt.'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          zahl(heraus * rest),
          `Die ${rest} steht noch unter der Wurzel — herauskommen darf nur der Faktor, der ein Quadrat ist.`
        ),
        fehlerbild(
          produkt(zahl(rest), wurzel(zahl(heraus))),
          'Du hast die beiden Faktoren vertauscht. Aus der Wurzel kommt die Wurzel des Quadratfaktors heraus, der Rest bleibt drin.'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          produkt(zahl(a + b + c), x),
          `Die ${zahlText(Math.abs(b))} hat kein x und gehört deshalb nicht zu den x-Gliedern. Drei Äpfel plus zwei Birnen sind nicht fünf Äpfel.`
        ),
        fehlerbild(
          summe(produkt(zahl(a + c), potenz(x, zahl(2))), zahl(b)),
          'Beim Zusammenfassen werden nur die Zahlen davor addiert. Der Buchstabenteil bleibt, wie er ist: 3x + 2x sind 5x, nicht 5x².'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          produkt(zahl(a + b + c), potenz(x, zahl(2))),
          'x und x² sind nicht gleichartig und lassen sich nicht zusammenfassen — genauso wenig wie Meter und Quadratmeter.'
        ),
        fehlerbild(
          produkt(zahl(a + b + c), x),
          'x und x² sind nicht gleichartig. Zusammenfassen darf man nur, was denselben Buchstabenteil hat.'
        ),
      ],
    };
  },

  ausmultiplizieren(naechste) {
    const a = echterFaktor(naechste, 7);
    const b = ohneNull(naechste, 9);
    const t = produkt(zahl(a), summe(x, zahl(b)));
    return {
      frage: `Multipliziere aus: ${termAlsText(t)}`,
      art: 'term',
      term: t,
      loesung: summe(produkt(zahl(a), x), zahl(a * b)),
      fehlerbilder: [
        fehlerbild(
          summe(produkt(zahl(a), x), zahl(b)),
          `Nur der erste Summand wurde malgenommen. Die ${zahlText(a)} gilt für ALLES in der Klammer, also auch für die ${zahlText(b)}.`
        ),
        fehlerbild(
          summe(x, zahl(a * b)),
          'Der zweite Summand wurde malgenommen, der erste nicht. Der Faktor vor der Klammer gilt für jeden Summanden darin.'
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          summe(potenz(x, zahl(2)), zahl(b * b)),
          'Das mittlere Glied fehlt. Beim Ausmultiplizieren zweier Klammern entstehen VIER Produkte, nicht zwei — und die beiden gemischten ergeben zusammen das Glied mit x.'
        ),
        fehlerbild(
          summe(potenz(x, zahl(2)), produkt(zahl(b), x), zahl(b * b)),
          `Das gemischte Glied kommt zweimal vor: einmal x · ${zahlText(b)} und einmal ${zahlText(b)} · x. Zusammen sind das ${zahlText(2 * b)}x.`
        ),
      ],
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
      fehlerbilder: [
        fehlerbild(
          produkt(zahl(faktor), summe(produkt(zahl(a), x), zahl(faktor * b))),
          `Beim Ausklammern muss JEDER Summand durch ${faktor} geteilt werden — auch der hintere. Die Probe durch Ausmultiplizieren zeigt es sofort.`
        ),
        fehlerbild(
          produkt(zahl(faktor), summe(produkt(zahl(faktor * a), x), zahl(b))),
          `Beim Ausklammern muss JEDER Summand durch ${faktor} geteilt werden — auch der vordere.`
        ),
      ],
    };
  },

  gleichungEinschrittig(naechste) {
    const loesung = ohneNull(naechste, 12);
    const b = ohneNull(naechste, 12);
    const g = gleichung(summe(x, zahl(b)), zahl(loesung + b));
    return {
      frage: `Löse die Gleichung: ${gleichungAlsText(g)}`,
      start: g,
      art: 'zahl',
      loesung: zahl(loesung),
      fehlerbilder: [
        fehlerbild(
          zahl(loesung + 2 * b),
          `Du hast die ${zahlText(Math.abs(b))} auf der falschen Seite verrechnet. Was links addiert wird, muss rechts abgezogen werden — nicht noch einmal dazu.`
        ),
      ],
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
      start: g,
      art: 'zahl',
      loesung: zahl(loesung),
      fehlerbilder: [
        fehlerbild(
          zahl(bruch((a - c) * loesung, a + c)),
          `Du hast die x-Glieder addiert statt subtrahiert. Wenn ${koeffizientText(c)}x auf die andere Seite soll, wird es auf BEIDEN Seiten abgezogen.`
        ),
      ],
    };
  },

  gleichungMitKlammern(naechste) {
    const loesung = ohneNull(naechste, 8);
    const a = naechste(4) + 2;
    const b = ohneNull(naechste, 7);
    const g = gleichung(produkt(zahl(a), summe(x, zahl(b))), zahl(a * (loesung + b)));
    return {
      frage: `Löse die Gleichung: ${gleichungAlsText(g)}`,
      start: g,
      art: 'zahl',
      loesung: zahl(loesung),
      fehlerbilder: [
        fehlerbild(
          zahl(a * (loesung + b) - b),
          `Du hast die Klammer nicht ausmultipliziert. Die ${zahlText(a)} gilt für x UND für die ${zahlText(b)}.`
        ),
      ],
    };
  },

  gleichungMitBruechen(naechste) {
    const nenner = naechste(4) + 2;
    const loesung = (ohneNull(naechste, 6)) * nenner;
    const b = ohneNull(naechste, 9);
    const g = gleichung(summe(quotient(x, zahl(nenner)), zahl(b)), zahl(loesung / nenner + b));
    return {
      frage: `Löse die Gleichung: ${gleichungAlsText(g)}`,
      start: g,
      art: 'zahl',
      loesung: zahl(loesung),
      fehlerbilder: [
        fehlerbild(
          zahl(loesung / nenner),
          `Du hast vergessen, am Ende mit ${nenner} malzunehmen. Wenn x geteilt durch ${nenner} bekannt ist, ist x selbst ${nenner}-mal so groß.`
        ),
      ],
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
      start: g,
      art: 'zahlen',
      loesung: [zahl(Math.max(r1, r2)), zahl(Math.min(r1, r2))],
      fehlerbilder: [
        fehlerbild(
          [zahl(-r1), zahl(-r2)],
          'Beide Vorzeichen stimmen nicht. In der pq-Formel steht −p/2, nicht +p/2 — das Minus davor wird leicht übersehen.'
        ),
      ],
      hinweis: 'Es gibt zwei Lösungen. Schreibe beide, getrennt durch ein Semikolon.',
    };
  },

  // ax + b < c mit POSITIVEM a — hier dreht sich nichts. Diese Aufgabe
  // ist absichtlich harmlos: Sie stellt fest, ob das Umformen an sich
  // sitzt, bevor die Aufgabe darüber den Dreh verlangt. Wer hier
  // scheitert, hat kein Problem mit dem Dreh, sondern mit dem Lösen.
  ungleichungEinfach(naechste) {
    const a = naechste(5) + 2;
    const b = ohneNull(naechste, 9);
    const grenze = ohneNull(naechste, 6);
    const zeichen = ausListe(naechste, ['<', '≤', '>', '≥']);
    const u = ungleichung(summe(produkt(zahl(a), x), zahl(b)), zeichen, zahl(a * grenze + b));
    return {
      frage: `Löse die Ungleichung: ${ungleichungAlsText(u)}`,
      start: u,
      art: 'ungleichung',
      loesung: ungleichung(x, zeichen, zahl(grenze)),
      fehlerbilder: [
        fehlerbild(
          ungleichung(x, drehe(zeichen), zahl(grenze)),
          `Hier war kein Dreh nötig. Das Zeichen kippt nur beim Malnehmen oder Teilen mit einer NEGATIVEN Zahl — hier wurde durch ${zahlText(a)} geteilt, und ${zahlText(a)} ist positiv.`
        ),
      ],
      hinweis: 'Schreibe das Ergebnis als Ungleichung, zum Beispiel x < 5.',
    };
  },

  // −ax + b < c — und jetzt muss gedreht werden. Das ist die Aufgabe,
  // für die es die ganze Zeile im Lernpfad gibt.
  ungleichungMitDreh(naechste) {
    const a = naechste(4) + 2;
    const b = ohneNull(naechste, 9);
    const grenze = ohneNull(naechste, 6);
    const zeichen = ausListe(naechste, ['<', '≤', '>', '≥']);
    // −a·x + b ⋛ −a·grenze + b   ist gleichbedeutend mit   x ⋚ grenze.
    const u = ungleichung(summe(produkt(zahl(-a), x), zahl(b)), zeichen, zahl(-a * grenze + b));
    return {
      frage: `Löse die Ungleichung: ${ungleichungAlsText(u)}`,
      start: u,
      art: 'ungleichung',
      loesung: ungleichung(x, drehe(zeichen), zahl(grenze)),
      fehlerbilder: [
        fehlerbild(
          ungleichung(x, zeichen, zahl(grenze)),
          `Die Zahl stimmt, das Zeichen nicht. Geteilt wurde durch ${zahlText(-a)} — eine negative Zahl, und dabei dreht sich das Vergleichszeichen um. Probe: Setze eine Zahl aus deinem Bereich in die ursprüngliche Ungleichung ein, dann siehst du es sofort.`
        ),
      ],
      hinweis: 'Schreibe das Ergebnis als Ungleichung, zum Beispiel x < 5.',
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

  // Fehlerbilder, die zufällig die richtige Antwort treffen, fliegen
  // raus. Das ist keine Kosmetik, sondern notwendig:
  //
  //   √4 — "die Wurzel ist die Hälfte" ergibt hier 2, und das STIMMT.
  //   x² · x² — Exponenten malgenommen ergibt x⁴, genau wie addiert.
  //   x² − 36 = 0 — beide Vorzeichen vertauscht ergibt dieselbe Menge.
  //
  // Bliebe so ein Bild stehen, würde eine richtige Antwort als
  // typischer Fehler abgewiesen — das Schlimmste, was eine Übungsapp
  // tun kann. Statt in jedem Generator die entarteten Zahlen zu
  // vermeiden, wird hier zentral geprüft: Wo sich der Fehler nicht vom
  // Richtigen unterscheiden lässt, gibt es für diese Aufgabe eben keine
  // Diagnose.
  const fehlerbilder = (roh.fehlerbilder ?? []).filter(
    (bild) => !trifftLoesung(bild.wert, roh.loesung)
  );

  return Object.freeze({
    thema: themaId,
    titel: thema?.titel ?? themaId,
    wissen: thema?.wissen ?? null,
    ...roh,
    fehlerbilder,
    // Womit der Rechenweg anfängt. Bei einer Gleichung ist das die
    // Gleichung, bei einer Umformung der Term. Wer selbst rechnet,
    // beginnt hier — und die erste eigene Zeile wird dagegen geprüft.
    start: roh.start ?? roh.term ?? null,
    loesungText: loesungAlsAntwort(roh.loesung),
  });
}

// Die Lösung so, wie sie dastehen soll, wenn man sie vorliest. Bei
// einer Ungleichung ist das der Bereich ("x > −3"), nicht die
// umgeformte Zeile.
function loesungAlsAntwort(loesung) {
  if (istUngleichung(loesung)) {
    return loesungAlsText(loeseUngleichung(loesung));
  }
  return Array.isArray(loesung)
    ? loesung.map(termAlsText).join('; ')
    : termAlsText(loesung);
}

// Deckt sich ein Fehlerbild mit der Lösung? Bei mehreren Lösungen zählt
// die Menge, nicht die Reihenfolge.
function trifftLoesung(wert, loesung) {
  // Bei einer Ungleichung ist die "Lösung" kein Term, sondern ein
  // Bereich — verglichen wird die Lösungsmenge. Auch hier gilt der
  // Zweck dieses Filters: Fiele der typische Fehler mit dem Richtigen
  // zusammen, würde eine richtige Antwort als Fehler abgewiesen. Bei
  // Ungleichungen passiert das etwa, wenn die Grenze null ist und das
  // Zeichen ≤ heißt — dann sind gedreht und ungedreht nicht immer zu
  // unterscheiden.
  if (istUngleichung(loesung) || istUngleichung(wert)) {
    if (!istUngleichung(loesung) || !istUngleichung(wert)) {
      return false;
    }
    return gleicheLoesungsmenge(loeseUngleichung(wert), loeseUngleichung(loesung));
  }
  if (Array.isArray(wert) !== Array.isArray(loesung)) {
    return false;
  }
  if (!Array.isArray(wert)) {
    return wertgleich(wert, loesung);
  }
  if (wert.length !== loesung.length) {
    return false;
  }
  const offen = [...loesung];
  return wert.every((w) => {
    const stelle = offen.findIndex((soll) => wertgleich(w, soll));
    if (stelle === -1) {
      return false;
    }
    offen.splice(stelle, 1);
    return true;
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
// "x = 3" ist die natürliche Art, eine Gleichungslösung hinzuschreiben —
// und die letzte Zeile eines Rechenwegs sieht ohnehin so aus. Gefragt
// ist aber die Zahl. Also wird das "x =" abgestreift, statt es als
// Fehler zu werten.
function ohneVariableVorn(text) {
  const treffer = text.match(/^\s*[a-zA-Zα-ωΑ-Ω]\s*=\s*(.+)$/);
  return treffer ? treffer[1].trim() : text;
}

export function pruefeAntwort(aufgabe, eingabe) {
  const text = ohneVariableVorn(String(eingabe).trim());
  if (text === '') {
    return { richtig: false, grund: 'Da steht noch nichts.' };
  }

  if (aufgabe.art === 'zahlen') {
    return pruefeMehrere(aufgabe, text);
  }
  if (aufgabe.art === 'ungleichung') {
    return pruefeUngleichung(aufgabe, String(eingabe).trim());
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
    // Erst nachsehen, ob das ein BEKANNTER Fehler ist. "Der Wert stimmt
    // nicht" hilft niemandem weiter; "du hast Zähler und Nenner einzeln
    // addiert" schon.
    const bild = (aufgabe.fehlerbilder ?? []).find(
      (f) => !Array.isArray(f.wert) && wertgleich(antwort, f.wert)
    );
    if (bild) {
      return { richtig: false, grund: bild.diagnose, erkannt: true };
    }
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

// Bei einer Ungleichung ist die Antwort keine Zahl, sondern ein
// Bereich. Verglichen wird deshalb die LÖSUNGSMENGE und nicht der Text:
// "−3 < x" ist dieselbe Aussage wie "x > −3", nur andersherum
// aufgeschrieben, und beides muss zählen.
//
// Vorn steht trotzdem eine Formprüfung: Wer "2x > −6" schreibt, hat
// zwar eine richtige Aussage hingeschrieben, aber nichts gelöst. Das
// ist dasselbe Maß wie bei den Zahlaufgaben, wo "6 : 2" nicht als "3"
// durchgeht.
function pruefeUngleichung(aufgabe, text) {
  if (!hatVergleich(text)) {
    return {
      richtig: false,
      grund: 'Hier ist eine Ungleichung gesucht — mit <, ≤, > oder ≥ dazwischen.',
    };
  }

  let antwort;
  try {
    antwort = parseUngleichung(text);
  } catch (fehler) {
    return { richtig: false, grund: `Das kann ich nicht lesen: ${fehler.message}` };
  }

  const meins = loeseUngleichung(antwort);
  if (meins.art === 'unklar') {
    return { richtig: false, grund: meins.grund };
  }
  if (!istAufgeloest(antwort)) {
    return { richtig: false, grund: 'Das lässt sich noch weiter auflösen — x soll allein stehen.' };
  }

  const soll = loeseUngleichung(aufgabe.loesung);
  if (gleicheLoesungsmenge(meins, soll)) {
    return { richtig: true };
  }

  for (const bild of aufgabe.fehlerbilder ?? []) {
    if (bild.wert && bild.wert.zeichen && gleicheLoesungsmenge(meins, loeseUngleichung(bild.wert))) {
      return { richtig: false, grund: bild.diagnose, erkannt: true };
    }
  }
  return { richtig: false, grund: 'Dieser Bereich stimmt nicht.' };
}

// Steht x allein auf einer Seite? Auf WELCHER, ist egal: "−3 < x" ist
// dieselbe Aussage wie "x > −3" und genauso weit aufgelöst. Nur wer
// "2x > −6" schreibt, hat noch nichts getan.
//
// Zuerst hatte ich hier gefragt, ob loese() noch Schritte macht — und
// damit "−3 < x" abgewiesen, weil die App es erst nach links holt. Das
// Umdrehen ist aber kein Rechenschritt, sondern eine Leserichtung.
// Derselbe Fehler wie damals bei umstellen.js.
function istAufgeloest(u) {
  const alleinLinks = u.links.art === 'variable' && variablen(u.rechts).length === 0;
  const alleinRechts = u.rechts.art === 'variable' && variablen(u.links).length === 0;
  return alleinLinks || alleinRechts;
}

// Zwei Lösungsmengen vergleichen. Strukturell, nicht über Stichproben:
// Zwei Bereiche, die sich nur an der Grenze unterscheiden — x < 3 und
// x ≤ 3 —, sähen an zufälligen Stellen fast immer gleich aus. Und genau
// dieser Unterschied ist bei Ungleichungen der Lernstoff.
function gleicheLoesungsmenge(a, b) {
  if (a.art !== b.art) {
    return false;
  }
  if (a.art !== 'loesung') {
    return true;
  }
  if (a.intervalle.length !== b.intervalle.length) {
    return false;
  }
  return a.intervalle.every((iv, i) => {
    const w = b.intervalle[i];
    const grenzeGleich = (p, q) =>
      (p === null && q === null) || (p !== null && q !== null && termAlsText(p) === termAlsText(q));
    return (
      grenzeGleich(iv.von, w.von) &&
      grenzeGleich(iv.bis, w.bis) &&
      iv.vonOffen === w.vonOffen &&
      iv.bisOffen === w.bisOffen
    );
  });
}

function pruefeMehrere(aufgabe, text) {
  const teile = text
    .split(/[;,]|\boder\b|\bund\b/)
    .map((s) => ohneVariableVorn(s.trim()))
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

  // Ein bekanntes Fehlerbild — hier trifft es die ganze Menge auf
  // einmal, etwa wenn beide Vorzeichen vertauscht sind.
  for (const bild of aufgabe.fehlerbilder ?? []) {
    if (!Array.isArray(bild.wert) || bild.wert.length !== antworten.length) {
      continue;
    }
    const offen = [...bild.wert];
    const passtAlles = antworten.every((antwort) => {
      const stelle = offen.findIndex((soll) => wertgleich(antwort, soll));
      if (stelle === -1) {
        return false;
      }
      offen.splice(stelle, 1);
      return true;
    });
    if (passtAlles) {
      return { richtig: false, grund: bild.diagnose, erkannt: true };
    }
  }

  // Die Reihenfolge ist egal — es ist eine Menge, keine Liste.
  const offen = [...aufgabe.loesung];
  const daneben = [];
  for (const antwort of antworten) {
    const stelle = offen.findIndex((soll) => wertgleich(antwort, soll));
    if (stelle === -1) {
      daneben.push(antwort);
    } else {
      offen.splice(stelle, 1);
    }
  }

  if (daneben.length === 0) {
    return { richtig: true };
  }
  // Eine von zweien richtig zu haben ist etwas anderes, als beide zu
  // verfehlen — und das soll auch dastehen.
  if (daneben.length < antworten.length) {
    return {
      richtig: false,
      grund: `${termAlsText(daneben[0])} ist keine Lösung — die andere stimmt aber. Es fehlt noch eine.`,
    };
  }
  return { richtig: false, grund: `${termAlsText(daneben[0])} ist keine Lösung.` };
}

// Für Prüfungen und für die Übersicht: Zu welchen Themen gibt es
// Aufgaben? Muss deckungsgleich mit dem Lernpfad sein.
export function themenMitAufgaben() {
  return alleThemen().filter(hatGenerator);
}
