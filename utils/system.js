// Lineare Gleichungssysteme mit zwei Unbekannten — Schritt für Schritt.
//
//     I    3x + 2y = 7
//     II    x −  y = 1
//                      | II · 2
//     I    3x + 2y = 7
//     II   2x − 2y = 2
//                      | I + II
//     I    3x + 2y = 7
//     II   5x      = 9
//
// Warum eine eigene Datei neben gleichung.js? Aus demselben Grund, aus
// dem ungleichung.js daneben steht: Die tragende Aussage ist eine
// andere.
//
//   term.js:        jeder Schritt lässt den WERT gleich
//   gleichung.js:   jeder Schritt lässt die LÖSUNGSMENGE gleich
//   ungleichung.js: dasselbe, aber ein Zeichen kann sich drehen
//   system.js:      jeder Schritt lässt die Lösungsmenge des SYSTEMS
//                   gleich — und die besteht aus PAAREN (x | y)
//
// Der Unterschied ist nicht akademisch. Eine einzelne Zeile darf sich
// beim Umformen sehr wohl ändern: Aus II wird I + II, und das ist eine
// ganz andere Gleichung. Erlaubt ist es trotzdem, weil das PAAR, das
// beide Zeilen zugleich löst, dasselbe bleibt. Wer hier die einzelne
// Zeile prüfte statt das System, würde jeden richtigen Schritt für
// falsch halten.
//
// Deshalb ist jeder Zwischenstand hier wieder ein SYSTEM, nie eine
// einzelne Gleichung. Auch "y = 3" steht als zweite Zeile eines Systems
// da. Das kostet nichts und macht den ganzen Weg mit einer einzigen
// Invariante prüfbar.
//
// Umfang: zwei lineare Gleichungen, zwei Unbekannte. Was darüber
// hinausgeht, sagt die Datei — sie rät nichts.

import {
  bruch,
  plus,
  minus,
  mal,
  geteilt,
  negativ,
  kehrwert,
  istNull,
  istGanz,
  istNegativ,
  gleich as bruchGleich,
  betrag,
} from './bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  istTerm,
  variablen,
  auswerteExakt,
  alsText as termAlsText,
  zahlAlsText,
  multipliziereAus,
} from './term.js';
import { gleichung, istGleichung, alsText as gleichungAlsText } from './gleichung.js';

// Im deutschen Unterricht heißen die Zeilen I und II.
export const ZEILEN = Object.freeze(['I', 'II']);

// Die drei Verfahren, die im Unterricht vorkommen. Alle drei führen zum
// selben Ergebnis — sie unterscheiden sich darin, WORAN man sie
// erkennt und wann sie bequem sind.
export const VERFAHREN = Object.freeze({
  addition: {
    name: 'Additionsverfahren',
    wann: 'Bequem, wenn bei einer Unbekannten in beiden Zeilen dieselbe Zahl steht — oder sich leicht herstellen lässt.',
  },
  einsetzen: {
    name: 'Einsetzungsverfahren',
    wann: 'Bequem, wenn eine Zeile schon nach einer Unbekannten aufgelöst ist, etwa y = 2x − 1.',
  },
  gleichsetzen: {
    name: 'Gleichsetzungsverfahren',
    wann: 'Bequem, wenn beide Zeilen nach derselben Unbekannten aufgelöst sind — dann müssen die rechten Seiten übereinstimmen.',
  },
});

// ---------------------------------------------------------------------
// Das System
// ---------------------------------------------------------------------

export function system(erste, zweite) {
  if (!istGleichung(erste) || !istGleichung(zweite)) {
    throw new Error('system: beide Zeilen müssen Gleichungen sein');
  }
  return Object.freeze({ gleichungen: Object.freeze([erste, zweite]) });
}

export function istSystem(wert) {
  return (
    typeof wert === 'object' &&
    wert !== null &&
    Array.isArray(wert.gleichungen) &&
    wert.gleichungen.length === 2 &&
    wert.gleichungen.every(istGleichung)
  );
}

export function alsText(s) {
  pruefeSystem(s, 'alsText');
  return s.gleichungen.map((g, i) => `${ZEILEN[i]}  ${gleichungAlsText(g)}`).join('\n');
}

function pruefeSystem(wert, wo) {
  if (!istSystem(wert)) {
    throw new Error(`${wo}: das ist kein Gleichungssystem`);
  }
  return wert;
}

