// Prüfungen fürs Integrieren.
//
// Die tragende Prüfung schreibt sich hier von selbst, weil Integrieren
// die Umkehrung des Ableitens ist:
//
//   Leitet man die Stammfunktion wieder ab, muss die Ausgangsfunktion
//   herauskommen.
//
// Das ist keine bequeme Abkürzung, sondern der stärkste Prüfstein, den
// es gibt — denn ableitung.js ist seinerseits gegen den
// Differenzenquotienten geprüft, also gegen die Definition. Damit hängt
// diese Prüfung an derselben Kette:
//
//   Integral  →  Ableitung  →  Differenzenquotient  →  Definition
//
// Dazu kommt eine zweite, davon UNABHÄNGIGE Kontrolle für das bestimmte
// Integral: der Vergleich mit numerischer Integration nach Simpson. Sie
// weiß nichts von Stammfunktionen und rechnet die Fläche direkt aus.
// Wären beide Wege über dieselbe Stammfunktion gelaufen, prüfte der
// Vergleich nichts — sie machten denselben Fehler.

import { pruefung, wahr, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, alsText as bruchAlsText, alsZahl } from '../utils/bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  quotient,
  wurzel,
  auswerte,
  alsText as termAlsText,
} from '../utils/term.js';
import { parseTerm } from '../utils/parser.js';
import { ableite } from '../utils/ableitung.js';
import {
  integriere,
  bestimmtesIntegral,
  flaeche,
  numerisch,
  alsRechenweg,
  REGELN,
} from '../utils/integral.js';

const x = variable('x');
const k = (n) => zahl(bruch(n));

const FUNKTIONEN = 90;

// ---------------------------------------------------------------------

pruefung('Die Grundregeln, jede einzeln', () => {
  const F = (text) => {
    const e = integriere(parseTerm(text));
    return e.art === 'stammfunktion' ? e.alsText : `UNKLAR: ${e.grund}`;
  };

  gleichText('Konstante', F('5'), '5x + C');
  gleichText('x', F('x'), '1/2 · x² + C');
  gleichText('Potenzregel rückwärts', F('x^3'), '1/4 · x⁴ + C');
  gleichText('Summe und Faktor', F('3x^2 + 5x'), 'x³ + 5/2 · x² + C');
  gleichText('negativer Exponent', F('1/x^2'), '−x⁻¹ + C');
  gleichText('Wurzel', F('√x'), '2/3 · x^(3/2) + C');
  gleichText('lineare Substitution', F('(2x+1)^3'), '1/8 · (2x + 1)⁴ + C');
});

pruefung('Das + C fehlt nie', () => {
  // Beim Ableiten fällt jede Konstante weg. Beim Integrieren weiß man
  // deshalb nicht, welche es war — es gibt nicht DIE Stammfunktion,
  // sondern unendlich viele. Wer das C weglässt, behauptet das
  // Gegenteil.
  for (const t of ['5', 'x', 'x^3', '3x^2 + 5x', '√x', '(2x+1)^3']) {
    const e = integriere(parseTerm(t));
    wahr(`${t}: + C steht da`, e.alsText.endsWith('+ C'), e.alsText);
  }

  const e = integriere(parseTerm('x^2'));
  wahr(
    'und die Konstante wird auch erklärt',
    e.schritte.some((s) => s.schluessel === 'konstanteC'),
    e.schritte.map((s) => s.schluessel).join(', ')
  );
});

pruefung('Die Lücke der Potenzregel bei n = −1', () => {
  // xⁿ⁺¹/(n+1) versagt bei n = −1: Der Nenner wäre null. Das ist keine
  // Schlamperei der Formel — 1:x hat tatsächlich eine Stammfunktion
  // ganz anderer Art. Raten wäre hier das Schlimmste.
  const e = integriere(parseTerm('1/x'));
  gleichText('wird abgelehnt', e.art, 'unklar');
  wahr('nennt die Division durch 0', e.grund.includes('durch 0'), e.grund);
  wahr('und nennt ln als richtige Antwort', e.grund.includes('ln'), e.grund);

  // Der Nachbarfall darf davon NICHT betroffen sein: 1 : x² ist x⁻²,
  // und dort ist der neue Exponent −1, nicht 0.
  const nachbar = integriere(parseTerm('1/x^2'));
  gleichText('1 : x² geht sehr wohl', nachbar.art, 'stammfunktion');
  gleichText('und ergibt', nachbar.alsText, '−x⁻¹ + C');
});

