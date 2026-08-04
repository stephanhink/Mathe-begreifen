// Prüfungen für die Vektorgeometrie.
//
// Hier ist die Lage besser als bei den Funktionen: Die tragenden
// Aussagen lassen sich EXAKT prüfen, ohne Toleranz und ohne
// Zufallsstellen. Skalar- und Kreuzprodukt sind reine Bruchrechnung.
//
// Drei Sätze tragen alles, und jeder ist zugleich das, was man im
// Unterricht als Kontrolle lernt:
//
//   1. Das Kreuzprodukt steht auf BEIDEN Ausgangsvektoren senkrecht.
//      (a × b) · a = 0  und  (a × b) · b = 0 — exakt null, nicht
//      "ungefähr null". Genau dafür braucht man es.
//
//   2. Die Identität von Lagrange:
//      |a × b|² + (a · b)² = |a|² · |b|²
//      Sie verbindet beide Produkte und fällt sofort auseinander, wenn
//      in einem von beiden ein Vorzeichen falsch steht.
//
//   3. Die Dreiecksungleichung: |a + b| ≤ |a| + |b|. Der Umweg ist nie
//      kürzer als der direkte Weg.
//
// Dazu die Lagebeziehungen, geprüft gegen unabhängig gebaute Fälle:
// Wer eine Gerade aus einer bekannten Lage konstruiert, weiß vorher,
// was herauskommen muss.

import { pruefung, wahr, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, istNull, gleich as bruchGleich, alsZahl, plus, mal, minus } from '../utils/bruch.js';
import { alsText as termAlsText } from '../utils/term.js';
import {
  vektor,
  istVektor,
  dimension,
  alsText,
  addiere,
  subtrahiere,
  strecke,
  gegenvektor,
  verbindung,
  skalarprodukt,
  istOrthogonal,
  betrag,
  betragQuadrat,
  betragAlsZahl,
  betragAlsText,
  kreuzprodukt,
  istKollinear,
  istNullvektor,
  winkel,
  gerade,
  geradeAlsText,
  punktAuf,
  liegtAuf,
  lage,
} from '../utils/vektor.js';

const DURCHGAENGE = 200;

// ---------------------------------------------------------------------

pruefung('Vektoren bauen und aufschreiben', () => {
  const v = vektor(3, 4);
  gleichText('als Text', alsText(v), '(3 | 4)');
  gleichText('Dimension', dimension(v), 2);
  wahr('ist ein Vektor', istVektor(v));

  // Das typografische Minus, wie überall sonst in der App.
  gleichText('negative Komponente', alsText(vektor(1, -1, 0)), '(1 | −1 | 0)');
  gleichText('Bruch als Komponente', alsText(vektor(bruch(1, 2), bruch(-3, 4))), '(1/2 | −3/4)');

  wirft('ein Vektor mit einer Komponente', () => vektor(5));
  wirft('ein Vektor mit vier Komponenten', () => vektor(1, 2, 3, 4));
  wirft('Ebene und Raum lassen sich nicht addieren', () =>
    addiere(vektor(1, 2), vektor(1, 2, 3))
  );
});

pruefung('Rechnen mit Vektoren', () => {
  const a = vektor(3, 4);
  const b = vektor(1, 1);

  gleichText('addieren', alsText(addiere(a, b)), '(4 | 5)');
  gleichText('subtrahieren', alsText(subtrahiere(a, b)), '(2 | 3)');
  gleichText('strecken', alsText(strecke(a, 2)), '(6 | 8)');
  gleichText('Gegenvektor', alsText(gegenvektor(a)), '(−3 | −4)');

  // Der Verbindungsvektor von A nach B ist B − A — andersherum, als man
  // es spricht.
  gleichText('von A nach B', alsText(verbindung(vektor(1, 1), vektor(4, 5))), '(3 | 4)');
});