// Löst dieses Paar BEIDE Zeilen? Nur dann ist es eine Lösung des
// Systems — eine Zeile allein genügt nicht.
export function istErfuellt(s, belegung) {
  pruefeSystem(s, 'istErfuellt');
  try {
    return s.gleichungen.every((g) =>
      bruchGleich(auswerteExakt(g.links, belegung), auswerteExakt(g.rechts, belegung))
    );
  } catch (fehler) {
    if (fehler.zuGross) {
      throw fehler;
    }
    return false;
  }
}

// ---------------------------------------------------------------------
// Die lineare Form: a·x + b·y + c
// ---------------------------------------------------------------------
//
// Bestimmt wird sie STRUKTURELL, nicht durch Einsetzen. Dieselbe
// Begründung wie bei den Koeffizienten in gleichung.js: Wer an drei
// Stellen misst, kann nicht ausschließen, dass dort x·y steht — an drei
// Punkten sieht das aus wie eine Ebene, ist aber keine.
//
// Rückgabe ist null, wenn der Term nicht linear ist. null heißt
// ausdrücklich "kann ich nicht", nicht "ist null".

function linearform(term, namen) {
  if (variablen(term).some((n) => !namen.includes(n))) {
    return null;
  }

  switch (term.art) {
    case 'zahl':
      return { koeffizienten: leereKoeffizienten(namen), konstante: term.wert };

    case 'variable': {
      const koeffizienten = leereKoeffizienten(namen);
      koeffizienten[term.name] = bruch(1);
      return { koeffizienten, konstante: bruch(0) };
    }

    case 'summe': {
      let aus = { koeffizienten: leereKoeffizienten(namen), konstante: bruch(0) };
      for (const teil of term.teile) {
        const f = linearform(teil, namen);
        if (f === null) {
          return null;
        }
        aus = addiereFormen(aus, f, namen);
      }
      return aus;
    }

    case 'produkt': {
      // Höchstens EIN Faktor darf eine Unbekannte enthalten. x · y ist
      // nicht linear — und genau das ist der Fall, den man übersieht.
      let form = { koeffizienten: leereKoeffizienten(namen), konstante: bruch(1) };
      for (const teil of term.teile) {
        const f = linearform(teil, namen);
        if (f === null) {
          return null;
        }
        const formHatVariable = namen.some((n) => !istNull(form.koeffizienten[n]));
        const teilHatVariable = namen.some((n) => !istNull(f.koeffizienten[n]));
        if (formHatVariable && teilHatVariable) {
          return null;
        }
        form = malForm(form, f, namen, teilHatVariable);
      }
      return form;
    }

    case 'quotient': {
      const nenner = linearform(term.nenner, namen);
      if (nenner === null || namen.some((n) => !istNull(nenner.koeffizienten[n]))) {
        return null; // durch eine Unbekannte teilen ist nicht linear
      }
      if (istNull(nenner.konstante)) {
        return null;
      }
      const zaehler = linearform(term.zaehler, namen);
      if (zaehler === null) {
        return null;
      }
      const koeffizienten = leereKoeffizienten(namen);
      for (const n of namen) {
        koeffizienten[n] = geteilt(zaehler.koeffizienten[n], nenner.konstante);
      }
      return { koeffizienten, konstante: geteilt(zaehler.konstante, nenner.konstante) };
    }

    default: {
      // Potenzen, Wurzeln, Beträge: nur erlaubt, wenn keine Unbekannte
      // darin steckt — dann ist es schlicht eine Zahl.
      if (variablen(term).length > 0) {
        return null;
      }
      try {
        return { koeffizienten: leereKoeffizienten(namen), konstante: auswerteExakt(term) };
      } catch {
        return null;
      }
    }
  }
}

function leereKoeffizienten(namen) {
  const aus = {};
  for (const n of namen) {
    aus[n] = bruch(0);
  }
  return aus;
}

function addiereFormen(a, b, namen) {
  const koeffizienten = {};
  for (const n of namen) {
    koeffizienten[n] = plus(a.koeffizienten[n], b.koeffizienten[n]);
  }
  return { koeffizienten, konstante: plus(a.konstante, b.konstante) };
}

function malForm(form, faktor, namen, faktorHatVariable) {
  const koeffizienten = {};
  if (faktorHatVariable) {
    for (const n of namen) {
      koeffizienten[n] = mal(faktor.koeffizienten[n], form.konstante);
    }
    return { koeffizienten, konstante: mal(faktor.konstante, form.konstante) };
  }
  for (const n of namen) {
    koeffizienten[n] = mal(form.koeffizienten[n], faktor.konstante);
  }
  return { koeffizienten, konstante: mal(form.konstante, faktor.konstante) };
}

