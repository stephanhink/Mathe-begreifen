// Prüfungen für die Termumformung.
//
// Die wichtigste steht ganz unten und ist die, die laut CLAUDE.md alles
// trägt:
//
//   Jede Umformung muss den Term wertgleich lassen. Term vor und nach
//   dem Schritt an 200 zufälligen Stellen auswerten und vergleichen.
//   Schlägt das fehl, ist die Umformungsregel falsch — egal wie
//   plausibel sie aussah.
//
// Ausgewertet wird dabei EXAKT, in Brüchen. Die Vorlage aus dem Konzept
// sprach von numerischem Vergleich mit Toleranz; das ist hier nicht
// nötig und wäre schwächer. Solange die Termsprache keine Wurzeln
// kennt, ist jeder Wert an einer rationalen Stelle wieder rational —
// und dann kann man auf Gleichheit prüfen statt auf Ähnlichkeit.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, gleich as bruchGleich, alsText as bruchAlsText } from '../utils/bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  quotient,
  wurzel,
  betrag,
  istTerm,
  istGleich,
  variablen,
  auswerteExakt,
  auswerte,
  alsText,
  vereinfache,
  multipliziereAus,
  klammereAus,
  alsRechenweg,
} from '../utils/term.js';

const x = variable('x');
const y = variable('y');

// ---------------------------------------------------------------------

pruefung('Bausteine', () => {
  wahr('eine Zahl ist ein Term', istTerm(zahl(3)));
  wahr('eine Variable ist ein Term', istTerm(variable('x')));
  wahr('eine Zahl ist eingefroren', Object.isFrozen(zahl(3)));
  wahr('istTerm lehnt eine Kommazahl ab', !istTerm(3));
  wahr('istTerm lehnt einen Bruch ab', !istTerm(bruch(1, 2)));

  // Verschachtelte Summen werden sofort flach gezogen: a + (b + c) ist
  // EINE Summe mit drei Gliedern. Sonst fände "gleichartige Glieder
  // zusammenfassen" die Glieder nicht, die eine Ebene tiefer liegen.
  const flach = summe(summe(x, zahl(1)), zahl(2));
  zahlIst('a + (b + c) hat drei Glieder', flach.teile.length, 3);
  const flachesProdukt = produkt(produkt(zahl(2), x), y);
  zahlIst('a · (b · c) hat drei Faktoren', flachesProdukt.teile.length, 3);

  // Entartete Fälle entstehen gar nicht erst.
  gleichText('eine Summe aus einem Glied ist das Glied', alsText(summe(x)), 'x');
  gleichText('eine leere Summe ist 0', alsText(summe()), '0');
  gleichText('ein leeres Produkt ist 1', alsText(produkt()), '1');

  // Ein Bruch darf direkt als Zahl übergeben werden.
  gleichText('zahl(bruch(1, 2))', alsText(zahl(bruch(1, 2))), '1/2');

  wirft('Variable mit Sonderzeichen', () => variable('x!'));
  wirft('Variable als Zahl', () => variable(3));
  wirft('Summe aus etwas, das kein Term ist', () => summe(x, 3));
  wirft('Potenz mit einer nackten Zahl', () => potenz(2, 3));
});

pruefung('Aufschreiben', () => {
  gleichText('3x', alsText(produkt(zahl(3), x)), '3x');
  gleichText('x + 3', alsText(summe(x, zahl(3))), 'x + 3');
  // Ein negatives Glied wird zum Minus, nicht zu "+ −3".
  gleichText('x − 3', alsText(summe(x, zahl(-3))), 'x − 3');
  gleichText('−x', alsText(produkt(zahl(-1), x)), '−x');
  gleichText('1 · x ist x', alsText(produkt(zahl(1), x)), 'x');

  // Hochgestellte Ziffern, auch mehrstellig und negativ.
  gleichText('x²', alsText(potenz(x, zahl(2))), 'x²');
  gleichText('x⁻²', alsText(potenz(x, zahl(-2))), 'x⁻²');
  gleichText('x¹²', alsText(potenz(x, zahl(12))), 'x¹²');
  gleichText('x^(y) bei unbekanntem Exponenten', alsText(potenz(x, y)), 'x^(y)');

  // Klammern nur, wo sie gebraucht werden.
  gleichText('3 · (x + y)', alsText(produkt(zahl(3), summe(x, y))), '3 · (x + y)');
  gleichText('(x + y)²', alsText(potenz(summe(x, y), zahl(2))), '(x + y)²');
  gleichText('keine Klammer um ein Produkt in einer Summe', alsText(summe(produkt(zahl(3), x), y)), '3x + y');
  gleichText('2x · (1 + y)', alsText(produkt(zahl(2), x, summe(zahl(1), y))), '2x · (1 + y)');
  gleichText('x · x bleibt getrennt', alsText(produkt(x, x)), 'x · x');
  gleichText('(x + 1) : (2y)', alsText(quotient(summe(x, zahl(1)), produkt(zahl(2), y))), '(x + 1) : (2y)');

  // Das Minuszeichen ist überall dasselbe Zeichen (U+2212).
  const gemischt = alsText(summe(produkt(zahl(-2), x), produkt(zahl(-6), potenz(x, zahl(2)))));
  gleichText('−2x − 6x² mit einheitlichem Minus', gemischt, '−2x − 6x²');
  wahr('kein ASCII-Bindestrich in der Ausgabe', !gemischt.includes('-'));
});

