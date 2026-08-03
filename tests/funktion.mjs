// Prüfungen für Funktionsanalyse und Graphengeometrie.
//
// Beim Zeichnen gibt es zwei Sorten Fehler. Die eine sieht man sofort
// (die Kurve liegt schief), die andere nie: eine Linie, die durch eine
// Definitionslücke gezogen wird, sieht völlig plausibel aus — und
// behauptet, dass dort etwas ist. Genau darauf zielen die Prüfungen
// unten.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { bruch, alsText as bruchAlsText } from '../utils/bruch.js';
import { zahl, variable, alsText as termAlsText } from '../utils/term.js';
import { parseTerm } from '../utils/parser.js';
import {
  art,
  yAchsenabschnitt,
  nullstellen,
  gerade,
  scheitelpunkt,
  beschreibe,
  wertetabelle,
  bruchText,
} from '../utils/funktion.js';
import {
  schoeneTeilung,
  teilstriche,
  skala,
  abtasten,
  passenderBereich,
  xBereichUm,
  funktionsvariable,
} from '../utils/graph.js';

// ---------------------------------------------------------------------
// Was für eine Funktion ist das?
// ---------------------------------------------------------------------

pruefung('Die Art der Funktion', () => {
  gleichText('2x + 3 ist linear', art(parseTerm('2x + 3')), 'linear');
  gleichText('x² − 4 ist quadratisch', art(parseTerm('x^2 - 4')), 'quadratisch');
  gleichText('5 ist konstant', art(parseTerm('5')), 'konstant');
  // x · x sieht nicht quadratisch aus, ist es aber.
  gleichText('x · x auch', art(parseTerm('x*x')), 'quadratisch');
  gleichText('(x+1)(x−1) auch', art(parseTerm('(x+1)(x-1)')), 'quadratisch');
  gleichText('x³ ist ein Polynom höheren Grades', art(parseTerm('x^3')), 'polynom');
  gleichText('1 : x ist etwas anderes', art(parseTerm('1/x')), 'anderes');
  gleichText('√x auch', art(parseTerm('√x')), 'anderes');
});

pruefung('Gerade: Steigung und Achsenabschnitt', () => {
  const g = gerade(parseTerm('2x + 3'));
  gleichText('Steigung 2', bruchAlsText(g.steigung), '2');
  gleichText('Abschnitt 3', bruchAlsText(g.abschnitt), '3');

  const fallend = gerade(parseTerm('-0,5x + 1'));
  gleichText('auch mit Bruch', bruchAlsText(fallend.steigung), '-1/2');

  wahr('bei einer Parabel gibt es keine Steigung', gerade(parseTerm('x^2')) === null);
});

pruefung('Nullstellen kommen aus dem Gleichungslöser', () => {
  // Kein zweites Verfahren, keine zweite Fehlerquelle.
  gleichText('2x + 3 = 0', nullstellen(parseTerm('2x + 3')).stellen.map(termAlsText).join(), '−3/2');
  gleichText(
    'x² − 4 hat zwei',
    nullstellen(parseTerm('x^2 - 4')).stellen.map(termAlsText).join('; '),
    '2; −2'
  );
  zahlIst('x² + 1 hat keine', nullstellen(parseTerm('x^2 + 1')).stellen.length, 0);
  wahr('mit Begründung', nullstellen(parseTerm('x^2 + 1')).grund.includes('schneidet'));

  // Auch irrationale Nullstellen bleiben exakt statt gerundet.
  gleichText(
    'x² − 2 hat √2',
    nullstellen(parseTerm('x^2 - 2')).stellen.map(termAlsText).join('; '),
    '√2; −√2'
  );

  wahr('bei 1 : x sagt sie, dass sie es nicht kann', nullstellen(parseTerm('1/x')).unklar === true);
});