// Eine Gleichung als a·x + b·y = c. Zurück kommt { a, b, c } oder null.
function alsZeile(g, namen) {
  const links = linearform(g.links, namen);
  const rechts = linearform(g.rechts, namen);
  if (links === null || rechts === null) {
    return null;
  }
  const koeffizienten = {};
  for (const n of namen) {
    koeffizienten[n] = minus(links.koeffizienten[n], rechts.koeffizienten[n]);
  }
  return { koeffizienten, konstante: minus(rechts.konstante, links.konstante) };
}

// Und zurück: aus { a, b, c } wieder eine Gleichung.
function alsGleichung(zeile, namen) {
  const glieder = [];
  for (const n of namen) {
    const k = zeile.koeffizienten[n];
    if (istNull(k)) {
      continue;
    }
    glieder.push(bruchGleich(k, bruch(1)) ? variable(n) : produkt(zahl(k), variable(n)));
  }
  const linkeSeite = glieder.length === 0 ? zahl(bruch(0)) : glieder.length === 1 ? glieder[0] : summe(...glieder);
  return gleichung(linkeSeite, zahl(zeile.konstante));
}

// ---------------------------------------------------------------------
// Umformen
// ---------------------------------------------------------------------

function schritt(operation, s) {
  return { operation, system: s, text: alsText(s) };
}

// "I · 3" — und bei einer negativen Zahl mit Klammer, sonst liest es
// sich wie ein Minus.
function malText(zeile, faktor) {
  const t = zahlAlsText(faktor);
  return `${zeile} · ${istNegativ(faktor) ? `(${t})` : t}`;
}

function malZeile(zeile, faktor, namen) {
  const koeffizienten = {};
  for (const n of namen) {
    koeffizienten[n] = mal(zeile.koeffizienten[n], faktor);
  }
  return { koeffizienten, konstante: mal(zeile.konstante, faktor) };
}

function plusZeile(a, b, namen) {
  const koeffizienten = {};
  for (const n of namen) {
    koeffizienten[n] = plus(a.koeffizienten[n], b.koeffizienten[n]);
  }
  return { koeffizienten, konstante: plus(a.konstante, b.konstante) };
}

// ---------------------------------------------------------------------
// Lösen
// ---------------------------------------------------------------------
//
// Ergebnis ist immer ein Objekt mit `art`:
//
//   'eindeutig' — genau ein Paar, in `loesung` als { x: Term, y: Term }
//   'keine'     — die Geraden sind parallel
//   'alle'      — es ist dieselbe Gerade, unendlich viele Paare
//   'unklar'    — diese Datei kann es nicht; `grund` sagt warum

export function loese(s, verfahren = 'addition') {
  pruefeSystem(s, 'loese');
  if (!(verfahren in VERFAHREN)) {
    throw new Error(`loese: "${verfahren}" ist kein bekanntes Verfahren`);
  }

  const namen = [
    ...new Set(s.gleichungen.flatMap((g) => [...variablen(g.links), ...variablen(g.rechts)])),
  ].sort();

  if (namen.length === 0) {
    return unklar('In diesem System kommt gar keine Unbekannte vor.', [], s);
  }
  if (namen.length !== 2) {
    return unklar(
      `Hier werden zwei Unbekannte erwartet, gefunden ${namen.length} (${namen.join(', ')}). ` +
        'Systeme mit einer oder mit mehr als zwei Unbekannten kann diese Datei noch nicht.',
      [],
      s
    );
  }

  const zeilen = s.gleichungen.map((g) => alsZeile(g, namen));
  if (zeilen.some((z) => z === null)) {
    return unklar(
      'Mindestens eine Zeile ist nicht linear. Produkte wie x · y, Potenzen und ' +
        'Unbekannte im Nenner kann diese Datei noch nicht lösen.',
      [],
      s
    );
  }

  // Erst aufräumen: alles mit Unbekannten nach links, die Zahlen nach
  // rechts. Ohne diesen Schritt stünde bei "3x = 7 − 2y" das y rechts,
  // und alles Weitere würde unlesbar.
  const schritte = [];
  let aktuell = s;
  const geordnet = system(alsGleichung(zeilen[0], namen), alsGleichung(zeilen[1], namen));
  if (alsText(geordnet) !== alsText(s)) {
    aktuell = geordnet;
    schritte.push(schritt('beide Zeilen ordnen: Unbekannte links, Zahlen rechts', aktuell));
  }

  const gewaehlt = VERFAHREN[verfahren];
  const ergebnis =
    verfahren === 'addition'
      ? mitAddition(zeilen, namen, schritte, aktuell)
      : verfahren === 'einsetzen'
        ? mitEinsetzen(zeilen, namen, schritte, aktuell)
        : mitGleichsetzen(zeilen, namen, schritte, aktuell);

  return { ...ergebnis, verfahren, verfahrenName: gewaehlt.name };
}

