// Prüfungen für die Geometrie.
//
// Aus CLAUDE.md, unter "Was die Prüfungen ablehnen müssen":
//
//   … ein Dreieck mit Winkelsumme ≠ 180° … Jedes davon muss einen
//   Fehler werfen oder ausdrücklich „gibt es nicht" sagen — nie eine
//   Zahl raten.
//
// Genau darauf zielt der größere Teil hier. Ein Dreieck mit c = 3 und
// a = 5 gibt es nicht: Die Hypotenuse ist die längste Seite. Wer
// stattdessen √(9 − 25) rechnet, bekommt eine Zahl, die nichts bedeutet.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { bruch, alsText as bruchAlsText } from '../utils/bruch.js';
import {
  pythagoras,
  rechtwinkligesDreieck,
  berechneForm,
  FORMEN,
  zahlText,
} from '../utils/geometrie.js';

const NAHE = 1e-9;
const ungefaehr = (a, b) => Math.abs(a - b) < 1e-6;

// ---------------------------------------------------------------------
// Pythagoras
// ---------------------------------------------------------------------

pruefung('Der Satz des Pythagoras', () => {
  // Das Standardbeispiel — und es geht auf.
  const e = pythagoras({ a: 3, b: 4 });
  gleichText('3 und 4 ergeben 5', e.ergebnisText, '5');
  gleichText('gesucht war c', e.gesucht, 'c');
  wahr('und das Ergebnis ist exakt', e.exakt);
  wahr('der erste Schritt nennt den Satz', e.schritte[0].text.includes('a² + b² = c²'));

  // Eine Kathete fehlt.
  gleichText('c = 13, b = 12 → a = 5', pythagoras({ b: 12, c: 13 }).ergebnisText, '5');
  gleichText('c = 5, a = 3 → b = 4', pythagoras({ a: 3, c: 5 }).ergebnisText, '4');
});

pruefung('Was nicht aufgeht, bleibt exakt', () => {
  // Der Kern: √13 ist die Antwort, 3,606 ist ihre Näherung. Wer 3,606
  // sieht, weiß nicht, ob das exakt ist.
  const e = pythagoras({ a: 2, b: 3 });
  gleichText('√13', e.ergebnisText, '√13');
  wahr('und das ist nicht exakt darstellbar', !e.exakt);
  wahr('die Näherung stimmt', ungefaehr(e.naeherung, Math.sqrt(13)));

  // Teilweises Wurzelziehen kommt aus term.js — kein zweites Verfahren.
  gleichText('a = 6, b = 6 → 6√2', pythagoras({ a: 6, b: 6 }).ergebnisText, '6√2');

  // Auch mit Brüchen und Kommazahlen.
  gleichText('0,3 und 0,4 ergeben 1/2', pythagoras({ a: 0.3, b: 0.4 }).ergebnisText, '1/2');
});

pruefung('Dreiecke, die es nicht gibt', () => {
  // Die Hypotenuse ist die längste Seite. Alles andere ist kein
  // rechtwinkliges Dreieck — und √(9 − 25) wäre eine Zahl ohne Bedeutung.
  wirft('Hypotenuse kürzer als die Kathete', () => pythagoras({ a: 5, c: 3 }));
  wirft('Hypotenuse gleich der Kathete', () => pythagoras({ a: 5, c: 5 }));

  wirft('negative Länge', () => pythagoras({ a: -3, b: 4 }));
  wirft('Länge null', () => pythagoras({ a: 0, b: 4 }));
  wirft('keine Zahl', () => pythagoras({ a: 'drei', b: 4 }));

  wirft('nur eine Seite', () => pythagoras({ a: 3 }));
  wirft('alle drei angegeben', () => pythagoras({ a: 3, b: 4, c: 5 }));

  // Die Meldung sagt, WAS nicht stimmt.
  let meldung = '';
  try {
    pythagoras({ a: 5, c: 3 });
  } catch (f) {
    meldung = f.message;
  }
  wahr('mit Begründung', meldung.includes('längste Seite'));
  wahr('und den konkreten Zahlen', meldung.includes('5') && meldung.includes('3'));
});

// ---------------------------------------------------------------------
// Rechtwinklige Dreiecke mit Winkeln
// ---------------------------------------------------------------------

pruefung('Aus zwei Seiten', () => {
  const d = rechtwinkligesDreieck({ a: 3, b: 4 });
  wahr('c ist 5', ungefaehr(d.c, 5));
  wahr('α ist etwa 36,87°', ungefaehr(d.alpha, 36.8698976));
  wahr('β ergänzt zu 90°', ungefaehr(d.alpha + d.beta, 90));
  zahlIst('γ ist der rechte Winkel', d.gamma, 90);

  // Die Winkelsumme muss stimmen — die Regel aus dem Konzept.
  wahr('die Winkelsumme ist 180°', ungefaehr(d.alpha + d.beta + d.gamma, 180));

  wahr('der Weg nennt den Sinus', d.schritte.some((s) => s.regel.includes('sin α')));
  wahr('und die Winkelsumme', d.schritte.some((s) => s.regel.includes('Winkelsumme')));
});

