// Gleichungen lösen — Schritt für Schritt, mit benannten Umformungen.
//
//     3x + 5 = 14
//              | beide Seiten − 5
//     3x = 9
//              | beide Seiten : 3
//     x = 3
//
// Das ist das Beispiel aus CLAUDE.md, und es ist der ganze Zweck dieser
// Datei: Nicht "x = 3" ausgeben, sondern den Weg dorthin, in Sätzen, die
// man vorlesen kann.
//
// Warum eine eigene Datei und nicht in term.js? Weil "beide Seiten − 5"
// eine Aussage über eine GLEICHUNG ist, nicht über einen Term. Ein Term
// hat einen Wert, eine Gleichung hat eine Lösungsmenge — und die
// Umformungsregeln sind entsprechend verschieden. term.js muss jeden
// Schritt WERTGLEICH lassen, gleichung.js muss die LÖSUNGSMENGE gleich
// lassen. Das eine folgt nicht aus dem anderen.
//
// Umfang: lineare Gleichungen mit einer Variablen. Quadratische
// Gleichungen fehlen noch, weil pq- und abc-Formel Wurzeln brauchen und
// term.js die noch nicht kennt (siehe "Offene Punkte" in CLAUDE.md).
// Was diese Datei nicht kann, sagt sie — sie rät nichts.