pruefung('Strukturelle Gleichheit', () => {
  wahr('3x ist 3x', istGleich(produkt(zahl(3), x), produkt(zahl(3), x)));
  // Bewusst NICHT mathematische Gleichheit: x + 1 und 1 + x sind
  // verschieden geschrieben, also hier verschieden. Wer wissen will, ob
  // zwei Terme denselben Wert haben, wertet sie aus.
  wahr('x + 1 ist nicht 1 + x', !istGleich(summe(x, zahl(1)), summe(zahl(1), x)));
});

pruefung('Variablen finden', () => {
  const t = summe(produkt(zahl(3), x), potenz(y, zahl(2)), x);
  gleichText('x und y, alphabetisch und ohne Wiederholung', variablen(t).join(','), 'x,y');
  gleichText('ein Term ohne Variable', variablen(zahl(7)).join(','), '');
});

pruefung('Exakt auswerten', () => {
  gleichText('3x bei x = 1/2', bruchAlsText(auswerteExakt(produkt(zahl(3), x), { x: bruch(1, 2) })), '3/2');
  gleichText(
    '(x + 3)² bei x = 2',
    bruchAlsText(auswerteExakt(potenz(summe(x, zahl(3)), zahl(2)), { x: bruch(2) })),
    '25'
  );
  gleichText(
    'x⁻² bei x = 2/3',
    bruchAlsText(auswerteExakt(potenz(x, zahl(-2)), { x: bruch(2, 3) })),
    '9/4'
  );
  gleichText(
    '1/3 + 1/3 + 1/3 ergibt genau 1',
    bruchAlsText(auswerteExakt(summe(zahl(bruch(1, 3)), zahl(bruch(1, 3)), zahl(bruch(1, 3))))),
    '1'
  );

  zahlIst('auswerte gibt eine Kommazahl', auswerte(produkt(zahl(3), x), { x: 0.5 }), 1.5);
});

pruefung('Was beim Auswerten abgelehnt wird', () => {
  wirft('unbelegte Variable', () => auswerteExakt(x, {}));
  wirft('Belegung als Kommazahl statt Bruch', () => auswerteExakt(x, { x: 0.5 }));
  wirft('Division durch null', () => auswerteExakt(quotient(zahl(1), x), { x: bruch(0) }));
  wirft('x⁻¹ an der Stelle 0', () => auswerteExakt(potenz(x, zahl(-1)), { x: bruch(0) }));
  wirft('0⁰', () => auswerteExakt(potenz(zahl(0), zahl(0))));
  // Ein gebrochener Exponent ist eine Wurzel und im Allgemeinen kein
  // Bruch. Dieses Modul rät dafür nichts.
  wirft('gebrochener Exponent', () => auswerteExakt(potenz(zahl(2), zahl(bruch(1, 2)))));
});

// ---------------------------------------------------------------------
// Die Regeln, einzeln
// ---------------------------------------------------------------------