pruefung('Scheitelpunkt', () => {
  // (x − 2)² + 1 hat den Scheitel bei (2 | 1).
  const s = scheitelpunkt(parseTerm('(x-2)^2 + 1'));
  gleichText('x = 2', bruchAlsText(s.x), '2');
  gleichText('y = 1', bruchAlsText(s.y), '1');
  gleichText('Tiefpunkt', s.art, 'Tiefpunkt');
  wahr('nach oben geöffnet', s.geoeffnetNachOben);

  const hoch = scheitelpunkt(parseTerm('-x^2 + 4'));
  gleichText('nach unten geöffnet', hoch.art, 'Hochpunkt');
  gleichText('Scheitel bei x = 0', bruchAlsText(hoch.x), '0');
  gleichText('und y = 4', bruchAlsText(hoch.y), '4');

  // Der Scheitel liegt genau in der Mitte zwischen den Nullstellen.
  const mitte = scheitelpunkt(parseTerm('x^2 - 6x + 8'));
  gleichText('bei x² − 6x + 8 in der Mitte von 2 und 4', bruchAlsText(mitte.x), '3');

  wahr('eine Gerade hat keinen Scheitelpunkt', scheitelpunkt(parseTerm('2x + 1')) === null);
});

pruefung('Der y-Achsenabschnitt ist f(0)', () => {
  gleichText('bei 2x + 3', bruchAlsText(yAchsenabschnitt(parseTerm('2x + 3')).wert), '3');
  gleichText('bei x² − 4', bruchAlsText(yAchsenabschnitt(parseTerm('x^2 - 4')).wert), '-4');

  // Wo es die Stelle nicht gibt, wird nichts erfunden.
  const luecke = yAchsenabschnitt(parseTerm('1/x'));
  wahr('bei 1 : x fehlt er', luecke.fehlt === true);
  wahr('mit Begründung', luecke.grund.includes('nicht definiert'));
});

pruefung('Die Beschreibung in Sätzen', () => {
  const b = beschreibe(parseTerm('x^2 - 6x + 8'));
  gleichText('quadratisch', b.art, 'quadratisch');

  const titel = b.angaben.map((a) => a.titel).join(' | ');
  wahr('nennt die y-Achse', titel.includes('y-Achse'));
  wahr('nennt die Nullstellen', titel.includes('Nullstellen'));
  wahr('nennt den Scheitelpunkt', titel.includes('Scheitelpunkt'));

  for (const angabe of b.angaben) {
    wahr(`"${angabe.titel}" hat einen Wert`, typeof angabe.wert === 'string' && angabe.wert.length > 0);
    wahr(`"${angabe.titel}" wird erklärt`, angabe.erklaerung.length > 20);
  }

  // Bei einer Geraden steht die Steigung dabei, und was sie bedeutet.
  const linear = beschreibe(parseTerm('2x + 3'));
  const steigung = linear.angaben.find((a) => a.titel === 'Steigung');
  gleichText('Steigung 2', steigung.wert, '2');
  wahr('anschaulich erklärt', steigung.erklaerung.includes('nach oben'));

  const fallend = beschreibe(parseTerm('-2x + 3'));
  wahr('und bei negativer Steigung nach unten',
    fallend.angaben.find((a) => a.titel === 'Steigung').erklaerung.includes('nach unten'));
});

pruefung('Wertetabelle', () => {
  const t = wertetabelle(parseTerm('x^2'), 'x', { von: -2, bis: 2, schritt: 1 });
  zahlIst('fünf Zeilen', t.length, 5);
  zahlIst('bei x = −2 ist y = 4', t[0].y, 4);
  zahlIst('bei x = 0 ist y = 0', t[2].y, 0);

  // Eine Definitionslücke bekommt einen Strich, keine erfundene Zahl.
  const luecke = wertetabelle(parseTerm('1/x'), 'x', { von: -1, bis: 1, schritt: 1 });
  wahr('bei x = 0 steht nichts', luecke[1].y === null);
  zahlIst('bei x = 1 steht 1', luecke[2].y, 1);
});

// ---------------------------------------------------------------------
// Die Geometrie
// ---------------------------------------------------------------------