pruefung('Aus einer Seite und einem Winkel', () => {
  // Das 30-60-90-Dreieck: Bei α = 30° ist die Gegenkathete halb so lang
  // wie die Hypotenuse.
  const d = rechtwinkligesDreieck({ c: 10, alpha: 30 });
  wahr('a ist die Hälfte von c', ungefaehr(d.a, 5));
  wahr('b ist 10 · cos 30°', ungefaehr(d.b, 10 * Math.cos(Math.PI / 6)));
  wahr('β ist 60°', ungefaehr(d.beta, 60));

  // Von der Gegenkathete aus.
  const ausA = rechtwinkligesDreieck({ a: 5, alpha: 30 });
  wahr('c ist 10', ungefaehr(ausA.c, 10));

  // Von der Ankathete aus.
  const ausB = rechtwinkligesDreieck({ b: 4, alpha: 45 });
  wahr('bei 45° sind beide Katheten gleich', ungefaehr(ausB.a, 4));
  wahr('und c ist 4√2', ungefaehr(ausB.c, 4 * Math.SQRT2));
});

pruefung('Winkel, die es im rechtwinkligen Dreieck nicht gibt', () => {
  // Die Winkelsumme ist 180°, der rechte Winkel nimmt 90° davon. Für
  // die anderen beiden bleiben zusammen 90° — jeder einzelne muss also
  // dazwischen liegen.
  wirft('α = 90°', () => rechtwinkligesDreieck({ c: 10, alpha: 90 }));
  wirft('α = 120°', () => rechtwinkligesDreieck({ c: 10, alpha: 120 }));
  wirft('α = 0°', () => rechtwinkligesDreieck({ c: 10, alpha: 0 }));
  wirft('α negativ', () => rechtwinkligesDreieck({ c: 10, alpha: -30 }));

  let meldung = '';
  try {
    rechtwinkligesDreieck({ c: 10, alpha: 120 });
  } catch (f) {
    meldung = f.message;
  }
  wahr('die Meldung nennt die Winkelsumme', meldung.includes('Winkelsumme'));

  // Auch hier: Die Hypotenuse ist die längste Seite.
  wirft('c kleiner als a', () => rechtwinkligesDreieck({ a: 8, c: 5 }));
  wirft('c kleiner als b', () => rechtwinkligesDreieck({ b: 8, c: 5 }));

  // Aus Winkeln allein folgt die Form, nicht die Größe.
  wirft('nur ein Winkel', () => rechtwinkligesDreieck({ alpha: 30 }));
  wirft('gar nichts', () => rechtwinkligesDreieck({}));
  wirft('nur eine Seite', () => rechtwinkligesDreieck({ c: 10 }));
});

pruefung('Bei Winkeln wird gerundet, und das steht dabei', () => {
  // sin 37° lässt sich nicht hinschreiben. Eine App, die das
  // verschweigt, täuscht eine Genauigkeit vor, die sie nicht hat.
  const d = rechtwinkligesDreieck({ c: 10, alpha: 37 });
  wahr('das Ergebnis ist als gerundet gekennzeichnet', d.gerundet === true);

  // Gegenprobe: Die berechneten Seiten müssen den Pythagoras erfüllen.
  wahr('a² + b² = c²', ungefaehr(d.a * d.a + d.b * d.b, d.c * d.c));
});

pruefung('Die Gegenprobe für viele Dreiecke', () => {
  // Für jede Kombination aus Seite und Winkel: Das Ergebnis muss in
  // sich stimmig sein — Pythagoras erfüllt, Winkelsumme 180°.
  let fehler = null;

  for (let alpha = 5; alpha <= 85 && fehler === null; alpha += 5) {
    for (const c of [1, 7, 12.5, 100]) {
      const d = rechtwinkligesDreieck({ c, alpha });

      if (!ungefaehr(d.a * d.a + d.b * d.b, d.c * d.c)) {
        fehler = `c=${c}, α=${alpha}°: Pythagoras stimmt nicht`;
        break;
      }
      if (!ungefaehr(d.alpha + d.beta + d.gamma, 180)) {
        fehler = `c=${c}, α=${alpha}°: Winkelsumme ist ${d.alpha + d.beta + d.gamma}°`;
        break;
      }
      // Und die Hypotenuse muss wirklich die längste Seite sein.
      if (d.c < d.a || d.c < d.b) {
        fehler = `c=${c}, α=${alpha}°: die Hypotenuse ist nicht die längste Seite`;
        break;
      }
    }
  }

  wahr('jedes berechnete Dreieck ist in sich stimmig', fehler === null, fehler ?? undefined);
});

