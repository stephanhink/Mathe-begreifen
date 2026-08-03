// Prüfungen für Bruchrechnung und Prozentrechnung.
//
// Beide Module zeigen einen Rechenweg, also gilt hier dieselbe
// Invariante wie bei den Termen — nur auf Zahlen statt auf Variablen:
//
//   Jeder Zwischenschritt muss denselben Wert haben wie der Anfang.
//
// Das fängt genau den Fehler, der beim Zeigen von Zwischenschritten
// naheliegt: dass ein Schritt hübsch aussieht, aber unterwegs etwas
// verloren geht.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, gleich as bruchGleich, alsText as bruchAlsText } from '../utils/bruch.js';
import {
  rechne,
  kuerze,
  paarAlsText,
  alsRechenweg,
  wertAlsText,
  alsKommazahl,
} from '../utils/bruchrechnung.js';
import {
  prozentwert,
  grundwert,
  prozentsatz,
  veraendere,
  grundwertAusVeraendert,
  alsProzentText,
} from '../utils/prozent.js';

// ---------------------------------------------------------------------
// Bruchrechnen
// ---------------------------------------------------------------------

pruefung('Die vier Rechenarten', () => {
  gleichText('1/2 + 1/3', bruchAlsText(rechne(1, 2, '+', 1, 3).ergebnis), '5/6');
  gleichText('3/4 − 1/4', bruchAlsText(rechne(3, 4, '−', 1, 4).ergebnis), '1/2');
  gleichText('2/3 · 3/4', bruchAlsText(rechne(2, 3, '·', 3, 4).ergebnis), '1/2');
  gleichText('1/2 : 1/4', bruchAlsText(rechne(1, 2, ':', 1, 4).ergebnis), '2');
  gleichText('1/3 + 1/3 + …', bruchAlsText(rechne(1, 3, '+', 2, 3).ergebnis), '1');
  gleichText('mit negativen Zahlen', bruchAlsText(rechne(-1, 2, '+', 1, 3).ergebnis), '-1/6');
  gleichText('negativer Nenner wandert nach vorn', paarAlsText({ z: 3, n: 4 }), '3/4');
});

pruefung('Der Schritt, um den es geht', () => {
  // Wer Brüche nicht addieren kann, scheitert am Gleichnamigmachen.
  // Genau dieser Schritt ist in term.js unsichtbar — hier muss er
  // dastehen.
  const e = rechne(1, 2, '+', 1, 3);
  gleichText('der Anfang', e.anfang, '1/2 + 1/3');
  wahr('der erste Schritt nennt den Hauptnenner', e.schritte[0].regel.includes('Hauptnenner ist 6'));
  gleichText('und zeigt beide Brüche erweitert', e.schritte[0].text, '3/6 + 2/6');
  wahr('dann werden die Zähler addiert', e.schritte[1].regel.includes('Zähler addieren'));
  gleichText('Ergebnis', e.schritte[1].text, '5/6');

  // Gleiche Nenner brauchen keinen Erweiterungsschritt.
  const gleich = rechne(1, 5, '+', 2, 5);
  wahr('bei gleichem Nenner entfällt das Erweitern', !gleich.schritte[0].regel.includes('Hauptnenner'));

  // Der Hauptnenner ist das kgV, nicht das Produkt.
  const kgvFall = rechne(1, 4, '+', 1, 6);
  wahr('Hauptnenner von 4 und 6 ist 12, nicht 24', kgvFall.schritte[0].regel.includes('12'));
});

pruefung('Teilen heißt mit dem Kehrwert malnehmen', () => {
  const e = rechne(2, 3, ':', 4, 5);
  wahr('der erste Schritt sagt es', e.schritte[0].regel.includes('Kehrwert'));
  gleichText('und dreht den zweiten Bruch um', e.schritte[0].text, '2/3 · 5/4');
  gleichText('Ergebnis', bruchAlsText(e.ergebnis), '5/6');

  wirft('durch null teilen', () => rechne(1, 2, ':', 0, 5));
});

pruefung('Gekürzt wird am Ende, und es wird gesagt', () => {
  const e = rechne(1, 4, '+', 1, 4);
  const letzter = e.schritte[e.schritte.length - 1];
  wahr('der letzte Schritt ist das Kürzen', letzter.regel.includes('kürzen'));
  gleichText('mit dem richtigen Teiler', letzter.regel, 'mit 2 kürzen');
  gleichText('Ergebnis', bruchAlsText(e.ergebnis), '1/2');

  // Was schon gekürzt ist, bekommt keinen Kürzungsschritt.
  const fertig = rechne(1, 2, '+', 1, 3);
  wahr('5/6 wird nicht mehr gekürzt', !fertig.schritte.some((s) => s.regel.includes('kürzen')));
});

