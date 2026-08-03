// Prüfungen für den Parser.
//
// Die tragende steht unten und ist eine Rundreise:
//
//   Was alsText() schreibt, muss parse() wieder einlesen können — und
//   dabei denselben Term ergeben.
//
// Das prüft beide Seiten auf einmal. Eine mehrdeutige Schreibweise
// fällt sofort auf, weil sie falsch zurückkommt: "√4/9" wäre als
// (√4)/9 gelesen worden und hätte 2/9 statt 2/3 ergeben. Genau solche
// Stellen wurden beim Bauen von Hand gefunden — ab jetzt findet sie
// diese Prüfung.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, gleich as bruchGleich, alsText as bruchAlsText } from '../utils/bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  quotient,
  wurzel,
  betrag,
  alsText,
  auswerteExakt,
  auswerte,
  vereinfache,
} from '../utils/term.js';
import { alsText as gleichungAlsText, loese } from '../utils/gleichung.js';
import { parseTerm, parseGleichung, parseEingabe } from '../utils/parser.js';

const x = variable('x');

// Kurz: einlesen und gleich aufschreiben.
const rund = (text) => alsText(parseTerm(text));

// ---------------------------------------------------------------------

pruefung('Zahlen und Buchstaben lesen', () => {
  gleichText('7', rund('7'), '7');
  gleichText('x', rund('x'), 'x');
  gleichText('−7', rund('-7'), '−7');
  gleichText('typografisches Minus', rund('−7'), '−7');
  gleichText('+7', rund('+7'), '7');

  // Kommazahlen werden exakt in Brüche umgerechnet, nicht gerundet.
  gleichText('2,5 mit Komma', rund('2,5'), '5/2');
  gleichText('2.5 mit Punkt', rund('2.5'), '5/2');
  gleichText('0,1 wird genau 1/10', rund('0,1'), '1/10');
  wahr('und nicht 0,1000...0004', bruchGleich(auswerteExakt(parseTerm('0,1')), bruch(1, 10)));

  gleichText('Leerzeichen stören nicht', rund('  3  +  4  '), '3 + 4');
});

pruefung('Grundrechenarten lesen', () => {
  gleichText('3 + 4', rund('3 + 4'), '3 + 4');
  gleichText('3 - 4', rund('3 - 4'), '3 − 4');
  gleichText('3 * 4', rund('3 * 4'), '3 · 4');
  gleichText('3 · 4', rund('3 · 4'), '3 · 4');
  gleichText('3 : 4', rund('3 : 4'), '3 : 4');
  gleichText('3 / 4', rund('3 / 4'), '3 : 4');

  // Punkt vor Strich, ohne dass man Klammern setzen muss.
  zahlIst('2 + 3 · 4 ist 14', auswerte(parseTerm('2 + 3 * 4')), 14);
  zahlIst('(2 + 3) · 4 ist 20', auswerte(parseTerm('(2 + 3) * 4')), 20);
  zahlIst('2 - 3 - 4 ist −5', auswerte(parseTerm('2 - 3 - 4')), -5);
  zahlIst('12 : 3 : 2 ist 2', auswerte(parseTerm('12 : 3 : 2')), 2);
});

pruefung('Malpunkt ohne Malpunkt', () => {
  gleichText('3x', rund('3x'), '3x');
  gleichText('2(x + 1)', rund('2(x+1)'), '2 · (x + 1)');
  gleichText('xy wird x · y', rund('xy'), 'x · y');
  gleichText('5√2', rund('5√2'), '5√2');
  zahlIst('2x bei x = 3 ist 6', auswerte(parseTerm('2x'), { x: 3 }), 6);

  // Zahl neben Zahl ist fast sicher ein Tippfehler und wird abgelehnt,
  // statt stillschweigend als Produkt gelesen zu werden.
  wirft('"2 3" ist ein Tippfehler', () => parseTerm('2 3'));
});

pruefung('Potenzen lesen', () => {
  gleichText('x^2', rund('x^2'), 'x²');
  gleichText('x²', rund('x²'), 'x²');
  gleichText('x⁻²', rund('x⁻²'), 'x⁻²');
  gleichText('x^-2', rund('x^-2'), 'x⁻²');
  gleichText('x¹²', rund('x¹²'), 'x¹²');

  // Potenzen binden von rechts: 2^3^2 ist 2^(3^2) = 512, nicht 64.
  zahlIst('2^3^2 ist 512', auswerte(parseTerm('2^3^2')), 512);
  // Und stärker als der Malpunkt.
  zahlIst('3 · 2^2 ist 12', auswerte(parseTerm('3 * 2^2')), 12);
  // Das Minus davor gehört nicht in die Potenz: −2² ist −4.
  zahlIst('−2² ist −4', auswerte(parseTerm('-2^2')), -4);
  zahlIst('(−2)² ist 4', auswerte(parseTerm('(-2)^2')), 4);
});

