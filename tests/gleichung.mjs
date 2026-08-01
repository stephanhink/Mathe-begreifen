// Prüfungen für das Lösen von Gleichungen.
//
// term.js muss jeden Schritt WERTGLEICH lassen. Hier gilt etwas
// anderes, und der Unterschied ist der ganze Grund für die eigene
// Datei:
//
//   Jede Umformung muss die LÖSUNGSMENGE unverändert lassen.
//
// Geprüft wird das genauso: An 200 zufälligen Stellen wird für die
// Gleichung vor und nach dem Schritt festgestellt, ob sie dort erfüllt
// ist. Die beiden Antworten müssen übereinstimmen — jedes Mal.
//
// Das ist die Prüfung, die den klassischen Fehler fängt: mit etwas
// multiplizieren, das null sein kann. Dabei bleibt jede einzelne Zeile
// "richtig", und trotzdem kommt eine Lösung dazu, die keine ist.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, gleich as bruchGleich, alsText as bruchAlsText } from '../utils/bruch.js';
import { zahl, variable, summe, produkt, potenz, quotient } from '../utils/term.js';
import {
  gleichung,
  istGleichung,
  alsText,
  istErfuellt,
  probe,
  loese,
  alsRechenweg,
} from '../utils/gleichung.js';

const x = variable('x');
const y = variable('y');

// Kurzschreibweisen, damit die Prüfungen lesbar bleiben.
const mal = (k, t) => produkt(zahl(k), t);
const lin = (a, b) => summe(mal(a, x), zahl(b)); // a·x + b

// ---------------------------------------------------------------------

pruefung('Gleichungen bauen und aufschreiben', () => {
  const g = gleichung(lin(3, 5), zahl(14));
  wahr('ist eine Gleichung', istGleichung(g));
  wahr('ist eingefroren', Object.isFrozen(g));
  gleichText('3x + 5 = 14', alsText(g), '3x + 5 = 14');

  wahr('istGleichung lehnt einen Term ab', !istGleichung(zahl(3)));
  wirft('eine Seite ist kein Term', () => gleichung(zahl(1), 5));
  wirft('alsText von etwas anderem', () => alsText({ links: 1, rechts: 2 }));
});

pruefung('Ist die Gleichung hier erfüllt?', () => {
  const g = gleichung(lin(3, 5), zahl(14));
  wahr('3x + 5 = 14 bei x = 3', istErfuellt(g, { x: bruch(3) }));
  wahr('aber nicht bei x = 4', !istErfuellt(g, { x: bruch(4) }));

  // An einer Definitionslücke ist die Gleichung nicht erfüllt — das ist
  // eine Eigenschaft der Gleichung, kein Fehler.
  const mitLuecke = gleichung(quotient(zahl(1), x), zahl(1));
  wahr('1 : x = 1 bei x = 1', istErfuellt(mitLuecke, { x: bruch(1) }));
  wahr('bei x = 0 nicht erfüllt statt Absturz', !istErfuellt(mitLuecke, { x: bruch(0) }));
});

pruefung('Die Probe rechnet gegen die ursprüngliche Gleichung', () => {
  const g = gleichung(lin(3, 5), zahl(14));
  const p = probe(g, bruch(3));
  wahr('x = 3 stimmt', p.stimmt);
  gleichText('linke Seite', bruchAlsText(p.links), '14');
  gleichText('rechte Seite', bruchAlsText(p.rechts), '14');

  const falsch = probe(g, bruch(4));
  wahr('x = 4 stimmt nicht', !falsch.stimmt);
  gleichText('und die linke Seite zeigt, warum', bruchAlsText(falsch.links), '17');
});

// ---------------------------------------------------------------------
// Der Rechenweg
// ---------------------------------------------------------------------