pruefung('Nur kürzen', () => {
  const e = kuerze(18, 24);
  gleichText('18/24 wird 3/4', bruchAlsText(e.ergebnis), '3/4');
  wahr('der ggT wird genannt', e.schritte[0].regel.includes('ist 6'));
  wahr('und nicht als schon gekürzt gemeldet', !e.schonGekuerzt);

  const schon = kuerze(3, 4);
  wahr('3/4 ist schon gekürzt', schon.schonGekuerzt);
  zahlIst('und bekommt keinen Schritt', schon.schritte.length, 0);

  wirft('Nenner 0', () => kuerze(1, 0));
  wirft('Kommazahl als Zähler', () => kuerze(1.5, 2));
});

pruefung('Überall dasselbe Minuszeichen', () => {
  // Im Rechenweg steht "−1/12", in der Ergebniszeile darf nicht
  // "-1/12" stehen. Zwei verschiedene Striche in derselben Anzeige
  // sehen nach Fehler aus.
  const e = rechne(3, 4, '−', 5, 6);
  gleichText('das Ergebnis', wertAlsText(e.ergebnis), '−1/12');
  const alles = [e.anfang, ...e.schritte.map((s) => s.text), wertAlsText(e.ergebnis)].join(' ');
  wahr('kein Bindestrich in der ganzen Anzeige', !alles.includes('-'), alles);

  wahr('auch nicht in der Kommazahl', !alsKommazahl(e.ergebnis).includes('-'));
  gleichText('Kommazahl mit Komma', alsKommazahl(bruch(1, 2)), '0,5');
  wahr('gerundete Werte bekommen Pünktchen', alsKommazahl(bruch(1, 3)).endsWith('…'));
});

pruefung('Der Rechenweg als Zeilen', () => {
  const zeilen = alsRechenweg(rechne(1, 2, '+', 1, 3));
  gleichText('erste Zeile ist die Aufgabe', zeilen[0], '1/2 + 1/3');
  wahr('die Regeln stehen eingerückt', zeilen[1].includes('|'));
  wahr('und die Zwischenstände mit =', zeilen[2].startsWith('= '));
  gleichText('am Ende das Ergebnis', zeilen[zeilen.length - 1], '= 5/6');
});

// ---------------------------------------------------------------------
// Die tragende Prüfung
// ---------------------------------------------------------------------

pruefung('Jeder Zwischenschritt hat denselben Wert (1000 Zufallsproben)', () => {
  const naechste = wuerfel(startwertFuer('bruchrechnung'));
  const zeichen = ['+', '−', '·', ':'];
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < 1000 && fehler === null; i++) {
    const za = naechste(21) - 10;
    const na = naechste(12) + 1;
    const zb = naechste(21) - 10;
    const nb = naechste(12) + 1;
    const op = zeichen[naechste(4)];

    if (op === ':' && zb === 0) {
      continue; // Durch null teilen wird zu Recht abgelehnt.
    }

    const e = rechne(za, na, op, zb, nb);
    const soll = e.ergebnis;

    for (const s of e.schritte) {
      geprueft++;
      if (!bruchGleich(s.wert, soll)) {
        fehler =
          `"${e.anfang}", Schritt "${s.regel}": Wert ${bruchAlsText(s.wert)} ` +
          `statt ${bruchAlsText(soll)}`;
        break;
      }
    }
  }

  wahr('kein Schritt verändert den Wert', fehler === null, fehler ?? undefined);
  wahr('und es wurde wirklich geprüft', geprueft >= 1500, `nur ${geprueft} Schritte`);
});

// ---------------------------------------------------------------------
// Prozentrechnung
// ---------------------------------------------------------------------

pruefung('Die drei Grundaufgaben', () => {
  gleichText('19 % von 250', alsProzentText(prozentwert(250, 19).ergebnis), '47,5');
  gleichText('47,5 sind 19 % von', alsProzentText(grundwert(47.5, 19).ergebnis), '250');
  gleichText('47,5 von 250 sind', alsProzentText(prozentsatz(47.5, 250).ergebnis), '19');

  // Exakt gerechnet: 19 % von 250 ist genau 47,5.
  wahr('das Ergebnis ist exakt', bruchGleich(prozentwert(250, 19).ergebnis, bruch(95, 2)));
  // Und 1/3 bleibt 1/3, nicht 0,3333…
  gleichText('100/3 %', bruchAlsText(prozentwert(300, bruch(100, 3)).ergebnis), '100');

  gleichText('die Formel steht dabei', prozentwert(250, 19).formel, 'W = G · p/100');
});

pruefung('Was bei Prozent nicht geht', () => {
  wirft('Grundwert aus 0 %', () => grundwert(50, 0));
  wirft('Prozentsatz von 0', () => prozentsatz(50, 0));
  wirft('Text statt Zahl', () => prozentwert('viel', 19));
  wirft('Unendlich', () => prozentwert(Infinity, 19));
});