// ---------------------------------------------------------------------
// Flächen und Umfänge
// ---------------------------------------------------------------------

pruefung('Flächen', () => {
  const r = berechneForm('rechteck', { a: 5, b: 3 });
  gleichText('Rechteck 5 × 3', bruchAlsText(r.flaeche), '15');
  gleichText('Umfang', bruchAlsText(r.umfang), '16');
  wahr('mit Rechenweg', r.flaecheSchritt.includes('5') && r.flaecheSchritt.includes('3'));

  gleichText('Quadrat mit a = 4', bruchAlsText(berechneForm('quadrat', { a: 4 }).flaeche), '16');
  gleichText('Dreieck g = 6, h = 4', bruchAlsText(berechneForm('dreieck', { g: 6, h: 4 }).flaeche), '12');
  gleichText(
    'Trapez a = 5, c = 3, h = 4',
    bruchAlsText(berechneForm('trapez', { a: 5, c: 3, h: 4 }).flaeche),
    '16'
  );

  // Halbe Zahlen bleiben exakt: 1/2 · 5 · 3 ist 15/2, nicht 7,5.
  gleichText('Dreieck g = 5, h = 3', bruchAlsText(berechneForm('dreieck', { g: 5, h: 3 }).flaeche), '15/2');
});

pruefung('Beim Kreis bleibt π stehen', () => {
  // Der Flächeninhalt eines Kreises mit r = 3 ist 9π. Die Kommazahl
  // steht daneben, nicht anstelle — sonst wüsste niemand, ob 28,27
  // gerundet ist.
  const k = berechneForm('kreis', { r: 3 });
  gleichText('9π', bruchAlsText(k.flaeche), '9');
  wahr('als π-Vielfaches gekennzeichnet', k.mitPi === true);
  wahr('der Schritt zeigt das π', k.flaecheSchritt.includes('π'));
  wahr('und die Kommazahl stimmt', ungefaehr(k.flaecheZahl, 9 * Math.PI));

  gleichText('Umfang 2πr = 6π', bruchAlsText(k.umfang), '6');
  wahr('als Zahl', ungefaehr(k.umfangZahl, 6 * Math.PI));
});

pruefung('Wo kein Umfang berechenbar ist, wird keiner behauptet', () => {
  // Aus Grundseite und Höhe folgt der Flächeninhalt, aber nicht der
  // Umfang — dafür bräuchte man alle drei Seiten. Eine Zahl zu nennen
  // wäre geraten.
  const d = berechneForm('dreieck', { g: 6, h: 4 });
  wahr('das Dreieck liefert keinen Umfang', d.umfang === null);
  wahr('und sagt warum', FORMEN.dreieck.hinweis.includes('drei Seiten'));

  const p = berechneForm('parallelogramm', { g: 6, h: 4 });
  wahr('das Parallelogramm auch nicht', p.umfang === null);
  wahr('mit Hinweis auf die Höhe', FORMEN.parallelogramm.hinweis.includes('NICHT die Seitenlänge'));
});

pruefung('Was bei Flächen abgelehnt wird', () => {
  wirft('negative Seite', () => berechneForm('rechteck', { a: -5, b: 3 }));
  wirft('Seite null', () => berechneForm('rechteck', { a: 0, b: 3 }));
  wirft('fehlende Angabe', () => berechneForm('rechteck', { a: 5 }));
  wirft('unbekannte Form', () => berechneForm('fuenfeck', { a: 5 }));
  wirft('Text statt Zahl', () => berechneForm('quadrat', { a: 'groß' }));
});

pruefung('Jede Form ist vollständig beschrieben', () => {
  for (const [id, form] of Object.entries(FORMEN)) {
    wahr(`${id}: hat einen Titel`, Boolean(form.titel));
    wahr(`${id}: hat Felder`, Array.isArray(form.felder) && form.felder.length > 0);
    wahr(`${id}: hat eine Flächenformel`, Boolean(form.flaecheFormel));
    for (const feld of form.felder) {
      wahr(`${id}: Feld "${feld.id}" hat eine Beschriftung`, Boolean(feld.label));
    }
    // Und sie muss sich mit lauter Einsen rechnen lassen.
    const eingaben = {};
    for (const feld of form.felder) {
      eingaben[feld.id] = 2;
    }
    const e = berechneForm(id, eingaben);
    wahr(`${id}: liefert eine Fläche`, e.flaeche !== null && e.flaecheZahl > 0);
  }
});

pruefung('Zahlen tragen das richtige Minus und Komma', () => {
  gleichText('Bruch', zahlText(bruch(15, 2)), '15/2');
  gleichText('ganze Zahl', zahlText(bruch(-3)), '−3');
  gleichText('Kommazahl mit Komma', zahlText(3.5), '3,5');
  gleichText('negative Kommazahl', zahlText(-3.5), '−3,5');
});