pruefung('Zusammenfassen', () => {
  const t = summe(produkt(zahl(3), x), zahl(5), produkt(zahl(2), x));
  const e = vereinfache(t);
  gleichText('3x + 5 + 2x', alsText(e.term), '5x + 5');
  gleichText('unter dem Namen, den man vorliest', e.schritte[0].regel, 'gleichartige Glieder zusammenfassen');

  gleichText('x² · x³', alsText(vereinfache(produkt(potenz(x, zahl(2)), potenz(x, zahl(3)))).term), 'x⁵');
  gleichText('x · x', alsText(vereinfache(produkt(x, x)).term), 'x²');
  gleichText('2 · 3 · x', alsText(vereinfache(produkt(zahl(2), zahl(3), x)).term), '6x');
  gleichText('x + 0', alsText(vereinfache(summe(x, zahl(0))).term), 'x');
  gleichText('1 · x', alsText(vereinfache(produkt(zahl(1), x)).term), 'x');
  gleichText('0 · x', alsText(vereinfache(produkt(zahl(0), x)).term), '0');
  gleichText('x¹', alsText(vereinfache(potenz(x, zahl(1))).term), 'x');
  gleichText('x − x', alsText(vereinfache(summe(x, produkt(zahl(-1), x))).term), '0');

  // Ein Term, an dem nichts zu tun ist, bekommt keinen Schritt.
  const fertig = vereinfache(summe(x, y));
  zahlIst('x + y braucht keinen Schritt', fertig.schritte.length, 0);
  gleichText('und bleibt, wie er war', alsText(fertig.term), 'x + y');
});

pruefung('Durch eine Zahl teilen', () => {
  // x : 3 wird zu 1/3 · x. Ohne diese Regel bliebe der Bruch stehen und
  // ließe sich nicht weiterverrechnen — beim Gleichungslösen führte das
  // zu Zeilen wie "3 · x : 3 = 6" statt "x = 6".
  gleichText('x : 3', alsText(vereinfache(quotient(x, zahl(3))).term), '1/3 · x');
  gleichText('6 : 3', alsText(vereinfache(quotient(zahl(6), zahl(3))).term), '2');
  gleichText('x : 1', alsText(vereinfache(quotient(x, zahl(1))).term), 'x');
  gleichText(
    '(2x + 4) : 2',
    alsText(multipliziereAus(quotient(summe(produkt(zahl(2), x), zahl(4)), zahl(2))).term),
    'x + 2'
  );

  // Steht die Variable im Nenner, bleibt der Bruch stehen: Der Kehrwert
  // wäre an den Nullstellen des Nenners nicht definiert, die Umformung
  // würde also den Definitionsbereich verschieben.
  gleichText('x : y bleibt stehen', alsText(vereinfache(quotient(x, y)).term), 'x : y');
  gleichText('1 : x bleibt stehen', alsText(vereinfache(quotient(zahl(1), x)).term), '1 : x');

  // Eine Null im Nenner wird nicht stillschweigend weggerechnet.
  gleichText('x : 0 bleibt stehen', alsText(vereinfache(quotient(x, zahl(0))).term), 'x : 0');
  wirft('und wirft beim Auswerten', () => auswerteExakt(quotient(x, zahl(0)), { x: bruch(1) }));

  // Und das Umformen selbst darf daran nicht scheitern: "5 : 0" ist ein
  // Term, den man hinschreiben kann — er hat nur keinen Wert. Würde
  // vereinfache() hier werfen, brächte ein Tippfehler im Eingabefeld
  // die App zu Fall, noch bevor gerechnet wird.
  gleichText('5 : 0 bleibt stehen', alsText(vereinfache(quotient(zahl(5), zahl(0))).term), '5 : 0');
  gleichText('0 : 0 bleibt stehen', alsText(vereinfache(quotient(zahl(0), zahl(0))).term), '0 : 0');
  gleichText(
    'auch mitten in einer Summe',
    alsText(vereinfache(summe(quotient(zahl(0), zahl(0)), x)).term),
    '0 : 0 + x'
  );
  wirft('0 : 0 wirft beim Auswerten', () => auswerteExakt(quotient(zahl(0), zahl(0))));
});

pruefung('Ein Bruch als Koeffizient klebt nicht am Buchstaben', () => {
  // "1/2x" liest sich wie 1/(2x) und meint das Gegenteil. Bei einem
  // Bruch muss der Malpunkt stehen, bei einer ganzen Zahl nicht.
  gleichText('1/2 · x', alsText(produkt(zahl(bruch(1, 2)), x)), '1/2 · x');
  gleichText('3x bleibt 3x', alsText(produkt(zahl(3), x)), '3x');
  gleichText('−1/2 · x', alsText(produkt(zahl(bruch(-1, 2)), x)), '−1/2 · x');
});