pruefung('Wurzeln und Betrag lesen', () => {
  gleichText('√x', rund('√x'), '√x');
  gleichText('√(x + 1)', rund('√(x+1)'), '√(x + 1)');
  gleichText('∛x', rund('∛x'), '∛x');
  gleichText('∜x', rund('∜x'), '∜x');
  gleichText('⁵√x', rund('⁵√x'), '⁵√x');
  gleichText('|x|', rund('|x|'), '|x|');
  gleichText('|x + 1|', rund('|x+1|'), '|x + 1|');

  zahlIst('√9 ist 3', auswerte(parseTerm('√9')), 3);
  zahlIst('∛8 ist 2', auswerte(parseTerm('∛8')), 2);
  zahlIst('|−5| ist 5', auswerte(parseTerm('|-5|')), 5);
  zahlIst('√(4/9) ist 2/3', auswerte(parseTerm('√(4/9)')), 2 / 3);
});

pruefung('Bruchzahl und Division auseinanderhalten', () => {
  // Ein Schrägstrich DIREKT zwischen Ziffern ist eine Bruchzahl, mit
  // Leerzeichen drumherum eine Division. Nötig ist das, damit die App
  // wieder einlesen kann, was sie selbst schreibt: alsText schreibt
  // Brüche als "1/9" und Divisionen als "1 : 9".
  gleichText('1/9 ist eine Zahl', rund('1/9'), '1/9');
  gleichText('1 / 9 ist eine Rechnung', rund('1 / 9'), '1 : 9');
  gleichText('x/9 ist eine Rechnung', rund('x/9'), 'x : 9');
  gleichText('−1/2 als Zahl', rund('-1/2'), '−1/2');
  zahlIst('im Wert dasselbe', auswerte(parseTerm('1/9')), auswerte(parseTerm('1 / 9')));

  // Folgerichtig gehört ein Bruch unter der Wurzel als Ganzes dazu.
  zahlIst('√4/9 liest 4/9 als eine Zahl', auswerte(parseTerm('√4/9')), 2 / 3);
  wirft('Bruch mit Nenner 0', () => parseTerm('1/0'));
});

pruefung('Ausgeschriebene Namen', () => {
  // Auf einer Handytastatur ist "wurzel" schneller getippt als das
  // Zeichen gesucht. Und wer "wurzel(20)" schreibt, meint ganz sicher
  // nicht w · u · r · z · e · l · 20 — genau das kam vorher heraus, und
  // die App rechnete stillschweigend Unsinn.
  gleichText('wurzel(20)', rund('wurzel(20)'), '√20');
  gleichText('Wurzel(4*5) — Großschreibung egal', rund('Wurzel(4*5)'), '√(4 · 5)');
  gleichText('sqrt(9)', rund('sqrt(9)'), '√9');
  gleichText('betrag(-5)', rund('betrag(-5)'), '|−5|');
  gleichText('abs(x)', rund('abs(x)'), '|x|');
  zahlIst('und der Wert stimmt', auswerte(parseTerm('wurzel(20)')), Math.sqrt(20));

  // Ohne Klammer dahinter bleibt es ein Produkt aus Variablen — sonst
  // wäre "ab" plötzlich ein unbekanntes Wort statt a · b.
  gleichText('ab bleibt a · b', rund('ab'), 'a · b');
  gleichText('xy bleibt x · y', rund('xy'), 'x · y');
  gleichText('2x(x+1) bleibt ein Produkt', rund('2x(x+1)'), '2x · (x + 1)');

  // Ein unbekanntes Wort vor einer Klammer wird abgelehnt, statt
  // stillschweigend als Variablenkette gelesen zu werden.
  wirft('sin(x) kennt die App nicht', () => parseTerm('sin(x)'));
  let meldung = '';
  try {
    parseTerm('sin(x)');
  } catch (f) {
    meldung = f.message;
  }
  wahr('und sagt, was sie kennt', meldung.includes('wurzel'));
});

pruefung('Gleichungen lesen', () => {
  gleichText('3x + 5 = 14', gleichungAlsText(parseGleichung('3x + 5 = 14')), '3x + 5 = 14');
  gleichText(
    'auch mit Klammern',
    gleichungAlsText(parseGleichung('2(x+3) = 4x - 2')),
    '2 · (x + 3) = 4x − 2'
  );

  // Der Weg von der Eingabe bis zur Lösung, in einem Stück.
  const e = loese(parseGleichung('3x + 5 = 14'));
  gleichText('und die Lösung stimmt', alsText(e.loesungen[0]), '3');

  wirft('ohne = ist es keine Gleichung', () => parseGleichung('3x + 5'));

  // parseEingabe entscheidet selbst, was es ist.
  wahr('parseEingabe erkennt eine Gleichung', 'links' in parseEingabe('x = 1'));
  wahr('und einen Term', !('links' in parseEingabe('x + 1')));
});