pruefung('Was diese Datei nicht kann, sagt sie', () => {
  const exponential = integriere(parseTerm('2^x'));
  gleichText('Variable im Exponenten', exponential.art, 'unklar');
  wahr('nennt die e-Funktion', exponential.grund.includes('e-Funktion'));

  // Es gibt keine Produktregel fürs Integrieren. Wo Ausmultiplizieren
  // hilft, wird es getan; wo nicht, wird es gesagt.
  const gehtDurchAusmultiplizieren = integriere(parseTerm('x*(x+1)'));
  gleichText('x · (x + 1) geht', gehtDurchAusmultiplizieren.art, 'stammfunktion');
  wahr(
    'und zwar durch Ausmultiplizieren',
    gehtDurchAusmultiplizieren.schritte.some((s) => s.schluessel === 'ausmultiplizieren')
  );

  const gehtNicht = integriere(produkt(x, wurzel(x)));
  gleichText('x · √x nicht', gehtNicht.art, 'unklar');
  wahr('nennt die partielle Integration', gehtNicht.grund.includes('partielle'), gehtNicht.grund);

  wirft('eine Zahl ist kein Term', () => integriere(3));
});

pruefung('Das bestimmte Integral und der Hauptsatz', () => {
  // ∫ von 0 bis 3 über x² ist 9 — und das C fällt weg, weil es in
  // beiden Klammern steht und sich aufhebt. Deshalb ist die Fläche
  // eindeutig, obwohl die Stammfunktion es nicht ist.
  const e = bestimmtesIntegral(parseTerm('x^2'), bruch(0), bruch(3));
  gleichText('Wert', bruchAlsText(e.wert), '9');
  gleichText('F(3)', bruchAlsText(e.oben), '9');
  gleichText('F(0)', bruchAlsText(e.unten), '0');

  const weg = alsRechenweg(parseTerm('x^2'), e).join('\n');
  wahr('der Weg zeigt das Einsetzen', weg.includes('F(3) − F(0)'), weg);

  // Von 1 bis 2 über x³: F = x⁴/4, also 4 − 1/4 = 15/4.
  const zweites = bestimmtesIntegral(parseTerm('x^3'), bruch(1), bruch(2));
  gleichText('∫₁² x³', bruchAlsText(zweites.wert), '15/4');
});

pruefung('Fläche ist NICHT dasselbe wie Integral', () => {
  // Der Fehler, den fast jeder einmal macht. ∫ von −1 bis 1 über x³ ist
  // null — die beiden Hälften heben sich auf. Fläche liegt dort
  // trotzdem, und zwar 1/2.
  const integral = bestimmtesIntegral(parseTerm('x^3'), bruch(-1), bruch(1));
  gleichText('das Integral ist null', bruchAlsText(integral.wert), '0');

  const f = flaeche(parseTerm('x^3'), bruch(-1), bruch(1), [0]);
  wahr('die Fläche ist es nicht', Math.abs(f.inhalt - 0.5) < 1e-6, String(f.inhalt));
  wahr('und die App weiß, dass das auseinandergeht', f.unterschied);
  gleichText('ein Abschnitt liegt unterhalb', f.abschnitte.filter((a) => a.unterhalb).length, 1);

  // Wo nichts unter der Achse liegt, stimmen beide überein — dann darf
  // die App auch nicht warnen.
  const oberhalb = flaeche(parseTerm('x^2'), bruch(0), bruch(2), []);
  wahr('bei x² von 0 bis 2 kein Unterschied', !oberhalb.unterschied);
});