pruefung('Ausmultiplizieren', () => {
  gleichText(
    '2 · (x + 3)',
    alsText(multipliziereAus(produkt(zahl(2), summe(x, zahl(3)))).term),
    '2x + 6'
  );

  // Die erste binomische Formel — nicht nachgeschlagen, sondern
  // Schritt für Schritt hergeleitet.
  const binom = multipliziereAus(potenz(summe(x, zahl(3)), zahl(2)));
  gleichText('(x + 3)²', alsText(binom.term), 'x² + 6x + 9');
  gleichText('zuerst wird die Potenz ausgeschrieben', binom.schritte[0].regel, 'Potenz als Produkt schreiben');
  wahr('und der Weg ist mehr als ein Schritt', binom.schritte.length >= 4);

  // Die dritte binomische Formel.
  gleichText(
    '(x + 3) · (x − 3)',
    alsText(multipliziereAus(produkt(summe(x, zahl(3)), summe(x, zahl(-3)))).term),
    'x² − 9'
  );

  // (a + b)² mit zwei Variablen.
  gleichText(
    '(x + y)²',
    alsText(multipliziereAus(potenz(summe(x, y), zahl(2))).term),
    'x² + 2x · y + y²'
  );
});

pruefung('Ausklammern', () => {
  gleichText('6x + 9', alsText(klammereAus(summe(produkt(zahl(6), x), zahl(9))).term), '3 · (2x + 3)');
  gleichText(
    'x² + x',
    alsText(klammereAus(summe(potenz(x, zahl(2)), x)).term),
    'x · (x + 1)'
  );
  // Sind alle Glieder negativ, wandert das Minus mit nach vorn.
  gleichText(
    '−2x − 6x²',
    alsText(klammereAus(summe(produkt(zahl(-2), x), produkt(zahl(-6), potenz(x, zahl(2))))).term),
    '−2x · (1 + 3x)'
  );
  // Auch Brüche: gemeinsamer Faktor ist ggT der Zähler über kgV der Nenner.
  gleichText(
    '1/2 x + 1/4',
    alsText(klammereAus(summe(produkt(zahl(bruch(1, 2)), x), zahl(bruch(1, 4)))).term),
    '1/4 · (2x + 1)'
  );

  // Wo nichts gemeinsam ist, wird nichts erfunden.
  const nichts = klammereAus(summe(x, y));
  gleichText('x + y bleibt x + y', alsText(nichts.term), 'x + y');
  zahlIst('und bekommt keinen Ausklammer-Schritt', nichts.schritte.length, 0);
});

// ---------------------------------------------------------------------
// Der Definitionsbereich — die feinste Stelle im ganzen Modul
// ---------------------------------------------------------------------

pruefung('x⁰ wird nicht vorschnell zu 1', () => {
  // 5⁰ ist 1, das ist unstrittig.
  gleichText('5⁰ ist 1', alsText(vereinfache(potenz(zahl(5), zahl(0))).term), '1');

  // x⁰ ist 1 für jedes x AUSSER 0 — dort ist 0⁰ nicht definiert. Wer
  // x⁰ zu 1 vereinfacht, hat den Definitionsbereich stillschweigend
  // erweitert. Für eine Lern-App ist das die schlimmste Sorte Fehler:
  // Er fällt nie auf und ist trotzdem falsch.
  gleichText('x⁰ bleibt stehen', alsText(vereinfache(potenz(x, zahl(0))).term), 'x⁰');
  zahlIst('und bekommt keinen Schritt', vereinfache(potenz(x, zahl(0))).schritte.length, 0);

  // 0⁻¹ ebenso: Das ist eine Division durch null und wird nicht
  // stillschweigend zu irgendetwas.
  gleichText('0⁻¹ bleibt stehen', alsText(vereinfache(potenz(zahl(0), zahl(-1))).term), '0⁻¹');
  wirft('und wirft beim Auswerten', () => auswerteExakt(potenz(zahl(0), zahl(-1))));
});