pruefung('Das Beispiel aus CLAUDE.md', () => {
  // Diese Gleichung steht als Beispiel im Konzept. Sie muss genau so
  // herauskommen — Wort für Wort, sonst stimmt die Doku nicht mehr.
  const g = gleichung(lin(3, 5), zahl(14));
  const e = loese(g);

  gleichText('Art', e.art, 'eindeutig');
  gleichText('Lösung', bruchAlsText(e.loesung), '3');
  zahlIst('zwei Schritte', e.schritte.length, 2);
  gleichText('erster Schritt', e.schritte[0].operation, 'beide Seiten − 5');
  gleichText('danach', e.schritte[0].text, '3x = 9');
  gleichText('zweiter Schritt', e.schritte[1].operation, 'beide Seiten : 3');
  gleichText('danach', e.schritte[1].text, 'x = 3');

  const zeilen = alsRechenweg(g, e);
  gleichText('Zeile 1', zeilen[0], '3x + 5 = 14');
  gleichText('Zeile 2', zeilen[1], '         | beide Seiten − 5');
  gleichText('Zeile 3', zeilen[2], '3x = 9');
  gleichText('Zeile 4', zeilen[3], '         | beide Seiten : 3');
  gleichText('Zeile 5', zeilen[4], 'x = 3');
  gleichText('am Ende die Lösungsmenge', zeilen[zeilen.length - 1], 'L = { 3 }');
});

pruefung('Variablen auf beiden Seiten', () => {
  // 5x − 2 = 2x + 7
  const g = gleichung(lin(5, -2), lin(2, 7));
  const e = loese(g);
  gleichText('Lösung', bruchAlsText(e.loesung), '3');
  gleichText('zuerst das x nach links', e.schritte[0].operation, 'beide Seiten − 2x');
  gleichText('dann die Zahl nach rechts', e.schritte[1].operation, 'beide Seiten + 2');
  gleichText('dann teilen', e.schritte[2].operation, 'beide Seiten : 3');
  wahr('Probe stimmt', probe(g, e.loesung).stimmt);
});

pruefung('Klammern werden zuerst aufgelöst', () => {
  // 2(x + 3) = 4x − 2
  const g = gleichung(produkt(zahl(2), summe(x, zahl(3))), lin(4, -2));
  const e = loese(g);
  gleichText('Lösung', bruchAlsText(e.loesung), '4');
  gleichText('erster Schritt', e.schritte[0].operation, 'beide Seiten ausrechnen');
  gleichText('und die Klammer ist weg', e.schritte[0].text, '2x + 6 = 4x − 2');
  wahr('Probe stimmt', probe(g, e.loesung).stimmt);
});

pruefung('Brüche als Koeffizient', () => {
  // 1/2 x + 1 = 4 — durch 1/2 zu teilen schreibt niemand hin.
  const halb = gleichung(summe(produkt(zahl(bruch(1, 2)), x), zahl(1)), zahl(4));
  const e = loese(halb);
  gleichText('Lösung', bruchAlsText(e.loesung), '6');
  gleichText('mit dem Kehrwert malnehmen', e.schritte[1].operation, 'beide Seiten · 2');

  // x : 3 = 2
  const geteiltDurch = gleichung(quotient(x, zahl(3)), zahl(2));
  const e2 = loese(geteiltDurch);
  gleichText('x : 3 = 2', bruchAlsText(e2.loesung), '6');
  gleichText('endet bei x = 6', e2.schritte[e2.schritte.length - 1].text, 'x = 6');

  // Eine Lösung, die selbst ein Bruch ist.
  const krumm = gleichung(lin(3, 1), zahl(3));
  gleichText('3x + 1 = 3', bruchAlsText(loese(krumm).loesung), '2/3');
  wahr('Probe stimmt auch bei krummer Lösung', probe(krumm, loese(krumm).loesung).stimmt);
});

pruefung('Negative Zahlen', () => {
  const g = gleichung(lin(-3, 1), zahl(10));
  const e = loese(g);
  gleichText('Lösung', bruchAlsText(e.loesung), '-3');
  gleichText('durch eine negative Zahl teilen', e.schritte[1].operation, 'beide Seiten : −3');

  // Das Minuszeichen ist überall dasselbe Zeichen.
  const zeilen = alsRechenweg(g, e).join('\n');
  wahr('kein ASCII-Bindestrich im Rechenweg', !zeilen.includes('-'));
});

// ---------------------------------------------------------------------
// Die Fälle, in denen es keine einzelne Lösung gibt
// ---------------------------------------------------------------------

