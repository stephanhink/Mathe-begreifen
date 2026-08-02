// Prüfungen für den Aufgabengenerator.
//
// Die tragende steht unten und ist einfach zu sagen, aber die
// wichtigste im ganzen Lückenfinder:
//
//   Die mitgelieferte Lösung muss die Aufgabe tatsächlich lösen.
//
// Eine Übungsapp, die eine richtige Antwort als falsch abweist, ist
// schlimmer als gar keine: Sie schickt jemanden, der es kann, auf die
// Suche nach einem Fehler, den er nicht gemacht hat. Geprüft wird das
// für jedes Thema an 100 erzeugten Aufgaben.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch } from '../utils/bruch.js';
import { zahl, variable, summe, produkt, potenz, alsText as termAlsText } from '../utils/term.js';
import { alleThemen } from '../utils/lernpfad.js';
import {
  erzeugeAufgabe,
  hatGenerator,
  pruefeAntwort,
  wertgleich,
  themenMitAufgaben,
} from '../utils/aufgaben.js';
import { parseTerm, parseGleichung } from '../utils/parser.js';
import { loese } from '../utils/gleichung.js';

const x = variable('x');
const DURCHGAENGE = 100;

pruefung('Jedes Thema hat einen Generator', () => {
  // Ohne Generator kann der Lückenfinder an dieser Stelle nicht
  // nachfragen — und genau dort wäre womöglich die Lücke.
  for (const id of alleThemen()) {
    wahr(`${id}: hat einen Aufgabengenerator`, hatGenerator(id));
  }
  zahlIst('und es sind genau so viele wie Themen', themenMitAufgaben().length, alleThemen().length);

  wirft('ein unbekanntes Thema wird abgelehnt', () => erzeugeAufgabe('gibtEsNicht'));
});

pruefung('Eine Aufgabe ist vollständig', () => {
  const naechste = wuerfel(startwertFuer('aufgabe'));
  for (const id of alleThemen()) {
    const a = erzeugeAufgabe(id, naechste);
    wahr(`${id}: hat eine Frage`, typeof a.frage === 'string' && a.frage.length > 5);
    wahr(`${id}: hat eine bekannte Art`, ['zahl', 'term', 'zahlen'].includes(a.art));
    wahr(`${id}: hat eine Lösung`, Boolean(a.loesung));
    wahr(`${id}: nennt den Titel des Themas`, Boolean(a.titel));
    wahr(`${id}: hat einen Lösungstext`, typeof a.loesungText === 'string' && a.loesungText.length > 0);
  }
});

// ---------------------------------------------------------------------

pruefung('Antworten prüfen', () => {
  const naechste = wuerfel(startwertFuer('pruefen'));
  const a = erzeugeAufgabe('termZusammenfassen', naechste);

  // Die eigene Lösung muss durchgehen.
  wahr('die Musterlösung ist richtig', pruefeAntwort(a, a.loesungText).richtig);

  // Und Unsinn nicht.
  wahr('leere Antwort ist falsch', !pruefeAntwort(a, '').richtig);
  wahr('Kauderwelsch ist falsch', !pruefeAntwort(a, 'hallo').richtig);
  wahr('mit Begründung', pruefeAntwort(a, 'hallo').grund.length > 0);

  // Die Aufgabe abzuschreiben gilt nicht.
  const abgeschrieben = pruefeAntwort(a, termAlsText(a.term));
  wahr('die Aufgabe selbst ist keine Antwort', !abgeschrieben.richtig);
  wahr('und wird auch so begründet', abgeschrieben.grund.includes('Aufgabe selbst'));
});

pruefung('Die Schreibweise ist egal, der Wert nicht', () => {
  // Das ist der Punkt, an dem sich eine Mathe-App von einer
  // Tippfehler-App unterscheidet.
  const t = summe(produkt(zahl(3), x), zahl(5), produkt(zahl(2), x));
  const aufgabe = {
    art: 'term',
    term: t,
    loesung: summe(produkt(zahl(5), x), zahl(5)),
  };

  wahr('5x + 5', pruefeAntwort(aufgabe, '5x + 5').richtig);
  wahr('5 + 5x — andere Reihenfolge', pruefeAntwort(aufgabe, '5 + 5x').richtig);
  wahr('5(x + 1) — ausgeklammert', pruefeAntwort(aufgabe, '5(x+1)').richtig);
  wahr('5*x+5 mit Sternchen', pruefeAntwort(aufgabe, '5*x+5').richtig);
  wahr('4x + 5 ist falsch', !pruefeAntwort(aufgabe, '4x + 5').richtig);
  wahr('5x ist falsch', !pruefeAntwort(aufgabe, '5x').richtig);

  // Bei einer Zahlenfrage muss auch eine Zahl dastehen.
  const zahlenaufgabe = { art: 'zahl', loesung: zahl(12) };
  wahr('12', pruefeAntwort(zahlenaufgabe, '12').richtig);
  wahr('24/2 ist auch 12', pruefeAntwort(zahlenaufgabe, '24/2').richtig);
  wahr('aber nicht 6 + 6 — das ist noch nicht ausgerechnet', !pruefeAntwort(zahlenaufgabe, '6 + 6').richtig);
  wahr('und kein Term mit x', !pruefeAntwort(zahlenaufgabe, 'x').richtig);
});

