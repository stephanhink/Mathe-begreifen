// Prüfungen fürs Kürzen von Bruchtermen.
//
// Hier tragen ZWEI Aussagen, und die zweite ist die wichtigere:
//
//   1. Wo beide definiert sind, müssen sie denselben Wert haben.
//      Das ist die gewohnte Wertgleichheit aus term.js.
//
//   2. DIE AUSGESCHLOSSENEN STELLEN SIND GENAU DIE, AN DENEN DER
//      URSPRÜNGLICHE TERM NICHT DEFINIERT IST — nicht mehr und nicht
//      weniger.
//
// Die zweite ist die, die den eigentlichen Fehler fängt. Beim Kürzen
// WÄCHST der Definitionsbereich: (x² − 1)/(x − 1) ist bei x = 1 nicht
// definiert, x + 1 sehr wohl. Fiele der Vorbehalt weg, lieferte die App
// für x = 1 die Antwort 2 — für eine Stelle, die es nie gab. Sie hätte
// einen Wert erfunden.
//
// Deshalb wird ausdrücklich BEIDES geprüft: dass jede ausgeschlossene
// Stelle wirklich eine Lücke ist (kein Vorbehalt zu viel), und dass es
// außerhalb keine gibt (kein Vorbehalt zu wenig).

import { pruefung, wahr, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, gleich as bruchGleich, alsText as bruchRoh } from '../utils/bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  quotient,
  wurzel,
  auswerteExakt,
  alsText as termAlsText,
} from '../utils/term.js';
import { parseTerm } from '../utils/parser.js';
import { kuerze, definitionsluecken, alsRechenweg } from '../utils/bruchterm.js';

const x = variable('x');

// Ist der Term an dieser Stelle definiert?
function definiert(term, stelle) {
  try {
    auswerteExakt(term, { x: stelle });
    return true;
  } catch (fehler) {
    if (fehler.undefiniert) {
      return false;
    }
    // irrational oder zuGross heißt NICHT "undefiniert" — dort gibt es
    // sehr wohl einen Wert, er lässt sich nur nicht als Bruch schreiben.
    return true;
  }
}

// ---------------------------------------------------------------------

pruefung('Das Beispiel aus CLAUDE.md', () => {
  // (x² − 1)/(x − 1) = x + 1, aber nur für x ≠ 1.
  const e = kuerze(parseTerm('x^2 - 1'), parseTerm('x - 1'));

  gleichText('gekürzt', e.art, 'gekuerzt');
  gleichText('Ergebnis', termAlsText(e.ergebnis), 'x + 1');
  gleichText('eine ausgeschlossene Stelle', e.ausgeschlossen.length, 1);
  wahr('nämlich x = 1', bruchGleich(e.ausgeschlossen[0], bruch(1)));

  wahr('und der Vorbehalt steht dabei', e.vorbehalt.includes('x ≠ 1'), e.vorbehalt);
  wahr(
    'mit der Erklärung, warum man es nicht mehr sieht',
    e.vorbehalt.includes('weggekürzt'),
    e.vorbehalt
  );

  const weg = alsRechenweg(parseTerm('x^2 - 1'), parseTerm('x - 1'), e).join('\n');
  wahr('der Weg zeigt die Zerlegung', weg.includes('(x − 1) · (x + 1)'), weg);
});

pruefung('Der gekürzte Term ist an der Lücke sehr wohl definiert', () => {
  // Genau das ist die Gefahr, und deshalb steht es als eigene Prüfung
  // da: Der ursprüngliche Term hat bei x = 1 ein Loch, der gekürzte
  // nicht. Wer den Vorbehalt wegließe, bekäme dort eine Antwort — für
  // eine Stelle, die es nie gab.
  const zaehler = parseTerm('x^2 - 1');
  const nenner = parseTerm('x - 1');
  const e = kuerze(zaehler, nenner);
  const ursprung = quotient(zaehler, nenner);

  wahr('ursprünglich bei x = 1 nicht definiert', !definiert(ursprung, bruch(1)));
  wahr('gekürzt aber schon', definiert(e.ergebnis, bruch(1)));
  gleichText(
    'und zwar mit dem Wert 2',
    bruchRoh(auswerteExakt(e.ergebnis, { x: bruch(1) })),
    '2'
  );
  wahr(
    'deshalb MUSS die Stelle ausgeschlossen sein',
    e.ausgeschlossen.some((s) => bruchGleich(s, bruch(1)))
  );
});

