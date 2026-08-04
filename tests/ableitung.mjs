// Prüfungen für das Ableiten.
//
// Die tragende Prüfung ist hier die schönste im ganzen Projekt, weil
// sie nicht eine Regel prüft, sondern DIE DEFINITION:
//
//   Die Ableitung ist die Steigung der Tangente, und die ist der
//   Grenzwert des Differenzenquotienten. Also muss für jede Funktion
//   und an jeder Stelle gelten:
//
//       f′(x)  ≈  (f(x + h) − f(x − h)) / (2h)   für kleines h
//
// Das ist unabhängig von jeder Regel. Wäre die Potenzregel falsch
// abgeschrieben, die Kettenregel verdreht oder ein Vorzeichen vertauscht
// — der Vergleich mit dem Differenzenquotienten fiele sofort auf, weil
// er gar nichts von Regeln weiß.
//
// Benutzt wird der SYMMETRISCHE Differenzenquotient, nicht der
// einseitige aus dem Schulbuch. Sein Fehler ist von der Ordnung h²
// statt h; bei h = 1e-5 sind das etwa zehn genaue Stellen statt fünf.
// Mit dem einseitigen wäre die Toleranz so weit, dass echte Fehler
// durchrutschten.

import { pruefung, wahr, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, alsText as bruchAlsText } from '../utils/bruch.js';
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
import { parseTerm } from '../utils/parser.js';
import {
  ableite,
  ableiteMehrfach,
  tangente,
  steigungBei,
  alsRechenweg,
  REGELN,
} from '../utils/ableitung.js';

const x = variable('x');
const k = (n) => zahl(bruch(n));

const H = 1e-5;
const FUNKTIONEN = 90;
const STELLEN = 40;

// ---------------------------------------------------------------------

pruefung('Die Grundregeln, jede einzeln', () => {
  const ab = (text) => {
    const e = ableite(parseTerm(text));
    return e.art === 'ableitung' ? termAlsText(e.ableitung) : `UNKLAR: ${e.grund}`;
  };

  gleichText('Konstantenregel', ab('7'), '0');
  gleichText('Ableitung von x', ab('x'), '1');
  gleichText('Potenzregel', ab('x^3'), '3x²');
  gleichText('Faktorregel', ab('5x'), '5');
  gleichText('Summenregel', ab('3x^2 + 5x'), '6x + 5');
  gleichText('das klassische Beispiel', ab('x^3 - 6x^2 + 8x'), '3x² − 12x + 8');
});

pruefung('Die Kettenregel — und was ohne sie herauskäme', () => {
  // (2x + 1)³ — die innere Ableitung ist 2. Wer sie vergisst, bekommt
  // 3(2x+1)² = 12x² + 12x + 3 statt 24x² + 24x + 6. Also genau die
  // Hälfte, und das fällt bei einer Probe sofort auf.
  const e = ableite(parseTerm('(2x+1)^3'));
  gleichText('mit innerer Ableitung', termAlsText(e.ableitung), '24x² + 24x + 6');

  const regeln = e.schritte.map((s) => s.schluessel);
  wahr('die Kettenregel wird benannt', regeln.includes('kette'), regeln.join(', '));

  // Die halbe Antwort ist die, die man ohne innere Ableitung bekäme.
  const halb = auswerte(e.ableitung, { x: 2 }) / 2;
  gleichText('ohne sie käme genau die Hälfte heraus', halb, 3 * (2 * 2 + 1) ** 2);
});

pruefung('Wurzeln und Brüche werden als POTENZ geschrieben', () => {
  // Das ist der Punkt, an dem der ganze Lernpfad hängt: Wer x⁻¹ und
  // x^(1/2) nicht versteht, versteht diese Ableitungen nicht — und
  // glaubt, er verstehe „Ableitungen" nicht.
  const wurzelAb = ableite(parseTerm('√x'));
  gleichText('√x', termAlsText(wurzelAb.ableitung), '1/2 · x^(−1/2)');
  wahr(
    'und das Umschreiben steht als eigener Schritt da',
    wurzelAb.schritte.some((s) => s.schluessel === 'alsPotenz'),
    wurzelAb.schritte.map((s) => s.schluessel).join(', ')
  );

  const bruchAb = ableite(parseTerm('1/x'));
  gleichText('1 : x', termAlsText(bruchAb.ableitung), '−x⁻²');
  wahr(
    'auch hier wird umgeschrieben',
    bruchAb.schritte.some((s) => s.schluessel === 'alsPotenz')
  );
});