function unklar(grund, schritte, s) {
  return { art: 'unklar', grund, schritte, system: s };
}

// Beide Zeilen ohne Unbekannte — dann entscheidet die Zahlenaussage.
function entartet(zeilen, namen, schritte, s) {
  const [a, b] = zeilen;
  const stimmtA = istNull(a.konstante);
  const stimmtB = istNull(b.konstante);
  if (stimmtA && stimmtB) {
    return {
      art: 'alle',
      grund:
        'Beide Zeilen beschreiben dieselbe Gerade. Jeder Punkt darauf löst das System — es gibt unendlich viele Lösungen.',
      schritte,
      system: s,
    };
  }
  return {
    art: 'keine',
    grund:
      'Die Unbekannten fallen heraus und übrig bleibt eine falsche Aussage. Die beiden Geraden sind parallel und schneiden sich nie — es gibt keine Lösung.',
    schritte,
    system: s,
  };
}

// ---------------------------------------------------------------------
// Additionsverfahren
// ---------------------------------------------------------------------
//
// Beide Zeilen werden so erweitert, dass bei einer Unbekannten
// entgegengesetzt gleiche Zahlen stehen. Addiert man sie dann, fällt
// diese Unbekannte heraus.
//
// Wichtig für die Prüfbarkeit: Ersetzt wird nur ZEILE II, Zeile I bleibt
// stehen. Das System { I, I + II } hat dieselben Lösungen wie { I, II }
// — und deshalb ist jeder Zwischenstand wieder ein gültiges System.

function mitAddition(zeilen, namen, schritte, s) {
  const [erst, zweit] = namen;
  let [a, b] = zeilen;

  // Welche Unbekannte lässt sich leichter herauswerfen?
  const wegName = istNull(a.koeffizienten[erst]) || istNull(b.koeffizienten[erst]) ? zweit : erst;
  const bleibt = wegName === erst ? zweit : erst;

  const ka = a.koeffizienten[wegName];
  const kb = b.koeffizienten[wegName];

  if (istNull(ka) && istNull(kb)) {
    return entartet([a, b], namen, schritte, s);
  }

  let aktuell = s;

  // I mal etwas, II mal etwas — so wenig wie möglich. Steht in beiden
  // Zeilen schon dieselbe Zahl, wird nichts multipliziert.
  if (!istNull(ka) && !istNull(kb)) {
    const faktorB = negativ(geteilt(ka, kb));
    if (!bruchGleich(faktorB, bruch(1))) {
      b = malZeile(b, faktorB, namen);
      aktuell = system(alsGleichung(a, namen), alsGleichung(b, namen));
      schritte.push(schritt(malText(ZEILEN[1], faktorB), aktuell));
    }
    b = plusZeile(b, a, namen);
    aktuell = system(alsGleichung(a, namen), alsGleichung(b, namen));
    schritte.push(schritt(`${ZEILEN[1]} + ${ZEILEN[0]}  —  ${wegName} fällt heraus`, aktuell));
  }

  return ausEinerZeile(a, b, bleibt, wegName, namen, schritte, aktuell);
}

// ---------------------------------------------------------------------
// Einsetzungsverfahren
// ---------------------------------------------------------------------
//
// Eine Zeile nach einer Unbekannten auflösen und den Ausdruck in die
// andere einsetzen. Gerechnet wird das hier über die lineare Form; im
// Ergebnis steht derselbe Schritt, den man von Hand schreibt.