pruefung('Wurzeln aufschreiben', () => {
  gleichText('√x', alsText(wurzel(x)), '√x');
  gleichText('√2', alsText(wurzel(zahl(2))), '√2');
  gleichText('∛x', alsText(wurzel(x, 3)), '∛x');
  gleichText('∜x', alsText(wurzel(x, 4)), '∜x');
  gleichText('⁵√x für höhere Grade', alsText(wurzel(x, 5)), '⁵√x');

  // Auf Papier hält der Wurzelstrich zusammen, was dazugehört. In einer
  // Textzeile muss das die Klammer tun.
  gleichText('√(2x), nicht √2x', alsText(wurzel(produkt(zahl(2), x))), '√(2x)');
  gleichText('√(x + 1)', alsText(wurzel(summe(x, zahl(1)))), '√(x + 1)');
  gleichText('√(4/9), nicht √4/9', alsText(wurzel(zahl(bruch(4, 9)))), '√(4/9)');
  gleichText('√(−4), nicht √−4', alsText(wurzel(zahl(-4))), '√(−4)');

  // Und umgekehrt braucht die Wurzel selbst eine Klammer, sobald etwas
  // dahinter steht: "√x²" wäre nicht zu lesen.
  gleichText('(√x)², nicht √x²', alsText(potenz(wurzel(x), zahl(2))), '(√x)²');

  // 5√2 wie im Heft, nicht 5 · √2.
  gleichText('5√2', alsText(produkt(zahl(5), wurzel(zahl(2)))), '5√2');

  gleichText('|x|', alsText(betrag(x)), '|x|');
  gleichText('|x|² braucht keine Klammer', alsText(potenz(betrag(x), zahl(2))), '|x|²');

  wirft('Wurzel mit Grad 0', () => wurzel(x, 0));
  wirft('Wurzel mit gebrochenem Grad', () => wurzel(x, 1.5));
});

pruefung('Wurzeln ziehen', () => {
  gleichText('√4', alsText(vereinfache(wurzel(zahl(4))).term), '2');
  gleichText('√(4/9)', alsText(vereinfache(wurzel(zahl(bruch(4, 9)))).term), '2/3');
  gleichText('√0', alsText(vereinfache(wurzel(zahl(0))).term), '0');
  gleichText('∛8', alsText(vereinfache(wurzel(zahl(8), 3)).term), '2');
  gleichText('⁵√32', alsText(vereinfache(wurzel(zahl(32), 5)).term), '2');
  gleichText('erste Wurzel', alsText(vereinfache(wurzel(x, 1)).term), 'x');

  // Aus einer negativen Zahl lässt sich mit ungeradem Grad sehr wohl
  // eine Wurzel ziehen — mit geradem nicht.
  gleichText('∛(−8)', alsText(vereinfache(wurzel(zahl(-8), 3)).term), '−2');
  gleichText('√(−4) bleibt stehen', alsText(vereinfache(wurzel(zahl(-4))).term), '√(−4)');
  wirft('und wirft beim Auswerten', () => auswerteExakt(wurzel(zahl(-4))));

  // Teilweises Wurzelziehen — ein Thema für sich im Unterricht.
  gleichText('√50', alsText(vereinfache(wurzel(zahl(50))).term), '5√2');
  gleichText('√12', alsText(vereinfache(wurzel(zahl(12))).term), '2√3');
  gleichText('√72', alsText(vereinfache(wurzel(zahl(72))).term), '6√2');
  gleichText('∛54', alsText(vereinfache(wurzel(zahl(54), 3)).term), '3∛2');
  gleichText('unter dem richtigen Namen', vereinfache(wurzel(zahl(50))).schritte[0].regel, 'teilweise Wurzel ziehen');

  // √2 ist irrational und bleibt stehen. Ein Näherungswert wäre hier
  // eine erfundene Genauigkeit.
  gleichText('√2 bleibt √2', alsText(vereinfache(wurzel(zahl(2))).term), '√2');
  zahlIst('und bekommt keinen Schritt', vereinfache(wurzel(zahl(2))).schritte.length, 0);
  gleichText('√3 bleibt √3', alsText(vereinfache(wurzel(zahl(3))).term), '√3');
});

