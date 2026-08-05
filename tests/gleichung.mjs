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
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  quotient,
  wurzel,
  betrag,
  auswerte,
  alsText as termAlsText,
} from '../utils/term.js';
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
  gleichText('Lösung', termAlsText(e.loesungen[0]), '3');
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
  gleichText('Lösung', termAlsText(e.loesungen[0]), '3');
  gleichText('zuerst das x nach links', e.schritte[0].operation, 'beide Seiten − 2x');
  gleichText('dann die Zahl nach rechts', e.schritte[1].operation, 'beide Seiten + 2');
  gleichText('dann teilen', e.schritte[2].operation, 'beide Seiten : 3');
  wahr('Probe stimmt', probe(g, e.loesungen[0]).stimmt);
});

pruefung('Klammern werden zuerst aufgelöst', () => {
  // 2(x + 3) = 4x − 2
  const g = gleichung(produkt(zahl(2), summe(x, zahl(3))), lin(4, -2));
  const e = loese(g);
  gleichText('Lösung', termAlsText(e.loesungen[0]), '4');
  gleichText('erster Schritt', e.schritte[0].operation, 'beide Seiten ausrechnen');
  gleichText('und die Klammer ist weg', e.schritte[0].text, '2x + 6 = 4x − 2');
  wahr('Probe stimmt', probe(g, e.loesungen[0]).stimmt);
});

pruefung('Brüche als Koeffizient', () => {
  // 1/2 x + 1 = 4 — durch 1/2 zu teilen schreibt niemand hin.
  const halb = gleichung(summe(produkt(zahl(bruch(1, 2)), x), zahl(1)), zahl(4));
  const e = loese(halb);
  gleichText('Lösung', termAlsText(e.loesungen[0]), '6');
  gleichText('mit dem Kehrwert malnehmen', e.schritte[1].operation, 'beide Seiten · 2');

  // x : 3 = 2
  const geteiltDurch = gleichung(quotient(x, zahl(3)), zahl(2));
  const e2 = loese(geteiltDurch);
  gleichText('x : 3 = 2', termAlsText(e2.loesungen[0]), '6');
  gleichText('endet bei x = 6', e2.schritte[e2.schritte.length - 1].text, 'x = 6');

  // Eine Lösung, die selbst ein Bruch ist.
  const krumm = gleichung(lin(3, 1), zahl(3));
  gleichText('3x + 1 = 3', termAlsText(loese(krumm).loesungen[0]), '2/3');
  wahr('Probe stimmt auch bei krummer Lösung', probe(krumm, loese(krumm).loesungen[0]).stimmt);
});

