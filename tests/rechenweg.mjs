// Prüfungen für das Prüfen eines selbst gerechneten Rechenwegs.
//
// Die entscheidende Eigenschaft ist nicht, dass ein Fehler gefunden
// wird — sondern DASS DIE RICHTIGE ZEILE genannt wird. Wer in Zeile 3
// einen Vorzeichenfehler macht, rechnet danach sauber weiter; die
// Zeilen 4 und 5 sind in sich stimmig. Eine App, die dann "Zeile 5 ist
// falsch" sagt, schickt einen an die falsche Stelle.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText } from './pruefer.mjs';
import { bruch } from '../utils/bruch.js';
import { zahl, variable, summe, produkt, potenz } from '../utils/term.js';
import { gleichung } from '../utils/gleichung.js';
import { parseEingabe, parseTerm, parseGleichung } from '../utils/parser.js';
import {
  pruefeRechenweg,
  findeAbweichung,
  findeAbweichungGleichung,
  istFertig,
} from '../utils/rechenweg.js';

const x = variable('x');

// ---------------------------------------------------------------------

pruefung('Zwei Terme vergleichen', () => {
  wahr('2(x + 3) und 2x + 6 sind gleich', findeAbweichung(parseTerm('2(x+3)'), parseTerm('2x+6')) === null);
  wahr('x + x und 2x auch', findeAbweichung(parseTerm('x+x'), parseTerm('2x')) === null);
  wahr('(x+1)² und x² + 2x + 1 auch', findeAbweichung(parseTerm('(x+1)^2'), parseTerm('x^2+2x+1')) === null);

  // Der klassische Fehler: die Klammer nur halb ausmultipliziert.
  const halb = findeAbweichung(parseTerm('2(x+3)'), parseTerm('2x+3'));
  wahr('2(x+3) ist nicht 2x+3', halb !== null);
  wahr('und die Stelle wird genannt', halb.stelle !== undefined);
  wahr('mit beiden Werten', Boolean(halb.links) && Boolean(halb.rechts));

  // Ein Vorzeichenfehler.
  wahr('x − 3 ist nicht x + 3', findeAbweichung(parseTerm('x-3'), parseTerm('x+3')) !== null);
  // Und der Klassiker schlechthin.
  wahr('(x+1)² ist nicht x² + 1', findeAbweichung(parseTerm('(x+1)^2'), parseTerm('x^2+1')) !== null);

  // Bei x = 0, 1 und 2 gehen viele Fehler durch — deshalb wird auch an
  // krummen Stellen geprüft.
  wahr('2x und x² sind verschieden', findeAbweichung(parseTerm('2x'), parseTerm('x^2')) !== null);
});

pruefung('Zwei Gleichungen vergleichen', () => {
  wahr(
    '3x + 5 = 14 und 3x = 9 haben dieselbe Lösung',
    findeAbweichungGleichung(parseGleichung('3x+5=14'), parseGleichung('3x=9')) === null
  );
  wahr(
    'und 3x = 9 und x = 3 auch',
    findeAbweichungGleichung(parseGleichung('3x=9'), parseGleichung('x=3')) === null
  );

  // Nur auf einer Seite abgezogen — der häufigste Fehler überhaupt.
  const einseitig = findeAbweichungGleichung(parseGleichung('3x+5=14'), parseGleichung('3x=14'));
  wahr('nur links abgezogen wird bemerkt', einseitig !== null);
  wahr('und die Stelle genannt', einseitig.stelle !== undefined);

  // Mit x multipliziert: Jede Zeile bleibt "richtig", aber x = 0 kommt
  // als Lösung dazu. Genau der Fall, den die App fangen soll.
  const malNull = findeAbweichungGleichung(parseGleichung('x=3'), parseGleichung('x^2=3x'));
  wahr('mit x multiplizieren ändert die Lösungsmenge', malNull !== null);
  gleichText('und zwar bei x = 0', malNull.stelle ? String(malNull.stelle.z) : '', '0');
});

// ---------------------------------------------------------------------

pruefung('Ein richtiger Rechenweg geht durch', () => {
  const e = pruefeRechenweg(
    ['3x + 5 = 14', '3x = 9', 'x = 3'],
    parseGleichung('3x + 5 = 14')
  );
  wahr('kein Fehler', e.ersterFehler === null);
  zahlIst('drei Zeilen geprüft', e.zeilen.length, 3);
  wahr('alle in Ordnung', e.zeilen.every((z) => z.ok));
  wahr('am Ende steht ein Ergebnis', istFertig(e.ergebnis));

  // Auch als Termumformung.
  const t = pruefeRechenweg(['2(x + 3)', '2x + 6'], parseTerm('2(x + 3)'));
  wahr('Terme gehen genauso', t.ersterFehler === null);
});

