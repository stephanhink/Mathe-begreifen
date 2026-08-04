// Vektorgeometrie — Vektoren, Geraden und ihre Lage zueinander.
//
// Ein Vektor ist hier eine PFEILRICHTUNG, kein Punkt. Der Unterschied
// klingt nach Wortklauberei und ist der häufigste Stolperstein des
// ganzen Gebiets: (3 | 4) als Punkt ist ein Ort, (3 | 4) als Vektor ist
// „drei nach rechts, vier nach oben" — und das darf überall im Raum
// stehen. Deshalb heißt der Stützvektor einer Geraden auch Stütz- und
// nicht Startpunkt: Er zeigt, WO man einsteigt, der Richtungsvektor,
// WOHIN es geht.
//
// Gerechnet wird exakt in Brüchen, so weit es geht:
//
//   Skalarprodukt und Kreuzprodukt sind Brüche — immer exakt.
//   Der Betrag ist eine Wurzel: |(3|4)| ist 5, |(1|1)| ist √2, und
//     √2 bleibt √2. Dieselbe Entscheidung wie in geometrie.js.
//   Der Winkel ist numerisch. cos φ = 1/2 gäbe genau 60°, aber
//     cos φ = 1/3 ist keine Zahl, die sich hinschreiben lässt.
//     Gerundet wird IN GRAD, und die Datei sagt es dazu — bis Klasse 10
//     rechnet man in Grad, ab der Oberstufe im Bogenmaß, und genau an
//     dieser Stelle geht viel verloren.

import {
  bruch,
  plus,
  minus,
  mal,
  geteilt,
  negativ,
  istNull,
  istNegativ,
  gleich as bruchGleich,
  alsZahl,
} from './bruch.js';
// zahlAlsText statt bruch.alsText: Nur das setzt das typografische
// Minus. "(1 | -1 | 0)" und "(1 | −1 | 0)" nebeneinander sehen nach
// Fehler aus, und dieselbe Regel gilt überall sonst in der App.
import {
  zahl,
  wurzel,
  vereinfache,
  auswerte,
  alsText as termAlsText,
  zahlAlsText,
} from './term.js';
import { GRAD_JE_BOGENMASS } from './konstanten.js';

// ---------------------------------------------------------------------
// Der Vektor
// ---------------------------------------------------------------------
//
// Zwei oder drei Komponenten — die Ebene und der Raum, mehr kommt in
// der Schule nicht vor. Eingefroren, damit niemand versehentlich einen
// Vektor verändert, der woanders noch gebraucht wird.

export function vektor(...komponenten) {
  if (komponenten.length !== 2 && komponenten.length !== 3) {
    throw new Error(
      `vektor: ${komponenten.length} Komponenten — hier gibt es nur die Ebene (2) und den Raum (3)`
    );
  }
  const werte = komponenten.map((k) => (typeof k === 'number' ? bruch(k) : k));
  for (const w of werte) {
    if (typeof w !== 'object' || w === null || typeof w.z !== 'number') {
      throw new Error('vektor: jede Komponente muss eine Zahl oder ein Bruch sein');
    }
  }
  return Object.freeze({ art: 'vektor', komponenten: Object.freeze(werte) });
}

export function istVektor(wert) {
  return typeof wert === 'object' && wert !== null && wert.art === 'vektor';
}

export function dimension(v) {
  pruefeVektor(v, 'dimension');
  return v.komponenten.length;
}

function pruefeVektor(v, wo) {
  if (!istVektor(v)) {
    throw new Error(`${wo}: das ist kein Vektor`);
  }
  return v;
}

function pruefeGleicheDimension(a, b, wo) {
  pruefeVektor(a, wo);
  pruefeVektor(b, wo);
  if (a.komponenten.length !== b.komponenten.length) {
    throw new Error(
      `${wo}: ein Vektor der Ebene und einer des Raums lassen sich nicht verrechnen ` +
        `(${a.komponenten.length} und ${b.komponenten.length} Komponenten)`
    );
  }
}

// So schreibt man ihn im Heft: senkrecht, in Klammern. Für eine Zeile
// im Fließtext gibt es alsZeile().
export function alsText(v) {
  pruefeVektor(v, 'alsText');
  return `(${v.komponenten.map(zahlAlsText).join(' | ')})`;
}

// ---------------------------------------------------------------------
// Rechnen
// ---------------------------------------------------------------------

export function addiere(a, b) {
  pruefeGleicheDimension(a, b, 'addiere');
  return vektor(...a.komponenten.map((k, i) => plus(k, b.komponenten[i])));
}