pruefung('Produkt- und Quotientenregel', () => {
  const p = ableite(parseTerm('x^2 * (x+1)'));
  gleichText('x² · (x + 1)', termAlsText(p.ableitung), '3x² + 2x');

  const q = ableite(parseTerm('(x+1)/(x-1)'));
  gleichText('(x + 1) : (x − 1)', termAlsText(q.ableitung), '−2 : (x² − 2x + 1)');
  wahr(
    'die Quotientenregel wird benannt',
    q.schritte.some((s) => s.schluessel === 'quotient')
  );

  // Durch eine ZAHL zu teilen ist keine Quotientenregel, sondern die
  // Faktorregel. Das ist der häufigste unnötige Rechenweg im Unterricht.
  const durchZahl = ableite(parseTerm('x^2/4'));
  wahr(
    'x² : 4 braucht keine Quotientenregel',
    !durchZahl.schritte.some((s) => s.schluessel === 'quotient'),
    durchZahl.schritte.map((s) => s.schluessel).join(', ')
  );
});

pruefung('Was diese Datei nicht kann, sagt sie', () => {
  const exponential = ableite(parseTerm('2^x'));
  gleichText('Variable im Exponenten', exponential.art, 'unklar');
  wahr('und nennt den Grund', exponential.grund.includes('EXPONENTEN'), exponential.grund);

  const mitBetrag = ableite(betrag(x));
  gleichText('Betrag', mitBetrag.art, 'unklar');
  wahr('nennt den Knick', mitBetrag.grund.includes('Knick'), mitBetrag.grund);

  const zweiVariablen = ableite(summe(x, variable('y')));
  gleichText('zwei Variablen', zweiVariablen.art, 'unklar');

  wirft('eine Zahl ist kein Term', () => ableite(3));
});

pruefung('Höhere Ableitungen', () => {
  const f = parseTerm('x^3 - 6x^2 + 8x');
  gleichText('f′', termAlsText(ableiteMehrfach(f, 1).ableitung), '3x² − 12x + 8');
  gleichText('f″', termAlsText(ableiteMehrfach(f, 2).ableitung), '6x − 12');
  gleichText('f‴', termAlsText(ableiteMehrfach(f, 3).ableitung), '6');
  gleichText('f⁗', termAlsText(ableiteMehrfach(f, 4).ableitung), '0');
  wirft('Ordnung 0 gibt es nicht', () => ableiteMehrfach(f, 0));
});

pruefung('Die Tangente schmiegt sich an', () => {
  // f(x) = x², bei x₀ = 2: f(2) = 4, f′(2) = 4 → y = 4x − 4
  const t = tangente(parseTerm('x^2'), bruch(2));
  gleichText('Steigung', bruchAlsText(t.steigung), '4');
  gleichText('Berührpunkt', bruchAlsText(t.beruehrpunkt), '4');
  gleichText('als Term', termAlsText(t.term), '4x − 4');

  // Am Berührpunkt müssen Kurve und Tangente denselben Wert haben —
  // das ist die Bedingung, die die Tangente überhaupt definiert.
  gleichText('sie berührt die Kurve', auswerte(t.term, { x: 2 }), 4);

  // Und daneben liegt sie darunter, weil x² nach oben gekrümmt ist.
  wahr('und liegt daneben darunter', auswerte(t.term, { x: 3 }) < auswerte(parseTerm('x^2'), { x: 3 }));

  const s = steigungBei(parseTerm('x^2'), bruch(3));
  gleichText('Steigung bei x = 3', bruchAlsText(s.wert), '6');
});

pruefung('Der Rechenweg nennt jede Regel', () => {
  const f = parseTerm('3x^2 + 5x');
  const weg = alsRechenweg(f, ableite(f)).join('\n');
  wahr('fängt bei f(x) an', weg.startsWith('f(x) = 3x² + 5x'), weg);
  wahr('nennt die Summenregel', weg.includes('Summenregel'), weg);
  wahr('nennt die Potenzregel', weg.includes('Potenzregel'), weg);
  wahr('und endet bei f′(x)', weg.includes("f′(x) = 6x + 5"), weg);

  // Jede Regel hat einen Namen, einen Satz und eine Formel — sonst ist
  // sie im Info-Fenster nicht zu gebrauchen.
  for (const [id, r] of Object.entries(REGELN)) {
    wahr(`${id}: hat einen Namen`, typeof r.name === 'string' && r.name.length > 3);
    wahr(`${id}: hat einen Satz`, typeof r.satz === 'string' && r.satz.length > 20);
    wahr(`${id}: hat eine Formel`, typeof r.formel === 'string' && r.formel.length > 3);
  }
});

