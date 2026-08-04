// Prüfungen für die Anwendungen.
//
// Hier steht ausnahmsweise nicht EINE tragende Invariante, sondern für
// jede Anwendung die Aussage, die sie überhaupt zu einer Anwendung
// macht — und die zugleich das ist, was der Schüler mitnehmen soll:
//
//   Zinseszins: Der Faktor wird WIEDERHOLT. Das Ergebnis der Potenz muss
//     mit dem übereinstimmen, was herauskommt, wenn man Jahr für Jahr
//     multipliziert. Genau daran sieht man, dass eine Potenz nichts
//     anderes ist als wiederholtes Malnehmen.
//
//   Verdopplungszeit: Sie hängt NICHT vom Startkapital ab. Das ist die
//     überraschende Eigenschaft, und sie lässt sich direkt prüfen.
//
//   Zerfall: dieselbe Formel wie Zinseszins, nur mit einem Faktor unter
//     1. Beide Wege müssen dieselbe Zahl liefern.
//
//   Optionspreis: DER NACHBAU MUSS IN BEIDEN FÄLLEN DASSELBE LIEFERN wie
//     die Option. Das ist die Bedingung, aus der der Preis überhaupt
//     folgt — und sie ist exakt prüfbar, weil in Brüchen gerechnet wird.

import { pruefung, wahr, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, plus, minus, mal, alsZahl, gleich as bruchGleich, alsText as bruchAlsText } from '../utils/bruch.js';
import {
  zinseszins,
  verdopplungszeit,
  verdopplung,
  zerfall,
  optionspreis,
  zahlKurz,
  hochzahl,
} from '../utils/anwendung.js';

// ---------------------------------------------------------------------
// Zinseszins
// ---------------------------------------------------------------------