export function subtrahiere(a, b) {
  pruefeGleicheDimension(a, b, 'subtrahiere');
  return vektor(...a.komponenten.map((k, i) => minus(k, b.komponenten[i])));
}

// Ein Vektor mal einer Zahl: Er wird länger oder kürzer, die RICHTUNG
// bleibt — außer bei einer negativen Zahl, dann dreht er sich um.
export function strecke(v, faktor) {
  pruefeVektor(v, 'strecke');
  const f = typeof faktor === 'number' ? bruch(faktor) : faktor;
  return vektor(...v.komponenten.map((k) => mal(k, f)));
}

export function gegenvektor(v) {
  return strecke(v, bruch(-1));
}

// Der Verbindungsvektor von A nach B ist B − A. Die Reihenfolge ist
// genau andersherum, als man sie spricht — deshalb steht sie hier als
// eigene Funktion und nicht als Kommentar.
export function verbindung(vonPunkt, zuPunkt) {
  return subtrahiere(zuPunkt, vonPunkt);
}

// ---------------------------------------------------------------------
// Skalarprodukt
// ---------------------------------------------------------------------
//
// Das Ergebnis ist eine ZAHL, kein Vektor — daher der Name. Es ist
// exakt, weil nur multipliziert und addiert wird.
//
// Seine Bedeutung: Es ist genau dann null, wenn die beiden Vektoren
// senkrecht aufeinander stehen. Das ist der meistgebrauchte Satz der
// ganzen Vektorgeometrie.

export function skalarprodukt(a, b) {
  pruefeGleicheDimension(a, b, 'skalarprodukt');
  return a.komponenten.reduce((summe, k, i) => plus(summe, mal(k, b.komponenten[i])), bruch(0));
}

export function istOrthogonal(a, b) {
  return istNull(skalarprodukt(a, b));
}

// ---------------------------------------------------------------------
// Betrag
// ---------------------------------------------------------------------
//
// Die Länge des Pfeils, über Pythagoras. Exakt bis auf die Wurzel:
// |(3|4)| ist 5, |(1|1)| ist √2 — und √2 wird nicht zu 1,414 gerundet.
// Wer 1,414 sieht, weiß nicht, ob das exakt ist. Wer √2 sieht, weiß es.

export function betragQuadrat(v) {
  pruefeVektor(v, 'betragQuadrat');
  return skalarprodukt(v, v);
}

export function betrag(v) {
  const q = betragQuadrat(v);
  // Der Radikand ist ein Bruch; √(a/b) = √a : √b, und term.js zieht
  // heraus, was herauszuziehen ist.
  return vereinfache(wurzel(zahl(q))).term;
}

export function betragAlsZahl(v) {
  return Math.sqrt(alsZahl(betragQuadrat(v)));
}

export function betragAlsText(v) {
  return termAlsText(betrag(v));
}

// ---------------------------------------------------------------------
// Kreuzprodukt — nur im Raum
// ---------------------------------------------------------------------
//
// Das Ergebnis ist ein VEKTOR, und zwar einer, der auf beiden Ausgangs-
// vektoren senkrecht steht. Genau dafür braucht man es: als
// Normalenvektor einer Ebene.
//
// In der Ebene gibt es kein Kreuzprodukt — dort steht senkrecht auf
// zwei Vektoren nichts mehr, außer man verlässt die Ebene. Die Datei
// sagt das, statt eine dritte Komponente zu erfinden.

export function kreuzprodukt(a, b) {
  pruefeGleicheDimension(a, b, 'kreuzprodukt');
  if (a.komponenten.length !== 3) {
    throw new Error(
      'kreuzprodukt: gibt es nur im Raum. In der Ebene steht auf zwei Vektoren kein ' +
        'dritter mehr senkrecht, ohne die Ebene zu verlassen'
    );
  }
  const [a1, a2, a3] = a.komponenten;
  const [b1, b2, b3] = b.komponenten;
  return vektor(
    minus(mal(a2, b3), mal(a3, b2)),
    minus(mal(a3, b1), mal(a1, b3)),
    minus(mal(a1, b2), mal(a2, b1))
  );
}

// ---------------------------------------------------------------------
// Kollinear: zeigen sie in dieselbe Richtung?
// ---------------------------------------------------------------------
//
// Geprüft wird STRUKTURELL über die Verhältnisse, nicht über den Winkel
// — der wäre gerundet, und „179,9999°" ist keine Antwort auf eine
// Ja-Nein-Frage.

