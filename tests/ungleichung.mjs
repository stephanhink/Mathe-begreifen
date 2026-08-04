// Prüfungen für das Lösen von Ungleichungen.
//
// Es gelten dieselben zwei tragenden Aussagen wie bei gleichung.js, aber
// die zweite ist hier stärker, weil eine Ungleichung keine einzelnen
// Lösungen hat, sondern ganze Bereiche:
//
//   1. Jede Umformung lässt die Lösungsmenge unverändert.
//   2. Die ausgegebene Lösungsmenge stimmt an jeder Stelle mit der
//      URSPRÜNGLICHEN Ungleichung überein — nicht bloß an den Grenzen.
//
// Die zweite ist das Gegenstück zur Probe aus dem Unterricht, nur
// gründlicher: Bei einer Gleichung setzt man die Lösung ein, bei einer
// Ungleichung muss man die ganze Zahlengerade abgehen. Genau das tut
// diese Prüfung, links und rechts der Grenzen und dazwischen.
//
// Beide fangen denselben Fehler: den vergessenen Dreh beim Multiplizieren
// mit einer negativen Zahl. Er kehrt die Wahrheit an JEDER Stelle um und
// kann sich deshalb nirgends verstecken.

import { pruefung, wahr, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, plus, alsText as bruchAlsText } from '../utils/bruch.js';
import { zahl, variable, summe, produkt, potenz, auswerte, auswerteExakt } from '../utils/term.js';
import {
  ungleichung,
  istUngleichung,
  alsText,
  istErfuellt,
  drehe,
  istStreng,
  loese,
  loesungAlsText,
  inLoesung,
  alsRechenweg,
  ZEICHEN,
} from '../utils/ungleichung.js';

const x = variable('x');
const y = variable('y');
const k = (n) => zahl(bruch(n));
const mal = (n, t) => produkt(k(n), t);

const UNGLEICHUNGEN = 160;
const PUNKTE = 200;

// ---------------------------------------------------------------------

pruefung('Ungleichungen bauen und aufschreiben', () => {
  const u = ungleichung(summe(mal(3, x), k(5)), '<', k(14));
  gleichText('als Text', alsText(u), '3x + 5 < 14');
  wahr('ist eine Ungleichung', istUngleichung(u));
  wahr('eine Gleichung ist keine', !istUngleichung({ links: x, rechts: k(1) }));

  wirft('ein unbekanntes Zeichen wird abgelehnt', () => ungleichung(x, '=', k(1)));
  wirft('<= statt ≤ wird abgelehnt', () => ungleichung(x, '<=', k(1)));
  wirft('eine Zahl ist kein Term', () => ungleichung(3, '<', k(1)));
});

pruefung('Der Dreh ist eine eigene Regel', () => {
  gleichText('aus < wird >', drehe('<'), '>');
  gleichText('aus ≤ wird ≥', drehe('≤'), '≥');
  gleichText('aus > wird <', drehe('>'), '<');
  gleichText('aus ≥ wird ≤', drehe('≥'), '≤');
  wirft('nur Vergleichszeichen', () => drehe('='));

  // Zweimal drehen bringt zurück — und die Strenge bleibt erhalten.
  for (const z of ZEICHEN) {
    gleichText(`${z} zweimal gedreht`, drehe(drehe(z)), z);
    wahr(`${z} behält seine Strenge`, istStreng(drehe(z)) === istStreng(z));
  }
});

pruefung('Stimmt die Ungleichung hier?', () => {
  const u = ungleichung(mal(2, x), '<', k(6));
  wahr('bei x = 2 ja', istErfuellt(u, { x: bruch(2) }));
  wahr('bei x = 3 nein', !istErfuellt(u, { x: bruch(3) }));

  const w = ungleichung(mal(2, x), '≤', k(6));
  wahr('mit ≤ ist die Grenze dabei', istErfuellt(w, { x: bruch(3) }));
});