function mitEinsetzen(zeilen, namen, schritte, s) {
  const [a, b] = zeilen;
  const [erst, zweit] = namen;

  // Aufgelöst wird nach der Unbekannten, bei der in Zeile I eine Zahl
  // steht, die das Rechnen nicht unnötig verkompliziert.
  const nachName = !istNull(a.koeffizienten[erst]) ? erst : zweit;
  const anderName = nachName === erst ? zweit : erst;

  if (istNull(a.koeffizienten[nachName])) {
    return entartet([a, b], namen, schritte, s);
  }

  // I nach `nachName` auflösen: x = (c − b·y) / a
  const teiler = a.koeffizienten[nachName];
  const aufgeloest = {
    koeffizienten: leereKoeffizienten(namen),
    konstante: geteilt(a.konstante, teiler),
  };
  aufgeloest.koeffizienten[nachName] = bruch(1);
  aufgeloest.koeffizienten[anderName] = bruch(0);
  const ausdruckKoeffizient = negativ(geteilt(a.koeffizienten[anderName], teiler));

  const ausdruck = bauTerm(ausdruckKoeffizient, anderName, geteilt(a.konstante, teiler));
  let aktuell = system(gleichung(variable(nachName), ausdruck), alsGleichung(b, namen));
  schritte.push(schritt(`${ZEILEN[0]} nach ${nachName} auflösen`, aktuell));

  // In II einsetzen: der Koeffizient von `nachName` wird ersetzt.
  const k = b.koeffizienten[nachName];
  const neu = {
    koeffizienten: leereKoeffizienten(namen),
    konstante: minus(b.konstante, mal(k, geteilt(a.konstante, teiler))),
  };
  neu.koeffizienten[anderName] = plus(b.koeffizienten[anderName], mal(k, ausdruckKoeffizient));
  neu.koeffizienten[nachName] = bruch(0);

  aktuell = system(gleichung(variable(nachName), ausdruck), alsGleichung(neu, namen));
  schritte.push(schritt(`${nachName} in ${ZEILEN[1]} einsetzen  —  ${nachName} fällt heraus`, aktuell));

  return ausEinerZeile(a, neu, anderName, nachName, namen, schritte, aktuell);
}

// ---------------------------------------------------------------------
// Gleichsetzungsverfahren
// ---------------------------------------------------------------------
//
// Beide Zeilen nach DERSELBEN Unbekannten auflösen. Steht links beide
// Male dasselbe, müssen auch die rechten Seiten übereinstimmen.

function mitGleichsetzen(zeilen, namen, schritte, s) {
  const [a, b] = zeilen;
  const [erst, zweit] = namen;

  const nachName =
    !istNull(a.koeffizienten[erst]) && !istNull(b.koeffizienten[erst]) ? erst : zweit;
  const anderName = nachName === erst ? zweit : erst;

  if (istNull(a.koeffizienten[nachName]) || istNull(b.koeffizienten[nachName])) {
    // Eine der beiden Zeilen enthält die Unbekannte gar nicht — dann
    // ist Gleichsetzen nicht möglich, aber Einsetzen schon.
    return mitEinsetzen(zeilen, namen, schritte, s);
  }

  const seite = (zeile) => {
    const teiler = zeile.koeffizienten[nachName];
    return {
      koeffizient: negativ(geteilt(zeile.koeffizienten[anderName], teiler)),
      konstante: geteilt(zeile.konstante, teiler),
    };
  };

  const sa = seite(a);
  const sb = seite(b);

  let aktuell = system(
    gleichung(variable(nachName), bauTerm(sa.koeffizient, anderName, sa.konstante)),
    gleichung(variable(nachName), bauTerm(sb.koeffizient, anderName, sb.konstante))
  );
  schritte.push(schritt(`beide Zeilen nach ${nachName} auflösen`, aktuell));

  // Gleichsetzen: die beiden rechten Seiten müssen übereinstimmen.
  const neu = { koeffizienten: leereKoeffizienten(namen), konstante: minus(sb.konstante, sa.konstante) };
  neu.koeffizienten[anderName] = minus(sa.koeffizient, sb.koeffizient);
  neu.koeffizienten[nachName] = bruch(0);

  aktuell = system(
    gleichung(variable(nachName), bauTerm(sa.koeffizient, anderName, sa.konstante)),
    alsGleichung(neu, namen)
  );
  schritte.push(
    schritt(`beide rechten Seiten gleichsetzen  —  ${nachName} fällt heraus`, aktuell)
  );

  return ausEinerZeile(a, neu, anderName, nachName, namen, schritte, aktuell);
}