pruefung('√(x²) ist |x| und nicht x', () => {
  // Das ist die Stelle, wegen der Wurzeln im Konzept als offene Frage
  // vermerkt waren. Bei x = −3 ist √((−3)²) = √9 = 3, nicht −3.
  gleichText('√(x²)', alsText(vereinfache(wurzel(potenz(x, zahl(2)))).term), '|x|');
  gleichText(
    'unter dem richtigen Namen',
    vereinfache(wurzel(potenz(x, zahl(2)))).schritte[0].regel,
    'Wurzel aus einer Potenz ziehen'
  );

  // Der Nachweis, dass die Vereinfachung stimmt und die naheliegende
  // falsch wäre: an der Stelle x = −3 auswerten.
  zahlIst('√(x²) bei x = −3 ist 3', auswerte(wurzel(potenz(x, zahl(2))), { x: -3 }), 3);
  zahlIst('und |x| ebenso', auswerte(betrag(x), { x: -3 }), 3);
  wahr('x wäre dort −3 und damit falsch', auswerte(x, { x: -3 }) === -3);

  // Bei ungeradem Grad gibt es das Problem nicht.
  gleichText('∛(x³) ist x', alsText(vereinfache(wurzel(potenz(x, zahl(3)), 3)).term), 'x');
  zahlIst('auch bei x = −3', auswerte(wurzel(potenz(x, zahl(3)), 3), { x: -3 }), -3);

  // Die Gegenrichtung wird NICHT vereinfacht: (√x)² ist nur für x ≥ 0
  // überhaupt definiert, x dagegen überall. Wer kürzt, erweitert den
  // Definitionsbereich — derselbe Fehler wie bei x⁰.
  gleichText('(√x)² bleibt stehen', alsText(vereinfache(potenz(wurzel(x), zahl(2))).term), '(√x)²');
  wirft('denn bei x = −1 gibt es das nicht', () =>
    auswerte(potenz(wurzel(x), zahl(2)), { x: -1 })
  );
});

pruefung('Wurzeln als Kommazahl', () => {
  // Exakt geht bei √2 nicht — als Zahlenwert zum Zeichnen sehr wohl.
  wahr('√2 ist ungefähr 1,4142', Math.abs(auswerte(wurzel(zahl(2))) - 1.4142135623730951) < 1e-12);
  zahlIst('∛(−8) ist −2', auswerte(wurzel(zahl(-8), 3)), -2);
  zahlIst('√(1/4) ist 0,5', auswerte(wurzel(zahl(bruch(1, 4)))), 0.5);

  // Die beiden Fehlerarten sind auseinanderzuhalten: "kein Bruch" ist
  // etwas anderes als "gibt es nicht".
  let irrational = false;
  try {
    auswerteExakt(wurzel(zahl(2)));
  } catch (fehler) {
    irrational = fehler.irrational === true;
  }
  wahr('√2 exakt meldet "irrational"', irrational);

  let undefiniert = false;
  try {
    auswerte(wurzel(zahl(-4)));
  } catch (fehler) {
    undefiniert = fehler.undefiniert === true;
  }
  wahr('√(−4) meldet "undefiniert"', undefiniert);

  wirft('Division durch null liefert kein Unendlich', () =>
    auswerte(quotient(zahl(1), x), { x: 0 })
  );
});

pruefung('Die Notbremse', () => {
  // Ein Rechenweg, der nicht zur Ruhe kommt, würde die App auf einem
  // Handy einfrieren — ohne Fehlermeldung, ohne Hinweis. Deshalb bricht
  // der Antrieb nach 100 Schritten ab. Dass die Bremse existiert, wird
  // hier festgehalten; auslösen darf sie im Normalbetrieb nie.
  const tief = multipliziereAus(potenz(summe(x, y, zahl(1)), zahl(4)));
  wahr('ein großes Binom kommt zur Ruhe', tief.schritte.length < 1000);
  // 81 Produkte entstehen dabei, und jeder Schritt ist echte Arbeit.
  // Die Grenze darf den Aufwand nicht begrenzen, nur die Endlosschleife
  // abfangen — deshalb ist hier viel Luft.
  wahr('braucht dafür aber gut hundert Schritte', tief.schritte.length > 100);
  zahlIst('und rechnet richtig', auswerte(tief.term, { x: 2, y: 3 }), 1296);
});