// ---------------------------------------------------------------------
// Der Fall, um den es geht
// ---------------------------------------------------------------------

pruefung('Das Beispiel aus dem Kopf der Datei', () => {
  // −3x + 5 < 14  →  x > −3
  const u = ungleichung(summe(mal(-3, x), k(5)), '<', k(14));
  const e = loese(u);

  gleichText('Lösung', loesungAlsText(e), 'x > −3');

  const weg = alsRechenweg(u, e);
  gleichText('Zeile 1', weg[0], '−3x + 5 < 14');
  gleichText('Zeile 2', weg[1], '         | beide Seiten − 5');
  gleichText('Zeile 3', weg[2], '−3x < 9');
  wahr('Zeile 4 nennt den Dreh', weg[3].includes('das Zeichen dreht sich um'), weg[3]);
  wahr('und schreibt die negative Zahl in Klammern', weg[3].includes('(−3)'), weg[3]);
  gleichText('Zeile 5', weg[4], 'x > −3');

  // Und der Schritt ist als drehend gekennzeichnet, nicht nur im Text.
  const dreher = e.schritte.filter((s) => s.dreht);
  wahr('genau ein Schritt dreht', dreher.length === 1, `${dreher.length} Schritte drehen`);
});

pruefung('Positiver Vorfaktor dreht NICHT', () => {
  const u = ungleichung(mal(3, x), '<', k(9));
  const e = loese(u);
  gleichText('Lösung', loesungAlsText(e), 'x < 3');
  wahr('kein Schritt dreht', e.schritte.every((s) => !s.dreht));
});

pruefung('Der Dreh hängt am Vorfaktor, nicht an den Zahlen ringsum', () => {
  // Beide haben negative Zahlen im Spiel, aber nur die erste dreht.
  const dreht = loese(ungleichung(mal(-2, x), '≥', k(-8)));
  gleichText('−2x ≥ −8', loesungAlsText(dreht), 'x ≤ 4');

  const drehtNicht = loese(ungleichung(mal(2, x), '≥', k(-8)));
  gleichText('2x ≥ −8', loesungAlsText(drehtNicht), 'x ≥ −4');
});

pruefung('Auch Brüche als Vorfaktor', () => {
  // −x/2 < 3  →  x > −6
  const u = ungleichung(produkt(zahl(bruch(-1, 2)), x), '<', k(3));
  gleichText('Lösung', loesungAlsText(loese(u)), 'x > −6');
});

pruefung('Variablen auf beiden Seiten', () => {
  // 5x − 3 > 2x + 6  →  x > 3
  const u = ungleichung(summe(mal(5, x), k(-3)), '>', summe(mal(2, x), k(6)));
  gleichText('Lösung', loesungAlsText(loese(u)), 'x > 3');

  // 2x + 1 ≤ 5x + 7  →  x ≥ −2   (der Vorfaktor wird negativ: −3x ≤ 6)
  const w = ungleichung(summe(mal(2, x), k(1)), '≤', summe(mal(5, x), k(7)));
  const e = loese(w);
  gleichText('Lösung', loesungAlsText(e), 'x ≥ −2');
  wahr('dabei wird gedreht', e.schritte.some((s) => s.dreht));
});

pruefung('Keine Lösung und jede Zahl', () => {
  // x + 1 < x + 2 — die Variable fällt heraus, wahre Aussage.
  const alle = loese(ungleichung(summe(x, k(1)), '<', summe(x, k(2))));
  gleichText('art', alle.art, 'alle');
  gleichText('Text', loesungAlsText(alle), 'jede Zahl');

  // x + 2 < x + 1 — falsche Aussage.
  const keine = loese(ungleichung(summe(x, k(2)), '<', summe(x, k(1))));
  gleichText('art', keine.art, 'keine');
  gleichText('Text', loesungAlsText(keine), 'keine Zahl');

  // x < x — auch falsch, und zwar knapp.
  gleichText('x < x', loese(ungleichung(x, '<', x)).art, 'keine');
  // x ≤ x — und das ist wahr.
  gleichText('x ≤ x', loese(ungleichung(x, '≤', x)).art, 'alle');
});