pruefung('Jede Regel hat Namen, Satz und Formel', () => {
  for (const [id, r] of Object.entries(REGELN)) {
    wahr(`${id}: Name`, typeof r.name === 'string' && r.name.length > 3);
    wahr(`${id}: Satz`, typeof r.satz === 'string' && r.satz.length > 20);
    wahr(`${id}: Formel`, typeof r.formel === 'string' && r.formel.length > 3);
  }
});

// ---------------------------------------------------------------------
// Die tragende Prüfung
// ---------------------------------------------------------------------

function zufallsfunktion(naechste, tiefe) {
  if (tiefe <= 0) {
    return naechste(3) === 0 ? zahl(bruch(naechste(9) - 4)) : x;
  }
  switch (naechste(7)) {
    case 0:
      return summe(zufallsfunktion(naechste, tiefe - 1), zufallsfunktion(naechste, tiefe - 1));
    case 1:
      return produkt(zahl(bruch(naechste(9) - 4 || 2)), zufallsfunktion(naechste, tiefe - 1));
    case 2:
      return potenz(x, zahl(bruch(naechste(4) + 1)));
    case 3:
      // Negative Exponenten — aber nie −1, das ist die Lücke.
      return potenz(x, zahl(bruch(-(naechste(3) + 2))));
    case 4:
      // Lineare Substitution.
      return potenz(
        summe(produkt(zahl(bruch(naechste(4) + 2)), x), zahl(bruch(naechste(7) - 3))),
        zahl(bruch(naechste(3) + 2))
      );
    case 5:
      return wurzel(x);
    default:
      return quotient(zufallsfunktion(naechste, tiefe - 1), zahl(bruch(naechste(4) + 1)));
  }
}

pruefung('Ableiten der Stammfunktion ergibt die Ausgangsfunktion', () => {
  // Der Kreis schließt sich: Integrieren ist die Umkehrung des
  // Ableitens, also muss der Rückweg genau dorthin führen, wo man
  // losgegangen ist. Verglichen wird an Zahlenwerten, weil die
  // Schreibweise unterwegs anders werden darf — x⁻² und 1 : x² sind
  // derselbe Wert.
  const naechste = wuerfel(startwertFuer('integral-umkehrung'));
  let verglichen = 0;
  let fehler = null;

  for (let i = 0; i < FUNKTIONEN && fehler === null; i++) {
    const f = zufallsfunktion(naechste, 2);
    const F = integriere(f);
    if (F.art !== 'stammfunktion') {
      continue;
    }

    const zurueck = ableite(F.stammfunktion);
    if (zurueck.art !== 'ableitung') {
      fehler = `∫ ${termAlsText(f)} dx = ${F.alsText}, aber das lässt sich nicht wieder ableiten: ${zurueck.grund}`;
      break;
    }

    for (const stelle of [0.7, 1.3, 2.6, -1.8, 4.2]) {
      let soll;
      let ist;
      try {
        soll = auswerte(f, { x: stelle });
        ist = auswerte(zurueck.ableitung, { x: stelle });
      } catch {
        continue;
      }
      if (!Number.isFinite(soll) || !Number.isFinite(ist) || Math.abs(soll) > 1e6) {
        continue;
      }
      verglichen++;
      if (Math.abs(soll - ist) > 1e-7 * Math.max(1, Math.abs(soll))) {
        fehler =
          `f(x) = ${termAlsText(f)}\n  F(x) = ${F.alsText}\n` +
          `  F′(x) = ${termAlsText(zurueck.ableitung)}\n` +
          `  bei x = ${stelle}: f = ${soll}, F′ = ${ist}`;
        break;
      }
    }
  }

  wahr('der Rückweg führt zurück', fehler === null, fehler ?? undefined);
  wahr('es wurde wirklich verglichen', verglichen >= 200, `nur ${verglichen} Stellen`);
});