export function istKollinear(a, b) {
  pruefeGleicheDimension(a, b, 'istKollinear');
  if (istNullvektor(a) || istNullvektor(b)) {
    // Der Nullvektor hat keine Richtung. Ihn als kollinear zu allem zu
    // erklären ist Konvention und hier bewusst so: Er liegt auf jeder
    // Geraden.
    return true;
  }

  let faktor = null;
  for (let i = 0; i < a.komponenten.length; i++) {
    const ai = a.komponenten[i];
    const bi = b.komponenten[i];
    if (istNull(bi)) {
      if (!istNull(ai)) {
        return false;
      }
      continue;
    }
    const f = geteilt(ai, bi);
    if (faktor === null) {
      faktor = f;
    } else if (!bruchGleich(faktor, f)) {
      return false;
    }
  }
  return faktor !== null;
}

export function istNullvektor(v) {
  pruefeVektor(v, 'istNullvektor');
  return v.komponenten.every(istNull);
}

// ---------------------------------------------------------------------
// Winkel
// ---------------------------------------------------------------------
//
// cos φ = (a · b) : (|a| · |b|). Hier wird gerundet, und zwar sichtbar:
// `exakt: false` und die Einheit steht dabei.

export function winkel(a, b) {
  pruefeGleicheDimension(a, b, 'winkel');
  if (istNullvektor(a) || istNullvektor(b)) {
    return {
      art: 'unklar',
      grund:
        'Der Nullvektor hat keine Richtung — mit ihm lässt sich kein Winkel bilden. ' +
        'Er ist der einzige Vektor ohne eigene Richtung.',
    };
  }

  const zaehler = alsZahl(skalarprodukt(a, b));
  const nenner = betragAlsZahl(a) * betragAlsZahl(b);
  // Rundungsfehler können cos knapp über 1 treiben; acos gäbe dann NaN.
  const cos = Math.min(1, Math.max(-1, zaehler / nenner));
  const grad = Math.acos(cos) * GRAD_JE_BOGENMASS;

  return {
    art: 'winkel',
    grad: Math.round(grad * 1e6) / 1e6,
    bogenmass: Math.round(Math.acos(cos) * 1e9) / 1e9,
    cos,
    exakt: false,
    einheit: 'Grad',
    // Bei 90° ist das Skalarprodukt exakt null — dann ist die Aussage
    // "senkrecht" doch exakt, auch wenn die Gradzahl gerundet ist.
    rechterWinkel: istNull(skalarprodukt(a, b)),
  };
}

// ---------------------------------------------------------------------
// Geraden in Parameterform
// ---------------------------------------------------------------------
//
//     g: x = p + t · u
//
// p ist der Stützvektor (wo man einsteigt), u der Richtungsvektor
// (wohin es geht), t der Parameter (wie weit).

export function gerade(stuetz, richtung) {
  pruefeGleicheDimension(stuetz, richtung, 'gerade');
  if (istNullvektor(richtung)) {
    throw new Error(
      'gerade: der Richtungsvektor darf nicht der Nullvektor sein — sonst bewegt man ' +
        'sich nicht und es entsteht keine Gerade, sondern ein Punkt'
    );
  }
  return Object.freeze({ art: 'gerade', stuetz, richtung });
}

export function istGerade(wert) {
  return typeof wert === 'object' && wert !== null && wert.art === 'gerade';
}

export function geradeAlsText(g, name = 'g') {
  return `${name}: x = ${alsText(g.stuetz)} + t · ${alsText(g.richtung)}`;
}

export function punktAuf(g, t) {
  const parameter = typeof t === 'number' ? bruch(t) : t;
  return addiere(g.stuetz, strecke(g.richtung, parameter));
}

// Liegt der Punkt auf der Geraden? Gesucht ist ein t, das für ALLE
// Komponenten dasselbe ist — eine Komponente reicht nicht.
export function liegtAuf(g, punkt) {
  const d = subtrahiere(punkt, g.stuetz);
  let t = null;
  for (let i = 0; i < d.komponenten.length; i++) {
    const ri = g.richtung.komponenten[i];
    const di = d.komponenten[i];
    if (istNull(ri)) {
      if (!istNull(di)) {
        return { liegtDrauf: false, grund: `In der ${i + 1}. Zeile steht 0 · t = ${zahlAlsText(di)} — das geht nicht auf.` };
      }
      continue;
    }
    const kandidat = geteilt(di, ri);
    if (t === null) {
      t = kandidat;
    } else if (!bruchGleich(t, kandidat)) {
      return {
        liegtDrauf: false,
        grund: `Die Zeilen ergeben verschiedene t (${zahlAlsText(t)} und ${zahlAlsText(kandidat)}). Es muss ein EINZIGES t für alle Zeilen geben.`,
      };
    }
  }
  return { liegtDrauf: true, t: t ?? bruch(0) };
}