// ---------------------------------------------------------------------
// Zweiten Grades
// ---------------------------------------------------------------------

pruefung('Quadratisch: zwei Nullstellen', () => {
  // x² < 4  →  −2 < x < 2   (innen)
  const innen = loese(ungleichung(potenz(x, k(2)), '<', k(4)));
  gleichText('x² < 4', loesungAlsText(innen), '−2 < x < 2');

  // x² > 4  →  x < −2 oder x > 2   (außen, zwei Intervalle)
  const aussen = loese(ungleichung(potenz(x, k(2)), '>', k(4)));
  gleichText('x² > 4', loesungAlsText(aussen), 'x < −2 oder x > 2');
  wahr('das sind zwei Intervalle', aussen.intervalle.length === 2);

  // Mit ≤ sind die Grenzen dabei.
  gleichText('x² ≤ 4', loesungAlsText(loese(ungleichung(potenz(x, k(2)), '≤', k(4)))), '−2 ≤ x ≤ 2');
});

pruefung('Quadratisch: nach unten geöffnet', () => {
  // −x² + 4 > 0  →  −2 < x < 2
  const u = ungleichung(summe(mal(-1, potenz(x, k(2))), k(4)), '>', k(0));
  gleichText('Lösung', loesungAlsText(loese(u)), '−2 < x < 2');
});

pruefung('Quadratisch: keine Nullstelle', () => {
  // x² + 1 > 0 — überall wahr.
  const alle = loese(ungleichung(summe(potenz(x, k(2)), k(1)), '>', k(0)));
  gleichText('x² + 1 > 0', alle.art, 'alle');

  // x² + 1 < 0 — nirgends.
  const keine = loese(ungleichung(summe(potenz(x, k(2)), k(1)), '<', k(0)));
  gleichText('x² + 1 < 0', keine.art, 'keine');
});

pruefung('Quadratisch: die doppelte Nullstelle', () => {
  // Das sind die vier Fälle, in denen man sich im Unterricht vertut.
  const q = (zeichen) => loese(ungleichung(potenz(x, k(2)), zeichen, k(0)));

  gleichText('x² ≥ 0 gilt für jede Zahl', q('≥').art, 'alle');
  gleichText('x² < 0 für keine', q('<').art, 'keine');

  // x² > 0: alle AUSSER null. Wer hier "jede Zahl" schreibt, liegt knapp
  // daneben — und genau das ist der Fehler, den man macht.
  const ohneNull = q('>');
  gleichText('x² > 0', ohneNull.art, 'loesung');
  wahr('bei x = 0 nicht erfüllt', !inLoesung(ohneNull, 0));
  wahr('bei x = 0,001 schon', inLoesung(ohneNull, 0.001));
  wahr('bei x = −0,001 auch', inLoesung(ohneNull, -0.001));

  // x² ≤ 0: NUR null.
  const nurNull = q('≤');
  gleichText('x² ≤ 0', nurNull.art, 'loesung');
  wahr('bei x = 0 erfüllt', inLoesung(nurNull, 0));
  wahr('sonst nirgends', !inLoesung(nurNull, 0.001) && !inLoesung(nurNull, -0.001));
});

pruefung('Irrationale Grenzen bleiben exakt', () => {
  // x² < 5 — die Grenzen sind ±√5 und werden nicht gerundet.
  const e = loese(ungleichung(potenz(x, k(2)), '<', k(5)));
  const text = loesungAlsText(e);
  wahr('√5 steht als Wurzel da', text.includes('√5'), text);
  wahr('keine Kommazahl', !text.includes('2,2'), text);
});

// ---------------------------------------------------------------------
// Was diese Datei nicht kann, sagt sie
// ---------------------------------------------------------------------