pruefung('Weitere Fälle, die im Unterricht vorkommen', () => {
  const kurz = (z, n) => {
    const e = kuerze(parseTerm(z), parseTerm(n));
    return e.art === 'gekuerzt' ? termAlsText(e.ergebnis) : e.art;
  };

  gleichText('(x² − 4)/(x + 2)', kurz('x^2 - 4', 'x + 2'), 'x − 2');
  gleichText('(x² + 5x + 6)/(x + 2)', kurz('x^2 + 5x + 6', 'x + 2'), 'x + 3');
  gleichText('(2x² − 8)/(x − 2)', kurz('2x^2 - 8', 'x - 2'), '2x + 4');
  gleichText('(x² − 3x)/x', kurz('x^2-3x', 'x'), 'x − 3');

  // Der Vorfaktor bleibt erhalten — 2(x+2) ist nicht x+2.
  const mitVorfaktor = kuerze(parseTerm('2x^2 - 8'), parseTerm('x - 2'));
  gleichText(
    'bei x = 3 ergibt der gekürzte Term',
    bruchRoh(auswerteExakt(mitVorfaktor.ergebnis, { x: bruch(3) })),
    '10'
  );
});

pruefung('Was sich nicht kürzen lässt, wird nicht gekürzt', () => {
  const ohneGemeinsamen = kuerze(parseTerm('x^2 - 1'), parseTerm('x + 5'));
  gleichText('kein gemeinsamer Faktor', ohneGemeinsamen.art, 'nichtKuerzbar');
  wahr('aber die Lücke wird trotzdem genannt', ohneGemeinsamen.ausgeschlossen.length === 1);
  wahr('nämlich x = −5', bruchGleich(ohneGemeinsamen.ausgeschlossen[0], bruch(-5)));

  // Ein Nenner ohne reelle Nullstelle: überall definiert, nichts zu
  // kürzen — und das ist eine gute Nachricht, keine Fehlermeldung.
  const ohneLuecke = kuerze(parseTerm('x - 1'), parseTerm('x^2 + 1'));
  gleichText('x² + 1 im Nenner', ohneLuecke.art, 'nichtKuerzbar');
  gleichText('keine Lücke', ohneLuecke.ausgeschlossen.length, 0);
  wahr('und die App sagt warum', ohneLuecke.grund.includes('überall definiert'), ohneLuecke.grund);

  // Irrationale Nullstellen: ginge zwar, wäre aber keine Schreibweise
  // aus dem Unterricht.
  gleichText('x² − 2 im Zähler', kuerze(parseTerm('x^2 - 2'), parseTerm('x - 1')).art, 'nichtKuerzbar');
});

pruefung('Was diese Datei nicht kann, sagt sie', () => {
  const dritterGrad = kuerze(parseTerm('x^3 - 1'), parseTerm('x - 1'));
  gleichText('dritter Grad', dritterGrad.art, 'unklar');
  wahr('nennt den Grad', dritterGrad.grund.includes('Grad 3'), dritterGrad.grund);

  const zweiVariablen = kuerze(summe(x, variable('y')), parseTerm('x - 1'));
  gleichText('zwei Variablen', zweiVariablen.art, 'unklar');

  const mitWurzel = kuerze(wurzel(x), parseTerm('x - 1'));
  gleichText('Wurzel im Zähler', mitWurzel.art, 'unklar');

  const nennerNull = kuerze(parseTerm('x - 1'), zahl(0));
  gleichText('Nenner ist null', nennerNull.art, 'unklar');
  wahr('nennt die Division durch null', nennerNull.grund.includes('Durch null'), nennerNull.grund);

  wirft('eine Zahl ist kein Term', () => kuerze(3, parseTerm('x')));
});

pruefung('Die Definitionslücken allein', () => {
  const eine = definitionsluecken(parseTerm('x - 3'));
  gleichText('x − 3', eine.stellen.map(bruchRoh).join('; '), '3');

  const zwei = definitionsluecken(parseTerm('x^2 - 4'));
  gleichText('x² − 4', zwei.stellen.map(bruchRoh).sort().join('; '), '-2; 2');

  const keine = definitionsluecken(parseTerm('x^2 + 1'));
  gleichText('x² + 1 hat keine', keine.stellen.length, 0);
});

// ---------------------------------------------------------------------
// Die tragenden Prüfungen
// ---------------------------------------------------------------------

// Ein Bruchterm, bei dem sich etwas kürzen lässt: gebaut aus
// Linearfaktoren, damit die Prüfung den geprüften Code auch erreicht.
// Ein Zufallstest, der nie einen gemeinsamen Faktor erzeugt, prüft das
// Kürzen nie — das steht als Warnung in CLAUDE.md.
function zufallsbruch(naechste) {
  const gemeinsam = naechste(11) - 5;
  const obenExtra = naechste(11) - 5;
  const untenExtra = naechste(11) - 5;
  const vorfaktor = naechste(4) + 1;

  const faktor = (r) => summe(x, zahl(-r));
  return {
    zaehler: produkt(zahl(vorfaktor), faktor(gemeinsam), faktor(obenExtra)),
    nenner: produkt(faktor(gemeinsam), faktor(untenExtra)),
    gemeinsam,
    untenExtra,
  };
}