pruefung('Der Betrag bleibt exakt, so weit es geht', () => {
  gleichText('|(3|4)| ist glatt', betragAlsText(vektor(3, 4)), '5');
  gleichText('|(1|1)| bleibt eine Wurzel', betragAlsText(vektor(1, 1)), '√2');
  gleichText('|(1|2|2)|', betragAlsText(vektor(1, 2, 2)), '3');
  gleichText('|(2|2)| wird teilweise gezogen', betragAlsText(vektor(2, 2)), '2√2');

  // Wer 1,414 sieht, weiß nicht, ob das exakt ist. Wer √2 sieht, weiß es.
  wahr('keine Kommazahl im Text', !betragAlsText(vektor(1, 1)).includes(','));
  gleichText('Nullvektor hat Länge 0', betragAlsText(vektor(0, 0)), '0');
});

pruefung('Das Skalarprodukt und der rechte Winkel', () => {
  gleichText('(3|4) · (1|1)', alsZahl(skalarprodukt(vektor(3, 4), vektor(1, 1))), 7);

  // Der meistgebrauchte Satz des ganzen Gebiets: null heißt senkrecht.
  wahr('(1|0) ⊥ (0|1)', istOrthogonal(vektor(1, 0), vektor(0, 1)));
  wahr('(3|4) ⊥ (−4|3)', istOrthogonal(vektor(3, 4), vektor(-4, 3)));
  wahr('(3|4) nicht ⊥ (1|1)', !istOrthogonal(vektor(3, 4), vektor(1, 1)));

  // Und im Raum genauso.
  wahr('(1|2|2) ⊥ (2|−2|1)', istOrthogonal(vektor(1, 2, 2), vektor(2, -2, 1)));
});

pruefung('Das Kreuzprodukt gibt es nur im Raum', () => {
  gleichText('e1 × e2 = e3', alsText(kreuzprodukt(vektor(1, 0, 0), vektor(0, 1, 0))), '(0 | 0 | 1)');

  // Es ist NICHT vertauschbar — a × b ist der Gegenvektor von b × a.
  const a = vektor(1, 2, 3);
  const b = vektor(4, 5, 6);
  gleichText(
    'a × b = −(b × a)',
    alsText(kreuzprodukt(a, b)),
    alsText(gegenvektor(kreuzprodukt(b, a)))
  );

  // Ein Vektor mit sich selbst ergibt den Nullvektor — er spannt keine
  // Fläche auf.
  wahr('a × a ist der Nullvektor', istNullvektor(kreuzprodukt(a, a)));

  wirft('in der Ebene gibt es keins', () => kreuzprodukt(vektor(1, 2), vektor(3, 4)));
});

pruefung('Kollinear heißt: dieselbe Richtung', () => {
  wahr('(1|2) und (2|4)', istKollinear(vektor(1, 2), vektor(2, 4)));
  wahr('auch entgegengesetzt', istKollinear(vektor(1, 2), vektor(-3, -6)));
  wahr('(1|2) und (2|3) nicht', !istKollinear(vektor(1, 2), vektor(2, 3)));
  wahr('mit Null in einer Komponente', istKollinear(vektor(1, 0), vektor(5, 0)));
  wahr('aber nicht so', !istKollinear(vektor(1, 0), vektor(0, 5)));
  wahr('im Raum', istKollinear(vektor(1, 2, 3), vektor(2, 4, 6)));
  wahr('und nicht im Raum', !istKollinear(vektor(1, 2, 3), vektor(2, 4, 7)));
});