pruefung('Ablehnen statt raten', () => {
  const zweiVariablen = loese(ungleichung(summe(x, y), '<', k(1)));
  gleichText('mehrere Variablen', zweiVariablen.art, 'unklar');
  wahr('mit Begründung', zweiVariablen.grund.includes('mehrere Variablen'));

  const dritterGrad = loese(ungleichung(potenz(x, k(3)), '<', k(8)));
  gleichText('dritten Grades', dritterGrad.art, 'unklar');
  wahr('nennt den Grad', dritterGrad.grund.includes('Grad 3'), dritterGrad.grund);
});

// ---------------------------------------------------------------------
// Die beiden tragenden Prüfungen
// ---------------------------------------------------------------------

function zufallsungleichung(naechste, quadratisch) {
  const seite = () => {
    const glieder = [];
    if (quadratisch && naechste(2) === 0) {
      glieder.push(mal(naechste(5) - 2, potenz(x, k(2))));
    }
    glieder.push(mal(naechste(9) - 4, x));
    glieder.push(k(naechste(13) - 6));
    return summe(...glieder);
  };
  return ungleichung(seite(), ZEICHEN[naechste(4)], seite());
}

function erfuellt(u, belegung) {
  try {
    return { antwort: istErfuellt(u, belegung) };
  } catch (fehler) {
    if (fehler.zuGross) {
      return { unbekannt: true };
    }
    throw fehler;
  }
}

pruefung('Jede Umformung lässt die Lösungsmenge unverändert', () => {
  const naechste = wuerfel(startwertFuer('ungleichung-schritte'));
  let verglichen = 0;
  let fehler = null;

  for (let i = 0; i < UNGLEICHUNGEN && fehler === null; i++) {
    const start = zufallsungleichung(naechste, i % 2 === 0);
    const ergebnis = loese(start);

    let vorher = start;
    for (const s of ergebnis.schritte) {
      for (let p = 0; p < PUNKTE; p++) {
        const stelle = bruch(naechste(41) - 20, naechste(6) + 1);
        const a = erfuellt(vorher, { x: stelle });
        const b = erfuellt(s.ungleichung, { x: stelle });
        if (a.unbekannt || b.unbekannt) {
          continue;
        }
        verglichen++;
        if (a.antwort !== b.antwort) {
          fehler =
            `Schritt "${s.operation}": "${alsText(vorher)}" → "${alsText(s.ungleichung)}" ` +
            `bei x = ${bruchAlsText(stelle)}: ` +
            `${a.antwort ? 'erfüllt' : 'nicht erfüllt'} wird zu ` +
            `${b.antwort ? 'erfüllt' : 'nicht erfüllt'}`;
          break;
        }
      }
      if (fehler) {
        break;
      }
      vorher = s.ungleichung;
    }
  }

  wahr('jeder Schritt erhält die Lösungsmenge', fehler === null, fehler ?? undefined);
  wahr('es wurde wirklich verglichen', verglichen >= 3000, `nur ${verglichen} Stellen`);
});

// Die Grenze als Bruch. Bei √5 gibt es keinen — dann eine Näherung,
// und die Aussage über die Grenze SELBST fällt weg. Das ist ehrlich:
// Ob √5 zur Lösungsmenge gehört, kann man mit Kommazahlen nicht
// entscheiden, und die Prüfung tut deshalb nicht so.
function alsBruchOderNaeherung(term) {
  try {
    return auswerteExakt(term);
  } catch (fehler) {
    if (!fehler.irrational) {
      throw fehler;
    }
  }
  const g = auswerte(term);
  return bruch(Math.round(g * 100000), 100000);
}

