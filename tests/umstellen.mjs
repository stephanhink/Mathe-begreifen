// Prüfungen für das Umstellen von Formeln.
//
// Die tragende Prüfung ist hier eine Gegenprobe: Wer eine Formel
// umstellt, darf sie nicht verändern. Also wird für jede Formel und
// jede Größe umgestellt und danach mit Zahlen nachgerechnet — die
// ursprüngliche Formel und die umgestellte müssen dieselben Werte
// liefern.
//
// Das fängt genau den Fehler, der beim Umstellen naheliegt: ein Schritt
// auf nur einer Seite, oder ein Vorzeichen, das unterwegs kippt. Jede
// einzelne Zeile sieht dann richtig aus.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch } from '../utils/bruch.js';
import { auswerte, variablen, alsText as termAlsText } from '../utils/term.js';
import { gleichung, alsText as gleichungAlsText } from '../utils/gleichung.js';
import { parseGleichung } from '../utils/parser.js';
import { stelleUm, alsRechenweg, FORMELN, holeFormel } from '../utils/umstellen.js';

// ---------------------------------------------------------------------

pruefung('Das Beispiel aus dem Konzept', () => {
  // "v = s/t nach t umstellen" steht wörtlich in CLAUDE.md.
  const formel = parseGleichung('v = s/t');
  const e = stelleUm(formel, 't');

  gleichText('es geht auf', e.art, 'fertig');
  gleichText('links steht t', termAlsText(e.ergebnis.links), 't');
  gleichText('rechts s : v', termAlsText(e.ergebnis.rechts), 's : v');

  // Und der Vorbehalt wird genannt, nicht verschwiegen.
  wahr('t ≠ 0 wird gesagt', e.vorbehalte.some((v) => v.includes('t ≠ 0')));
  wahr('v ≠ 0 auch', e.vorbehalte.some((v) => v.includes('v ≠ 0')));
});

pruefung('Die vier Grundfälle', () => {
  // Summe: das andere abziehen.
  const summe = stelleUm(parseGleichung('y = m*x + b'), 'b');
  gleichText('y = mx + b nach b', termAlsText(summe.ergebnis.rechts), 'y − m · x');

  // Produkt: durch das andere teilen.
  const produkt = stelleUm(parseGleichung('U = R*I'), 'R');
  gleichText('U = R·I nach R', termAlsText(produkt.ergebnis.rechts), 'U : I');
  wahr('mit Vorbehalt', produkt.vorbehalte.some((v) => v.includes('I ≠ 0')));

  // Bruch, Zielgröße im Zähler.
  const zaehler = stelleUm(parseGleichung('v = s/t'), 's');
  gleichText('v = s : t nach s', termAlsText(zaehler.ergebnis.rechts), 'v · t');

  // Potenz: Wurzel ziehen.
  const potenz = stelleUm(parseGleichung('A = p*r^2'), 'r');
  gleichText('A = p·r² nach r', termAlsText(potenz.ergebnis.rechts), '√(A : p)');
  wahr('der Hinweis auf die negative Lösung fehlt nicht',
    potenz.vorbehalte.some((v) => v.includes('negative Lösung')));
});

pruefung('Auch rückwärts und über mehrere Schritte', () => {
  // Die Zielgröße steht rechts — die Seiten werden getauscht.
  const rechts = stelleUm(parseGleichung('12 = 3x'), 'x');
  gleichText('x = 4', gleichungAlsText(rechts.ergebnis), 'x = 4');
  wahr('das Tauschen steht als Schritt da',
    rechts.schritte.some((s) => s.operation.includes('tauschen')));

  // Mehrere Schichten: erst mal t, dann durch v.
  const mehrere = stelleUm(parseGleichung('v = s/t'), 't');
  wahr('braucht mehrere Schritte', mehrere.schritte.length >= 2);

  // Wurzel auf der linken Seite: quadrieren.
  const wurzel = stelleUm(parseGleichung('c = √(a)'), 'a');
  gleichText('c = √a nach a', termAlsText(wurzel.ergebnis.rechts), 'c²');
  wahr('mit dem Vorbehalt zum Quadrieren',
    wurzel.vorbehalte.some((v) => v.includes('nicht negativ')));

  // Der Fallweg: erst die Brüche, dann die Wurzel.
  const fall = stelleUm(parseGleichung('s = 1/2*g*t^2'), 't');
  gleichText('es geht auf', fall.art, 'fertig');
  gleichText('t steht links', termAlsText(fall.ergebnis.links), 't');
});

pruefung('Was nicht geht, wird gesagt', () => {
  // Kommt die Größe gar nicht vor, gibt es nichts umzustellen.
  const fehlt = stelleUm(parseGleichung('v = s/t'), 'q');
  gleichText('unklar', fehlt.art, 'unklar');
  wahr('mit Begründung', fehlt.grund.includes('kommt') && fehlt.grund.includes('nicht vor'));

  // Mehrfach: dafür müsste man erst zusammenfassen.
  const mehrfach = stelleUm(parseGleichung('y = a*x + x'), 'x');
  gleichText('auch unklar', mehrfach.art, 'unklar');
  wahr('und sagt warum', mehrfach.grund.includes('mehrfach'));

  wirft('ohne Zielgröße', () => stelleUm(parseGleichung('v = s/t'), ''));
});