pruefung('Keine Lösung und alle Zahlen', () => {
  const keine = gleichung(summe(x, zahl(1)), summe(x, zahl(2)));
  const e1 = loese(keine);
  gleichText('x + 1 = x + 2 hat keine Lösung', e1.art, 'keine');
  wahr('mit Begründung', e1.grund.includes('falsche Aussage'));
  wahr('L = { } im Rechenweg', alsRechenweg(keine, e1).join('\n').includes('L = { }'));
  wahr('und keine Zahl erfüllt sie', !istErfuellt(keine, { x: bruch(7) }));

  const alle = gleichung(produkt(zahl(2), summe(x, zahl(1))), lin(2, 2));
  const e2 = loese(alle);
  gleichText('2(x + 1) = 2x + 2 gilt immer', e2.art, 'alle');
  wahr('L = G im Rechenweg', alsRechenweg(alle, e2).join('\n').includes('L = G'));
  wahr('und irgendeine Zahl erfüllt sie', istErfuellt(alle, { x: bruch(7) }));
  wahr('und noch eine', istErfuellt(alle, { x: bruch(-5, 3) }));
});

pruefung('Was diese Datei nicht kann, sagt sie', () => {
  // Eine quadratische Gleichung ist keine Panne, sondern nur nicht das,
  // was hier gelöst wird. Stillschweigend etwas Falsches zu liefern
  // wäre schlimmer als zuzugeben, dass man nicht weiterweiß.
  const quadratisch = loese(gleichung(potenz(x, zahl(2)), zahl(4)));
  gleichText('x² = 4 ist unklar', quadratisch.art, 'unklar');
  wahr('mit Begründung', quadratisch.grund.includes('nicht linear'));

  const zweiVariablen = loese(gleichung(summe(x, y), zahl(3)));
  gleichText('x + y = 3 ist unklar', zweiVariablen.art, 'unklar');
  wahr('und nennt beide Variablen', zweiVariablen.grund.includes('x, y'));

  // Variable im Nenner: nicht linear, und der Definitionsbereich hat
  // ein Loch.
  gleichText('1 : x = 2 ist unklar', loese(gleichung(quotient(zahl(1), x), zahl(2))).art, 'unklar');

  // x · x ist genauso quadratisch wie x², auch wenn es nicht so aussieht.
  gleichText('x · x = 4 ist unklar', loese(gleichung(produkt(x, x), zahl(4))).art, 'unklar');

  // x⁰ ist überall 1 AUSSER bei x = 0. Wer das zu "alle Zahlen"
  // vereinfacht, hat eine Lösung erfunden, die keine ist.
  gleichText('x⁰ = 1 ist unklar', loese(gleichung(potenz(x, zahl(0)), zahl(1))).art, 'unklar');
  wahr('und x = 0 erfüllt sie tatsächlich nicht', !istErfuellt(gleichung(potenz(x, zahl(0)), zahl(1)), { x: bruch(0) }));
});

pruefung('Eine Gleichung ohne Variable', () => {
  gleichText('2 = 2 gilt immer', loese(gleichung(zahl(2), zahl(2))).art, 'alle');
  gleichText('2 = 3 gilt nie', loese(gleichung(zahl(2), zahl(3))).art, 'keine');
});

// ---------------------------------------------------------------------
// Die Prüfung, die alles trägt
// ---------------------------------------------------------------------

const PUNKTE = 200;
const GLEICHUNGEN = 80;

// Ein zufälliger linearer Term in x.
function zufallslinear(naechste, tiefe) {
  if (tiefe <= 0 || naechste(10) < 4) {
    return naechste(3) === 0 ? x : zahl(naechste(13) - 6);
  }
  switch (naechste(4)) {
    case 0:
      return summe(zufallslinear(naechste, tiefe - 1), zufallslinear(naechste, tiefe - 1));
    case 1:
      return summe(
        zufallslinear(naechste, tiefe - 1),
        zufallslinear(naechste, tiefe - 1),
        zufallslinear(naechste, tiefe - 1)
      );
    case 2:
      // Zahl mal Term — so entstehen Klammern, die aufgelöst werden müssen.
      return produkt(zahl(naechste(9) - 4), zufallslinear(naechste, tiefe - 1));
    default:
      return quotient(zufallslinear(naechste, tiefe - 1), zahl(naechste(4) + 1));
  }
}