pruefung('Zunahme und Abnahme', () => {
  gleichText('250 plus 19 %', alsProzentText(veraendere(250, 19).ergebnis), '297,5');
  gleichText('250 minus 19 %', alsProzentText(veraendere(250, -19).ergebnis), '202,5');
  wahr('die Zunahme wird benannt', veraendere(250, 19).gesucht.includes('Zunahme'));
  wahr('die Abnahme auch', veraendere(250, -19).gesucht.includes('Abnahme'));
  wahr('und der Schritt nennt die 119 %', veraendere(250, 19).schritte[0].regel.includes('119'));
});

pruefung('Der Fall, an dem fast alle scheitern', () => {
  // "Nach 19 % Aufschlag kostet es 119 €. Was war es vorher?"
  // Die naheliegende Rechnung "119 minus 19 %" ergibt 96,39 — falsch.
  const e = grundwertAusVeraendert(119, 19);
  gleichText('richtig sind 100', alsProzentText(e.ergebnis), '100');

  wahr('der Schritt sagt, warum', e.schritte[0].regel.includes('nicht 100 %'));
  wahr('die Falle wird ausdrücklich genannt', e.falle !== null);
  wahr('mit der falschen Zahl', e.falle.text.includes('96,39'));
  wahr('und mit dem Grund', e.falle.text.includes('ALTEN Wert'));

  // Gegenprobe: hin und zurück muss wieder passen.
  const hin = veraendere(100, 19).ergebnis;
  gleichText('100 plus 19 % sind 119', alsProzentText(hin), '119');
  gleichText('und zurück wieder 100', alsProzentText(grundwertAusVeraendert(hin, 19).ergebnis), '100');

  wirft('bei −100 % bleibt nichts übrig', () => grundwertAusVeraendert(50, -100));
});

pruefung('Prozent: hin und zurück (500 Zufallsproben)', () => {
  // Die drei Grundaufgaben sind Umkehrungen voneinander. Was die eine
  // ausrechnet, muss die andere zurückrechnen — sonst steckt in einer
  // von beiden ein Fehler.
  const naechste = wuerfel(startwertFuer('prozent'));
  let fehler = null;
  let geprueft = 0;

  for (let i = 0; i < 500 && fehler === null; i++) {
    const g = bruch(naechste(2000) - 1000, naechste(4) + 1);
    const p = bruch(naechste(400) - 200, naechste(4) + 1);

    if (bruchGleich(g, bruch(0)) || bruchGleich(p, bruch(0))) {
      continue;
    }

    const w = prozentwert(g, p).ergebnis;

    if (!bruchGleich(grundwert(w, p).ergebnis, g)) {
      fehler = `Grundwert: aus W=${bruchAlsText(w)}, p=${bruchAlsText(p)} kam nicht ${bruchAlsText(g)}`;
      break;
    }
    if (!bruchGleich(prozentsatz(w, g).ergebnis, p)) {
      fehler = `Prozentsatz: aus W=${bruchAlsText(w)}, G=${bruchAlsText(g)} kam nicht ${bruchAlsText(p)}`;
      break;
    }

    // Und die Veränderung mit ihrer Umkehrung.
    if (!bruchGleich(plus100(p), bruch(0))) {
      const neu = veraendere(g, p).ergebnis;
      if (!bruchGleich(grundwertAusVeraendert(neu, p).ergebnis, g)) {
        fehler = `Veränderung: aus ${bruchAlsText(neu)} zurück kam nicht ${bruchAlsText(g)}`;
        break;
      }
    }
    geprueft++;
  }

  wahr('jede Umkehrung führt zurück', fehler === null, fehler ?? undefined);
  wahr('und es wurde wirklich geprüft', geprueft >= 400, `nur ${geprueft}`);
});

function plus100(p) {
  return bruch(p.z + 100 * p.n, p.n);
}

pruefung('Jeder Prozentschritt hat denselben Wert', () => {
  // Wie bei den Brüchen: Der Zwischenstand muss zum Ergebnis passen.
  const faelle = [
    prozentwert(250, 19),
    grundwert(47.5, 19),
    prozentsatz(47.5, 250),
    veraendere(250, 19),
    veraendere(250, -19),
    grundwertAusVeraendert(119, 19),
  ];

  for (const e of faelle) {
    for (const s of e.schritte) {
      wahr(
        `${e.gesucht}, Schritt "${s.regel}" hat den Ergebniswert`,
        bruchGleich(s.wert, e.ergebnis),
        `${bruchAlsText(s.wert)} statt ${bruchAlsText(e.ergebnis)}`
      );
    }
  }
});
