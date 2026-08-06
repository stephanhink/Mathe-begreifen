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
//
//   Dezibel: Der Pegel ist 10 · lg(I : I₀) — geprüft gegen Math.log10,
//     also gegen etwas, das nichts von diesem Modul weiß. Dazu die
//     Aussage, die die Skala ausmacht: JEDE VERZEHNFACHUNG BRINGT GENAU
//     10 dB DAZU, exakt und ohne Toleranz.
//
//   pH: derselbe Bau mit dem Minus davor. −lg(c), und jede pH-Stufe ist
//     genau ein Faktor 10 in der Konzentration.

import { pruefung, wahr, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, plus, minus, mal, alsZahl, gleich as bruchGleich, alsText as bruchAlsText } from '../utils/bruch.js';
import {
  zinseszins,
  verdopplungszeit,
  verdopplung,
  zerfall,
  optionspreis,
  dezibel,
  phWert,
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

// ---------------------------------------------------------------------
// Dezibel
// ---------------------------------------------------------------------

// Die tragende Prüfung als eigene Funktion, damit sie sich auch auf
// einen absichtlich FALSCHEN Pegel loslassen lässt. Ohne diesen Griff
// bliebe die Gegenprobe eine Behauptung: Eine Prüfung, die nichts
// ablehnt, sieht genauso grün aus wie eine, die alles bestätigt.
//
// Verglichen wird gegen Math.log10 — etwas, das von diesem Modul nichts
// weiß. Wäre der Faktor falsch, das Verhältnis verkehrt herum gebildet
// oder der Logarithmus zur falschen Basis genommen, fiele es hier auf.
function pegelWeichtAb(pegelVon) {
  const naechste = wuerfel(startwertFuer('anwendung-dezibel'));
  let geprueft = 0;

  for (let i = 0; i < 200; i++) {
    // Glatte Zehnerpotenzen und krumme Verhältnisse gemischt — sonst
    // träfe die Prüfung nur den exakten Zweig.
    const verhaeltnis = i % 3 === 0 ? 10 ** naechste(13) : naechste(100000) + 1;

    const wert = pegelVon(verhaeltnis);
    const erwartet = 10 * Math.log10(verhaeltnis);
    geprueft++;

    if (Math.abs(wert - erwartet) > 1e-9 * Math.max(1, Math.abs(erwartet))) {
      return {
        geprueft,
        fehler: `bei I : I₀ = ${verhaeltnis}: ${wert} dB statt 10 · lg = ${erwartet} dB`,
      };
    }
  }
  return { geprueft, fehler: null };
}

pruefung('Der Pegel ist 10 · lg(I : I₀)', () => {
  const lauf = pegelWeichtAb((verhaeltnis) => dezibel({ verhaeltnis }).pegel);

  wahr('der Pegel stimmt mit 10 · lg überein', lauf.fehler === null, lauf.fehler ?? undefined);
  wahr('und zwar oft genug', lauf.geprueft >= 150, `nur ${lauf.geprueft}`);

  // Gegenprobe: derselbe Lauf gegen den SCHALLDRUCKpegel (20 statt 10).
  // Der ist eine andere Größe, heißt aber auch dB — genau der
  // Verwechslungsfall aus dem Vorbehalt. Die Prüfung muss ihn finden,
  // mit Zahlen.
  const gegenprobe = pegelWeichtAb((verhaeltnis) => 20 * Math.log10(verhaeltnis));
  wahr(
    'ein falscher Faktor wird gefunden',
    gegenprobe.fehler !== null,
    'der Faktor 20 fiel nicht auf — dann prüft diese Prüfung nichts'
  );
  wahr(
    'und die Meldung nennt die Stelle',
    (gegenprobe.fehler ?? '').includes('I : I₀'),
    gegenprobe.fehler ?? undefined
  );
});

pruefung('Jede Verzehnfachung bringt genau 10 dB dazu', () => {
  // Das ist die Aussage, die die Skala überhaupt erst zur Skala macht —
  // und bei Zehnerpotenzen ist sie exakt prüfbar, ohne jede Toleranz.
  for (let k = 0; k <= 12; k++) {
    const unten = dezibel({ verhaeltnis: 10 ** k });
    const oben = dezibel({ verhaeltnis: 10 ** (k + 1) });

    wahr(`10${hochzahl(k)} ist exakt`, unten.exakt);
    wahr(
      `10${hochzahl(k)} ergibt ${10 * k} dB`,
      bruchGleich(unten.pegelBruch, bruch(10 * k)),
      bruchAlsText(unten.pegelBruch)
    );
    wahr(
      `eine Verzehnfachung mehr sind genau 10 dB mehr`,
      bruchGleich(oben.pegelBruch, plus(unten.pegelBruch, bruch(10))),
      `${bruchAlsText(unten.pegelBruch)} → ${bruchAlsText(oben.pegelBruch)}`
    );
  }

  // Auch dort, wo der Pegel krumm ist, gilt der Abstand exakt 10 —
  // nur lässt er sich dann nicht mehr als Bruch hinschreiben.
  const leise = dezibel({ verhaeltnis: 2 });
  const lauter = dezibel({ verhaeltnis: 20 });
  wahr('krummer Fall: der Abstand bleibt 10 dB', Math.abs(lauter.pegel - leise.pegel - 10) < 1e-9);
  wahr('und der krumme Wert wird als gerundet ausgewiesen', leise.gerundet && !leise.exakt);
  wahr('mit Hinweis, warum', leise.hinweis.includes('keine Zehnerpotenz'), leise.hinweis);
  wahr('die Leiter spannt zwölf Zehnerpotenzen', leise.leiter.length === 13);
});

pruefung('Der Schallpegel an echten Zahlen', () => {
  // I₀ = 10⁻¹² W/m² ist die Hörschwelle — der Nullpunkt der Skala, nicht
  // die Stille.
  const hoerschwelle = dezibel({ intensitaet: 1e-12 });
  gleichText('die Hörschwelle ist 0 dB', hoerschwelle.pegel, 0);
  gleichText('und das exakt', bruchAlsText(hoerschwelle.pegelBruch), '0');

  const zimmer = dezibel({ intensitaet: 1e-8 });
  gleichText('10⁻⁸ W/m² sind 40 dB', zimmer.pegel, 40);
  gleichText('das Verhältnis steht als Zehnerpotenz da', zimmer.verhaeltnisText, '10⁴');

  const schmerz = dezibel({ intensitaet: 1 });
  gleichText('1 W/m² sind 120 dB', schmerz.pegel, 120);
  wahr(
    'zwischen Hörschwelle und Schmerzgrenze liegt der Faktor 10¹²',
    schmerz.verhaeltnisText === '10¹²',
    schmerz.verhaeltnisText
  );

  // Der Rechenweg hat benannte Schritte — die eiserne Regel gilt auch
  // für die Anwendungen.
  wahr('drei benannte Schritte', schmerz.schritte.length === 3);
  wahr('jeder Schritt hat einen Namen', schmerz.schritte.every((s) => s.regel.length > 5));
  wahr('das Verhältnis wird zuerst gebildet', schmerz.schritte[0].text.includes('I : I₀'));
  wahr('und am Ende steht der Pegel', schmerz.schritte[2].text.includes('dB'));

  wahr('die Einsicht nennt die Billion', schmerz.einsicht.includes('Billion'), schmerz.einsicht);
  wahr(
    'der Vorbehalt trennt Intensität und Schalldruck',
    schmerz.vorbehalt.includes('20 · lg'),
    schmerz.vorbehalt
  );
  wahr('und sagt nichts über Schädigung zu', schmerz.vorbehalt.includes('Schädigung'));
});

pruefung('Zur Stille gibt es keinen Pegel', () => {
  // Ablehnen heißt: eine Zahl raten wäre schlimmer. Und der Fehler trägt
  // das Kennzeichen, sonst müsste ihn jeder Aufrufer wie einen
  // Rechenfehler behandeln.
  wirft('Intensität 0', () => dezibel({ intensitaet: 0 }));
  wirft('negative Intensität', () => dezibel({ intensitaet: -1 }));
  wirft('Bezug 0', () => dezibel({ intensitaet: 1, bezug: 0 }));

  let kennzeichen = false;
  try {
    dezibel({ intensitaet: 0 });
  } catch (fehler) {
    kennzeichen = fehler.undefiniert === true;
  }
  wahr('der Fehler ist als "gibt es nicht" gekennzeichnet', kennzeichen);
});

// ---------------------------------------------------------------------
// Der pH-Wert
// ---------------------------------------------------------------------

// Dieselbe tragende Prüfung wie beim Dezibel, gegen dieselbe unabhängige
// Quelle — und wieder mit dem Griff, um sie auf einen falschen Wert
// loszulassen. Der springende Punkt ist hier das Vorzeichen: Ohne das
// Minus stünden auf der Skala lauter negative Zahlen.
function phWeichtAb(phVon) {
  const naechste = wuerfel(startwertFuer('anwendung-ph'));
  let geprueft = 0;

  for (let i = 0; i < 200; i++) {
    // 10 ** -4 ist in Gleitkomma NICHT 0,0001, sondern
    // 0,00009999999999999999 — geteilt wird deshalb, statt negativ zu
    // potenzieren. Eine Prüfung, die selbst krumme Zahlen erzeugt,
    // prüft nicht das Modul, sondern Math.pow.
    const stufe = naechste(11);
    const konzentration =
      i % 3 === 0 ? 1 / 10 ** stufe : (naechste(999) + 1) / 10 ** (stufe + 4);

    const wert = phVon(konzentration);
    const erwartet = -Math.log10(konzentration);
    geprueft++;

    if (Math.abs(wert - erwartet) > 1e-9 * Math.max(1, Math.abs(erwartet))) {
      return { geprueft, fehler: `bei c = ${konzentration} mol/l: ${wert} statt −lg(c) = ${erwartet}` };
    }
  }
  return { geprueft, fehler: null };
}

pruefung('Der pH-Wert ist −lg(c)', () => {
  const lauf = phWeichtAb((konzentration) => phWert({ konzentration }).ph);

  wahr('der pH-Wert stimmt mit −lg(c) überein', lauf.fehler === null, lauf.fehler ?? undefined);
  wahr('und zwar oft genug', lauf.geprueft >= 150, `nur ${lauf.geprueft}`);

  // Gegenprobe: das vergessene Minus — der Fehler, den beim ersten Mal
  // fast jeder macht. Aus pH 7 würde −7.
  const ohneMinus = phWeichtAb((konzentration) => Math.log10(konzentration));
  wahr(
    'ein vergessenes Minus wird gefunden',
    ohneMinus.fehler !== null,
    'das fehlende Minus fiel nicht auf — dann prüft diese Prüfung nichts'
  );
  wahr(
    'und die Meldung nennt die Konzentration',
    (ohneMinus.fehler ?? '').includes('mol/l'),
    ohneMinus.fehler ?? undefined
  );
});

pruefung('Eine pH-Stufe ist ein Faktor 10', () => {
  // Der Satz, den fast jeder falsch im Kopf hat: pH 4 ist nicht "ein
  // bisschen saurer" als pH 5, sondern ZEHNMAL so sauer. Exakt prüfbar.
  for (let stufe = 0; stufe <= 13; stufe++) {
    // Geteilt statt negativ potenziert — siehe oben, 10 ** -4 ist krumm.
    const oben = phWert({ konzentration: 1 / 10 ** stufe });
    const zehnfachVerduennt = phWert({ konzentration: 1 / 10 ** (stufe + 1) });

    wahr(`c = 10⁻${stufe} ist exakt`, oben.exakt);
    wahr(
      `ergibt pH ${stufe}`,
      bruchGleich(oben.phBruch, bruch(stufe)),
      bruchAlsText(oben.phBruch)
    );
    wahr(
      'zehnfach verdünnt heißt genau eine pH-Stufe höher',
      bruchGleich(zehnfachVerduennt.phBruch, plus(oben.phBruch, bruch(1))),
      `${bruchAlsText(oben.phBruch)} → ${bruchAlsText(zehnfachVerduennt.phBruch)}`
    );
  }

  const neutral = phWert({ konzentration: 1e-7 });
  gleichText('reines Wasser: pH 7', neutral.ph, 7);
  gleichText('und das heißt neutral', neutral.einordnung, 'neutral');
  gleichText('Magensäure bei 10⁻² mol/l', phWert({ konzentration: 0.01 }).einordnung, 'sauer');
  gleichText('Seifenlauge bei 10⁻¹¹ mol/l', phWert({ konzentration: 1e-11 }).einordnung, 'basisch');

  // Der Rechenweg macht das Minus zu einem eigenen, benannten Schritt —
  // sonst fiele es vom Himmel.
  wahr('drei benannte Schritte', neutral.schritte.length === 3);
  wahr(
    'das Minus ist ein eigener Schritt',
    neutral.schritte[2].regel.includes('Vorzeichen'),
    neutral.schritte[2].regel
  );
  gleichText('und am Ende steht der pH-Wert', neutral.schritte[2].text, 'pH = 7');
  gleichText('die Konzentration steht als Zehnerpotenz da', neutral.konzentrationText, '10⁻⁷');
  wahr('die Leiter geht von 0 bis 14', neutral.leiter.length === 15);
});

pruefung('Wo der pH-Wert krumm ist, sagt die App es', () => {
  const essig = phWert({ konzentration: 0.0002 });
  wahr('gerundet', essig.gerundet && !essig.exakt);
  wahr('mit Hinweis, warum', essig.hinweis.includes('keine Zehnerpotenz'), essig.hinweis);
  wahr('und das Ungefähr-Zeichen steht im Ergebnis', essig.phText.startsWith('≈'), essig.phText);
  wahr('der Wert liegt zwischen 3 und 4', essig.ph > 3 && essig.ph < 4, String(essig.ph));

  wirft('Konzentration 0', () => phWert({ konzentration: 0 }));
  wirft('negative Konzentration', () => phWert({ konzentration: -1 }));

  let kennzeichen = false;
  try {
    phWert({ konzentration: 0 });
  } catch (fehler) {
    kennzeichen = fehler.undefiniert === true;
  }
  wahr('der Fehler ist als "gibt es nicht" gekennzeichnet', kennzeichen);

  wahr(
    'der Vorbehalt nennt die Aktivität',
    essig.vorbehalt.includes('Aktivität'),
    essig.vorbehalt
  );
  wahr('und dass es pH unter 0 und über 14 gibt', essig.vorbehalt.includes('über 14'));
  wahr('die Einsicht sagt: zehnmal so sauer', essig.einsicht.includes('ZEHNMAL'), essig.einsicht);
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
    dezibel({ intensitaet: 1e-8 }),
    phWert({ konzentration: 1e-7 }),
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