pruefung('Negative Zahlen', () => {
  const g = gleichung(lin(-3, 1), zahl(10));
  const e = loese(g);
  gleichText('Lösung', termAlsText(e.loesungen[0]), '−3');
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

// ---------------------------------------------------------------------
// Zweiten Grades
// ---------------------------------------------------------------------

pruefung('Quadratische Gleichungen', () => {
  // Zwei Lösungen. Die Lösungsmenge wird aufsteigend gelesen, hier
  // stehen sie in der Reihenfolge +√ und −√.
  const zwei = loese(gleichung(potenz(x, zahl(2)), zahl(4)));
  gleichText('x² = 4 hat mehrere Lösungen', zwei.art, 'mehrere');
  zahlIst('nämlich zwei', zwei.loesungen.length, 2);
  gleichText('L = { 2; −2 }', zwei.loesungen.map(termAlsText).join('; '), '2; −2');
  wahr('beide bestehen die Probe', zwei.loesungen.every((l) => probe(gleichung(potenz(x, zahl(2)), zahl(4)), l).stimmt));

  // Ein Vorfaktor vor dem x² muss weg, bevor die pq-Formel gilt. Das
  // ist einer der häufigsten Fehler überhaupt.
  const mitVorfaktor = gleichung(
    summe(mal(2, potenz(x, zahl(2))), mal(8, x), zahl(6)),
    zahl(0)
  );
  const e = loese(mitVorfaktor);
  gleichText('2x² + 8x + 6 = 0', e.loesungen.map(termAlsText).join('; '), '−1; −3');
  gleichText('erst durch 2 teilen', e.schritte[0].operation, 'beide Seiten : 2');
  gleichText('dann steht die Normalform da', e.schritte[0].text, 'x² + 4x + 3 = 0');
  zahlIst('p ist 4', Number(e.pq.p.z), 4);
  zahlIst('q ist 3', Number(e.pq.q.z), 3);

  // Die Diskriminante entscheidet, wie viele Lösungen es gibt.
  const beruehrt = loese(gleichung(summe(potenz(x, zahl(2)), mal(-4, x), zahl(4)), zahl(0)));
  gleichText('x² − 4x + 4 = 0 hat genau eine', beruehrt.art, 'eindeutig');
  gleichText('nämlich 2', termAlsText(beruehrt.loesungen[0]), '2');
  wahr('mit Begründung', beruehrt.grund.includes('berührt'));

  const keine = loese(gleichung(summe(potenz(x, zahl(2)), zahl(1)), zahl(0)));
  gleichText('x² + 1 = 0 hat keine', keine.art, 'keine');
  wahr('und begründet es mit der Wurzel', keine.grund.includes('negative Zahl'));
  wahr('und anschaulich mit der Parabel', keine.grund.includes('schneidet'));

  // x · x ist genauso quadratisch wie x², auch wenn es nicht so aussieht.
  gleichText('x · x = 4', loese(gleichung(produkt(x, x), zahl(4))).art, 'mehrere');
  // Und ein Produkt zweier Klammern auch — aber seit dem Satz vom
  // Nullprodukt geht die App dort einen anderen, kürzeren Weg. Die
  // Lösungen kommen jetzt in der Reihenfolge der FAKTOREN statt aus der
  // pq-Formel. Dieselbe Menge, andere Reihenfolge.
  const produktform = loese(
    gleichung(produkt(summe(x, zahl(1)), summe(x, zahl(-3))), zahl(0))
  );
  gleichText('(x + 1)(x − 3) = 0', produktform.loesungen.map(termAlsText).join('; '), '−1; 3');
  wahr('und zwar über das Nullprodukt', produktform.nullprodukt === true);
});

pruefung('Der Satz vom Nullprodukt', () => {
  // Nicht "null mal irgendwas ist null" — das ist die triviale Richtung.
  // Sondern: Ist ein Produkt null, MUSS ein Faktor null sein. Damit
  // liest man die Lösungen ab, statt auszumultiplizieren und über die
  // Wurzel zurückzurechnen.
  // Numerisch sortieren, nicht als Text. Das typografische Minus „−"
  // steht im Zeichensatz HINTER der Ziffer 3 — eine Textsortierung
  // ergäbe „3; −1" und hätte nichts mit der Größe zu tun.
  const sortiert = (loesungen) =>
    [...loesungen].sort((a, b) => auswerte(a) - auswerte(b)).map(termAlsText).join('; ');
  const mengeVon = (g) => sortiert(loese(g).loesungen);
  const klammer = (versatz) => summe(x, zahl(versatz));

  gleichText(
    'zwei Faktoren',
    mengeVon(gleichung(produkt(klammer(1), klammer(-3)), zahl(0))),
    '−1; 3'
  );

  // DREI Faktoren — das ist Grad 3, und den hat die App vorher
  // abgelehnt. Der Satz löst ihn in einer Zeile.
  const dritterGrad = loese(
    gleichung(produkt(klammer(1), klammer(-3), klammer(5)), zahl(0))
  );
  gleichText('drei Faktoren gehen jetzt', dritterGrad.art, 'mehrere');
  gleichText('und liefern drei Lösungen', sortiert(dritterGrad.loesungen), '−5; −1; 3');

  // Ein Zahlenfaktor kann nie null werden und fällt weg.
  const mitZahl = loese(gleichung(produkt(zahl(3), klammer(-2)), zahl(0)));
  gleichText('3(x − 2) = 0 hat eine Lösung', mitZahl.art, 'eindeutig');
  gleichText('nämlich 2', termAlsText(mitZahl.loesungen[0]), '2');
  wahr(
    'und der Schritt sagt, dass die 3 wegfällt',
    mitZahl.schritte[0].operation.includes('kann nie null werden'),
    mitZahl.schritte[0].operation
  );

  // Doppelte Lösungen werden zusammengefasst — die Lösungsmenge ist eine
  // MENGE. (x − 2)(x − 2) = 0 hat eine Lösung, nicht zwei.
  const doppelt = loese(gleichung(produkt(klammer(-2), klammer(-2)), zahl(0)));
  gleichText('(x − 2)² als Produkt', doppelt.art, 'eindeutig');
  gleichText('eine Lösung', doppelt.loesungen.length, 1);

  // Ein Faktor ohne reelle Nullstelle trägt nichts bei — und darf das
  // Ergebnis auch nicht kaputtmachen.
  const ohneNullstelle = loese(
    gleichung(produkt(summe(potenz(x, zahl(2)), zahl(1)), klammer(-3)), zahl(0))
  );
  gleichText('(x² + 1)(x − 3) = 0', ohneNullstelle.art, 'eindeutig');
  gleichText('nur die 3', termAlsText(ohneNullstelle.loesungen[0]), '3');

  // Auch andersherum aufgeschrieben.
  gleichText(
    '0 = (x + 1)(x − 3)',
    mengeVon(gleichung(zahl(0), produkt(klammer(1), klammer(-3)))),
    '−1; 3'
  );

  // Und der Satz gilt NUR gegen null. Steht rechts etwas anderes, wird
  // ganz normal ausmultipliziert — wer hier "x + 1 = 5 oder x − 3 = 5"
  // rechnet, macht den klassischen Fehler.
  const gegenFuenf = loese(gleichung(produkt(klammer(1), klammer(-3)), zahl(5)));
  wahr('gegen 5 kein Nullprodukt', gegenFuenf.nullprodukt !== true);
  gleichText('sondern ausmultipliziert', sortiert(gegenFuenf.loesungen), '−2; 4');
});

pruefung('Das Nullprodukt findet dieselben Lösungen wie der lange Weg', () => {
  // Die Probe, die zählt: Beide Wege müssen dieselbe Menge liefern. Der
  // kurze Weg darf bequemer sein, aber nicht anders.
  const naechste = wuerfel(startwertFuer('nullprodukt'));
  let verglichen = 0;
  let fehler = null;

  for (let i = 0; i < 120 && fehler === null; i++) {
    const a = naechste(13) - 6;
    const b = naechste(13) - 6;
    const alsProdukt = gleichung(
      produkt(summe(x, zahl(a)), summe(x, zahl(b))),
      zahl(0)
    );
    // Derselbe Inhalt, aber ausmultipliziert: x² + (a+b)x + ab = 0.
    const glieder = [potenz(x, zahl(2))];
    if (a + b !== 0) {
      glieder.push(produkt(zahl(a + b), x));
    }
    if (a * b !== 0) {
      glieder.push(zahl(a * b));
    }
    const ausmultipliziert = gleichung(
      glieder.length === 1 ? glieder[0] : summe(...glieder),
      zahl(0)
    );

    const kurz = loese(alsProdukt);
    const lang = loese(ausmultipliziert);

    const nachGroesse = (l) =>
      [...l].sort((p, q) => auswerte(p) - auswerte(q)).map(termAlsText).join('; ');
    const mengeKurz = nachGroesse(kurz.loesungen ?? []);
    const mengeLang = nachGroesse(lang.loesungen ?? []);

    verglichen++;
    if (mengeKurz !== mengeLang) {
      fehler =
        `(x + ${a})(x + ${b}) = 0: über das Nullprodukt {${mengeKurz}}, ` +
        `ausmultipliziert {${mengeLang}}`;
    }
    // Und die Probe gegen die URSPRÜNGLICHE Gleichung muss stimmen.
    for (const l of kurz.loesungen ?? []) {
      if (!probe(alsProdukt, l).stimmt) {
        fehler = `(x + ${a})(x + ${b}) = 0: ${termAlsText(l)} besteht die Probe nicht`;
      }
    }
  }

  wahr('beide Wege liefern dieselbe Menge', fehler === null, fehler ?? undefined);
  wahr('und wurden verglichen', verglichen >= 100, `nur ${verglichen}`);
});

pruefung('Irrationale Lösungen bleiben exakt', () => {
  // √2 lässt sich nicht als Bruch schreiben. Eine gerundete Kommazahl
  // wäre die bequeme Lüge — der Term ist die Wahrheit.
  const g = gleichung(potenz(x, zahl(2)), zahl(2));
  const e = loese(g);
  gleichText('x² = 2', e.loesungen.map(termAlsText).join('; '), '√2; −√2');

  // Die Probe kann hier nicht exakt sein und sagt das auch.
  const p = probe(g, e.loesungen[0]);
  wahr('die Probe geht auf', p.stimmt);
  wahr('aber nur gerundet', p.exakt === false);

  // Bei einer rationalen Lösung ist sie dagegen exakt.
  wahr('exakt bei x = 3', probe(gleichung(lin(3, 5), zahl(14)), zahl(3)).exakt);

  // Ein Bruch unter der Wurzel wird weggeschafft, wie im Unterricht.
  const krumm = loese(gleichung(summe(potenz(x, zahl(2)), mal(3, x), zahl(1)), zahl(0)));
  gleichText(
    'x² + 3x + 1 = 0',
    krumm.loesungen.map(termAlsText).join('; '),
    '−3/2 + 1/2 · √5; −3/2 − 1/2 · √5'
  );
  wahr('und beide bestehen die Probe', krumm.loesungen.every((l) => probe(gleichung(summe(potenz(x, zahl(2)), mal(3, x), zahl(1)), zahl(0)), l).stimmt));
});

pruefung('Was diese Datei nicht kann, sagt sie', () => {
  // Nicht können ist keine Panne. Stillschweigend etwas Falsches zu
  // liefern wäre schlimmer als zuzugeben, dass man nicht weiterweiß.
  const zweiVariablen = loese(gleichung(summe(x, y), zahl(3)));
  gleichText('x + y = 3 ist unklar', zweiVariablen.art, 'unklar');
  wahr('und nennt beide Variablen', zweiVariablen.grund.includes('x, y'));

  // Dritten Grades — die Grenze wird ausdrücklich benannt.
  const kubisch = loese(gleichung(potenz(x, zahl(3)), zahl(8)));
  gleichText('x³ = 8 ist unklar', kubisch.art, 'unklar');
  wahr('und nennt den Grad', kubisch.grund.includes('Grad 3'));

  // Variable im Nenner: kein Polynom, und der Definitionsbereich hat
  // ein Loch.
  gleichText('1 : x = 2 ist unklar', loese(gleichung(quotient(zahl(1), x), zahl(2))).art, 'unklar');

  // Variable unter der Wurzel.
  gleichText('√x = 2 ist unklar', loese(gleichung(wurzel(x), zahl(2))).art, 'unklar');
  // Variable im Betrag.
  gleichText('|x| = 2 ist unklar', loese(gleichung(betrag(x), zahl(2))).art, 'unklar');

  // x⁰ ist überall 1 AUSSER bei x = 0. Wer das zu "alle Zahlen"
  // vereinfacht, hat eine Lösung erfunden, die keine ist.
  gleichText('x⁰ = 1 ist unklar', loese(gleichung(potenz(x, zahl(0)), zahl(1))).art, 'unklar');
  wahr('und x = 0 erfüllt sie tatsächlich nicht', !istErfuellt(gleichung(potenz(x, zahl(0)), zahl(1)), { x: bruch(0) }));

  // Ein irrationaler Koeffizient ist kein Bruch — auch das wird gesagt
  // statt gerundet.
  gleichText('√2 · x = 1 ist unklar', loese(gleichung(produkt(wurzel(zahl(2)), x), zahl(1))).art, 'unklar');
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

// Ein zufälliger Term in x, höchstens zweiten Grades.
//
// `quadratisch` steuert, ob auch x² entstehen darf. Ohne diesen Schalter
// hätte die Prüfung den ganzen quadratischen Zweig nie erreicht — der
// Fehler, der beim Einbau der Wurzeln aufgefallen ist und in CLAUDE.md
// als Warnung steht: Ein Zufallstest, der den geprüften Code nicht
// trifft, gibt falsche Sicherheit.
function zufallsterm(naechste, tiefe, quadratisch) {
  if (tiefe <= 0 || naechste(10) < 4) {
    return naechste(3) === 0 ? x : zahl(naechste(13) - 6);
  }
  switch (naechste(quadratisch ? 6 : 4)) {
    case 0:
      return summe(
        zufallsterm(naechste, tiefe - 1, quadratisch),
        zufallsterm(naechste, tiefe - 1, quadratisch)
      );
    case 1:
      return summe(
        zufallsterm(naechste, tiefe - 1, quadratisch),
        zufallsterm(naechste, tiefe - 1, quadratisch),
        zufallsterm(naechste, tiefe - 1, quadratisch)
      );
    case 2:
      // Zahl mal Term — so entstehen Klammern, die aufgelöst werden müssen.
      return produkt(zahl(naechste(9) - 4), zufallsterm(naechste, tiefe - 1, quadratisch));
    case 4:
      // x² direkt.
      return produkt(zahl(naechste(5) - 2), potenz(x, zahl(2)));
    case 5:
      // Zwei Klammern nebeneinander — auch daraus wird x².
      return produkt(
        summe(x, zahl(naechste(9) - 4)),
        summe(x, zahl(naechste(9) - 4))
      );
    default:
      return quotient(zufallsterm(naechste, tiefe - 1, quadratisch), zahl(naechste(4) + 1));
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
    // Die Hälfte der Durchgänge darf quadratisch werden, damit auch
    // "alles auf eine Seite bringen" und das Teilen durch den Vorfaktor
    // geprüft werden.
    const quadratisch = i % 2 === 0;
    const start = gleichung(
      zufallsterm(naechste, 2, quadratisch),
      zufallsterm(naechste, 2, quadratisch)
    );
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
  let mehrfache = 0;
  let alleFaelle = 0;
  let fehler = null;

  for (let i = 0; i < GLEICHUNGEN * 3 && fehler === null; i++) {
    const quadratisch = i % 2 === 0;
    const g = gleichung(
      zufallsterm(naechste, 2, quadratisch),
      zufallsterm(naechste, 2, quadratisch)
    );
    const e = loese(g);

    if (e.art === 'eindeutig' || e.art === 'mehrere') {
      if (e.art === 'eindeutig') {
        eindeutige++;
      } else {
        mehrfache++;
      }
      // Jede gefundene Lösung muss die Gleichung erfüllen — auch die
      // zweite, und auch wenn sie irrational ist. Dann prüft probe()
      // numerisch und sagt das über `exakt` auch.
      for (const l of e.loesungen) {
        if (!probe(g, l).stimmt) {
          fehler = `"${alsText(g)}" → x = ${termAlsText(l)} besteht die Probe nicht`;
        }
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
  wahr('und quadratische mit zwei Lösungen', mehrfache >= 20, `nur ${mehrfache}`);
});