// k · name + konstante, aber ohne die Glieder, die man nicht schreibt.
function bauTerm(koeffizient, name, konstante) {
  const glieder = [];
  if (!istNull(koeffizient)) {
    glieder.push(
      bruchGleich(koeffizient, bruch(1)) ? variable(name) : produkt(zahl(koeffizient), variable(name))
    );
  }
  if (!istNull(konstante) || glieder.length === 0) {
    glieder.push(zahl(konstante));
  }
  return glieder.length === 1 ? glieder[0] : summe(...glieder);
}

// ---------------------------------------------------------------------
// Der gemeinsame Schluss
// ---------------------------------------------------------------------
//
// Alle drei Verfahren enden an derselben Stelle: In Zeile II steht nur
// noch eine Unbekannte. Ab hier ist der Weg für alle drei gleich, und
// deshalb steht er nur einmal da.

function ausEinerZeile(erstZeile, restZeile, bleibt, weg, namen, schritte, s) {
  const k = restZeile.koeffizienten[bleibt];

  if (istNull(k)) {
    return entartet(
      [
        { koeffizienten: leereKoeffizienten(namen), konstante: bruch(0) },
        { koeffizienten: leereKoeffizienten(namen), konstante: restZeile.konstante },
      ],
      namen,
      schritte,
      s
    );
  }

  const wert = geteilt(restZeile.konstante, k);
  let aktuell = s;

  if (!bruchGleich(k, bruch(1))) {
    const geloest = { koeffizienten: leereKoeffizienten(namen), konstante: wert };
    geloest.koeffizienten[bleibt] = bruch(1);
    aktuell = system(s.gleichungen[0], alsGleichung(geloest, namen));
    schritte.push(schritt(`${ZEILEN[1]} nach ${bleibt} auflösen`, aktuell));
  }

  // Zurück in Zeile I: die zweite Unbekannte ausrechnen.
  const kWeg = erstZeile.koeffizienten[weg];
  const wertWeg = istNull(kWeg)
    ? bruch(0)
    : geteilt(minus(erstZeile.konstante, mal(erstZeile.koeffizienten[bleibt], wert)), kWeg);

  const zeileWeg = { koeffizienten: leereKoeffizienten(namen), konstante: wertWeg };
  zeileWeg.koeffizienten[weg] = bruch(1);
  const zeileBleibt = { koeffizienten: leereKoeffizienten(namen), konstante: wert };
  zeileBleibt.koeffizienten[bleibt] = bruch(1);

  aktuell = system(alsGleichung(zeileWeg, namen), alsGleichung(zeileBleibt, namen));
  schritte.push(
    schritt(`${bleibt} = ${zahlAlsText(wert)} in ${ZEILEN[0]} einsetzen`, aktuell)
  );

  const loesung = {};
  loesung[bleibt] = zahl(wert);
  loesung[weg] = zahl(wertWeg);

  return { art: 'eindeutig', loesung, schritte, system: aktuell };
}

// ---------------------------------------------------------------------
// Probe und Ausgabe
// ---------------------------------------------------------------------

// Die Probe rechnet gegen das URSPRÜNGLICHE System — genau wie bei den
// Gleichungen. Ein Fehler im Rechenweg fällt damit auch dann auf, wenn
// alle folgenden Schritte sauber waren.
export function probe(s, loesung) {
  pruefeSystem(s, 'probe');
  const belegung = {};
  for (const name of Object.keys(loesung)) {
    belegung[name] = auswerteExakt(loesung[name]);
  }

  return s.gleichungen.map((g) => {
    const links = auswerteExakt(g.links, belegung);
    const rechts = auswerteExakt(g.rechts, belegung);
    return { links, rechts, stimmt: bruchGleich(links, rechts) };
  });
}

export function loesungAlsText(ergebnis) {
  if (ergebnis.art === 'keine') {
    return 'keine Lösung';
  }
  if (ergebnis.art === 'alle') {
    return 'unendlich viele Lösungen';
  }
  if (ergebnis.art !== 'eindeutig') {
    return '';
  }
  const namen = Object.keys(ergebnis.loesung).sort();
  return namen.map((n) => `${n} = ${termAlsText(ergebnis.loesung[n])}`).join(',  ');
}

export function alsRechenweg(s, ergebnis) {
  const zeilen = alsText(s).split('\n');
  for (const t of ergebnis.schritte) {
    zeilen.push(`         | ${t.operation}`);
    zeilen.push(...t.text.split('\n'));
  }
  return zeilen;
}
