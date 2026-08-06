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
import {
  bruch,
  mal as malBruch,
  gleich as bruchGleich,
  alsText as bruchAlsText,
} from '../utils/bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  wurzel,
  auswerteExakt,
  alsText as termAlsText,
} from '../utils/term.js';
import { istGleichung } from '../utils/gleichung.js';
import { alleThemen } from '../utils/lernpfad.js';
import {
  istUngleichung,
  alsText as ungleichungAlsText,
  loese as loeseUngleichung,
  loesungAlsText,
} from '../utils/ungleichung.js';

// Ein Paar { x: Term, y: Term } — kein Term, kein Array, keine
// Ungleichung. Erkennbar daran, dass ihm das art-Feld fehlt, das jeder
// Term hat.
function istPaar(wert) {
  return (
    typeof wert === 'object' &&
    wert !== null &&
    !Array.isArray(wert) &&
    typeof wert.art !== 'string' &&
    !istUngleichung(wert)
  );
}

// Zwei Ungleichungen beschreiben denselben Bereich? Strukturell
// verglichen, nicht über Stichproben: x < 3 und x ≤ 3 sähen an
// zufälligen Stellen fast immer gleich aus, und genau der Unterschied
// ist hier der Lernstoff.
function gleicheMenge(a, b) {
  const links = loeseUngleichung(a);
  const rechts = loeseUngleichung(b);
  return (
    links.art === rechts.art &&
    loesungAlsText(links) === loesungAlsText(rechts)
  );
}
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
    wahr(
      `${id}: hat eine bekannte Art`,
      ['zahl', 'term', 'zahlen', 'ungleichung', 'paar'].includes(a.art)
    );
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

      // 2. Ist die Aufgabe eine GLEICHUNG, muss die App selbst auf
      //    dieselbe Lösung kommen. Das prüft Aufgabe und Löser
      //    gegeneinander — ein Fehler in einem von beiden fällt auf.
      //
      //    Gefragt wird der Aufgabentyp, nicht der Text. Die frühere
      //    Faustregel "steht ein = in der Frage, ist es eine Gleichung"
      //    trug nur so lange, bis die Ableitungen kamen: Dort steht
      //    "Leite ab: f(x) = 4x⁴ + 3x − 4", und der Löser sollte
      //    plötzlich eine Funktionsdefinition lösen.
      const stelle = a.frage.indexOf(': ');
      const rohtext = stelle === -1 ? '' : a.frage.slice(stelle + 2);
      if (istGleichung(a.start) && rohtext.includes('=')) {
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

// ---------------------------------------------------------------------
// Fehlerbilder
// ---------------------------------------------------------------------

pruefung('Ein Fehlerbild trifft nie die richtige Lösung', () => {
  // Die wichtigste Prüfung an dieser Stelle. Träfe ein Fehlerbild
  // zufällig die richtige Antwort, würde eine richtige Lösung als
  // falsch abgewiesen — der schlimmste Fehler, den eine Übungsapp
  // machen kann.
  for (const id of alleThemen()) {
    const naechste = wuerfel(startwertFuer(`fehlerbild-${id}`));
    let fehler = null;

    for (let i = 0; i < DURCHGAENGE && fehler === null; i++) {
      const a = erzeugeAufgabe(id, naechste);
      for (const bild of a.fehlerbilder ?? []) {
        if (Array.isArray(bild.wert)) {
          const offen = [...a.loesung];
          const deckungsgleich =
            bild.wert.length === offen.length &&
            bild.wert.every((w) => {
              const stelle = offen.findIndex((soll) => wertgleich(w, soll));
              if (stelle === -1) {
                return false;
              }
              offen.splice(stelle, 1);
              return true;
            });
          if (deckungsgleich) {
            fehler = `"${a.frage}": ein Fehlerbild ist deckungsgleich mit der Lösung`;
          }
        } else if (istPaar(a.loesung)) {
          // Bei einem System ist die Lösung ein Paar. Deckungsgleich
          // wäre das Vertausch-Fehlerbild genau dann, wenn beide Werte
          // zufällig gleich sind — (2 | 2) vertauscht bleibt (2 | 2).
          const namen = Object.keys(a.loesung);
          if (namen.every((n) => wertgleich(bild.wert[n], a.loesung[n]))) {
            fehler = `"${a.frage}": das vertauschte Paar ist die richtige Lösung`;
          }
        } else if (istUngleichung(a.loesung)) {
          // Bei einer Ungleichung ist die Lösung ein Bereich. Zwei
          // Bereiche mit derselben Grenze können sich allein im Zeichen
          // unterscheiden — und genau das ist hier der typische Fehler.
          // Deckungsgleich wären sie nur, wenn auch der Dreh nichts
          // ändert; dann darf das Bild nicht stehen bleiben.
          if (gleicheMenge(bild.wert, a.loesung)) {
            fehler = `"${a.frage}": Fehlerbild ${loesungAlsText(loeseUngleichung(bild.wert))} ist die richtige Lösung`;
          }
        } else if (wertgleich(bild.wert, a.loesung)) {
          fehler = `"${a.frage}": Fehlerbild ${termAlsText(bild.wert)} ist die richtige Lösung`;
        }
        if (fehler) {
          break;
        }
      }
    }

    wahr(`${id}: kein Fehlerbild trifft die Lösung`, fehler === null, fehler ?? undefined);
  }
});

pruefung('Ein Fehlerbild wird erkannt und benannt', () => {
  // Die Diagnose sagt, WAS gedacht wurde — nicht, dass etwas fehlt.
  const naechste = wuerfel(startwertFuer('diagnose'));

  for (const id of alleThemen()) {
    const a = erzeugeAufgabe(id, naechste);
    for (const bild of a.fehlerbilder ?? []) {
      const eingabe = istPaar(bild.wert)
        ? Object.keys(bild.wert)
            .sort()
            .map((n) => `${n} = ${termAlsText(bild.wert[n])}`)
            .join('; ')
        : istUngleichung(bild.wert)
        ? ungleichungAlsText(bild.wert)
        : Array.isArray(bild.wert)
          ? bild.wert.map(termAlsText).join('; ')
          : termAlsText(bild.wert);
      const geprueft = pruefeAntwort(a, eingabe);

      wahr(`${id}: "${eingabe}" gilt als falsch`, !geprueft.richtig);
      wahr(`${id}: und wird als bekannter Fehler erkannt`, geprueft.erkannt === true, geprueft.grund);
      wahr(
        `${id}: mit einer Begründung, die etwas erklärt`,
        typeof geprueft.grund === 'string' && geprueft.grund.length > 40,
        String(geprueft.grund)
      );
    }
  }
});

pruefung('Auch die Diagnosen benutzen das richtige Minus', () => {
  // "−12x" im Term und "-12x" in der Erklärung darunter sehen nach
  // Fehler aus. Dieselbe Regel wie überall sonst in der App.
  for (const id of alleThemen()) {
    const naechste = wuerfel(startwertFuer(`minus-${id}`));
    let mitBindestrich = null;
    for (let i = 0; i < 50 && mitBindestrich === null; i++) {
      const a = erzeugeAufgabe(id, naechste);
      for (const bild of a.fehlerbilder ?? []) {
        // Gemeint ist nur der Bindestrich als MINUSZEICHEN, also einer
        // direkt vor einer Ziffer. In "3-mal" und "x-Gliedern" gehört
        // er dahin.
        if (/-\d/.test(bild.diagnose)) {
          mitBindestrich = bild.diagnose;
          break;
        }
      }
    }
    wahr(`${id}: kein Bindestrich in den Diagnosen`, mitBindestrich === null, mitBindestrich ?? undefined);
  }
});

pruefung('Die klassischen Fehler', () => {
  // Feste Beispiele, damit die Diagnosen nicht nur irgendwie vorhanden
  // sind, sondern die richtigen.
  const faelle = [
    {
      aufgabe: { art: 'zahl', loesung: zahl(bruch(5, 6)), fehlerbilder: [] },
      erwartet: null,
    },
  ];
  // 1/2 + 1/3 als 2/5: Zähler und Nenner einzeln addiert.
  const bruchAufgabe = {
    art: 'zahl',
    loesung: zahl(bruch(5, 6)),
    fehlerbilder: [{ wert: zahl(bruch(2, 5)), diagnose: 'Zähler und Nenner einzeln addiert.' }],
  };
  const g1 = pruefeAntwort(bruchAufgabe, '2/5');
  wahr('2/5 wird erkannt', g1.erkannt === true);
  gleichText('mit der richtigen Diagnose', g1.grund, 'Zähler und Nenner einzeln addiert.');

  // Eine unbekannte falsche Antwort bekommt die schlichte Auskunft.
  const g2 = pruefeAntwort(bruchAufgabe, '7/9');
  wahr('7/9 gilt als falsch', !g2.richtig);
  wahr('aber nicht als erkannter Fehler', g2.erkannt !== true);

  // Und die richtige Antwort bleibt richtig.
  wahr('5/6 ist weiterhin richtig', pruefeAntwort(bruchAufgabe, '5/6').richtig);
  wahr('auch anders geschrieben', pruefeAntwort(bruchAufgabe, '10/12').richtig);
  zahlIst('unbenutzte Fälle', faelle.length, 1);
});

pruefung('Bei zwei Lösungen zählt jede einzeln', () => {
  const aufgabe = { art: 'zahlen', loesung: [zahl(3), zahl(-1)], fehlerbilder: [] };

  const halb = pruefeAntwort(aufgabe, '3; 5');
  wahr('eine richtig, eine falsch', !halb.richtig);
  wahr('und das steht auch da', halb.grund.includes('die andere stimmt aber'));

  const ganz = pruefeAntwort(aufgabe, '7; 5');
  wahr('beide falsch', !ganz.richtig);
  wahr('ohne Trostpflaster', !ganz.grund.includes('die andere stimmt aber'));
});

// ---------------------------------------------------------------------
// Prozentrechnung und Formeln umstellen
// ---------------------------------------------------------------------
//
// Beide Generatoren holen ihre Musterlösung aus dem Fachmodul
// (prozent.js, umstellen.js). Damit kann die Aufgabe nicht vom Rechner
// im Bildschirm abweichen — aber sie kann mit ihm gemeinsam falsch
// liegen. Deshalb wird hier NICHT noch einmal dasselbe Modul gefragt,
// sondern die Probe aus dem Unterricht gerechnet, in ganzen Zahlen:
//
//   Prozentwert:    W · 100 = G · p
//   Prozentsatz:    p · G   = W · 100
//   Grundwert:      G · p   = W · 100
//   Veränderung:    neu · 100 = G · (100 ± p)
//   Rückwärts:      alt · (100 ± p) = neu · 100
//   Umstellen:      Ergebnis · unten = oben
//   Fallweg:        t² · g = 2 · s
//
// Jede dieser Zeilen ist die Formel selbst, rückwärts gelesen. Rechnet
// prozent.js oder umstellen.js falsch, geht sie nicht auf.
const PROBEN = {
  prozentGrundaufgabe(frage, l) {
    const t = /^Wie viel sind (\d+) % von (\d+)\?$/.exec(frage);
    if (!t) {
      return `unerwarteter Fragetext: ${frage}`;
    }
    const [p, g] = [Number(t[1]), Number(t[2])];
    return bruchGleich(malBruch(l, bruch(100)), bruch(g * p))
      ? null
      : `${frage} → ${bruchAlsText(l)}: ${bruchAlsText(l)} · 100 ist nicht ${g} · ${p}`;
  },

  prozentRueckwaerts(frage, l) {
    const satz = /^(\d+) von (\d+) — wie viel Prozent sind das\?$/.exec(frage);
    if (satz) {
      const [w, g] = [Number(satz[1]), Number(satz[2])];
      return bruchGleich(malBruch(l, bruch(g)), bruch(w * 100))
        ? null
        : `${frage} → ${bruchAlsText(l)}: p · G ist nicht W · 100`;
    }
    const ganzes = /^(\d+) sind (\d+) % — wie groß ist das Ganze\?$/.exec(frage);
    if (ganzes) {
      const [w, p] = [Number(ganzes[1]), Number(ganzes[2])];
      return bruchGleich(malBruch(l, bruch(p)), bruch(w * 100))
        ? null
        : `${frage} → ${bruchAlsText(l)}: G · p ist nicht W · 100`;
    }
    return `unerwarteter Fragetext: ${frage}`;
  },

  prozentVeraenderung(frage, l) {
    const t = /^(\d+) € werden um (\d+) % (teurer|billiger)\. /.exec(frage);
    if (!t) {
      return `unerwarteter Fragetext: ${frage}`;
    }
    const [g, p] = [Number(t[1]), Number(t[2])];
    const anteil = t[3] === 'teurer' ? 100 + p : 100 - p;
    return bruchGleich(malBruch(l, bruch(100)), bruch(g * anteil))
      ? null
      : `${frage} → ${bruchAlsText(l)}: neu · 100 ist nicht ${g} · ${anteil}`;
  },

  prozentZurueck(frage, l) {
    const t = /^Nach (\d+) % (Aufschlag|Rabatt) kostet ein Artikel (\d+) €\. /.exec(frage);
    if (!t) {
      return `unerwarteter Fragetext: ${frage}`;
    }
    const p = Number(t[1]);
    const neu = Number(t[3]);
    const anteil = t[2] === 'Aufschlag' ? 100 + p : 100 - p;
    // Die Probe, die diese Aufgabe ausmacht: Verändert man den alten
    // Wert wieder um p %, muss der genannte neue Wert herauskommen.
    return bruchGleich(malBruch(l, bruch(anteil)), bruch(neu * 100))
      ? null
      : `${frage} → ${bruchAlsText(l)}: alt · ${anteil} ist nicht ${neu} · 100`;
  },

  formelUmstellen(frage, l) {
    const t = /für ([a-zA-Z]) = (\d+) und ([a-zA-Z]) = (\d+)\.$/.exec(frage);
    if (!t) {
      return `unerwarteter Fragetext: ${frage}`;
    }
    const [oben, unten] = [Number(t[2]), Number(t[4])];
    return bruchGleich(malBruch(l, bruch(unten)), bruch(oben))
      ? null
      : `${frage} → ${bruchAlsText(l)}: Ergebnis · ${unten} ist nicht ${oben}`;
  },

  formelMitPotenz(frage, l) {
    const t = /für s = (\d+) und g = (\d+)\.$/.exec(frage);
    if (!t) {
      return `unerwarteter Fragetext: ${frage}`;
    }
    const [s, g] = [Number(t[1]), Number(t[2])];
    return bruchGleich(malBruch(malBruch(l, l), bruch(g)), bruch(2 * s))
      ? null
      : `${frage} → ${bruchAlsText(l)}: t² · ${g} ist nicht 2 · ${s}`;
  },
};

pruefung(`Die Probe für Prozent und Umstellen geht auf (je ${DURCHGAENGE} Stück)`, () => {
  for (const [id, probe] of Object.entries(PROBEN)) {
    const naechste = wuerfel(startwertFuer(`probe-${id}`));
    let fehler = null;
    let krumme = 0;

    for (let i = 0; i < DURCHGAENGE && fehler === null; i++) {
      const a = erzeugeAufgabe(id, naechste);
      const wert = auswerteExakt(a.loesung, {});
      // Die Zahlen sind gebaut, nicht gewürfelt: Wer an Prozenten
      // scheitert, soll nicht am Bruchrechnen scheitern.
      if (wert.n !== 1) {
        krumme++;
      }
      fehler = probe(a.frage, wert);
    }

    wahr(`${id}: die Probe geht auf`, fehler === null, fehler ?? undefined);
    zahlIst(`${id}: keine krummen Lösungen`, krumme, 0);
  }
});

pruefung('Die neuen Fehlerbilder sind die benannten Fehler', () => {
  // Ein Fehlerbild ohne nachgerechnete Ursache ist nur eine Zahl, die
  // nicht die Lösung ist. Hier wird verlangt, dass genau der benannte
  // Denkfehler dahintersteht.
  const naechste = wuerfel(startwertFuer('neue-fehlerbilder'));
  // Ein Fehlerbild darf auch irrational sein — beim Fallweg ist eines
  // davon eine Wurzel. Für den Vergleich in Brüchen bleiben die anderen;
  // das irrationale wird unten eigens geprüft.
  const werte = (a) =>
    (a.fehlerbilder ?? []).flatMap((b) => {
      try {
        return [auswerteExakt(b.wert, {})];
      } catch (fehler) {
        return fehler.irrational ? [] : [null];
      }
    });
  const dabei = (liste, soll) => liste.some((w) => w !== null && bruchGleich(w, soll));

  for (let i = 0; i < 30; i++) {
    {
      const a = erzeugeAufgabe('prozentGrundaufgabe', naechste);
      const [, p, g] = /^Wie viel sind (\d+) % von (\d+)\?$/.exec(a.frage).map(Number);
      wahr(
        `${a.frage}: der Prozentsatz als ganze Zahl gelesen ergibt ${g * p}`,
        dabei(werte(a), bruch(g * p))
      );
    }
    {
      const a = erzeugeAufgabe('formelUmstellen', naechste);
      const t = /für ([a-zA-Z]) = (\d+) und ([a-zA-Z]) = (\d+)\.$/.exec(a.frage);
      const [oben, unten] = [Number(t[2]), Number(t[4])];
      const w = werte(a);
      wahr(`${a.frage}: mal statt geteilt`, dabei(w, bruch(oben * unten)));
      wahr(`${a.frage}: Kehrwert statt Division`, dabei(w, bruch(unten, oben)));
    }
    {
      const a = erzeugeAufgabe('formelMitPotenz', naechste);
      const [, s, g] = /für s = (\d+) und g = (\d+)\.$/.exec(a.frage).map(Number);
      // Die Wurzel vergessen heißt: bei t² stehen bleiben.
      wahr(`${a.frage}: die Wurzel vergessen`, dabei(werte(a), bruch(2 * s, g)));
      // Und das ½ übersehen heißt: nur durch g teilen. Das ist meistens
      // irrational — verglichen wird deshalb über wertgleich, nicht in
      // Brüchen.
      wahr(
        `${a.frage}: das ½ übersehen`,
        (a.fehlerbilder ?? []).some((b) => wertgleich(b.wert, wurzel(zahl(bruch(s, g)))))
      );
    }
    {
      const a = erzeugeAufgabe('prozentZurueck', naechste);
      const t = /^Nach (\d+) % (Aufschlag|Rabatt) kostet ein Artikel (\d+) €\. /.exec(a.frage);
      const p = Number(t[1]);
      const neu = Number(t[3]);
      // Die Prozentfalle: p % vom NEUEN Wert abgezogen (beim Rabatt:
      // daraufgeschlagen). Genau die Rechnung, die fast alle machen.
      const falle = t[2] === 'Aufschlag' ? bruch(neu * (100 - p), 100) : bruch(neu * (100 + p), 100);
      wahr(`${a.frage}: die Prozentfalle steht als Fehlerbild da`, dabei(werte(a), falle));
    }
  }
});

pruefung(`Jedes neue Fehlerbild wird erkannt (je ${DURCHGAENGE} Stück)`, () => {
  // Die bestehende Prüfung tut das für eine einzige erzeugte Aufgabe je
  // Thema. Bei den Prozentaufgaben hängt der Text aber an den gezogenen
  // Zahlen — und ein Bild, das nur bei bestimmten Zahlen danebengeht,
  // fiele so nicht auf.
  for (const id of Object.keys(PROBEN)) {
    const naechste = wuerfel(startwertFuer(`erkannt-${id}`));
    let fehler = null;

    for (let i = 0; i < DURCHGAENGE && fehler === null; i++) {
      const a = erzeugeAufgabe(id, naechste);
      for (const bild of a.fehlerbilder ?? []) {
        const eingabe = termAlsText(bild.wert);
        const geprueft = pruefeAntwort(a, eingabe);
        if (geprueft.richtig) {
          fehler = `"${a.frage}": das Fehlerbild ${eingabe} gilt als richtig`;
        } else if (geprueft.erkannt !== true) {
          fehler = `"${a.frage}": ${eingabe} wird nicht als bekannter Fehler erkannt (${geprueft.grund})`;
        } else if (geprueft.grund.length <= 40) {
          fehler = `"${a.frage}": die Diagnose zu ${eingabe} erklärt nichts: ${geprueft.grund}`;
        }
        if (fehler) {
          break;
        }
      }
      // Und die Musterlösung bleibt richtig.
      if (fehler === null && !pruefeAntwort(a, a.loesungText).richtig) {
        fehler = `"${a.frage}": die Musterlösung ${a.loesungText} wird abgelehnt`;
      }
    }

    wahr(`${id}: alle Fehlerbilder werden benannt`, fehler === null, fehler ?? undefined);
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