pruefung('Der Fehler wird in der richtigen Zeile gefunden', () => {
  // Zeile 3 ist falsch (statt −5 wurde +5 gerechnet). Zeile 4 folgt
  // daraus sauber — sie ist in sich richtig und darf NICHT gemeldet
  // werden.
  const e = pruefeRechenweg(
    ['5x − 2 = 2x + 7', '3x − 2 = 7', '3x = 5', 'x = 5/3'],
    parseGleichung('5x - 2 = 2x + 7')
  );

  zahlIst('der Fehler steckt in der dritten Zeile', e.ersterFehler, 2);
  gleichText('und die wird auch genannt', e.zeilen[2].text, '3x = 5');
  wahr('die Zeilen davor gelten als richtig', e.zeilen[0].ok && e.zeilen[1].ok);
  wahr('nach dem Fehler wird nicht weitergeprüft', e.zeilen.length === 3);
  wahr('die Begründung nennt die Lösungsmenge', e.zeilen[2].grund.includes('Lösungsmenge'));
  wahr('und die Zeile davor', e.zeilen[2].grund.includes('Zeile 2'));
});

pruefung('Auch die erste Zeile wird geprüft', () => {
  // Wer gleich mit einer falschen Umformung anfängt und danach sauber
  // weiterrechnet, käme sonst durch.
  const e = pruefeRechenweg(['2x + 3', 'x + 3 + x'], parseTerm('2(x + 3)'));
  zahlIst('der Fehler steckt schon in Zeile 1', e.ersterFehler, 0);
  wahr('die Begründung verweist auf die Aufgabe', e.zeilen[0].grund.includes('die Aufgabe'));
});

pruefung('Was der Rechenweg nicht durchgehen lässt', () => {
  const kaputt = pruefeRechenweg(['3x + 5 = 14', '3x = '], parseGleichung('3x + 5 = 14'));
  zahlIst('eine unlesbare Zeile', kaputt.ersterFehler, 1);
  wahr('mit Meldung', kaputt.zeilen[1].grund.length > 0);

  // Aus einer Gleichung darf nicht plötzlich ein Term werden.
  const gemischt = pruefeRechenweg(['3x + 5 = 14', '3x'], parseGleichung('3x + 5 = 14'));
  zahlIst('Gleichung und Term gemischt', gemischt.ersterFehler, 1);
  wahr('mit Hinweis auf das Gleichheitszeichen', gemischt.zeilen[1].grund.includes('Gleichheitszeichen'));

  const leer = pruefeRechenweg(['', '   ']);
  wahr('leere Eingabe', leer.leer === true);
});

pruefung('Leerzeilen stören nicht', () => {
  // Wer beim Tippen eine Zeile zu viel erwischt, soll deswegen keine
  // Fehlermeldung bekommen.
  const e = pruefeRechenweg(
    ['3x + 5 = 14', '', '3x = 9', '   ', 'x = 3'],
    parseGleichung('3x + 5 = 14')
  );
  wahr('kein Fehler', e.ersterFehler === null);
  zahlIst('und nur die echten Zeilen zählen', e.zeilen.length, 3);
});

pruefung('Bei Termen ist das = ein Kettenglied', () => {
  // So schreibt man eine Umformung im Heft:
  //
  //     √20 = √(4 · 5) = 2√5
  //
  // Das "=" ist hier keine Gleichung, die man löst, sondern ein
  // Kettenglied: Alles in der Zeile hat denselben Wert. Vorher wurde
  // die erste Zeile als Gleichung gelesen und passte dann nicht mehr
  // zur zweiten — der Fall, an dem das aufgefallen ist.
  const start = parseTerm('√20');

  const e = pruefeRechenweg(['√20 = √(4*5)', '2√5'], start);
  wahr('die Kette geht durch', e.ersterFehler === null, e.ersterFehler !== null ? e.zeilen[e.ersterFehler].grund : undefined);
  zahlIst('zwei Zeilen', e.zeilen.length, 2);

  // Auch alles in einer Zeile.
  const einzeilig = pruefeRechenweg(['√20 = √(4*5) = 2√5'], start);
  wahr('drei Glieder in einer Zeile', einzeilig.ersterFehler === null);

  // Und ganz ohne Gleichheitszeichen, wie bisher.
  wahr('nur das Ergebnis', pruefeRechenweg(['2√5'], start).ersterFehler === null);

  // Ein Fehler innerhalb einer Zeile wird auch dort gefunden.
  const drin = pruefeRechenweg(['√20 = √(4*5) = 4√5'], start);
  zahlIst('Fehler in der ersten Zeile', drin.ersterFehler, 0);
  wahr('und die Meldung zeigt auf das Glied', drin.zeilen[0].grund.includes('Glied dieser Zeile'));

  // Ein falsches erstes Glied fällt gegen die Aufgabe auf.
  const falscherStart = pruefeRechenweg(['√20 = √(4+5)'], start);
  zahlIst('falsches erstes Glied', falscherStart.ersterFehler, 0);

  // Dasselbe bei einer gewöhnlichen Termumformung.
  const term = pruefeRechenweg(
    ['3x + 5 + 2x = 5x + 5', '5x + 5 = 5(x + 1)'],
    parseTerm('3x + 5 + 2x')
  );
  wahr('Kette über zwei Zeilen', term.ersterFehler === null);
});