// ---------------------------------------------------------------------
// Die tragende Prüfung: gegen die Definition
// ---------------------------------------------------------------------

// Zufällige Funktionen — aber gezielt so gebaut, dass jede Regel auch
// wirklich vorkommt. Ein Zufallstest, der den geprüften Code nicht
// erreicht, gibt falsche Sicherheit; das steht als Warnung in CLAUDE.md
// und gilt hier genauso.
function zufallsfunktion(naechste, tiefe) {
  if (tiefe <= 0) {
    return naechste(3) === 0 ? zahl(bruch(naechste(9) - 4)) : x;
  }
  switch (naechste(8)) {
    case 0:
      return summe(zufallsfunktion(naechste, tiefe - 1), zufallsfunktion(naechste, tiefe - 1));
    case 1:
      return produkt(zahl(bruch(naechste(9) - 4 || 2)), zufallsfunktion(naechste, tiefe - 1));
    case 2:
      // Potenzregel mit reiner Variablen.
      return potenz(x, zahl(bruch(naechste(4) + 1)));
    case 3:
      // Kettenregel: zusammengesetzte Basis.
      return potenz(summe(produkt(zahl(bruch(naechste(5) - 2 || 2)), x), zahl(bruch(naechste(7) - 3))), zahl(bruch(naechste(3) + 2)));
    case 4:
      // Produktregel: zwei veränderliche Faktoren.
      return produkt(
        summe(x, zahl(bruch(naechste(7) - 3))),
        summe(produkt(zahl(bruch(2)), x), zahl(bruch(naechste(7) - 3)))
      );
    case 5:
      // Quotientenregel mit veränderlichem Nenner.
      return quotient(
        summe(x, zahl(bruch(naechste(5) - 2))),
        summe(x, zahl(bruch(naechste(5) + 3)))
      );
    case 6:
      // Wurzel — wird als Potenz mit Bruchexponent abgeleitet.
      return wurzel(summe(produkt(zahl(bruch(2)), x), zahl(bruch(naechste(4) + 5))));
    default:
      return produkt(zufallsfunktion(naechste, tiefe - 1), zahl(bruch(naechste(5) + 1)));
  }
}

// Ist der Wert an dieser Stelle brauchbar? Definitionslücken und
// riesige Werte werden übersprungen — dort misst der
// Differenzenquotient Rundung statt Steigung.
function brauchbar(...werte) {
  return werte.every((w) => Number.isFinite(w) && Math.abs(w) < 1e6);
}

pruefung('Die Ableitung stimmt mit dem Differenzenquotienten überein', () => {
  const naechste = wuerfel(startwertFuer('ableitung-definition'));
  let verglichen = 0;
  let fehler = null;

  for (let i = 0; i < FUNKTIONEN && fehler === null; i++) {
    const f = zufallsfunktion(naechste, 2);
    const e = ableite(f);
    if (e.art !== 'ableitung') {
      continue;
    }

    for (let p = 0; p < STELLEN && fehler === null; p++) {
      const stelle = (naechste(2001) - 1000) / 100;

      let links;
      let rechts;
      let symbolisch;
      try {
        links = auswerte(f, { x: stelle - H });
        rechts = auswerte(f, { x: stelle + H });
        symbolisch = auswerte(e.ableitung, { x: stelle });
      } catch {
        continue;
      }
      if (!brauchbar(links, rechts, symbolisch)) {
        continue;
      }

      const numerisch = (rechts - links) / (2 * H);
      if (!brauchbar(numerisch)) {
        continue;
      }

      verglichen++;
      const schranke = 1e-4 * Math.max(1, Math.abs(symbolisch), Math.abs(numerisch));
      if (Math.abs(symbolisch - numerisch) > schranke) {
        fehler =
          `f(x) = ${termAlsText(f)}\n  f′(x) = ${termAlsText(e.ableitung)}\n` +
          `  bei x = ${stelle}: symbolisch ${symbolisch}, Differenzenquotient ${numerisch}`;
      }
    }
  }

  wahr('die Ableitung ist die Steigung', fehler === null, fehler ?? undefined);
  wahr('es wurde wirklich verglichen', verglichen >= 1500, `nur ${verglichen} Stellen`);
});