pruefung('Der Rechenweg als Zeilen', () => {
  const t = summe(produkt(zahl(2), summe(x, zahl(3))), produkt(zahl(4), x));
  const zeilen = alsRechenweg(t, multipliziereAus(t));
  gleichText('erste Zeile ist der Term selbst', zeilen[0], '2 · (x + 3) + 4x');
  wahr('jede weitere Zeile beginnt mit =', zeilen.slice(1).every((z) => z.startsWith('= ')));
  wahr('und nennt die Regel hinter einem Strich', zeilen.slice(1).every((z) => z.includes(' | ')));
  gleichText('am Ende steht das Ergebnis', alsText(multipliziereAus(t).term), '6x + 6');
});

// ---------------------------------------------------------------------
// Die Prüfung, die alles trägt
// ---------------------------------------------------------------------

const PUNKTE = 200;
const TERME = 60;

// Ein zufälliger Term aus Zahlen, x und y.
//
// Der Generator baut absichtlich auch Formen, die eine bestimmte Regel
// AUSLÖSEN — etwa √(t²) für "Wurzel aus einer Potenz ziehen". Ohne das
// hätte diese Prüfung eine Lücke, die beim Bauen tatsächlich auffiel:
// Ein absichtlich falsch gebautes √(x²) → x wurde von der gezielten
// Prüfung erkannt, von der Zufallsprüfung aber nicht — sie hatte die
// Regel schlicht nie erreicht. Ein Zufallstest, der den geprüften Code
// nicht trifft, gibt falsche Sicherheit.
function zufallsterm(naechste, tiefe) {
  if (tiefe <= 0 || naechste(10) < 4) {
    return naechste(3) === 0 ? zahl(naechste(11) - 5) : variable(naechste(2) === 0 ? 'x' : 'y');
  }
  switch (naechste(8)) {
    case 0:
      return summe(zufallsterm(naechste, tiefe - 1), zufallsterm(naechste, tiefe - 1));
    case 1:
      return summe(
        zufallsterm(naechste, tiefe - 1),
        zufallsterm(naechste, tiefe - 1),
        zufallsterm(naechste, tiefe - 1)
      );
    case 2:
      return produkt(zufallsterm(naechste, tiefe - 1), zufallsterm(naechste, tiefe - 1));
    case 3:
      return potenz(zufallsterm(naechste, tiefe - 1), zahl(naechste(5) - 1));
    case 4:
      return quotient(zufallsterm(naechste, tiefe - 1), zufallsterm(naechste, tiefe - 1));
    case 5:
      return wurzel(zufallsterm(naechste, tiefe - 1), naechste(2) === 0 ? 2 : 3);
    case 6: {
      // √(t²) und ∛(t³) — die Form, auf die "Wurzel aus einer Potenz
      // ziehen" wartet. Bei geradem Grad muss dabei ein Betrag
      // entstehen, sonst stimmt der Wert für negative t nicht.
      const grad = naechste(2) === 0 ? 2 : 3;
      return wurzel(potenz(zufallsterm(naechste, tiefe - 1), zahl(grad)), grad);
    }
    default:
      return betrag(zufallsterm(naechste, tiefe - 1));
  }
}

// Auswerten mit vier möglichen Ausgängen: ein exakter Wert, "hier nicht
// definiert" (Division durch null, 0⁰, √ aus negativ), "irrational"
// (√2 ist kein Bruch) oder "zu groß für JavaScript".
function werteAus(term, belegung) {
  try {
    return { wert: auswerteExakt(term, belegung) };
  } catch (fehler) {
    if (fehler.zuGross) {
      return { zuGross: true };
    }
    if (fehler.irrational) {
      return { irrational: true };
    }
    return { undefiniert: true };
  }
}

function naeherung(term, belegung) {
  try {
    const wert = auswerte(term, belegung);
    return Number.isFinite(wert) ? { wert } : { undefiniert: true };
  } catch {
    return { undefiniert: true };
  }
}