pruefung('Der Winkel wird gerundet — und sagt das', () => {
  const rechter = winkel(vektor(1, 0), vektor(0, 1));
  gleichText('90 Grad', Math.round(rechter.grad), 90);
  gleichText('die Einheit steht dabei', rechter.einheit, 'Grad');
  wahr('als gerundet gekennzeichnet', rechter.exakt === false);
  // Der rechte Winkel ist trotzdem eine exakte Aussage — das
  // Skalarprodukt ist genau null.
  wahr('aber senkrecht ist exakt', rechter.rechterWinkel);

  const spitz = winkel(vektor(1, 0), vektor(1, 1));
  gleichText('45 Grad', Math.round(spitz.grad), 45);
  wahr('und kein rechter Winkel', !spitz.rechterWinkel);

  const gestreckt = winkel(vektor(1, 0), vektor(-1, 0));
  gleichText('180 Grad', Math.round(gestreckt.grad), 180);

  // Mit dem Nullvektor geht es nicht — er hat keine Richtung.
  const ohne = winkel(vektor(0, 0), vektor(1, 1));
  gleichText('Nullvektor', ohne.art, 'unklar');
  wahr('mit Begründung', ohne.grund.includes('keine Richtung'));
});

// ---------------------------------------------------------------------
// Geraden
// ---------------------------------------------------------------------

pruefung('Geraden in Parameterform', () => {
  const g = gerade(vektor(1, 0, 0), vektor(1, 1, 0));
  gleichText('als Text', geradeAlsText(g, 'g'), 'g: x = (1 | 0 | 0) + t · (1 | 1 | 0)');
  gleichText('bei t = 2', alsText(punktAuf(g, 2)), '(3 | 2 | 0)');

  wahr('der Stützpunkt liegt drauf', liegtAuf(g, vektor(1, 0, 0)).liegtDrauf);
  wahr('und ein anderer Punkt auch', liegtAuf(g, vektor(4, 3, 0)).liegtDrauf);

  // EIN t muss für ALLE Zeilen passen — eine Zeile reicht nicht.
  const daneben = liegtAuf(g, vektor(4, 2, 0));
  wahr('ein Punkt daneben nicht', !daneben.liegtDrauf);
  wahr('mit Begründung', daneben.grund.includes('verschiedene t'), daneben.grund);

  wirft('der Nullvektor ist keine Richtung', () => gerade(vektor(1, 1), vektor(0, 0)));
});

pruefung('Die vier Lagen zweier Geraden', () => {
  const g = gerade(vektor(1, 0, 0), vektor(1, 1, 0));

  const schneidend = lage(g, gerade(vektor(0, 1, 0), vektor(1, -1, 0)));
  gleichText('schneidend', schneidend.art, 'schneidend');
  gleichText('im Punkt', alsText(schneidend.punkt), '(1 | 0 | 0)');

  gleichText(
    'parallel',
    lage(g, gerade(vektor(0, 5, 0), vektor(2, 2, 0))).art,
    'parallel'
  );
  gleichText(
    'identisch',
    lage(g, gerade(vektor(2, 1, 0), vektor(-3, -3, 0))).art,
    'identisch'
  );

  // Windschief gibt es nur im Raum: Dieselben Geraden von oben gesehen
  // würden sich schneiden — sie liegen aber in verschiedenen Höhen.
  const windschief = lage(g, gerade(vektor(0, 1, 5), vektor(1, -1, 0)));
  gleichText('windschief', windschief.art, 'windschief');
  wahr('und erklärt, dass es das nur im Raum gibt', windschief.grund.includes('nur im Raum'));
});

pruefung('In der Ebene kann nichts windschief sein', () => {
  // Zwei Geraden der Ebene mit verschiedenen Richtungen MÜSSEN sich
  // schneiden. Käme hier je "windschief" heraus, wäre das ein Fehler —
  // und zwar einer, den man beim Rechnen im Raum nicht bemerkt.
  const naechste = wuerfel(startwertFuer('vektor-ebene'));
  let fehler = null;

  for (let i = 0; i < DURCHGAENGE && fehler === null; i++) {
    const g = gerade(
      vektor(naechste(11) - 5, naechste(11) - 5),
      vektor(naechste(9) - 4 || 1, naechste(9) - 4 || 2)
    );
    const h = gerade(
      vektor(naechste(11) - 5, naechste(11) - 5),
      vektor(naechste(9) - 4 || 3, naechste(9) - 4 || 1)
    );
    const l = lage(g, h);

    if (l.art === 'windschief') {
      fehler = `${geradeAlsText(g, 'g')}\n  ${geradeAlsText(h, 'h')}\n  → windschief, das gibt es in der Ebene nicht`;
    }
    if (l.art === 'schneidend') {
      // Und der gemeldete Punkt muss wirklich auf beiden liegen.
      if (!liegtAuf(g, l.punkt).liegtDrauf || !liegtAuf(h, l.punkt).liegtDrauf) {
        fehler = `Der Schnittpunkt ${alsText(l.punkt)} liegt nicht auf beiden Geraden`;
      }
    }
  }

  wahr('in der Ebene gibt es kein windschief', fehler === null, fehler ?? undefined);
});