// ---------------------------------------------------------------------
// Die tragende Prüfung
// ---------------------------------------------------------------------

// Setzt in beide Formeln dieselben Zahlen ein und vergleicht. Die
// Zielgröße wird dabei aus der umgestellten Formel berechnet und in die
// ursprüngliche eingesetzt — stimmt sie dort, war das Umstellen richtig.
function stimmenUeberein(formel, ziel, ergebnis, belegung) {
  // Die umgestellte Formel liefert die Zielgröße.
  let wert;
  try {
    wert = auswerte(ergebnis.ergebnis.rechts, belegung);
  } catch {
    return null; // hier nicht auswertbar
  }
  if (!Number.isFinite(wert)) {
    return null;
  }

  // Eingesetzt in die ursprüngliche Formel müssen beide Seiten gleich sein.
  const voll = { ...belegung, [ziel]: wert };
  let links;
  let rechts;
  try {
    links = auswerte(formel.links, voll);
    rechts = auswerte(formel.rechts, voll);
  } catch {
    return null;
  }
  if (!Number.isFinite(links) || !Number.isFinite(rechts)) {
    return null;
  }

  const schranke = 1e-8 * Math.max(1, Math.abs(links), Math.abs(rechts));
  return Math.abs(links - rechts) <= schranke;
}

pruefung('Umgestellt ist dieselbe Formel — Gegenprobe mit Zahlen', () => {
  const naechste = wuerfel(startwertFuer('umstellen'));
  let geprueft = 0;
  let fehler = null;

  for (const eintrag of FORMELN) {
    const alle = [
      ...new Set([...variablen(eintrag.formel.links), ...variablen(eintrag.formel.rechts)]),
    ];

    for (const ziel of alle) {
      const e = stelleUm(eintrag.formel, ziel);
      if (e.art !== 'fertig') {
        continue; // was die Datei nicht kann, sagt sie — geprüft wird das oben
      }

      // Die übrigen Größen mit Zahlen belegen, positiv (es sind Längen,
      // Zeiten, Massen).
      for (let i = 0; i < 20 && fehler === null; i++) {
        const belegung = {};
        for (const name of alle) {
          if (name !== ziel) {
            belegung[name] = (naechste(90) + 10) / 10;
          }
        }

        const stimmt = stimmenUeberein(eintrag.formel, ziel, e, belegung);
        if (stimmt === null) {
          continue;
        }
        geprueft++;
        if (!stimmt) {
          const stelle = Object.entries(belegung)
            .map(([k, w]) => `${k} = ${w}`)
            .join(', ');
          fehler =
            `"${eintrag.text}" nach ${ziel}: ergibt ${gleichungAlsText(e.ergebnis)}, ` +
            `stimmt aber nicht bei ${stelle}`;
        }
      }
    }
  }

  wahr('jede Umstellung liefert dieselbe Formel', fehler === null, fehler ?? undefined);
  wahr('und es wurde wirklich gerechnet', geprueft >= 200, `nur ${geprueft} Proben`);
});

pruefung('Jede Formel ist vollständig beschrieben', () => {
  const ids = new Set();

  for (const f of FORMELN) {
    wahr(`${f.id}: eindeutig`, !ids.has(f.id));
    ids.add(f.id);

    wahr(`${f.id}: hat einen Titel`, Boolean(f.titel));
    wahr(`${f.id}: hat einen Formeltext`, Boolean(f.text));
    wahr(`${f.id}: hat eine Erklärung`, f.erklaerung.length > 20);

    // Jede vorkommende Größe muss benannt sein — sonst steht da ein
    // Buchstabe, von dem niemand weiß, wofür er steht.
    const alle = [...new Set([...variablen(f.formel.links), ...variablen(f.formel.rechts)])];
    for (const name of alle) {
      wahr(`${f.id}: die Größe ${name} ist benannt`, Boolean(f.groessen[name]));
    }

    // Und nach mindestens zwei Größen muss sie sich umstellen lassen.
    const gehen = alle.filter((ziel) => stelleUm(f.formel, ziel).art === 'fertig');
    wahr(`${f.id}: lässt sich nach mindestens zwei Größen umstellen`, gehen.length >= 2,
      `nur nach ${gehen.join(', ') || 'keiner'}`);
  }

  wahr('holeFormel findet eine bekannte', holeFormel('geschwindigkeit') !== null);
  wahr('und gibt bei unbekannter nichts zurück', holeFormel('gibtEsNicht') === null);
});

pruefung('Der Rechenweg als Zeilen', () => {
  const formel = parseGleichung('v = s/t');
  const zeilen = alsRechenweg(formel, stelleUm(formel, 't'));

  gleichText('erste Zeile ist die Formel', zeilen[0], 'v = s : t');
  wahr('die Schritte stehen eingerückt', zeilen[1].includes('|'));
  wahr('und die Vorbehalte in Klammern', zeilen.some((z) => z.trim().startsWith('(')));
  wahr('am Ende steht t allein', zeilen.some((z) => z.startsWith('t = ')));
});
