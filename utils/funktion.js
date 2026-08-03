// Was man über eine Funktion sagen kann — hergeleitet, nicht geraten.
//
// Der Graph zeigt, wie es aussieht. Diese Datei sagt, was daran wichtig
// ist: Nullstellen, Schnittpunkt mit der y-Achse, Steigung, Scheitel-
// punkt. Und zwar mit Begründung, nicht als Zahlenliste.
//
// Gerechnet wird über die Koeffizienten aus gleichung.js — also
// strukturell. Wer an drei Stellen misst und daraus auf eine Parabel
// schließt, wird von x⁴ an genau drei Punkten belogen.

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
} from './bruch.js';
import { zahl, auswerteExakt, auswerte, alsText as termAlsText } from './term.js';
import { gleichung, koeffizienten, gradVon, loese } from './gleichung.js';

// ---------------------------------------------------------------------
// Was für eine Funktion ist das?
// ---------------------------------------------------------------------

export function art(term, name = 'x') {
  const k = koeffizienten(term, name);
  if (k === null) {
    return 'anderes';
  }
  switch (gradVon(k)) {
    case 0:
      return 'konstant';
    case 1:
      return 'linear';
    case 2:
      return 'quadratisch';
    default:
      return 'polynom';
  }
}

// ---------------------------------------------------------------------
// Die einzelnen Angaben
// ---------------------------------------------------------------------

// Wo schneidet der Graph die y-Achse? Das ist schlicht f(0) — und
// deshalb die einzige Angabe, die man immer bekommt, sofern die Stelle
// überhaupt definiert ist.
export function yAchsenabschnitt(term, name = 'x') {
  try {
    return { wert: auswerteExakt(term, { [name]: bruch(0) }) };
  } catch (fehler) {
    return {
      fehlt: true,
      grund: fehler.irrational
        ? 'Der Wert bei 0 ist keine Bruchzahl.'
        : 'Bei x = 0 ist die Funktion nicht definiert.',
    };
  }
}

// Wo schneidet der Graph die x-Achse? Gesucht sind die Lösungen von
// f(x) = 0 — also genau das, was gleichung.js kann. Kein zweites
// Verfahren, keine zweite Fehlerquelle.
export function nullstellen(term, name = 'x') {
  const ergebnis = loese(gleichung(term, zahl(0)));

  switch (ergebnis.art) {
    case 'eindeutig':
    case 'mehrere':
      return { stellen: ergebnis.loesungen };
    case 'keine':
      return { stellen: [], grund: 'Der Graph schneidet die x-Achse nicht.' };
    case 'alle':
      return { stellen: [], alle: true, grund: 'Die Funktion ist überall null.' };
    default:
      return { stellen: [], unklar: true, grund: ergebnis.grund };
  }
}

// Steigung und y-Achsenabschnitt einer Geraden.
export function gerade(term, name = 'x') {
  const k = koeffizienten(term, name);
  if (k === null || gradVon(k) > 1) {
    return null;
  }
  return { steigung: k[1] ?? bruch(0), abschnitt: k[0] ?? bruch(0) };
}

// Der Scheitelpunkt einer Parabel.
//
// x_s = −b/(2a), y_s = f(x_s). Hergeleitet über die quadratische
// Ergänzung, nicht nachgeschlagen: Die Parabel ist symmetrisch zur
// Senkrechten durch ihren Scheitel, und die liegt genau in der Mitte
// zwischen den beiden Nullstellen — auch dann, wenn es gar keine gibt.
export function scheitelpunkt(term, name = 'x') {
  const k = koeffizienten(term, name);
  if (k === null || gradVon(k) !== 2) {
    return null;
  }

  const a = k[2];
  const b = k[1] ?? bruch(0);
  const x = negativ(geteilt(b, mal(bruch(2), a)));
  const y = auswerteExakt(term, { [name]: x });

  return {
    x,
    y,
    // Nach oben geöffnet heißt: der Scheitel ist der tiefste Punkt.
    geoeffnetNachOben: !istNegativ(a),
    art: istNegativ(a) ? 'Hochpunkt' : 'Tiefpunkt',
  };
}