pruefung('Was der Parser ablehnt', () => {
  wirft('leere Eingabe', () => parseTerm(''));
  wirft('nur Leerzeichen', () => parseTerm('   '));
  wirft('offene Klammer', () => parseTerm('2 * (x + 1'));
  wirft('überzählige Klammer', () => parseTerm('2 * x)'));
  wirft('offener Betragsstrich', () => parseTerm('|x + 1'));
  wirft('Rechenzeichen ohne Zahl', () => parseTerm('3 +'));
  wirft('zwei Rechenzeichen', () => parseTerm('3 * * 4'));
  wirft('unbekanntes Zeichen', () => parseTerm('3 § 4'));
  wirft('Wurzel ohne Radikand', () => parseTerm('√'));
});

pruefung('Fehlermeldungen sagen, wo es klemmt', () => {
  // "Unerwartetes Zeichen" hilft niemandem. Die Stelle schon.
  let nachricht = '';
  let stelle = -1;
  try {
    parseTerm('2 * (x + 1');
  } catch (fehler) {
    nachricht = fehler.message;
    stelle = fehler.stelle;
  }
  wahr('die Meldung nennt die Klammer', nachricht.includes('schließende Klammer'));
  wahr('und die Stelle', stelle >= 0);
  wahr('und zeigt die Eingabe', nachricht.includes('2 * (x + 1'));
});

// ---------------------------------------------------------------------
// Die Rundreise
// ---------------------------------------------------------------------

const TERME = 200;

function zufallsterm(naechste, tiefe) {
  if (tiefe <= 0 || naechste(10) < 4) {
    return naechste(3) === 0 ? zahl(naechste(11) - 5) : variable(naechste(2) === 0 ? 'x' : 'y');
  }
  switch (naechste(8)) {
    case 0:
      return summe(zufallsterm(naechste, tiefe - 1), zufallsterm(naechste, tiefe - 1));
    case 1:
      return summe(
        zufallsterm(naechste, tiefe - 1),
        zufallsterm(naechste, tiefe - 1),
        zufallsterm(naechste, tiefe - 1)
      );
    case 2:
      return produkt(zufallsterm(naechste, tiefe - 1), zufallsterm(naechste, tiefe - 1));
    case 3:
      return potenz(zufallsterm(naechste, tiefe - 1), zahl(naechste(5) - 1));
    case 4:
      return quotient(zufallsterm(naechste, tiefe - 1), zufallsterm(naechste, tiefe - 1));
    case 5:
      return wurzel(zufallsterm(naechste, tiefe - 1), naechste(3) + 2);
    case 6:
      return betrag(zufallsterm(naechste, tiefe - 1));
    default:
      return produkt(zahl(bruch(naechste(9) - 4, naechste(5) + 1)), zufallsterm(naechste, tiefe - 1));
  }
}

pruefung('Rundreise: was die App schreibt, liest sie auch wieder', () => {
  const naechste = wuerfel(startwertFuer('rundreise'));
  let verglichen = 0;
  let fehler = null;

  for (let i = 0; i < TERME && fehler === null; i++) {
    const original = zufallsterm(naechste, 3);
    const geschrieben = alsText(original);

    let gelesen;
    try {
      gelesen = parseTerm(geschrieben);
    } catch (f) {
      fehler = `"${geschrieben}" lässt sich nicht wieder einlesen: ${f.message}`;
      break;
    }

    // Der eingelesene Term muss sich genauso aufschreiben lassen wie
    // der ursprüngliche. Das ist strenger als ein Wertvergleich und
    // genau richtig: Eine Schreibweise, die anders zurückkommt, ist
    // mehrdeutig — egal ob der Wert zufällig stimmt.
    const nochmal = alsText(gelesen);
    if (nochmal !== geschrieben) {
      fehler = `"${geschrieben}" kommt als "${nochmal}" zurück`;
      break;
    }
    verglichen++;
  }

  wahr('jede Schreibweise ist eindeutig', fehler === null, fehler ?? undefined);
  wahr('und es wurden genug Terme geprüft', verglichen >= 150, `nur ${verglichen}`);
});

pruefung('Rundreise über den Rechenweg', () => {
  // Auch was beim Umformen entsteht, muss wieder lesbar sein — sonst
  // könnte man einen Zwischenschritt nicht in ein Eingabefeld
  // zurückkopieren.
  const naechste = wuerfel(startwertFuer('rechenweg'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < 200 && fehler === null; i++) {
    const original = zufallsterm(naechste, 2);
    for (const schritt of vereinfache(original).schritte) {
      try {
        if (alsText(parseTerm(schritt.text)) !== schritt.text) {
          fehler = `Zwischenschritt "${schritt.text}" kommt anders zurück`;
          break;
        }
        geprueft++;
      } catch (f) {
        fehler = `Zwischenschritt "${schritt.text}" lässt sich nicht einlesen: ${f.message}`;
        break;
      }
    }
  }

  wahr('jeder Zwischenschritt ist wieder lesbar', fehler === null, fehler ?? undefined);
  wahr('und es gab welche', geprueft >= 50, `nur ${geprueft}`);
});