pruefung('Die ausgegebene Lösungsmenge stimmt mit der Ungleichung überein', () => {
  // Das ist die Probe, und bei einer Ungleichung muss sie die ganze
  // Zahlengerade abgehen: Für jede Teststelle muss "liegt im
  // Lösungsbereich" dasselbe sagen wie "erfüllt die ursprüngliche
  // Ungleichung". Eine Grenze, die um ein Haar falsch liegt, oder ein
  // ≤ statt <, fällt hier auf.
  const naechste = wuerfel(startwertFuer('ungleichung-menge'));
  let geprueft = 0;
  let mitLoesung = 0;
  let fehler = null;

  for (let i = 0; i < UNGLEICHUNGEN && fehler === null; i++) {
    const u = zufallsungleichung(naechste, i % 2 === 0);
    const e = loese(u);
    if (e.art === 'unklar') {
      continue;
    }
    if (e.art === 'loesung') {
      mitLoesung++;
    }

    // Teststellen sind BRÜCHE, keine Kommazahlen — beide Seiten des
    // Vergleichs müssen dieselbe Zahl sehen. Vorher wurde die
    // Zugehörigkeit an einer Fließkommazahl und die Wahrheit an einer
    // gerundeten Bruchzahl gemessen; an der Grenze −4/3 gingen die
    // beiden auseinander und die Prüfung schlug fehl, obwohl das Modul
    // recht hatte.
    const winzig = bruch(1, 1000000);
    const stellen = [];
    for (const iv of e.intervalle ?? []) {
      for (const grenze of [iv.von, iv.bis]) {
        if (grenze === null) {
          continue;
        }
        const g = alsBruchOderNaeherung(grenze);
        stellen.push(g, plus(g, winzig), plus(g, bruch(-1, 1000000)), plus(g, bruch(1)), plus(g, bruch(-1)));
      }
    }
    for (let p = 0; p < 40; p++) {
      stellen.push(bruch(naechste(4001) - 2000, 100));
    }

    for (const stelle of stellen) {
      const drin = inLoesung(e, stelle);
      const wahrheit = istErfuellt(u, { x: stelle });
      geprueft++;
      if (drin !== wahrheit) {
        fehler =
          `"${alsText(u)}" → "${loesungAlsText(e)}" ` +
          `bei x = ${bruchAlsText(stelle)}: Lösungsmenge sagt ${drin ? 'drin' : 'draußen'}, ` +
          `die Ungleichung sagt ${wahrheit ? 'erfüllt' : 'nicht erfüllt'}`;
        break;
      }
    }
  }

  wahr('die Lösungsmenge beschreibt die Ungleichung', fehler === null, fehler ?? undefined);
  wahr('es kamen wirklich Lösungsbereiche vor', mitLoesung >= 40, `nur ${mitLoesung}`);
  wahr('es wurde wirklich geprüft', geprueft >= 4000, `nur ${geprueft} Stellen`);
});

// ---------------------------------------------------------------------
// Die Gegenprobe: vergessener Dreh wird gefunden
// ---------------------------------------------------------------------

pruefung('Ein vergessener Dreh würde auffallen', () => {
  // Nicht der Code wird verbogen, sondern eine falsche Umformung von
  // Hand nachgebaut — und die Prüfung, die den Weg absichert, muss sie
  // verwerfen. So ist belegt, dass die Prüfung oben wirklich greift und
  // nicht bloß immer "ja" sagt.
  const vorher = ungleichung(mal(-3, x), '<', k(9));
  const falsch = ungleichung(x, '<', k(-3)); // richtig wäre x > −3
  const richtig = ungleichung(x, '>', k(-3));

  let unterschiede = 0;
  let gleiche = 0;
  for (let n = -20; n <= 20; n++) {
    const stelle = bruch(n);
    if (istErfuellt(vorher, { x: stelle }) !== istErfuellt(falsch, { x: stelle })) {
      unterschiede++;
    }
    if (istErfuellt(vorher, { x: stelle }) === istErfuellt(richtig, { x: stelle })) {
      gleiche++;
    }
  }

  wahr('die falsche Fassung weicht ab — an fast jeder Stelle', unterschiede >= 38, `${unterschiede} von 41`);
  wahr('die richtige stimmt überall überein', gleiche === 41, `${gleiche} von 41`);
});