// ---------------------------------------------------------------------
// Alles zusammen
// ---------------------------------------------------------------------

// Eine Beschreibung der Funktion in Sätzen — das, was auf dem
// Bildschirm steht.
export function beschreibe(term, name = 'x') {
  const welche = art(term, name);
  const angaben = [];

  const g = gerade(term, name);
  if (welche === 'linear' && g) {
    angaben.push({
      titel: 'Steigung',
      wert: bruchText(g.steigung),
      erklaerung:
        'Ein Schritt nach rechts bedeutet ' +
        (istNegativ(g.steigung)
          ? `${bruchText(mal(g.steigung, bruch(-1)))} nach unten.`
          : `${bruchText(g.steigung)} nach oben.`),
      wissen: 'steigung',
    });
  }

  if (welche === 'konstant') {
    angaben.push({
      titel: 'Waagerechte Gerade',
      wert: bruchText(g ? g.abschnitt : bruch(0)),
      erklaerung: 'Der Wert ändert sich nicht — für jedes x kommt dasselbe heraus.',
    });
  }

  const y0 = yAchsenabschnitt(term, name);
  angaben.push(
    y0.fehlt
      ? { titel: 'Schnittpunkt mit der y-Achse', wert: '—', erklaerung: y0.grund }
      : {
          titel: 'Schnittpunkt mit der y-Achse',
          wert: `(0 | ${bruchText(y0.wert)})`,
          erklaerung: `Man setzt x = 0 ein: f(0) = ${bruchText(y0.wert)}.`,
        }
  );

  const n = nullstellen(term, name);
  angaben.push({
    titel: n.stellen.length === 1 ? 'Nullstelle' : 'Nullstellen',
    wert:
      n.stellen.length > 0
        ? n.stellen.map((s) => `(${termAlsText(s)} | 0)`).join('   ')
        : '—',
    erklaerung:
      n.stellen.length > 0
        ? 'Dort ist f(x) = 0 — das ist genau die Gleichung, die dahintersteckt.'
        : n.grund,
    wissen: 'nullstelle',
  });

  const s = scheitelpunkt(term, name);
  if (s) {
    angaben.push({
      titel: `Scheitelpunkt (${s.art})`,
      wert: `(${bruchText(s.x)} | ${bruchText(s.y)})`,
      erklaerung: s.geoeffnetNachOben
        ? 'Die Parabel ist nach oben geöffnet — der Scheitel ist ihr tiefster Punkt.'
        : 'Die Parabel ist nach unten geöffnet — der Scheitel ist ihr höchster Punkt.',
      wissen: 'scheitelpunkt',
    });
  }

  return { art: welche, angaben };
}

// ---------------------------------------------------------------------
// Wertetabelle
// ---------------------------------------------------------------------

// Die Tabelle, die man im Heft anlegt, bevor man zeichnet. Stellen, an
// denen die Funktion nicht definiert ist, bekommen einen Strich statt
// einer erfundenen Zahl.
export function wertetabelle(term, name = 'x', { von = -3, bis = 3, schritt = 1 } = {}) {
  const zeilen = [];
  for (let x = von; x <= bis + 1e-9; x += schritt) {
    const gerundet = Math.round(x * 1e6) / 1e6;
    try {
      const y = auswerte(term, { [name]: gerundet });
      zeilen.push({ x: gerundet, y: Number.isFinite(y) ? y : null });
    } catch {
      zeilen.push({ x: gerundet, y: null });
    }
  }
  return zeilen;
}

// ---------------------------------------------------------------------

function bruchText(wert) {
  if (wert.n === 1) {
    return String(wert.z).replace('-', '−');
  }
  return `${String(wert.z).replace('-', '−')}/${wert.n}`;
}

export { bruchText };
