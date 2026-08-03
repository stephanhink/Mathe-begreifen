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
// Umfang: Gleichungen ersten und zweiten Grades mit einer Variablen.
// Was darüber hinausgeht, sagt die Datei — sie rät nichts.

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
  potenz,
  wurzel,
  istTerm,
  variablen,
  auswerteExakt,
  auswerte,
  alsText as termAlsText,
  zahlAlsText,
  vereinfache,
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
  return typeof wert === 'object' && wert !== null && istTerm(wert.links) && istTerm(wert.rechts);
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
//
// Die Lösung darf ein Bruch sein oder ein Term — seit es quadratische
// Gleichungen gibt, ist sie oft etwas wie −2 + √17 und damit gar kein
// Bruch. Dann wird numerisch geprüft, und `exakt` sagt das auch: Eine
// Probe mit gerundeten Zahlen ist ein starkes Indiz, aber kein Beweis,
// und die App soll das nicht verschweigen.
export function probe(g, loesung, name = 'x') {
  pruefeGleichung(g, 'probe');
  const alsTerm = istTerm(loesung) ? loesung : zahl(loesung);

  try {
    const wert = auswerteExakt(alsTerm);
    const links = auswerteExakt(g.links, { [name]: wert });
    const rechts = auswerteExakt(g.rechts, { [name]: wert });
    return { exakt: true, links, rechts, stimmt: bruchGleich(links, rechts) };
  } catch (fehler) {
    if (!fehler.irrational) {
      throw fehler;
    }
  }

  const wert = auswerte(alsTerm);
  const links = auswerte(g.links, { [name]: wert });
  const rechts = auswerte(g.rechts, { [name]: wert });
  const schranke = 1e-9 * Math.max(1, Math.abs(links), Math.abs(rechts));
  return { exakt: false, links, rechts, stimmt: Math.abs(links - rechts) <= schranke };
}

// Beide Seiten einer Probe als Text — egal ob exakt oder gerundet.
export function probeAlsText(p) {
  return p.exakt ? zahlAlsText(p.links) : String(Math.round(p.links * 1e6) / 1e6);
}

// ---------------------------------------------------------------------
// Ist die Gleichung ein Polynom? Und welchen Grades?
// ---------------------------------------------------------------------
//
// Gesucht sind die Koeffizienten: aus 2x² + 3x − 5 wird [−5, 3, 2],
// also der Reihe nach die Vorfaktoren von x⁰, x¹, x².
//
// Bestimmt werden sie STRUKTURELL, nicht durch Einsetzen. Wer an drei
// Stellen misst und daraus auf eine Parabel schließt, wird von x⁴ an
// genau drei Punkten belogen.
//
// Rückgabe ist null, wenn der Term kein Polynom in dieser Variablen ist
// — null heißt hier ausdrücklich "kann ich nicht", nicht "ist null".

// Höher als vierten Grades wird gar nicht erst gesammelt. Der Grund ist
// nicht Bequemlichkeit: (x + 1)²⁰ ausmultipliziert hat Koeffizienten
// jenseits von 2^53, und die Bruchrechnung würde zu Recht abbrechen.
// Lieber vorher sagen, dass es zu viel wird.
const HOECHSTER_GRAD = 4;