// Zwei Kommazahlen gelten als gleich, wenn sie es bis auf Rundung sind.
// Die Toleranz ist relativ: Bei einem Ergebnis um 10.000 ist eine
// absolute Schranke von 1e-9 schärfer als die Rechengenauigkeit selbst.
function ungefaehrGleich(a, b) {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

// Vergleicht zwei Terme an PUNKTE zufälligen rationalen Stellen.
//
// Verglichen wird nur dort, wo BEIDE Terme definiert sind. Das ist eine
// bewusste Entscheidung und der Grund steht hier, damit sie niemand für
// Nachlässigkeit hält: 1/x − 1/x ist überall 0, wo es definiert ist —
// aber an der Stelle x = 0 ist der linke Term undefiniert und der
// rechte nicht. Genau so schreibt es jedes Schulbuch, und würde man das
// als Fehler werten, könnte die App nichts mehr zusammenfassen.
//
// Die Fälle, in denen der Definitionsbereich WIRKLICH nicht wandern
// darf, sind einzeln oben festgehalten (x⁰, 0⁻¹) — dort, wo man sie
// gezielt prüfen kann, statt zu hoffen, dass der Zufall sie trifft.
function vergleiche(vorher, nachher, naechste) {
  const namen = [...new Set([...variablen(vorher), ...variablen(nachher)])];
  let verglichen = 0;

  for (let i = 0; i < PUNKTE; i++) {
    const belegung = {};
    for (const name of namen) {
      belegung[name] = bruch(naechste(21) - 10, naechste(6) + 1);
    }

    const a = werteAus(vorher, belegung);
    const b = werteAus(nachher, belegung);

    if (a.zuGross || b.zuGross || a.undefiniert || b.undefiniert) {
      continue;
    }

    const stelle = () => namen.map((n) => `${n} = ${bruchAlsText(belegung[n])}`).join(', ');
    const meldung = (istText, sollText) => ({
      verglichen,
      fehler:
        `"${alsText(vorher)}" → "${alsText(nachher)}" ` +
        `bei ${stelle() || 'ohne Variable'}: ${istText} statt ${sollText}`,
    });

    // Sobald eine Wurzel im Spiel ist, gibt es keinen Bruch mehr, mit
    // dem sich exakt vergleichen ließe — √2 ist irrational. Dann wird
    // numerisch verglichen, mit Toleranz. Das ist genau der Weg, den
    // das Konzept ursprünglich für alle Terme vorsah; ohne Wurzeln ist
    // der exakte Vergleich strenger, mit Wurzeln geht es nicht anders.
    if (a.irrational || b.irrational) {
      const na = naeherung(vorher, belegung);
      const nb = naeherung(nachher, belegung);
      if (na.undefiniert || nb.undefiniert) {
        continue;
      }
      verglichen++;
      if (!ungefaehrGleich(na.wert, nb.wert)) {
        return meldung(String(na.wert), String(nb.wert));
      }
      continue;
    }

    verglichen++;
    if (!bruchGleich(a.wert, b.wert)) {
      return meldung(bruchAlsText(a.wert), bruchAlsText(b.wert));
    }
  }

  return { verglichen, fehler: null };
}

// Prüft eine ganze Umformung: JEDER Zwischenschritt muss wertgleich zum
// vorigen sein — nicht nur Anfang und Ende. Ein Fehler, der sich in der
// Mitte selbst wieder aufhebt, wäre sonst unsichtbar.
function pruefeUmformung(beschreibung, umformer) {
  const naechste = wuerfel(startwertFuer(beschreibung));
  let verglichen = 0;
  let bremse = 0;
  let fehler = null;

  for (let i = 0; i < TERME && fehler === null; i++) {
    const start = zufallsterm(naechste, 2);

    let ergebnis;
    try {
      ergebnis = umformer(start);
    } catch (f) {
      if (/kommt nicht zur Ruhe/.test(f.message)) {
        bremse++;
        continue;
      }
      fehler = `"${alsText(start)}" → Fehler: ${f.message}`;
      break;
    }

    let vorher = start;
    for (const schritt of ergebnis.schritte) {
      const probe = vergleiche(vorher, schritt.term, naechste);
      verglichen += probe.verglichen;
      if (probe.fehler) {
        fehler = `Regel "${schritt.regel}": ${probe.fehler}`;
        break;
      }
      vorher = schritt.term;
    }
  }

  wahr(`${beschreibung}: jeder Schritt ist wertgleich`, fehler === null, fehler ?? undefined);
  wahr(
    `${beschreibung}: es wurde wirklich verglichen`,
    verglichen >= 1000,
    `nur ${verglichen} auswertbare Stellen`
  );
  wahr(`${beschreibung}: keine Notbremse ausgelöst`, bremse === 0, `${bremse}-mal abgebrochen`);
}

pruefung('Jede Umformung lässt den Wert unverändert', () => {
  pruefeUmformung('vereinfache', vereinfache);
  pruefeUmformung('multipliziereAus', multipliziereAus);
  pruefeUmformung('klammereAus', klammereAus);
});