pruefung('Bei Gleichungen bleibt das = die Gleichung', () => {
  // Hier darf NICHT zerlegt werden: "3x = 9" ist eine Gleichung, keine
  // Kette aus 3x und 9.
  const start = parseGleichung('3x + 5 = 14');
  const e = pruefeRechenweg(['3x = 9', 'x = 3'], start);
  wahr('der Weg trägt', e.ersterFehler === null);

  // Und eine Zeile ohne Gleichheitszeichen ist dort ein Fehler.
  const ohne = pruefeRechenweg(['3x'], start);
  zahlIst('Zeile ohne =', ohne.ersterFehler, 0);
  wahr('mit Hinweis', ohne.zeilen[0].grund.includes('Gleichheitszeichen'));
});

pruefung('Ist am Ende ein Ergebnis erreicht?', () => {
  wahr('x = 3 ist fertig', istFertig(parseGleichung('x = 3')));
  wahr('3x = 9 noch nicht', !istFertig(parseGleichung('3x = 9')));
  wahr('x = 2y wäre auch nicht fertig', !istFertig(parseGleichung('x = 2y')));

  wahr('5x + 5 ist fertig', istFertig(parseTerm('5x + 5')));
  wahr('3x + 2x + 5 noch nicht', !istFertig(parseTerm('3x + 2x + 5')));
});

// ---------------------------------------------------------------------
// Ganze Wege, wie sie ein Mensch schreibt
// ---------------------------------------------------------------------

pruefung('Echte Rechenwege', () => {
  const richtig = [
    // Gleichung mit Klammern
    {
      aufgabe: '2(x + 3) = 4x - 2',
      weg: ['2x + 6 = 4x - 2', '-2x + 6 = -2', '-2x = -8', 'x = 4'],
    },
    // Binomische Formel
    {
      aufgabe: '(x + 3)^2',
      weg: ['(x + 3)(x + 3)', 'x*x + 3x + 3x + 9', 'x^2 + 6x + 9'],
    },
    // Bruchgleichung
    {
      aufgabe: 'x/3 + 1 = 4',
      weg: ['x/3 = 3', 'x = 9'],
    },
    // Ein Umweg, der trotzdem stimmt — erlaubt sein muss er.
    {
      aufgabe: '3x + 5 + 2x',
      weg: ['5x + 5', '5(x + 1)'],
    },
  ];

  for (const fall of richtig) {
    const e = pruefeRechenweg(fall.weg, parseEingabe(fall.aufgabe));
    wahr(
      `"${fall.aufgabe}" geht durch`,
      e.ersterFehler === null,
      e.ersterFehler !== null ? `Zeile ${e.ersterFehler + 1}: ${e.zeilen[e.ersterFehler].grund}` : undefined
    );
  }

  const falsch = [
    {
      aufgabe: '2(x + 3) = 4x - 2',
      // Klammer nur halb ausmultipliziert
      weg: ['2x + 3 = 4x - 2'],
      zeile: 0,
    },
    {
      aufgabe: '(x + 3)^2',
      // Der Klassiker: das gemischte Glied vergessen
      weg: ['x^2 + 9'],
      zeile: 0,
    },
    {
      aufgabe: '5x - 2 = 2x + 7',
      // Zeile 2 stimmt, Zeile 3 hat einen Vorzeichenfehler
      weg: ['3x - 2 = 7', '3x = 5'],
      zeile: 1,
    },
    {
      aufgabe: 'x/3 + 1 = 4',
      // Nur den Zähler mal 3 genommen
      weg: ['x/3 = 3', 'x = 3'],
      zeile: 1,
    },
  ];

  for (const fall of falsch) {
    const e = pruefeRechenweg(fall.weg, parseEingabe(fall.aufgabe));
    zahlIst(`"${fall.aufgabe}": Fehler in Zeile ${fall.zeile + 1}`, e.ersterFehler, fall.zeile);
  }
});

pruefung('Die Meldung ist nachrechenbar', () => {
  // Eine Fehlermeldung ohne Zahlen ist eine rote Lampe ohne Schalter.
  const e = pruefeRechenweg(['2x + 3'], parseTerm('2(x + 3)'));
  const grund = e.zeilen[0].grund;

  wahr('sie nennt die Variable und die Stelle', /x = /.test(grund));
  wahr('und beide Werte', /ergibt .* , diese Zeile |ergibt/.test(grund));
  wahr('und sagt, was sich geändert hat', grund.includes('Wert'));

  // Nachrechnen: An der genannten Stelle müssen die genannten Werte
  // wirklich herauskommen. Sonst stünde dort eine Zahl, die niemanden
  // weiterbringt.
  const a = e.zeilen[0].abweichung;
  wahr('die Stelle ist konkret', a.stelle !== null && a.stelle !== undefined);
  wahr('und die beiden Werte unterscheiden sich', a.links !== a.rechts);
});