// Wird auch von utils/funktion.js gebraucht: Steigung, Scheitelpunkt und
// die Art einer Funktion stecken alle in denselben Koeffizienten.
export function koeffizienten(term, name) {
  // Ein Teilterm ohne jede Variable ist eine Zahl — wenn er sich exakt
  // ausrechnen lässt. √4 geht, √2 nicht: Ein irrationaler Koeffizient
  // wäre kein Bruch mehr, und dann trüge diese Datei eine Genauigkeit
  // vor, die sie nicht hat.
  if (variablen(term).length === 0) {
    try {
      return [auswerteExakt(term)];
    } catch {
      return null;
    }
  }

  switch (term.art) {
    case 'variable':
      return term.name === name ? [bruch(0), bruch(1)] : null;

    case 'summe': {
      let ergebnis = [bruch(0)];
      for (const teil of term.teile) {
        const k = koeffizienten(teil, name);
        if (k === null) {
          return null;
        }
        ergebnis = addiere(ergebnis, k);
      }
      return ergebnis;
    }

    case 'produkt': {
      let ergebnis = [bruch(1)];
      for (const teil of term.teile) {
        const k = koeffizienten(teil, name);
        if (k === null) {
          return null;
        }
        ergebnis = falte(ergebnis, k);
        if (ergebnis === null) {
          return null;
        }
      }
      return ergebnis;
    }

    case 'potenz': {
      const e = koeffizienten(term.exponent, name);
      if (e === null || e.length > 1 || !istGanz(e[0]) || istNegativ(e[0])) {
        // Ein negativer Exponent hieße: die Variable steht im Nenner.
        // Das ist kein Polynom, und der Definitionsbereich hat ein Loch.
        return null;
      }
      const n = e[0].z;
      const basis = koeffizienten(term.basis, name);
      if (basis === null) {
        return null;
      }
      // x⁰ ist NICHT einfach 1: An der Stelle x = 0 ist 0⁰ nicht
      // definiert. Die Gleichung x⁰ = 1 hat deshalb nicht alle Zahlen
      // als Lösung, sondern alle außer null. Statt diese Feinheit
      // mitzuschleppen, wird abgelehnt — dieselbe Haltung wie in term.js.
      if (n === 0) {
        return basis.length > 1 ? null : [bruch(1)];
      }

      let ergebnis = [bruch(1)];
      for (let i = 0; i < n; i++) {
        ergebnis = falte(ergebnis, basis);
        if (ergebnis === null) {
          return null;
        }
      }
      return ergebnis;
    }

    case 'quotient': {
      const nenner = koeffizienten(term.nenner, name);
      // Steht die Variable im Nenner, ist es kein Polynom.
      if (nenner === null || nenner.length > 1 || istNull(nenner[0])) {
        return null;
      }
      const zaehler = koeffizienten(term.zaehler, name);
      if (zaehler === null) {
        return null;
      }
      return zaehler.map((k) => geteilt(k, nenner[0]));
    }

    default:
      // Wurzel oder Betrag mit der Variablen darin: kein Polynom.
      return null;
  }
}

function addiere(a, b) {
  const laenge = Math.max(a.length, b.length);
  const ergebnis = [];
  for (let i = 0; i < laenge; i++) {
    ergebnis.push(plus(a[i] ?? bruch(0), b[i] ?? bruch(0)));
  }
  return ergebnis;
}

// Zwei Polynome multiplizieren heißt, ihre Koeffizienten zu falten.
function falte(a, b) {
  if (a.length + b.length - 2 > HOECHSTER_GRAD) {
    return null;
  }
  const ergebnis = Array.from({ length: a.length + b.length - 1 }, () => bruch(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      ergebnis[i + j] = plus(ergebnis[i + j], mal(a[i], b[j]));
    }
  }
  return ergebnis;
}

export function gradVon(koeffs) {
  for (let i = koeffs.length - 1; i >= 0; i--) {
    if (!istNull(koeffs[i])) {
      return i;
    }
  }
  return 0;
}

// Aus Koeffizienten wieder einen Term machen, absteigend sortiert:
// [−5, 3, 2] wird 2x² + 3x − 5.
function alsPolynom(koeffs, name) {
  const glieder = [];
  for (let i = koeffs.length - 1; i >= 0; i--) {
    if (istNull(koeffs[i])) {
      continue;
    }
    glieder.push(monom(koeffs[i], i, name));
  }
  return glieder.length === 0 ? zahl(0) : summe(...glieder);
}

function monom(koeffizient, grad, name) {
  if (grad === 0) {
    return zahl(koeffizient);
  }
  const potenzTeil = grad === 1 ? variable(name) : potenz(variable(name), zahl(grad));
  return bruchGleich(koeffizient, bruch(1))
    ? potenzTeil
    : produkt(zahl(koeffizient), potenzTeil);
}

// ---------------------------------------------------------------------
// Umformen
// ---------------------------------------------------------------------

// Eine Umformung auf beiden Seiten. Danach werden beide Seiten
// aufgeräumt — sonst stünde da "3x + 5 − 5 = 14 − 5" und der nächste
// Schritt wäre nicht zu erkennen.
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

function schritt(operation, g) {
  return { operation, gleichung: g, text: alsText(g) };
}

// ---------------------------------------------------------------------
// Lösen
// ---------------------------------------------------------------------