// Erfüllt-Prüfung, die den Überlauf vom Nein unterscheidet.
function erfuellt(g, belegung) {
  try {
    return { antwort: istErfuellt(g, belegung) };
  } catch (fehler) {
    if (fehler.zuGross) {
      return { unbekannt: true };
    }
    throw fehler;
  }
}

pruefung('Jede Umformung lässt die Lösungsmenge unverändert', () => {
  const naechste = wuerfel(startwertFuer('lösungsmenge'));
  let verglichen = 0;
  let fehler = null;

  for (let i = 0; i < GLEICHUNGEN && fehler === null; i++) {
    const start = gleichung(zufallslinear(naechste, 2), zufallslinear(naechste, 2));
    const ergebnis = loese(start);

    let vorher = start;
    for (const schritt of ergebnis.schritte) {
      for (let p = 0; p < PUNKTE; p++) {
        const stelle = bruch(naechste(41) - 20, naechste(6) + 1);
        const a = erfuellt(vorher, { x: stelle });
        const b = erfuellt(schritt.gleichung, { x: stelle });
        if (a.unbekannt || b.unbekannt) {
          continue;
        }
        verglichen++;
        if (a.antwort !== b.antwort) {
          fehler =
            `Schritt "${schritt.operation}": "${alsText(vorher)}" → "${alsText(schritt.gleichung)}" ` +
            `bei x = ${bruchAlsText(stelle)}: ` +
            `${a.antwort ? 'erfüllt' : 'nicht erfüllt'} wird zu ` +
            `${b.antwort ? 'erfüllt' : 'nicht erfüllt'}`;
          break;
        }
      }
      if (fehler) {
        break;
      }
      vorher = schritt.gleichung;
    }
  }

  wahr('jeder Schritt erhält die Lösungsmenge', fehler === null, fehler ?? undefined);
  wahr('es wurde wirklich verglichen', verglichen >= 5000, `nur ${verglichen} Stellen`);
});

pruefung('Die gefundene Lösung löst die ursprüngliche Gleichung', () => {
  // Der Abschluss von außen: Was am Ende herauskommt, muss die
  // Gleichung erfüllen, mit der angefangen wurde — nicht die zuletzt
  // umgeformte. Genau das macht im Unterricht die Probe.
  const naechste = wuerfel(startwertFuer('probe'));
  let eindeutige = 0;
  let alleFaelle = 0;
  let fehler = null;

  for (let i = 0; i < GLEICHUNGEN * 3 && fehler === null; i++) {
    const g = gleichung(zufallslinear(naechste, 2), zufallslinear(naechste, 2));
    const e = loese(g);

    if (e.art === 'eindeutig') {
      eindeutige++;
      if (!probe(g, e.loesung).stimmt) {
        fehler = `"${alsText(g)}" → x = ${bruchAlsText(e.loesung)} besteht die Probe nicht`;
      }
    } else if (e.art === 'alle') {
      alleFaelle++;
      // Behauptet die App "jede Zahl", muss das auch stimmen.
      for (const wert of [bruch(0), bruch(1), bruch(-7, 3), bruch(11)]) {
        if (!istErfuellt(g, { x: wert })) {
          fehler = `"${alsText(g)}" soll für jede Zahl gelten, tut es aber nicht bei x = ${bruchAlsText(wert)}`;
        }
      }
    } else if (e.art === 'keine') {
      // Behauptet die App "keine Lösung", darf keine Stichprobe passen.
      for (let p = 0; p < 20; p++) {
        const wert = bruch(naechste(41) - 20, naechste(6) + 1);
        if (istErfuellt(g, { x: wert })) {
          fehler = `"${alsText(g)}" soll keine Lösung haben, aber x = ${bruchAlsText(wert)} passt`;
        }
      }
    }
  }

  wahr('die Probe geht immer auf', fehler === null, fehler ?? undefined);
  wahr('und es gab genug eindeutige Fälle', eindeutige >= 50, `nur ${eindeutige}`);
  wahr('und auch entartete Fälle kamen vor', alleFaelle >= 1, `${alleFaelle} Fälle mit "alle"`);
});