pruefung('Zwei Lösungen', () => {
  const aufgabe = { art: 'zahlen', loesung: [zahl(3), zahl(-1)] };

  wahr('mit Semikolon', pruefeAntwort(aufgabe, '3; -1').richtig);
  wahr('mit Komma', pruefeAntwort(aufgabe, '3, -1').richtig);
  wahr('mit "und"', pruefeAntwort(aufgabe, '3 und -1').richtig);
  wahr('mit "oder"', pruefeAntwort(aufgabe, '3 oder -1').richtig);
  // Es ist eine Menge, keine Liste — die Reihenfolge ist egal.
  wahr('umgekehrte Reihenfolge', pruefeAntwort(aufgabe, '-1; 3').richtig);

  wahr('nur eine Lösung reicht nicht', !pruefeAntwort(aufgabe, '3').richtig);
  wahr('und wird begründet', pruefeAntwort(aufgabe, '3').grund.includes('2 Lösungen'));
  wahr('drei sind auch falsch', !pruefeAntwort(aufgabe, '3; -1; 5').richtig);
  wahr('eine falsche darunter zählt nicht', !pruefeAntwort(aufgabe, '3; 7').richtig);
});

pruefung('Wertgleichheit', () => {
  wahr('x + x und 2x', wertgleich(summe(x, x), produkt(zahl(2), x)));
  wahr('(x+1)² und x² + 2x + 1', wertgleich(
    potenz(summe(x, zahl(1)), zahl(2)),
    summe(potenz(x, zahl(2)), produkt(zahl(2), x), zahl(1))
  ));
  wahr('x + 1 und x + 2 nicht', !wertgleich(summe(x, zahl(1)), summe(x, zahl(2))));
  wahr('1/2 und 0,5', wertgleich(zahl(bruch(1, 2)), parseTerm('0,5')));
  // Verschiedene Variablen lassen sich nicht vergleichen.
  wahr('x und y nicht', !wertgleich(x, variable('y')));
});

// ---------------------------------------------------------------------
// Die Prüfung, die alles trägt
// ---------------------------------------------------------------------

pruefung(`Jede erzeugte Aufgabe ist lösbar (je ${DURCHGAENGE} Stück)`, () => {
  for (const id of alleThemen()) {
    const naechste = wuerfel(startwertFuer(`aufgabe-${id}`));
    let fehler = null;

    for (let i = 0; i < DURCHGAENGE && fehler === null; i++) {
      let a;
      try {
        a = erzeugeAufgabe(id, naechste);
      } catch (f) {
        fehler = `Durchgang ${i}: ${f.message}`;
        break;
      }

      // 1. Die Musterlösung muss die eigene Prüfung bestehen.
      const geprueft = pruefeAntwort(a, a.loesungText);
      if (!geprueft.richtig) {
        fehler = `"${a.frage}" → Musterlösung "${a.loesungText}" wird abgelehnt: ${geprueft.grund}`;
        break;
      }

      // 2. Steht in der Frage eine Gleichung, muss die App selbst auf
      //    dieselbe Lösung kommen. Das prüft Aufgabe und Löser
      //    gegeneinander — ein Fehler in einem von beiden fällt auf.
      const stelle = a.frage.indexOf(': ');
      const rohtext = stelle === -1 ? '' : a.frage.slice(stelle + 2);
      if (rohtext.includes('=')) {
        try {
          const e = loese(parseGleichung(rohtext));
          const sollen = Array.isArray(a.loesung) ? a.loesung : [a.loesung];
          if (!['eindeutig', 'mehrere'].includes(e.art)) {
            fehler = `"${rohtext}" wird von loese() als "${e.art}" eingestuft`;
          } else if (e.loesungen.length !== sollen.length) {
            fehler = `"${rohtext}": loese() findet ${e.loesungen.length} Lösungen, erwartet ${sollen.length}`;
          } else if (!sollen.every((s) => e.loesungen.some((l) => wertgleich(l, s)))) {
            fehler =
              `"${rohtext}": loese() findet ${e.loesungen.map(termAlsText).join('; ')}, ` +
              `die Aufgabe erwartet ${sollen.map(termAlsText).join('; ')}`;
          }
        } catch (f) {
          fehler = `"${rohtext}" lässt sich nicht lösen: ${f.message}`;
        }
      }
    }

    wahr(`${id}: alle ${DURCHGAENGE} Aufgaben sind stimmig`, fehler === null, fehler ?? undefined);
  }
});

pruefung('Die Zahlen sind gebaut, nicht gewürfelt', () => {
  // Bei einer Gleichungsaufgabe soll eine handhabbare Lösung
  // herauskommen — sonst scheitert der Schüler am Bruchrechnen statt an
  // dem, was gefragt war.
  for (const id of [
    'gleichungEinschrittig',
    'gleichungMehrschrittig',
    'gleichungMitKlammern',
    'gleichungMitBruechen',
    'quadratischeGleichung',
  ]) {
    const naechste = wuerfel(startwertFuer(`ganz-${id}`));
    let krumme = 0;
    for (let i = 0; i < DURCHGAENGE; i++) {
      const a = erzeugeAufgabe(id, naechste);
      const loesungen = Array.isArray(a.loesung) ? a.loesung : [a.loesung];
      for (const l of loesungen) {
        if (l.art !== 'zahl' || l.wert.n !== 1) {
          krumme++;
        }
      }
    }
    zahlIst(`${id}: keine krummen Lösungen`, krumme, 0);
  }
});