// ---------------------------------------------------------------------
// Die tragenden Sätze — exakt, ohne Toleranz
// ---------------------------------------------------------------------

function zufallsvektor(naechste, dim) {
  return vektor(...Array.from({ length: dim }, () => bruch(naechste(13) - 6, naechste(3) + 1)));
}

pruefung('Das Kreuzprodukt steht auf beiden senkrecht — exakt', () => {
  // Das ist der Satz, für den es das Kreuzprodukt überhaupt gibt. Und
  // er lässt sich EXAKT prüfen: Das Skalarprodukt ist ein Bruch, also
  // muss dort genau null stehen und nicht "ungefähr null".
  const naechste = wuerfel(startwertFuer('vektor-kreuz'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < DURCHGAENGE && fehler === null; i++) {
    const a = zufallsvektor(naechste, 3);
    const b = zufallsvektor(naechste, 3);
    const n = kreuzprodukt(a, b);

    geprueft++;
    if (!istNull(skalarprodukt(n, a))) {
      fehler = `(${alsText(a)} × ${alsText(b)}) · ${alsText(a)} ist nicht null`;
    } else if (!istNull(skalarprodukt(n, b))) {
      fehler = `(${alsText(a)} × ${alsText(b)}) · ${alsText(b)} ist nicht null`;
    }
  }

  wahr('senkrecht auf beiden', fehler === null, fehler ?? undefined);
  wahr('und zwar oft genug', geprueft >= 150, `nur ${geprueft}`);
});

pruefung('Die Identität von Lagrange — exakt', () => {
  // |a × b|² + (a · b)² = |a|² · |b|²
  //
  // Sie verbindet beide Produkte. Stünde in einem von beiden ein
  // Vorzeichen falsch, fiele sie sofort auseinander — und zwar ohne
  // jede Toleranz, weil beide Seiten Brüche sind.
  const naechste = wuerfel(startwertFuer('vektor-lagrange'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < DURCHGAENGE && fehler === null; i++) {
    const a = zufallsvektor(naechste, 3);
    const b = zufallsvektor(naechste, 3);

    const links = plus(betragQuadrat(kreuzprodukt(a, b)), mal(skalarprodukt(a, b), skalarprodukt(a, b)));
    const rechts = mal(betragQuadrat(a), betragQuadrat(b));

    geprueft++;
    if (!bruchGleich(links, rechts)) {
      fehler = `a = ${alsText(a)}, b = ${alsText(b)}: links ${alsZahl(links)}, rechts ${alsZahl(rechts)}`;
    }
  }

  wahr('|a × b|² + (a · b)² = |a|² · |b|²', fehler === null, fehler ?? undefined);
  wahr('und zwar oft genug', geprueft >= 150, `nur ${geprueft}`);
});

pruefung('Die Dreiecksungleichung: der Umweg ist nie kürzer', () => {
  // |a + b| ≤ |a| + |b|. Hier muss numerisch verglichen werden, weil
  // Beträge Wurzeln sind — aber die Aussage ist eine Ungleichung, und
  // dafür reicht die Genauigkeit locker.
  const naechste = wuerfel(startwertFuer('vektor-dreieck'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < DURCHGAENGE && fehler === null; i++) {
    const dim = naechste(2) === 0 ? 2 : 3;
    const a = zufallsvektor(naechste, dim);
    const b = zufallsvektor(naechste, dim);

    const umweg = betragAlsZahl(a) + betragAlsZahl(b);
    const direkt = betragAlsZahl(addiere(a, b));

    geprueft++;
    if (direkt > umweg + 1e-9) {
      fehler = `a = ${alsText(a)}, b = ${alsText(b)}: |a + b| = ${direkt} > ${umweg}`;
    }

    // Und die Cauchy-Schwarz-Ungleichung gleich mit: |a · b| ≤ |a| · |b|.
    // Sie ist der Grund, warum der Kosinus im Winkel nie über 1 kommt.
    const skalar = Math.abs(alsZahl(skalarprodukt(a, b)));
    if (skalar > betragAlsZahl(a) * betragAlsZahl(b) + 1e-9) {
      fehler = `a = ${alsText(a)}, b = ${alsText(b)}: |a · b| ist größer als |a| · |b|`;
    }
  }

  wahr('der direkte Weg ist nie länger', fehler === null, fehler ?? undefined);
  wahr('und zwar oft genug', geprueft >= 150, `nur ${geprueft}`);
});

pruefung('Skalarprodukt und Winkel passen zusammen', () => {
  // a · b = |a| · |b| · cos φ — die Formel, aus der der Winkel kommt.
  // Sie wird hier andersherum geprüft: Aus dem gemeldeten Winkel muss
  // sich das Skalarprodukt zurückrechnen lassen.
  const naechste = wuerfel(startwertFuer('vektor-winkel'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < DURCHGAENGE && fehler === null; i++) {
    const dim = naechste(2) === 0 ? 2 : 3;
    const a = zufallsvektor(naechste, dim);
    const b = zufallsvektor(naechste, dim);
    if (istNullvektor(a) || istNullvektor(b)) {
      continue;
    }

    const w = winkel(a, b);
    if (w.art !== 'winkel') {
      continue;
    }

    const zurueck = betragAlsZahl(a) * betragAlsZahl(b) * Math.cos((w.grad * Math.PI) / 180);
    const soll = alsZahl(skalarprodukt(a, b));

    geprueft++;
    if (Math.abs(zurueck - soll) > 1e-6 * Math.max(1, Math.abs(soll))) {
      fehler = `a = ${alsText(a)}, b = ${alsText(b)}: ${w.grad}° ergibt ${zurueck}, das Skalarprodukt ist ${soll}`;
    }

    // Der Winkel liegt immer zwischen 0° und 180°.
    if (w.grad < -1e-9 || w.grad > 180 + 1e-9) {
      fehler = `Winkel ${w.grad}° liegt außerhalb von 0…180`;
    }
  }

  wahr('a · b = |a| · |b| · cos φ', fehler === null, fehler ?? undefined);
  wahr('und zwar oft genug', geprueft >= 150, `nur ${geprueft}`);
});

pruefung('Ein falsches Kreuzprodukt würde auffallen', () => {
  // Die Gegenprobe: ein vertauschtes Vorzeichen in der mittleren
  // Komponente — der Fehler, den man beim Auswendiglernen des Schemas
  // macht, weil dort als einziger Platz ein Minus steht.
  const a = vektor(1, 2, 3);
  const b = vektor(4, 5, 6);
  const richtig = kreuzprodukt(a, b);
  const falsch = vektor(
    richtig.komponenten[0],
    minus(bruch(0), richtig.komponenten[1]),
    richtig.komponenten[2]
  );

  wahr('das richtige steht senkrecht', istNull(skalarprodukt(richtig, a)));
  wahr(
    'das falsche nicht',
    !istNull(skalarprodukt(falsch, a)),
    'die Gegenprobe greift nicht — dann prüft die Invariante oben nichts'
  );
});