import {
  bruch,
  plus,
  minus,
  mal,
  geteilt,
  hoch,
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

// ---------------------------------------------------------------------
// Die Gleichung
// ---------------------------------------------------------------------

export function gleichung(links, rechts) {
  if (!istTerm(links) || !istTerm(rechts)) {
    throw new Error('gleichung: beide Seiten müssen Terme sein');
  }
  return Object.freeze({ links, rechts });
}

export function istGleichung(wert) {
  return (
    typeof wert === 'object' && wert !== null && istTerm(wert.links) && istTerm(wert.rechts)
  );
}

export function alsText(g) {
  pruefeGleichung(g, 'alsText');
  return `${termAlsText(g.links)} = ${termAlsText(g.rechts)}`;
}

function pruefeGleichung(wert, wo) {
  if (!istGleichung(wert)) {
    throw new Error(`${wo}: das ist keine Gleichung`);
  }
  return wert;
}

// Stimmt die Gleichung an dieser Stelle? Beide Seiten werden exakt
// ausgewertet und verglichen.
//
// Wo eine Seite nicht definiert ist (Division durch null), ist die
// Gleichung dort nicht erfüllt — und zwar nicht "falsch", sondern
// "kommt nicht in Frage". Für die Lösungsmenge läuft das aufs selbe
// hinaus, und deshalb steht dafür `false` statt eines geworfenen
// Fehlers: Eine Definitionslücke ist keine Panne, sondern eine
// Eigenschaft der Gleichung.
//
// Ein Zahlenüberlauf ist etwas ganz anderes und wird deshalb
// durchgereicht: Er heißt "kann ich nicht ausrechnen", nicht "ist nicht
// erfüllt". Beides gleich zu behandeln hieße, auf eine offene Frage mit
// einem sachlichen Nein zu antworten.
export function istErfuellt(g, belegung) {
  pruefeGleichung(g, 'istErfuellt');
  try {
    return bruchGleich(auswerteExakt(g.links, belegung), auswerteExakt(g.rechts, belegung));
  } catch (fehler) {
    if (fehler.zuGross) {
      throw fehler;
    }
    return false;
  }
}

// Die Probe — das Ritual aus dem Unterricht, und zu Recht: Sie prüft
// das Ergebnis gegen die URSPRÜNGLICHE Gleichung, nicht gegen die
// umgeformte. Ein Fehler in der Umformung fällt damit auf, auch wenn
// alle folgenden Schritte sauber waren.
export function probe(g, wert, name = 'x') {
  pruefeGleichung(g, 'probe');
  const belegung = { [name]: wert };
  const links = auswerteExakt(g.links, belegung);
  const rechts = auswerteExakt(g.rechts, belegung);
  return {
    links,
    rechts,
    stimmt: bruchGleich(links, rechts),
    text:
      `${termAlsText(g.links)} = ${zahlAlsText(links)}   |   ` +
      `${termAlsText(g.rechts)} = ${zahlAlsText(rechts)}`,
  };
}

// ---------------------------------------------------------------------
// Ist der Term linear?
// ---------------------------------------------------------------------
//
// Gesucht ist die Darstellung a·x + b. Bestimmt wird sie strukturell,
// nicht durch Einsetzen: Wer an zwei Stellen misst und daraus auf eine
// Gerade schließt, wird von x² an genau zwei Punkten belogen.
//
// Rückgabe ist { a, b } als Brüche — oder null, wenn der Term nicht
// linear ist. null heißt hier ausdrücklich "kann ich nicht", nicht
// "ist null".

function linearform(term, name) {
  switch (term.art) {
    case 'zahl':
      return { a: bruch(0), b: term.wert };

    case 'variable':
      return term.name === name ? { a: bruch(1), b: bruch(0) } : null;

    case 'summe': {
      let a = bruch(0);
      let b = bruch(0);
      for (const teil of term.teile) {
        const f = linearform(teil, name);
        if (f === null) {
          return null;
        }
        a = plus(a, f.a);
        b = plus(b, f.b);
      }
      return { a, b };
    }

    case 'produkt': {
      let ergebnis = { a: bruch(0), b: bruch(1) };
      for (const teil of term.teile) {
        const f = linearform(teil, name);
        if (f === null) {
          return null;
        }
        // (a₁x + b₁)(a₂x + b₂) ist nur dann wieder linear, wenn
        // höchstens ein Faktor die Variable enthält. Sonst entsteht x².
        if (!istNull(ergebnis.a) && !istNull(f.a)) {
          return null;
        }
        ergebnis = {
          a: plus(mal(ergebnis.a, f.b), mal(ergebnis.b, f.a)),
          b: mal(ergebnis.b, f.b),
        };
      }
      return ergebnis;
    }

    case 'potenz': {
      const e = linearform(term.exponent, name);
      if (e === null || !istNull(e.a) || !istGanz(e.b)) {
        return null;
      }
      const n = e.b.z;
      const basis = linearform(term.basis, name);
      if (basis === null) {
        return null;
      }
      if (n === 1) {
        return basis;
      }
      // x⁰ ist NICHT einfach 1: An der Stelle x = 0 ist 0⁰ nicht
      // definiert. Die Gleichung x⁰ = 1 hat deshalb nicht alle Zahlen
      // als Lösung, sondern alle außer null. Diese Feinheit sauber
      // mitzuführen wäre möglich, aber die Datei würde sie zu leicht
      // wieder verlieren — also wird abgelehnt statt geraten. Dieselbe
      // Haltung wie bei x⁰ in term.js.
      if (!istNull(basis.a)) {
        return null;
      }
      if (n === 0 && istNull(basis.b)) {
        return null; // 0⁰
      }
      if (n < 0 && istNull(basis.b)) {
        return null; // Division durch null
      }
      return { a: bruch(0), b: hoch(basis.b, n) };
    }

    case 'quotient': {
      const nenner = linearform(term.nenner, name);
      // Steht die Variable im Nenner, ist die Gleichung nicht linear —
      // und der Definitionsbereich hat ein Loch. Beides Gründe genug.
      if (nenner === null || !istNull(nenner.a) || istNull(nenner.b)) {
        return null;
      }
      const zaehler = linearform(term.zaehler, name);
      if (zaehler === null) {
        return null;
      }
      return { a: geteilt(zaehler.a, nenner.b), b: geteilt(zaehler.b, nenner.b) };
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------
// Umformen
// ---------------------------------------------------------------------

function monom(koeffizient, name) {
  if (bruchGleich(koeffizient, bruch(1))) {
    return variable(name);
  }
  return produkt(zahl(koeffizient), variable(name));
}

// Eine Umformung auf beiden Seiten, mit Namen. Danach werden beide
// Seiten aufgeräumt — sonst stünde da "3x + 5 − 5 = 14 − 5" und der
// nächste Schritt wäre nicht zu erkennen.
function beideSeiten(g, wandle) {
  return gleichung(multipliziereAus(wandle(g.links)).term, multipliziereAus(wandle(g.rechts)).term);
}

function addiereBeidseitig(g, term) {
  return beideSeiten(g, (seite) => summe(seite, term));
}

function malBeidseitig(g, faktor) {
  return beideSeiten(g, (seite) => produkt(seite, zahl(faktor)));
}

// "− 5" statt "+ (−5)". Was man hinschreibt, soll man auch sagen können.
function strichText(wert) {
  return istNegativ(wert)
    ? `beide Seiten + ${zahlAlsText(betrag(wert))}`
    : `beide Seiten − ${zahlAlsText(wert)}`;
}

function strichTextMonom(koeffizient, name) {
  const zeichen = istNegativ(koeffizient) ? '+' : '−';
  const betragKoeffizient = betrag(koeffizient);
  const text = bruchGleich(betragKoeffizient, bruch(1))
    ? name
    : `${zahlAlsText(betragKoeffizient)}${name}`;
  return `beide Seiten ${zeichen} ${text}`;
}

// Durch 1/3 zu teilen schreibt niemand hin — man multipliziert mit 3.
function punktText(koeffizient) {
  if (istGanz(koeffizient)) {
    return `beide Seiten : ${zahlAlsText(koeffizient)}`;
  }
  return `beide Seiten · ${zahlAlsText(kehrwert(koeffizient))}`;
}

// ---------------------------------------------------------------------
// Lösen
// ---------------------------------------------------------------------

// Ergebnis ist immer ein Objekt mit `art`:
//
//   'eindeutig'  — genau eine Lösung, in `loesung` als Bruch
//   'keine'      — die Lösungsmenge ist leer (z. B. x + 1 = x + 2)
//   'alle'       — jede Zahl löst die Gleichung (z. B. 2(x+1) = 2x+2)
//   'unklar'     — diese Datei kann es nicht; `grund` sagt warum
//
// 'unklar' ist ausdrücklich ein gültiges Ergebnis und keine Ausnahme.
// Eine quadratische Gleichung ist keine Panne, sie ist nur nicht das,
// was diese Datei kann — und stillschweigend etwas Falsches zu liefern
// wäre schlimmer als zuzugeben, dass man nicht weiterweiß.
export function loese(g) {
  pruefeGleichung(g, 'loese');

  const namen = [...new Set([...variablen(g.links), ...variablen(g.rechts)])];
  if (namen.length > 1) {
    return {
      art: 'unklar',
      grund: `Diese Gleichung hat mehrere Variablen (${namen.join(', ')}). Hier wird nach genau einer aufgelöst.`,
      schritte: [],
      gleichung: g,
    };
  }

  const name = namen[0] ?? 'x';
  const schritte = [];
  let aktuell = g;

  // Schritt 0: Klammern auflösen und zusammenfassen. Nur aufnehmen,
  // wenn sich dabei wirklich etwas ändert.
  const aufgeraeumt = gleichung(multipliziereAus(g.links).term, multipliziereAus(g.rechts).term);
  if (alsText(aufgeraeumt) !== alsText(g)) {
    aktuell = aufgeraeumt;
    schritte.push(schritt('beide Seiten ausrechnen', aktuell));
  }

  const links = linearform(aktuell.links, name);
  const rechts = linearform(aktuell.rechts, name);

  if (links === null || rechts === null) {
    return {
      art: 'unklar',
      grund:
        'Diese Gleichung ist nicht linear. Quadratische Gleichungen, Wurzeln und ' +
        'Variablen im Nenner kann diese Datei noch nicht lösen.',
      schritte,
      gleichung: aktuell,
    };
  }

  // Alles mit x nach links.
  if (!istNull(rechts.a)) {
    aktuell = addiereBeidseitig(aktuell, monom(negativ(rechts.a), name));
    schritte.push(schritt(strichTextMonom(rechts.a, name), aktuell));
  }

  // Alles ohne x nach rechts.
  if (!istNull(links.b)) {
    aktuell = addiereBeidseitig(aktuell, zahl(negativ(links.b)));
    schritte.push(schritt(strichText(links.b), aktuell));
  }

  const koeffizient = minus(links.a, rechts.a);

  // Ist die Variable weggefallen, entscheidet die Zahlenaussage.
  if (istNull(koeffizient)) {
    const stimmt = bruchGleich(links.b, rechts.b);
    return {
      art: stimmt ? 'alle' : 'keine',
      grund: stimmt
        ? 'Die Variable fällt heraus und übrig bleibt eine wahre Aussage — jede Zahl löst die Gleichung.'
        : 'Die Variable fällt heraus und übrig bleibt eine falsche Aussage — es gibt keine Lösung.',
      schritte,
      gleichung: aktuell,
    };
  }

  // Durch den Koeffizienten teilen.
  if (!bruchGleich(koeffizient, bruch(1))) {
    aktuell = malBeidseitig(aktuell, kehrwert(koeffizient));
    schritte.push(schritt(punktText(koeffizient), aktuell));
  }

  const loesung = geteilt(minus(rechts.b, links.b), koeffizient);

  return { art: 'eindeutig', loesung, schritte, gleichung: aktuell };
}

function schritt(operation, g) {
  return { operation, gleichung: g, text: alsText(g) };
}

// ---------------------------------------------------------------------
// Aufschreiben
// ---------------------------------------------------------------------

// Der Rechenweg in der Form, die im Konzept steht: Die Umformung steht
// eingerückt ZWISCHEN den Zeilen, nicht daneben. So liest man sie als
// das, was sie ist — der Übergang von einer Zeile zur nächsten.
//
//     3x + 5 = 14
//              | beide Seiten − 5
//     3x = 9
export function alsRechenweg(g, ergebnis) {
  pruefeGleichung(g, 'alsRechenweg');
  const zeilen = [alsText(g)];

  for (const s of ergebnis.schritte) {
    zeilen.push(`         | ${s.operation}`);
    zeilen.push(s.text);
  }

  switch (ergebnis.art) {
    case 'eindeutig':
      zeilen.push('');
      zeilen.push(`L = { ${zahlAlsText(ergebnis.loesung)} }`);
      break;
    case 'keine':
      zeilen.push('');
      zeilen.push('L = { }   (keine Lösung)');
      break;
    case 'alle':
      zeilen.push('');
      // "L = G" ist die Schreibweise des deutschen Unterrichts: Die
      // Lösungsmenge ist die ganze Grundmenge. Hier bewusst nicht ℚ
      // oder ℝ — welche Zahlen zugelassen sind, steht in der Aufgabe
      // und nicht in dieser Datei.
      zeilen.push('L = G   (jede Zahl der Grundmenge löst die Gleichung)');
      break;
    default:
      zeilen.push('');
      zeilen.push(ergebnis.grund);
  }

  return zeilen;
}