pruefung('Jede Regel kommt in den Zufallsproben auch vor', () => {
  // Ohne diese Kontrolle wäre die Prüfung oben eine rote Lampe ohne
  // Schalter: Sie kann nur finden, was der Generator auch erzeugt.
  const naechste = wuerfel(startwertFuer('ableitung-abdeckung'));
  const gesehen = new Set();

  for (let i = 0; i < 400; i++) {
    const e = ableite(zufallsfunktion(naechste, 2));
    if (e.art === 'ableitung') {
      for (const s of e.schritte) {
        gesehen.add(s.schluessel);
      }
    }
  }

  for (const regel of ['konstante', 'variable', 'summe', 'faktor', 'potenz', 'produkt', 'quotient', 'kette', 'alsPotenz']) {
    wahr(`${regel} wird von den Zufallsproben erreicht`, gesehen.has(regel), [...gesehen].join(', '));
  }
});

pruefung('Die Tangente berührt — auch bei Zufallsfunktionen', () => {
  // Zwei Bedingungen machen eine Tangente aus, und beide werden
  // geprüft: Sie trifft die Kurve am Berührpunkt, und sie hat dort
  // dieselbe Steigung. Eine Gerade, die nur den Punkt trifft, ist eine
  // Sekante — der Unterschied ist genau die Ableitung.
  const naechste = wuerfel(startwertFuer('ableitung-tangente'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < FUNKTIONEN && fehler === null; i++) {
    const f = zufallsfunktion(naechste, 2);
    const stelle = bruch(naechste(21) - 10, 2);

    let t;
    try {
      t = tangente(f, stelle);
    } catch {
      continue;
    }
    if (t.art !== 'tangente') {
      continue;
    }

    const wo = stelle.z / stelle.n;
    const aufKurve = auswerte(f, { x: wo });
    const aufGerade = auswerte(t.term, { x: wo });
    if (!brauchbar(aufKurve, aufGerade)) {
      continue;
    }

    geprueft++;
    if (Math.abs(aufKurve - aufGerade) > 1e-6 * Math.max(1, Math.abs(aufKurve))) {
      fehler = `f(x) = ${termAlsText(f)} bei x = ${bruchAlsText(stelle)}: Kurve ${aufKurve}, Tangente ${aufGerade}`;
      break;
    }

    // Und die Steigung: der Differenzenquotient der Tangente ist ihre
    // Steigung, und die muss die der Kurve sein.
    const kurveSteigung = (auswerte(f, { x: wo + H }) - auswerte(f, { x: wo - H })) / (2 * H);
    const geradeSteigung = t.steigung.z / t.steigung.n;
    if (brauchbar(kurveSteigung) && Math.abs(kurveSteigung - geradeSteigung) > 1e-4 * Math.max(1, Math.abs(geradeSteigung))) {
      fehler = `f(x) = ${termAlsText(f)} bei x = ${bruchAlsText(stelle)}: Kurve steigt ${kurveSteigung}, Tangente ${geradeSteigung}`;
    }
  }

  wahr('die Tangente berührt und hat dieselbe Steigung', fehler === null, fehler ?? undefined);
  wahr('und wurde oft genug geprüft', geprueft >= 30, `nur ${geprueft}`);
});

pruefung('Eine falsche Regel würde auffallen', () => {
  // Die Gegenprobe: Von Hand die Ableitung gebaut, wie sie ohne innere
  // Ableitung aussähe — der klassische Kettenregel-Fehler. Der
  // Differenzenquotient muss sie verwerfen.
  const f = parseTerm('(2x+1)^3');
  const richtig = ableite(f).ableitung;
  const ohneInnere = parseTerm('3*(2x+1)^2'); // die innere 2 fehlt

  const stelle = 1.3;
  const numerisch =
    (auswerte(f, { x: stelle + H }) - auswerte(f, { x: stelle - H })) / (2 * H);

  wahr(
    'die richtige Ableitung trifft den Differenzenquotienten',
    Math.abs(auswerte(richtig, { x: stelle }) - numerisch) < 1e-3
  );
  wahr(
    'die Fassung ohne innere Ableitung nicht',
    Math.abs(auswerte(ohneInnere, { x: stelle }) - numerisch) > 1,
    'die Gegenprobe greift nicht — dann prüft die Invariante oben nichts'
  );
});