// ---------------------------------------------------------------------
// Die Lage zweier Geraden
// ---------------------------------------------------------------------
//
// Vier Fälle, und der vierte gibt es nur im Raum:
//
//   identisch    dieselbe Gerade, nur anders aufgeschrieben
//   parallel     gleiche Richtung, verschiedene Lage — nie ein Schnitt
//   schneidend   genau ein gemeinsamer Punkt
//   windschief   weder parallel noch schneidend
//
// Windschief ist der Fall, den es in der Ebene nicht gibt und den man
// deshalb nicht erwartet: Zwei Geraden im Raum können aneinander
// vorbeilaufen, ohne parallel zu sein. Ein Blick auf eine Zeichnung von
// oben zeigte einen Schnittpunkt — den es nicht gibt, weil die beiden
// in verschiedenen Höhen liegen.
//
// Entschieden wird über die RICHTUNGEN zuerst. Wer mit dem
// Gleichungssystem anfängt, muss die Sonderfälle hinterher doch noch
// von Hand auseinanderhalten.

export function lage(g, h) {
  pruefeGleicheDimension(g.richtung, h.richtung, 'lage');
  const parallelRichtung = istKollinear(g.richtung, h.richtung);

  if (parallelRichtung) {
    const drauf = liegtAuf(g, h.stuetz);
    if (drauf.liegtDrauf) {
      return {
        art: 'identisch',
        grund:
          'Die Richtungsvektoren sind Vielfache voneinander, und der Stützpunkt der ' +
          'zweiten Geraden liegt auf der ersten. Es ist dieselbe Gerade, nur anders ' +
          'aufgeschrieben.',
      };
    }
    return {
      art: 'parallel',
      grund:
        'Die Richtungsvektoren sind Vielfache voneinander, aber der Stützpunkt der ' +
        'zweiten Geraden liegt nicht auf der ersten. Die Geraden laufen nebeneinander ' +
        'her und treffen sich nie.',
    };
  }

  // Verschiedene Richtungen: Schnittpunkt suchen.
  //
  //   p + t·u = q + s·v   →   t·u − s·v = q − p
  //
  // Zwei Gleichungen bestimmen t und s, die übrigen müssen dann von
  // selbst aufgehen. Genau dort entscheidet sich schneidend gegen
  // windschief.
  const d = subtrahiere(h.stuetz, g.stuetz);
  const u = g.richtung.komponenten;
  const v = h.richtung.komponenten;

  for (let i = 0; i < u.length; i++) {
    for (let j = i + 1; j < u.length; j++) {
      const det = minus(mal(u[i], negativ(v[j])), mal(u[j], negativ(v[i])));
      if (istNull(det)) {
        continue;
      }
      const t = geteilt(
        minus(mal(d.komponenten[i], negativ(v[j])), mal(d.komponenten[j], negativ(v[i]))),
        det
      );
      const s = geteilt(minus(mal(u[i], d.komponenten[j]), mal(u[j], d.komponenten[i])), det);

      const aufG = punktAuf(g, t);
      const aufH = punktAuf(h, s);
      const gleich = aufG.komponenten.every((k, n) => bruchGleich(k, aufH.komponenten[n]));

      if (gleich) {
        return {
          art: 'schneidend',
          punkt: aufG,
          t,
          s,
          grund: `Es gibt genau ein Paar (t | s), das beide Geraden zum selben Punkt führt: t = ${zahlAlsText(t)}, s = ${zahlAlsText(s)}.`,
        };
      }
      return {
        art: 'windschief',
        grund:
          'Die Richtungen sind verschieden, aber die Geraden treffen sich trotzdem ' +
          'nicht: Aus zwei Zeilen ergibt sich ein Parameterpaar, das die dritte Zeile ' +
          'nicht erfüllt. Das gibt es nur im Raum — in der Ebene müssten sich zwei ' +
          'Geraden mit verschiedenen Richtungen schneiden.',
      };
    }
  }

  return {
    art: 'unklar',
    grund: 'Die Lage lässt sich mit diesen Vektoren nicht bestimmen.',
  };
}