pruefung('Das bestimmte Integral stimmt mit der Fläche überein', () => {
  // Die zweite, unabhängige Kontrolle: Simpson weiß nichts von
  // Stammfunktionen. Stimmen beide überein, ist der Hauptsatz an dieser
  // Stelle bestätigt — und ein Fehler in der Stammfunktion fiele auf,
  // auch wenn er sich beim Ableiten zufällig aufhöbe.
  const naechste = wuerfel(startwertFuer('integral-simpson'));
  let verglichen = 0;
  let fehler = null;

  for (let i = 0; i < FUNKTIONEN && fehler === null; i++) {
    const f = zufallsfunktion(naechste, 2);
    // Grenzen im positiven Bereich — dort sind auch Wurzeln und
    // negative Exponenten definiert.
    const von = bruch(naechste(4) + 1);
    const bis = bruch(naechste(6) + 6);

    const e = bestimmtesIntegral(f, von, bis);
    if (e.art !== 'integral' && e.art !== 'gerundet') {
      continue;
    }

    const exakt = e.art === 'integral' ? alsZahl(e.wert) : e.wert;
    let simpson;
    try {
      simpson = numerisch(f, alsZahl(von), alsZahl(bis));
    } catch {
      continue;
    }
    if (!Number.isFinite(exakt) || !Number.isFinite(simpson) || Math.abs(exakt) > 1e9) {
      continue;
    }

    verglichen++;
    if (Math.abs(exakt - simpson) > 1e-4 * Math.max(1, Math.abs(exakt))) {
      fehler =
        `∫ von ${bruchAlsText(von)} bis ${bruchAlsText(bis)} über ${termAlsText(f)}:\n` +
        `  über die Stammfunktion ${exakt}, nach Simpson ${simpson}`;
    }
  }

  wahr('Hauptsatz und Fläche stimmen überein', fehler === null, fehler ?? undefined);
  wahr('es wurde wirklich verglichen', verglichen >= 40, `nur ${verglichen}`);
});

pruefung('Jede Regel kommt in den Zufallsproben auch vor', () => {
  const naechste = wuerfel(startwertFuer('integral-abdeckung'));
  const gesehen = new Set();

  for (let i = 0; i < 400; i++) {
    const e = integriere(zufallsfunktion(naechste, 2));
    if (e.art === 'stammfunktion') {
      for (const s of e.schritte) {
        gesehen.add(s.schluessel);
      }
    }
  }

  for (const regel of ['konstante', 'potenz', 'summe', 'faktor', 'alsPotenz', 'linear', 'konstanteC']) {
    wahr(`${regel} wird erreicht`, gesehen.has(regel), [...gesehen].join(', '));
  }
});

pruefung('Eine falsche Stammfunktion würde auffallen', () => {
  // Die Gegenprobe: der klassische Fehler, den Exponenten zu erhöhen,
  // aber das Teilen zu vergessen.
  const f = parseTerm('x^3');
  const richtig = integriere(f).stammfunktion;
  const ohneTeilen = parseTerm('x^4'); // richtig wäre x⁴ : 4

  const abRichtig = ableite(richtig).ableitung;
  const abFalsch = ableite(ohneTeilen).ableitung;

  gleichText('die richtige Stammfunktion führt zurück', termAlsText(abRichtig), 'x³');
  wahr(
    'die falsche nicht',
    termAlsText(abFalsch) !== 'x³',
    'die Gegenprobe greift nicht — dann prüft die Umkehrung oben nichts'
  );

  // Und das bestimmte Integral wäre entsprechend daneben.
  const echt = alsZahl(bestimmtesIntegral(f, bruch(0), bruch(2)).wert);
  const simpson = numerisch(f, 0, 2);
  wahr('Simpson bestätigt den richtigen Wert', Math.abs(echt - simpson) < 1e-6, `${echt} vs ${simpson}`);
  wahr('und der ist 4', Math.abs(echt - 4) < 1e-9, String(echt));
});