pruefung('Schöne Achsenteilung', () => {
  // Ein Gitter im Abstand 0,7143 ist korrekt und unlesbar. Erlaubt sind
  // nur 1, 2, 5 und deren Zehnerpotenzen.
  const erlaubt = (wert) => {
    const g = 10 ** Math.floor(Math.log10(wert));
    const v = Math.round((wert / g) * 1e6) / 1e6;
    return v === 1 || v === 2 || v === 5;
  };

  for (const spanne of [0.3, 1, 3, 7, 12, 60, 137, 1000, 4321]) {
    const abstand = schoeneTeilung(spanne);
    wahr(`Spanne ${spanne}: Abstand ${abstand} ist lesbar`, erlaubt(abstand));
    wahr(`Spanne ${spanne}: ergibt nicht zu viele Striche`, spanne / abstand <= 12);
    wahr(`Spanne ${spanne}: und nicht zu wenige`, spanne / abstand >= 1);
  }

  wirft('keine Spanne', () => schoeneTeilung(0));
  wirft('negative Spanne', () => schoeneTeilung(-5));
});

pruefung('Teilstriche', () => {
  const { abstand, striche } = teilstriche(-5, 5);
  wahr('alle liegen im Bereich', striche.every((s) => s >= -5 && s <= 5));
  wahr('die Null ist dabei', striche.includes(0));
  wahr('gleichmäßiger Abstand', striche.every((s, i) => i === 0 || Math.abs(s - striche[i - 1] - abstand) < 1e-9));

  // Kein Gleitkommastaub: "0.30000000000000004" gehört nicht an ein Gitter.
  const fein = teilstriche(0, 1);
  wahr('keine krummen Zahlen', fein.striche.every((s) => String(s).length <= 5), fein.striche.join(','));
});

pruefung('Umrechnen in Bildschirmpunkte', () => {
  const x = skala({ von: -5, bis: 5, pixel: 300 });
  zahlIst('links', x(-5), 0);
  zahlIst('rechts', x(5), 300);
  zahlIst('die Mitte', x(0), 150);

  // Die y-Achse zeigt auf dem Bildschirm nach unten — die häufigste
  // Fehlerquelle beim Zeichnen, deshalb an einer einzigen Stelle.
  const y = skala({ von: -5, bis: 5, pixel: 200, umgedreht: true });
  zahlIst('oben ist der größte Wert', y(5), 0);
  zahlIst('unten der kleinste', y(-5), 200);
  zahlIst('die Null in der Mitte', y(0), 100);

  wirft('verkehrter Bereich', () => skala({ von: 5, bis: -5, pixel: 100 }));
  wirft('keine Breite', () => skala({ von: 0, bis: 1, pixel: 0 }));
});

pruefung('Die Kurve wird nicht durch eine Lücke gezogen', () => {
  // Das ist die Prüfung, um die es hier geht. Bei 1 : x eine Linie von
  // −1000 nach +1000 durch die Null zu ziehen sieht plausibel aus und
  // behauptet, dass dort etwas ist.
  const einDurchX = abtasten(parseTerm('1/x'), 'x', {
    von: -5,
    bis: 5,
    unten: -10,
    oben: 10,
  });
  wahr('1 : x zerfällt in zwei Äste', einDurchX.length === 2, `${einDurchX.length} Abschnitte`);
  wahr('der eine liegt links der Null', einDurchX[0].every((p) => p.x < 0));
  wahr('der andere rechts', einDurchX[1].every((p) => p.x > 0));

  // Eine Parabel ist dagegen ein einziger Zug.
  const parabel = abtasten(parseTerm('x^2'), 'x', { von: -3, bis: 3, unten: 0, oben: 9 });
  zahlIst('x² ist ein Abschnitt', parabel.length, 1);
  wahr('mit vielen Punkten', parabel[0].length > 100);

  // √x ist links der Null nicht definiert — der Graph beginnt bei 0.
  const wurzel = abtasten(parseTerm('√x'), 'x', { von: -3, bis: 9, unten: 0, oben: 3 });
  zahlIst('√x ist ein Abschnitt', wurzel.length, 1);
  wahr('und beginnt bei 0', wurzel[0][0].x >= -1e-9);
});