pruefung('Zinseszins ist wiederholtes Malnehmen', () => {
  // Der Kern: Die Potenz muss dasselbe liefern wie Jahr für Jahr
  // multiplizieren. Wer das einmal gesehen hat, braucht die
  // Exponentialfunktion nicht mehr erklärt zu bekommen.
  const naechste = wuerfel(startwertFuer('anwendung-zins'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < 200 && fehler === null; i++) {
    const startkapital = (naechste(50) + 1) * 100;
    const zinssatz = (naechste(100) + 1) / 10;
    const jahre = naechste(40) + 1;

    const e = zinseszins({ startkapital, zinssatz, jahre });

    // Von Hand, Jahr für Jahr.
    let vonHand = startkapital;
    for (let n = 0; n < jahre; n++) {
      vonHand *= 1 + zinssatz / 100;
    }

    geprueft++;
    if (Math.abs(vonHand - e.ende) > 1e-6 * Math.max(1, Math.abs(vonHand))) {
      fehler = `${startkapital} € zu ${zinssatz} % über ${jahre} Jahre: Potenz ${e.ende}, Jahr für Jahr ${vonHand}`;
    }
  }

  wahr('die Potenz ist das wiederholte Malnehmen', fehler === null, fehler ?? undefined);
  wahr('und zwar oft genug', geprueft >= 150, `nur ${geprueft}`);
});

pruefung('Der Zinseszins bringt mehr als einfache Zinsen', () => {
  // Der Unterschied ist der ganze Punkt — und er muss positiv sein,
  // sobald mehr als ein Jahr vergeht und der Zins positiv ist.
  const e = zinseszins({ startkapital: 1000, zinssatz: 3, jahre: 30 });
  wahr('mit Zinseszins mehr', e.ende > e.ohneZinseszins, `${e.ende} vs ${e.ohneZinseszins}`);
  wahr('und der Unterschied ist beziffert', e.unterschied > 500, String(e.unterschied));

  // Nach einem Jahr gibt es noch keinen Unterschied — der Zinseszins
  // fängt erst im zweiten Jahr an zu wirken.
  const einJahr = zinseszins({ startkapital: 1000, zinssatz: 3, jahre: 1 });
  wahr('nach einem Jahr kein Unterschied', Math.abs(einJahr.unterschied) < 1e-9);

  // Die ersten Jahre stehen ausgeschrieben da — daran sieht man die
  // Wiederholung, bevor die Potenz auftaucht.
  gleichText('Jahr 1 ausgeschrieben', e.schritte[0].ausgeschrieben, 'K · 1,03');
  gleichText('Jahr 3 ausgeschrieben', e.schritte[2].ausgeschrieben, 'K · 1,03 · 1,03 · 1,03');
  gleichText('Jahr 3 als Potenz', e.schritte[2].alsPotenz, 'K · 1,03³');

  wahr('und der Vorbehalt nennt die Inflation', e.vorbehalt.includes('Inflation'), e.vorbehalt);
});

pruefung('Die Verdopplungszeit hängt nicht vom Startkapital ab', () => {
  // Die überraschende Eigenschaft, und der Kern des exponentiellen
  // Wachstums. Ob 100 € oder eine Million: gleich lange.
  const v = verdopplungszeit(3);

  for (const startkapital of [1, 100, 5000, 1000000]) {
    const e = zinseszins({ startkapital, zinssatz: 3, jahre: v.jahre });
    wahr(
      `${startkapital} € hat sich nach ${v.jahre} Jahren verdoppelt`,
      e.ende >= 2 * startkapital
    );
    const davor = zinseszins({ startkapital, zinssatz: 3, jahre: v.jahre - 1 });
    wahr(`aber ein Jahr früher noch nicht`, davor.ende < 2 * startkapital);
  }

  wahr('und die Einsicht sagt genau das', v.einsicht.includes('NICHT vom Startkapital'));

  // Ohne Zins verdoppelt sich nichts — und das wird gesagt, nicht
  // durch eine Zahl überspielt.
  gleichText('bei 0 % keine Verdopplung', verdopplungszeit(0).art, 'unklar');
  gleichText('bei negativem Satz auch nicht', verdopplungszeit(-2).art, 'unklar');
  wahr('mit Hinweis auf die Halbwertszeit', verdopplungszeit(-2).grund.includes('Halbwertszeit'));
});

// ---------------------------------------------------------------------
// Exponentielles Wachstum
// ---------------------------------------------------------------------

pruefung('Ein Cent, dreißigmal verdoppelt', () => {
  const e = verdopplung({ start: 0.01, schritte: 30 });
  wahr('sind über zehn Millionen', e.ende > 10000000, String(e.ende));
  gleichText('genau', Math.round(e.ende * 100) / 100, 10737418.24);

  // Der eigentliche Punkt: Nach der Hälfte der Zeit ist fast nichts
  // passiert. Das ist der Grund, warum man es immer zu spät bemerkt.
  wahr('nach 15 Tagen erst ein paar Hundert', e.beiHalbzeit < 400, String(e.beiHalbzeit));
  wahr(
    'und die Einsicht sagt warum',
    e.einsicht.includes('ganz am Schluss'),
    e.einsicht
  );

  // Jeder Schritt ist genau das Doppelte des vorigen.
  for (let i = 1; i < e.reihe.length; i++) {
    wahr(
      `Schritt ${i} ist das Doppelte`,
      Math.abs(e.reihe[i].wert - 2 * e.reihe[i - 1].wert) < 1e-9
    );
  }

  wahr('der Vorbehalt sagt, dass es in Wirklichkeit aufhört', e.vorbehalt.includes('hört'));
  wirft('200 Verdopplungen sind zu viel', () => verdopplung({ start: 1, schritte: 500 }));
});

pruefung('Zerfall ist Zinseszins rückwärts', () => {
  // Dieselbe Formel, nur mit einem Faktor unter 1. Dass beides EIN
  // Gesetz ist, sieht man erst, wenn es nebeneinandersteht — und
  // deshalb wird genau das geprüft.
  const naechste = wuerfel(startwertFuer('anwendung-zerfall'));
  let fehler = null;

  for (let i = 0; i < 100 && fehler === null; i++) {
    const start = (naechste(100) + 1) * 10;
    const halbwertszeit = naechste(50) + 1;
    const halbierungen = naechste(8) + 1;
    const dauer = halbwertszeit * halbierungen;

    const z = zerfall({ start, halbwertszeit, dauer });
    // Über den Zinseszins mit −50 % pro Halbwertszeit.
    const ueberZins = zinseszins({ startkapital: start, zinssatz: -50, jahre: halbierungen });

    if (Math.abs(z.rest - ueberZins.ende) > 1e-9 * Math.max(1, start)) {
      fehler = `${start} nach ${halbierungen} Halbwertszeiten: Zerfall ${z.rest}, Zinseszins ${ueberZins.ende}`;
    }
  }

  wahr('beide Wege liefern dasselbe', fehler === null, fehler ?? undefined);

  // Kohlenstoff-14 nach zwei Halbwertszeiten: ein Viertel.
  const c14 = zerfall({ start: 100, halbwertszeit: 5730, dauer: 11460 });
  wahr('ein Viertel bleibt', Math.abs(c14.anteil - 0.25) < 1e-12, String(c14.anteil));
  wahr('und es wird nie ganz null', c14.vorbehalt.includes('nie exakt null'));

  wirft('Halbwertszeit 0 gibt es nicht', () => zerfall({ start: 1, halbwertszeit: 0, dauer: 1 }));
});

// ---------------------------------------------------------------------
// Der Optionspreis
// ---------------------------------------------------------------------

pruefung('Der Nachbau liefert in BEIDEN Fällen dasselbe', () => {
  // Das ist die Bedingung, aus der der Preis folgt — und sie ist der
  // Grund, warum der Preis kein Schätzwert ist, sondern ein Zwang.
  //
  // Exakt prüfbar, weil in Brüchen gerechnet wird: Δ · Kurs + Bargeld
  // muss GENAU die Auszahlung sein, oben wie unten.
  const naechste = wuerfel(startwertFuer('anwendung-option'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < 200 && fehler === null; i++) {
    const kurs = (naechste(50) + 10) * 2;
    const hoch = kurs + (naechste(40) + 5);
    const tief = kurs - (naechste(Math.min(kurs - 2, 40)) + 1);
    const ausuebung = tief + naechste(hoch - tief + 1);

    const o = optionspreis({ kurs, hoch, tief, ausuebung });

    // Oben: Δ · hoch + B muss die Auszahlung im hohen Fall sein.
    const obenNachbau = plus(mal(o.delta, bruch(hoch)), o.bargeld);
    const untenNachbau = plus(mal(o.delta, bruch(tief)), o.bargeld);

    geprueft++;
    if (!bruchGleich(obenNachbau, o.auszahlungHoch)) {
      fehler = `Kurs ${kurs}/${hoch}/${tief}, K = ${ausuebung}: oben liefert der Nachbau ${bruchAlsText(obenNachbau)} statt ${bruchAlsText(o.auszahlungHoch)}`;
    } else if (!bruchGleich(untenNachbau, o.auszahlungTief)) {
      fehler = `Kurs ${kurs}/${hoch}/${tief}, K = ${ausuebung}: unten liefert der Nachbau ${bruchAlsText(untenNachbau)} statt ${bruchAlsText(o.auszahlungTief)}`;
    }
  }

  wahr('der Nachbau trifft beide Fälle', fehler === null, fehler ?? undefined);
  wahr('und zwar oft genug', geprueft >= 150, `nur ${geprueft}`);
});

pruefung('Der Preis über q stimmt mit dem Nachbau überein', () => {
  // Zwei Wege zum selben Preis: über den Nachbau und über den
  // Erwartungswert mit q. Dass beide übereinstimmen, ist der Satz —
  // und er wird hier nachgerechnet statt behauptet.
  const naechste = wuerfel(startwertFuer('anwendung-q'));
  let fehler = null;

  for (let i = 0; i < 200 && fehler === null; i++) {
    const kurs = (naechste(50) + 10) * 2;
    const hoch = kurs + (naechste(40) + 5);
    const tief = kurs - (naechste(Math.min(kurs - 2, 40)) + 1);
    const ausuebung = tief + naechste(hoch - tief + 1);

    const o = optionspreis({ kurs, hoch, tief, ausuebung });
    const ueberQ = plus(
      mal(o.q, o.auszahlungHoch),
      mal(minus(bruch(1), o.q), o.auszahlungTief)
    );

    if (!bruchGleich(ueberQ, o.preis)) {
      fehler = `Kurs ${kurs}/${hoch}/${tief}, K = ${ausuebung}: über q ${bruchAlsText(ueberQ)}, über den Nachbau ${bruchAlsText(o.preis)}`;
    }

    // Und q ist eine Wahrscheinlichkeit — zwischen 0 und 1.
    const qWert = alsZahl(o.q);
    if (qWert < 0 || qWert > 1) {
      fehler = `q = ${bruchAlsText(o.q)} liegt außerhalb von 0…1`;
    }
  }

  wahr('beide Wege ergeben denselben Preis', fehler === null, fehler ?? undefined);
});

pruefung('Das Beispiel aus dem Gespräch', () => {
  // Aktie bei 100, in einem Jahr 125 oder 80, Kaufrecht für 100.
  const o = optionspreis({ kurs: 100, hoch: 125, tief: 80, ausuebung: 100 });

  gleichText('Delta', bruchAlsText(o.delta), '5/9');
  gleichText('Bargeld', bruchAlsText(o.bargeld), '-400/9');
  gleichText('Preis', bruchAlsText(o.preis), '100/9');
  gleichText('q', bruchAlsText(o.q), '4/9');

  // Und die naive Rechnung wäre 12,50 € — deutlich daneben.
  gleichText('naiv', bruchAlsText(o.naiv), '25/2');
  wahr('der naive Wert ist zu hoch', alsZahl(o.naiv) > alsZahl(o.preis));

  wahr('q ist nicht 1/2', !bruchGleich(o.q, bruch(1, 2)));
  wahr('und die Einsicht sagt warum', o.einsicht.includes('FALSCHEN Wahrscheinlichkeit'));
  wahr('der Vorbehalt nennt die Annahmen', o.vorbehalt.includes('nur zwei mögliche Kurse'));
});

pruefung('Wo der naive Erwartungswert zufällig stimmt', () => {
  // Er stimmt genau dann, wenn q = 1/2 ist — also wenn der heutige Kurs
  // genau in der Mitte liegt. Das ist kein Argument FÜR die naive
  // Rechnung, sondern zeigt, wovon sie abhängt: nicht von der
  // Wahrscheinlichkeit, sondern von der Lage des Kurses.
  const mittig = optionspreis({ kurs: 100, hoch: 120, tief: 80, ausuebung: 100 });
  gleichText('q ist hier 1/2', bruchAlsText(mittig.q), '1/2');
  wahr('und dann stimmt auch die naive Rechnung', bruchGleich(mittig.naiv, mittig.preis));

  // Sobald der Kurs nicht mittig liegt, gehen sie auseinander.
  const schief = optionspreis({ kurs: 90, hoch: 120, tief: 80, ausuebung: 100 });
  wahr('sonst nicht', !bruchGleich(schief.naiv, schief.preis));
});

pruefung('Was nicht geht, wird abgelehnt', () => {
  wirft('der Kurs liegt nicht dazwischen', () =>
    optionspreis({ kurs: 200, hoch: 125, tief: 80, ausuebung: 100 })
  );
  wirft('hoch und tief vertauscht', () =>
    optionspreis({ kurs: 100, hoch: 80, tief: 125, ausuebung: 100 })
  );
  wirft('negatives Startkapital', () => zinseszins({ startkapital: -100, zinssatz: 3, jahre: 5 }));
  wirft('halbe Jahre', () => zinseszins({ startkapital: 100, zinssatz: 3, jahre: 2.5 }));
  wirft('Zinssatz unter −100 %', () =>
    zinseszins({ startkapital: 100, zinssatz: -150, jahre: 1 })
  );
});

pruefung('Jede Anwendung sagt, was ihr Modell nicht weiß', () => {
  // Die zweite Regel dieses Kapitels. Ohne den Vorbehalt wäre die
  // Anwendung eine Behauptung über die Wirklichkeit — und genau das
  // wirft diese App ihren Nutzern gegenüber nie.
  const alle = [
    zinseszins({ startkapital: 1000, zinssatz: 3, jahre: 10 }),
    verdopplung({ start: 1, schritte: 10 }),
    zerfall({ start: 100, halbwertszeit: 10, dauer: 30 }),
    optionspreis({ kurs: 100, hoch: 125, tief: 80, ausuebung: 100 }),
  ];

  for (const e of alle) {
    wahr(`${e.art}: hat einen Vorbehalt`, typeof e.vorbehalt === 'string' && e.vorbehalt.length > 60);
    wahr(`${e.art}: hat eine Einsicht`, typeof e.einsicht === 'string' && e.einsicht.length > 40);
  }
});

pruefung('Große Zahlen bleiben lesbar', () => {
  gleichText('Tausenderpunkte', zahlKurz(1234567), '1.234.567');
  gleichText('Komma statt Punkt', zahlKurz(11.111), '11,11');
  wahr('sehr große Zahlen als Zehnerpotenz', zahlKurz(1.2e20).includes('10²⁰'), zahlKurz(1.2e20));
  gleichText('Hochzahlen', hochzahl(30), '³⁰');
  gleichText('negative Hochzahlen', hochzahl(-2), '⁻²');
});