pruefung('Gekürzt und ungekürzt sind gleich, wo beide definiert sind', () => {
  const naechste = wuerfel(startwertFuer('bruchterm-wert'));
  let verglichen = 0;
  let fehler = null;

  for (let i = 0; i < 150 && fehler === null; i++) {
    const { zaehler, nenner } = zufallsbruch(naechste);
    const e = kuerze(zaehler, nenner);
    if (e.art !== 'gekuerzt') {
      continue;
    }
    const ursprung = quotient(zaehler, nenner);

    for (let p = 0; p < 25 && fehler === null; p++) {
      const stelle = bruch(naechste(41) - 20, naechste(3) + 1);
      if (!definiert(ursprung, stelle)) {
        continue;
      }

      let vorher;
      let nachher;
      try {
        vorher = auswerteExakt(ursprung, { x: stelle });
        nachher = auswerteExakt(e.ergebnis, { x: stelle });
      } catch {
        continue;
      }

      verglichen++;
      if (!bruchGleich(vorher, nachher)) {
        fehler =
          `(${termAlsText(zaehler)}) : (${termAlsText(nenner)}) = ${termAlsText(e.ergebnis)}\n` +
          `  bei x = ${bruchRoh(stelle)}: vorher ${bruchRoh(vorher)}, nachher ${bruchRoh(nachher)}`;
      }
    }
  }

  wahr('der Wert bleibt gleich', fehler === null, fehler ?? undefined);
  wahr('es wurde wirklich verglichen', verglichen >= 1000, `nur ${verglichen} Stellen`);
});

pruefung('Die ausgeschlossenen Stellen sind GENAU die Lücken', () => {
  // Die Prüfung, auf die es ankommt. Sie hat zwei Hälften, und beide
  // sind nötig:
  //
  //   Kein Vorbehalt zu viel: Jede ausgeschlossene Stelle muss wirklich
  //     eine Lücke sein, sonst schränkt die App grundlos ein.
  //   Kein Vorbehalt zu wenig: Außerhalb der genannten Stellen darf es
  //     keine Lücke geben — sonst liefert die App irgendwo eine Antwort,
  //     die es nicht gibt.
  const naechste = wuerfel(startwertFuer('bruchterm-luecken'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < 150 && fehler === null; i++) {
    const { zaehler, nenner } = zufallsbruch(naechste);
    const e = kuerze(zaehler, nenner);
    if (e.art === 'unklar') {
      continue;
    }
    const ursprung = quotient(zaehler, nenner);

    // Hälfte 1: Jede genannte Stelle ist wirklich eine Lücke.
    for (const stelle of e.ausgeschlossen) {
      geprueft++;
      if (definiert(ursprung, stelle)) {
        fehler =
          `(${termAlsText(zaehler)}) : (${termAlsText(nenner)}): ` +
          `x = ${bruchRoh(stelle)} wird ausgeschlossen, ist aber definiert`;
        break;
      }
    }
    if (fehler) {
      break;
    }

    // Hälfte 2: Außerhalb gibt es keine.
    for (let n = -20; n <= 20 && fehler === null; n++) {
      const stelle = bruch(n);
      const genannt = e.ausgeschlossen.some((s) => bruchGleich(s, stelle));
      if (genannt) {
        continue;
      }
      geprueft++;
      if (!definiert(ursprung, stelle)) {
        fehler =
          `(${termAlsText(zaehler)}) : (${termAlsText(nenner)}): ` +
          `bei x = ${n} gibt es eine Lücke, die NICHT ausgeschlossen wurde`;
      }
    }
  }

  wahr('genau die Lücken, nicht mehr und nicht weniger', fehler === null, fehler ?? undefined);
  wahr('und zwar oft genug', geprueft >= 3000, `nur ${geprueft}`);
});

pruefung('Ein vergessener Vorbehalt würde auffallen', () => {
  // Die Gegenprobe von Hand: Wer (x² − 1)/(x − 1) zu x + 1 kürzt und
  // den Vorbehalt weglässt, behauptet, der Term sei bei x = 1 gleich 2.
  // Das ist die Behauptung, die diese Prüfung verwirft.
  const ursprung = quotient(parseTerm('x^2 - 1'), parseTerm('x - 1'));
  const gekuerztOhneVorbehalt = parseTerm('x + 1');

  wahr('ursprünglich ist x = 1 eine Lücke', !definiert(ursprung, bruch(1)));
  wahr(
    'der gekürzte Term hat dort aber einen Wert',
    definiert(gekuerztOhneVorbehalt, bruch(1)),
    'die Gegenprobe greift nicht — dann prüft die Invariante oben nichts'
  );

  // Und die App nennt die Stelle.
  const e = kuerze(parseTerm('x^2 - 1'), parseTerm('x - 1'));
  wahr('die App schließt sie aus', e.ausgeschlossen.some((s) => bruchGleich(s, bruch(1))));
});