pruefung('Der gezeigte Bereich', () => {
  // Nicht Minimum bis Maximum: Bei 1 : x wäre das −10000 bis +10000 und
  // der interessante Teil ein Strich auf der Achse.
  const parabel = passenderBereich(parseTerm('x^2'), 'x', { von: -3, bis: 3 });
  wahr('bei x² beginnt es bei 0 oder darunter', parabel.unten <= 0);
  wahr('und reicht bis mindestens 9', parabel.oben >= 9);

  const pol = passenderBereich(parseTerm('1/x'), 'x', { von: -5, bis: 5 });
  wahr('bei 1 : x bleibt der Bereich handhabbar', pol.oben - pol.unten < 100,
    `${pol.unten}…${pol.oben}`);

  // Auch eine waagerechte Gerade bekommt ein sichtbares Fenster.
  const konstant = passenderBereich(parseTerm('3'), 'x', { von: -5, bis: 5 });
  wahr('eine Konstante bekommt Höhe', konstant.oben > konstant.unten);
  wahr('und die 3 liegt darin', konstant.unten <= 3 && konstant.oben >= 3);
});

pruefung('Das Fenster richtet sich nach den besonderen Stellen', () => {
  // Ein festes Fenster von −6 bis 6 geht bei x² − 6x + 8 schief: Am
  // Rand erreicht die Parabel 80, und Scheitel und Nullstellen werden
  // zum Strich am unteren Rand.
  const b = xBereichUm([0, 2, 4, 3]);
  wahr('alle Stellen liegen darin', [0, 2, 4, 3].every((s) => s >= b.von && s <= b.bis));
  wahr('mit Luft am Rand', b.von < 0 && b.bis > 4);
  wahr('und nicht übertrieben breit', b.bis - b.von <= 20, `${b.von}…${b.bis}`);

  // Der y-Bereich in diesem Fenster zeigt dann den interessanten Teil.
  const term = parseTerm('x^2 - 6x + 8');
  const y = passenderBereich(term, 'x', b);
  wahr('der Scheitel bei −1 ist zu sehen', y.unten <= -1);
  wahr('und das Fenster bleibt handhabbar', y.oben - y.unten <= 40, `${y.unten}…${y.oben}`);

  // Ohne besondere Stellen gibt es ein vernünftiges Standardfenster.
  const leer = xBereichUm([]);
  wahr('auch ohne Anhaltspunkte', leer.bis > leer.von);
  wahr('und um die Null herum', leer.von < 0 && leer.bis > 0);

  // Eine einzelne Stelle bekommt trotzdem Breite.
  const einer = xBereichUm([5]);
  wahr('eine einzelne Stelle liegt drin', 5 >= einer.von && 5 <= einer.bis);
  wahr('mit ordentlicher Breite', einer.bis - einer.von >= 8);
});

pruefung('Welche Variable', () => {
  gleichText('x', funktionsvariable(parseTerm('2x + 1')), 'x');
  gleichText('auch t', funktionsvariable(parseTerm('3t')), 't');
  gleichText('ohne Variable trotzdem x', funktionsvariable(parseTerm('5')), 'x');
  wirft('mit zweien geht es nicht', () => funktionsvariable(parseTerm('x + y')));
});

pruefung('Zahlen im Text tragen das richtige Minus', () => {
  gleichText('ganze Zahl', bruchText(bruch(-3)), '−3');
  gleichText('Bruch', bruchText(bruch(-3, 4)), '−3/4');
  const b = beschreibe(parseTerm('x^2 - 6x + 8'));
  const alles = b.angaben.map((a) => `${a.wert} ${a.erklaerung}`).join(' ');
  wahr('kein Bindestrich vor einer Ziffer', !/-\d/.test(alles), alles);
});