// Ergebnis ist immer ein Objekt mit `art`:
//
//   'eindeutig'  — genau eine Lösung, in `loesungen[0]`
//   'mehrere'    — zwei Lösungen, in `loesungen`
//   'keine'      — die Lösungsmenge ist leer (z. B. x + 1 = x + 2)
//   'alle'       — jede Zahl löst die Gleichung (z. B. 2(x+1) = 2x+2)
//   'unklar'     — diese Datei kann es nicht; `grund` sagt warum
//
// Die Lösungen sind TERME, keine Brüche. Seit es quadratische
// Gleichungen gibt, ist eine Lösung oft −2 + √17 — und das ist kein
// Bruch. Als Kommazahl zu runden wäre die bequeme Lüge; als Term
// stehenzulassen ist die Wahrheit.
//
// 'unklar' ist ausdrücklich ein gültiges Ergebnis und keine Ausnahme.
// Stillschweigend etwas Falsches zu liefern wäre schlimmer als
// zuzugeben, dass man nicht weiterweiß.
export function loese(g) {
  pruefeGleichung(g, 'loese');

  const namen = [...new Set([...variablen(g.links), ...variablen(g.rechts)])];
  if (namen.length > 1) {
    return unklar(
      `Diese Gleichung hat mehrere Variablen (${namen.join(', ')}). Hier wird nach genau einer aufgelöst.`,
      [],
      g
    );
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

  const links = koeffizienten(aktuell.links, name);
  const rechts = koeffizienten(aktuell.rechts, name);

  if (links === null || rechts === null) {
    return unklar(
      'Diese Gleichung ist kein Polynom in einer Variablen. Wurzeln, Beträge und ' +
        'Variablen im Nenner kann diese Datei noch nicht lösen.',
      schritte,
      aktuell
    );
  }

  // Alles auf eine Seite: links − rechts.
  const differenz = addiere(
    links,
    rechts.map((k) => negativ(k))
  );
  const grad = gradVon(differenz);

  if (grad > 2) {
    return unklar(
      `Diese Gleichung ist vom Grad ${grad}. Gelöst werden hier Gleichungen ersten und zweiten Grades.`,
      schritte,
      aktuell
    );
  }

  if (grad === 0) {
    return ohneVariable(differenz[0], schritte, aktuell);
  }
  if (grad === 1) {
    return loeseLinear(aktuell, links, rechts, name, schritte);
  }
  return loeseQuadratisch(aktuell, differenz, name, schritte);
}

function unklar(grund, schritte, g) {
  return { art: 'unklar', grund, schritte, gleichung: g };
}

// Die Variable ist herausgefallen — dann entscheidet die Zahlenaussage.
function ohneVariable(rest, schritte, g) {
  const stimmt = istNull(rest);
  return {
    art: stimmt ? 'alle' : 'keine',
    grund: stimmt
      ? 'Die Variable fällt heraus und übrig bleibt eine wahre Aussage — jede Zahl löst die Gleichung.'
      : 'Die Variable fällt heraus und übrig bleibt eine falsche Aussage — es gibt keine Lösung.',
    schritte,
    gleichung: g,
  };
}

// ---------------------------------------------------------------------
// Ersten Grades
// ---------------------------------------------------------------------

function loeseLinear(g, links, rechts, name, schritte) {
  let aktuell = g;
  const a1 = links[1] ?? bruch(0);
  const b1 = links[0] ?? bruch(0);
  const a2 = rechts[1] ?? bruch(0);
  const b2 = rechts[0] ?? bruch(0);

  // Alles mit x nach links.
  if (!istNull(a2)) {
    aktuell = addiereBeidseitig(aktuell, monom(negativ(a2), 1, name));
    schritte.push(schritt(strichTextMonom(a2, name), aktuell));
  }

  // Alles ohne x nach rechts.
  if (!istNull(b1)) {
    aktuell = addiereBeidseitig(aktuell, zahl(negativ(b1)));
    schritte.push(schritt(strichText(b1), aktuell));
  }

  const koeffizient = minus(a1, a2);

  // Durch den Koeffizienten teilen.
  if (!bruchGleich(koeffizient, bruch(1))) {
    aktuell = malBeidseitig(aktuell, kehrwert(koeffizient));
    schritte.push(schritt(punktText(koeffizient), aktuell));
  }

  const loesung = geteilt(minus(b2, b1), koeffizient);
  return { art: 'eindeutig', loesungen: [zahl(loesung)], schritte, gleichung: aktuell };
}

// ---------------------------------------------------------------------
// Zweiten Grades
// ---------------------------------------------------------------------

function loeseQuadratisch(g, differenz, name, schritte) {
  let aktuell = g;

  // Alles auf eine Seite. Nur als Schritt aufnehmen, wenn sich dadurch
  // etwas ändert — bei "x² − 4 = 0" steht es schon so da.
  const aufEinerSeite = gleichung(alsPolynom(differenz, name), zahl(0));
  if (alsText(aufEinerSeite) !== alsText(aktuell)) {
    aktuell = aufEinerSeite;
    schritte.push(schritt('alles auf eine Seite bringen', aktuell));
  }

  // Auf die Normalform x² + px + q = 0 bringen. Die pq-Formel gilt nur
  // dafür — mit einem Vorfaktor vor dem x² liefert sie Unsinn, und das
  // ist einer der häufigsten Fehler überhaupt.
  const a = differenz[2];
  let normiert = differenz;
  if (!bruchGleich(a, bruch(1))) {
    normiert = differenz.map((k) => geteilt(k, a));
    aktuell = gleichung(alsPolynom(normiert, name), zahl(0));
    schritte.push(schritt(punktText(a), aktuell));
  }

  const p = normiert[1];
  const q = normiert[0];

  // Diskriminante D = (p/2)² − q. Ihr Vorzeichen entscheidet alles.
  const halbesP = geteilt(p, bruch(2));
  const diskriminante = minus(mal(halbesP, halbesP), q);

  const pq = {
    p,
    q,
    halbesP,
    diskriminante,
    formel: `x = −${zahlAlsText(halbesP)} ± √((${zahlAlsText(halbesP)})² − ${zahlAlsText(q)})`,
  };

  if (istNegativ(diskriminante)) {
    return {
      art: 'keine',
      grund:
        `Unter der Wurzel steht ${zahlAlsText(diskriminante)}, also eine negative Zahl. ` +
        'Daraus lässt sich im Reellen keine Wurzel ziehen — die Gleichung hat keine Lösung. ' +
        'Anschaulich: Die Parabel schneidet die x-Achse nicht.',
      pq,
      schritte,
      gleichung: aktuell,
    };
  }

  const minusHalbesP = negativ(halbesP);

  if (istNull(diskriminante)) {
    return {
      art: 'eindeutig',
      loesungen: [zahl(minusHalbesP)],
      grund:
        'Unter der Wurzel steht 0 — beide Lösungen fallen zusammen. ' +
        'Anschaulich: Die Parabel berührt die x-Achse genau einmal.',
      pq,
      schritte,
      gleichung: aktuell,
    };
  }

  // Zwei Lösungen. Erst in der rohen Form −p/2 ± √D, damit man sieht,
  // woher sie kommen; dann vereinfacht.
  const wurzelTeil = wurzel(zahl(diskriminante));
  const roh = [
    summe(zahl(minusHalbesP), wurzelTeil),
    summe(zahl(minusHalbesP), produkt(zahl(-1), wurzelTeil)),
  ];
  const loesungen = roh.map((t) => vereinfache(t).term);

  return { art: 'mehrere', loesungen, roh, pq, schritte, gleichung: aktuell };
}

// ---------------------------------------------------------------------
// Aufschreiben
// ---------------------------------------------------------------------

// Der Rechenweg in der Form, die im Konzept steht: Die Umformung steht
// eingerückt ZWISCHEN den Zeilen, nicht daneben. So liest man sie als
// das, was sie ist — der Übergang von einer Zeile zur nächsten.
export function alsRechenweg(g, ergebnis) {
  pruefeGleichung(g, 'alsRechenweg');
  const zeilen = [alsText(g)];

  for (const s of ergebnis.schritte) {
    zeilen.push(`         | ${s.operation}`);
    zeilen.push(s.text);
  }

  if (ergebnis.pq) {
    zeilen.push('');
    zeilen.push(
      `p = ${zahlAlsText(ergebnis.pq.p)},  q = ${zahlAlsText(ergebnis.pq.q)}`
    );
    zeilen.push(`unter der Wurzel: ${zahlAlsText(ergebnis.pq.diskriminante)}`);
  }

  zeilen.push('');
  switch (ergebnis.art) {
    case 'eindeutig':
      zeilen.push(`L = { ${termAlsText(ergebnis.loesungen[0])} }`);
      break;
    case 'mehrere':
      zeilen.push(`L = { ${ergebnis.loesungen.map(termAlsText).join('; ')} }`);
      break;
    case 'keine':
      zeilen.push('L = { }   (keine Lösung)');
      break;
    case 'alle':
      // "L = G" ist die Schreibweise des deutschen Unterrichts: Die
      // Lösungsmenge ist die ganze Grundmenge. Hier bewusst nicht ℚ
      // oder ℝ — welche Zahlen zugelassen sind, steht in der Aufgabe
      // und nicht in dieser Datei.
      zeilen.push('L = G   (jede Zahl der Grundmenge löst die Gleichung)');
      break;
    default:
      zeilen.push(ergebnis.grund);
  }

  return zeilen;
}
