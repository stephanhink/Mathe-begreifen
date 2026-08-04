// Ungleichungen lösen — Schritt für Schritt, mit benannten Umformungen.
//
//     −3x + 5 < 14
//                | beide Seiten − 5
//     −3x < 9
//                | beide Seiten : (−3)  — das Zeichen dreht sich um
//     x > −3
//
// Warum eine eigene Datei neben gleichung.js? Weil eine Ungleichung eine
// Regel hat, die eine Gleichung nicht kennt:
//
//     Multipliziert oder dividiert man beide Seiten mit einer NEGATIVEN
//     Zahl, dreht sich das Vergleichszeichen um.
//
// Das ist keine Marotte, sondern der ganze Unterschied. 2 < 3 ist wahr,
// mal (−1) wäre −2 < −3 falsch — richtig ist −2 > −3. Wer diese Regel
// vergisst, bekommt bei jedem Schritt eine Aussage, die für GENAU DIE
// FALSCHEN Zahlen gilt. Und das fällt beim Nachrechnen nicht auf, weil
// jede einzelne Zeile für sich plausibel aussieht.
//
// Deshalb ist die tragende Prüfung hier dieselbe wie bei gleichung.js,
// nur schärfer: Jede Umformung muss die LÖSUNGSMENGE unverändert lassen,
// geprüft an vielen Stellen. Ein vergessener Dreh kehrt die Wahrheit an
// jeder einzelnen Stelle um und fällt sofort auf.
//
// Umfang: Ungleichungen ersten und zweiten Grades mit einer Variablen.
// Was darüber hinausgeht, sagt die Datei — sie rät nichts.

import {
  bruch,
  minus,
  mal,
  geteilt,
  negativ,
  kehrwert,
  istNull,
  istGanz,
  istNegativ,
  vergleiche,
  gleich as bruchGleich,
  betrag,
  istBruch,
  alsZahl,
} from './bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  istTerm,
  variablen,
  auswerteExakt,
  auswerte,
  alsText as termAlsText,
  zahlAlsText,
  multipliziereAus,
} from './term.js';
import { gleichung, koeffizienten, gradVon, loese as loeseGleichung } from './gleichung.js';

// ---------------------------------------------------------------------
// Die vier Vergleichszeichen
// ---------------------------------------------------------------------
//
// Geschrieben wird ≤ und ≥, nicht <= und >=. Das ist die Schreibweise
// des deutschen Unterrichts, und der Parser nimmt beides entgegen.

export const ZEICHEN = Object.freeze(['<', '≤', '>', '≥']);

// Gilt die Aussage `a ZEICHEN b`?
const PRUEFT = Object.freeze({
  '<': (a, b) => vergleiche(a, b) < 0,
  '≤': (a, b) => vergleiche(a, b) <= 0,
  '>': (a, b) => vergleiche(a, b) > 0,
  '≥': (a, b) => vergleiche(a, b) >= 0,
});

// Der Dreh: aus < wird >, aus ≤ wird ≥. Die Grenze bleibt dabei offen
// oder geschlossen wie sie war — nur die Richtung kippt.
const GEDREHT = Object.freeze({ '<': '>', '≤': '≥', '>': '<', '≥': '≤' });

export function drehe(zeichen) {
  const neu = GEDREHT[zeichen];
  if (!neu) {
    throw new Error(`drehe: "${zeichen}" ist kein Vergleichszeichen`);
  }
  return neu;
}

export function istStreng(zeichen) {
  return zeichen === '<' || zeichen === '>';
}

// ---------------------------------------------------------------------
// Die Ungleichung
// ---------------------------------------------------------------------

export function ungleichung(links, zeichen, rechts) {
  if (!istTerm(links) || !istTerm(rechts)) {
    throw new Error('ungleichung: beide Seiten müssen Terme sein');
  }
  if (!ZEICHEN.includes(zeichen)) {
    throw new Error(`ungleichung: "${zeichen}" ist kein Vergleichszeichen (erlaubt: ${ZEICHEN.join(' ')})`);
  }
  return Object.freeze({ links, zeichen, rechts });
}

export function istUngleichung(wert) {
  return (
    typeof wert === 'object' &&
    wert !== null &&
    istTerm(wert.links) &&
    istTerm(wert.rechts) &&
    ZEICHEN.includes(wert.zeichen)
  );
}

export function alsText(u) {
  pruefeUngleichung(u, 'alsText');
  return `${termAlsText(u.links)} ${u.zeichen} ${termAlsText(u.rechts)}`;
}

function pruefeUngleichung(wert, wo) {
  if (!istUngleichung(wert)) {
    throw new Error(`${wo}: das ist keine Ungleichung`);
  }
  return wert;
}

// Stimmt die Ungleichung an dieser Stelle?
//
// Dieselbe Abwägung wie in gleichung.js: Wo eine Seite nicht definiert
// ist, ist die Ungleichung dort nicht erfüllt — das ist eine Eigenschaft
// der Ungleichung, keine Panne. Ein Zahlenüberlauf dagegen heißt "kann
// ich nicht ausrechnen" und wird durchgereicht, statt als Nein getarnt
// zu werden.
export function istErfuellt(u, belegung) {
  pruefeUngleichung(u, 'istErfuellt');
  try {
    return PRUEFT[u.zeichen](auswerteExakt(u.links, belegung), auswerteExakt(u.rechts, belegung));
  } catch (fehler) {
    if (fehler.zuGross) {
      throw fehler;
    }
    return false;
  }
}

// ---------------------------------------------------------------------
// Die Lösungsmenge: Intervalle
// ---------------------------------------------------------------------
//
// Eine Gleichung hat einzelne Lösungen, eine Ungleichung ganze Bereiche.
// Ein Intervall ist { von, vonOffen, bis, bisOffen }; `null` als Grenze
// heißt "unbeschränkt".
//
// Die Grenzen sind TERME, keine Brüche — genau wie die Lösungen in
// gleichung.js. Bei x² < 5 sind die Grenzen ±√5, und die als Kommazahl
// zu runden wäre die bequeme Lüge.

export function intervall(von, vonOffen, bis, bisOffen) {
  return Object.freeze({ von, vonOffen, bis, bisOffen });
}

// x gegen eine Grenze: −1, 0 oder 1.
//
// Exakt, wo es exakt geht. Das ist hier nicht Pedanterie, sondern der
// Unterschied zwischen "die Grenze gehört dazu" und "die Grenze gehört
// nicht dazu" — also genau der Unterschied zwischen ≤ und <, um den es
// bei Ungleichungen geht.
//
// Bei der Grenze −4/3 liegt JEDE Gleitkommazahl daneben. Wer dort
// numerisch vergleicht, bekommt an der Grenze eine Zufallsantwort. Nur
// wo die Grenze eine Wurzel ist, bleibt nichts als das Runden — und
// dann sagt die Antwort eben nichts über die Grenze selbst aus.
function vergleicheMitGrenze(grenze, x) {
  if (istBruch(x)) {
    try {
      return vergleiche(x, auswerteExakt(grenze));
    } catch (fehler) {
      if (!fehler.irrational) {
        throw fehler;
      }
    }
  }
  const zahlX = istBruch(x) ? alsZahl(x) : x;
  const zahlGrenze = auswerte(grenze);
  return zahlX < zahlGrenze ? -1 : zahlX > zahlGrenze ? 1 : 0;
}

// Liegt die Zahl im Intervall? `x` darf ein Bruch sein oder eine
// Kommazahl.
function imIntervall(iv, x) {
  if (iv.von !== null) {
    const c = vergleicheMitGrenze(iv.von, x);
    if (iv.vonOffen ? c <= 0 : c < 0) {
      return false;
    }
  }
  if (iv.bis !== null) {
    const c = vergleicheMitGrenze(iv.bis, x);
    if (iv.bisOffen ? c >= 0 : c > 0) {
      return false;
    }
  }
  return true;
}

export function inLoesung(ergebnis, x) {
  if (ergebnis.art === 'alle') {
    return true;
  }
  if (ergebnis.art !== 'loesung') {
    return false;
  }
  return ergebnis.intervalle.some((iv) => imIntervall(iv, x));
}

// Ein Intervall in Schulschreibweise: "x < 3", "−2 ≤ x < 5", "x ≥ 0".
export function intervallAlsText(iv, name = 'x') {
  const hatUnten = iv.von !== null;
  const hatOben = iv.bis !== null;

  if (hatUnten && hatOben) {
    const links = `${termAlsText(iv.von)} ${iv.vonOffen ? '<' : '≤'}`;
    const rechts = `${iv.bisOffen ? '<' : '≤'} ${termAlsText(iv.bis)}`;
    return `${links} ${name} ${rechts}`;
  }
  if (hatUnten) {
    return `${name} ${iv.vonOffen ? '>' : '≥'} ${termAlsText(iv.von)}`;
  }
  if (hatOben) {
    return `${name} ${iv.bisOffen ? '<' : '≤'} ${termAlsText(iv.bis)}`;
  }
  return `${name} beliebig`;
}

export function loesungAlsText(ergebnis, name = 'x') {
  if (ergebnis.art === 'alle') {
    return 'jede Zahl';
  }
  if (ergebnis.art === 'keine') {
    return 'keine Zahl';
  }
  if (ergebnis.art !== 'loesung') {
    return '';
  }
  return ergebnis.intervalle.map((iv) => intervallAlsText(iv, name)).join(' oder ');
}

// ---------------------------------------------------------------------
// Umformen
// ---------------------------------------------------------------------

function schritt(operation, u, dreht = false) {
  return { operation, ungleichung: u, text: alsText(u), dreht };
}

// "− 5" statt "+ (−5)".
function strichText(wert) {
  return istNegativ(wert)
    ? `beide Seiten + ${zahlAlsText(betrag(wert))}`
    : `beide Seiten − ${zahlAlsText(wert)}`;
}

function strichTextMonom(koeffizient, name) {
  const zeichen = istNegativ(koeffizient) ? '+' : '−';
  const b = betrag(koeffizient);
  const text = bruchGleich(b, bruch(1)) ? name : `${zahlAlsText(b)}${name}`;
  return `beide Seiten ${zeichen} ${text}`;
}

// Der Text, auf den es in dieser Datei ankommt. Bei einer negativen Zahl
// steht der Dreh ausdrücklich dabei — er ist der eigentliche Lernstoff,
// nicht eine Nebenbemerkung im Kleingedruckten.
function punktText(koeffizient) {
  const negativZahl = istNegativ(koeffizient);
  const grund = negativZahl ? '  — negative Zahl, das Zeichen dreht sich um' : '';
  if (istGanz(koeffizient)) {
    return `beide Seiten : ${klammerBeiNegativ(koeffizient)}${grund}`;
  }
  return `beide Seiten · ${klammerBeiNegativ(kehrwert(koeffizient))}${grund}`;
}

// ": (−3)" statt ": −3". Ohne Klammer liest sich das wie ein Minus.
function klammerBeiNegativ(wert) {
  const text = zahlAlsText(wert);
  return istNegativ(wert) ? `(${text})` : text;
}

// Eine Strichrechnung auf beiden Seiten. Danach wird aufgeräumt, sonst
// stünde da "3x + 5 − 5 < 14 − 5" und der nächste Schritt wäre nicht zu
// erkennen. Das Vergleichszeichen bleibt — Addieren dreht nie.
function strichBeidseitig(u, term) {
  return ungleichung(
    multipliziereAus(summe(u.links, term)).term,
    u.zeichen,
    multipliziereAus(summe(u.rechts, term)).term
  );
}

function produktMitZahl(term, faktor) {
  return produkt(term, zahl(faktor));
}

// k·xⁿ als Term. Für n = 0 nur die Zahl, für n = 1 ohne Exponent —
// "1x¹" schreibt niemand.
function monomTerm(koeffizient, name, grad = 1) {
  if (grad === 0) {
    return zahl(koeffizient);
  }
  const basis = grad === 1 ? variable(name) : potenz(variable(name), zahl(bruch(grad)));
  return bruchGleich(koeffizient, bruch(1)) ? basis : produkt(zahl(koeffizient), basis);
}

function polynomTerm(koeffizienten, name) {
  const glieder = [];
  for (let grad = koeffizienten.length - 1; grad >= 0; grad--) {
    const k = koeffizienten[grad] ?? bruch(0);
    if (!istNull(k)) {
      glieder.push(monomTerm(k, name, grad));
    }
  }
  if (glieder.length === 0) {
    return zahl(bruch(0));
  }
  return glieder.length === 1 ? glieder[0] : summe(...glieder);
}

// ---------------------------------------------------------------------
// Lösen
// ---------------------------------------------------------------------
//
// Ergebnis ist immer ein Objekt mit `art`:
//
//   'loesung'  — ein oder zwei Intervalle, in `intervalle`
//   'keine'    — die Lösungsmenge ist leer (z. B. x² < 0)
//   'alle'     — jede Zahl erfüllt sie (z. B. x² ≥ 0)
//   'unklar'   — diese Datei kann es nicht; `grund` sagt warum
//
// 'unklar' ist ein gültiges Ergebnis und keine Ausnahme.

export function loese(u) {
  pruefeUngleichung(u, 'loese');

  const namen = [...new Set([...variablen(u.links), ...variablen(u.rechts)])];
  if (namen.length > 1) {
    return unklar(
      `Diese Ungleichung hat mehrere Variablen (${namen.join(', ')}). Hier wird nach genau einer aufgelöst.`,
      [],
      u
    );
  }

  const name = namen[0] ?? 'x';
  const schritte = [];
  let aktuell = u;

  const aufgeraeumt = ungleichung(
    multipliziereAus(u.links).term,
    u.zeichen,
    multipliziereAus(u.rechts).term
  );
  if (alsText(aufgeraeumt) !== alsText(u)) {
    aktuell = aufgeraeumt;
    schritte.push(schritt('beide Seiten ausrechnen', aktuell));
  }

  const links = koeffizienten(aktuell.links, name);
  const rechts = koeffizienten(aktuell.rechts, name);

  if (links === null || rechts === null) {
    return unklar(
      'Diese Ungleichung ist kein Polynom in einer Variablen. Wurzeln, Beträge und ' +
        'Variablen im Nenner kann diese Datei noch nicht lösen.',
      schritte,
      aktuell
    );
  }

  const differenz = zieheAb(links, rechts);
  const grad = gradVon(differenz);

  if (grad > 2) {
    return unklar(
      `Diese Ungleichung ist vom Grad ${grad}. Gelöst werden hier Ungleichungen ersten und zweiten Grades.`,
      schritte,
      aktuell
    );
  }

  if (grad === 0) {
    return ohneVariable(differenz[0] ?? bruch(0), aktuell.zeichen, schritte, aktuell);
  }
  if (grad === 1) {
    return loeseLinear(aktuell, differenz, name, schritte);
  }
  return loeseQuadratisch(aktuell, differenz, name, schritte);
}

function unklar(grund, schritte, u) {
  return { art: 'unklar', grund, schritte, ungleichung: u };
}

function zieheAb(links, rechts) {
  const laenge = Math.max(links.length, rechts.length);
  const aus = [];
  for (let i = 0; i < laenge; i++) {
    aus.push(minus(links[i] ?? bruch(0), rechts[i] ?? bruch(0)));
  }
  return aus;
}

// Die Variable fällt heraus — dann entscheidet die Zahlenaussage allein.
function ohneVariable(rest, zeichen, schritte, u) {
  const stimmt = PRUEFT[zeichen](rest, bruch(0));
  return {
    art: stimmt ? 'alle' : 'keine',
    grund: stimmt
      ? 'Die Variable fällt heraus und übrig bleibt eine wahre Aussage — jede Zahl erfüllt die Ungleichung.'
      : 'Die Variable fällt heraus und übrig bleibt eine falsche Aussage — es gibt keine Lösung.',
    schritte,
    ungleichung: u,
  };
}

// ---------------------------------------------------------------------
// Ersten Grades
// ---------------------------------------------------------------------

function loeseLinear(u, differenz, name, schritte) {
  let aktuell = u;
  const a = differenz[1];
  const b = differenz[0] ?? bruch(0);

  // Alles mit x nach links, alles ohne x nach rechts. Beides sind
  // Strichrechnungen — dabei dreht sich nie etwas um.
  const rechtsX = koeffizienten(aktuell.rechts, name)[1] ?? bruch(0);
  if (!istNull(rechtsX)) {
    aktuell = strichBeidseitig(aktuell, monomTerm(negativ(rechtsX), name));
    schritte.push(schritt(strichTextMonom(rechtsX, name), aktuell));
  }

  const linksZahl = koeffizienten(aktuell.links, name)[0] ?? bruch(0);
  if (!istNull(linksZahl)) {
    aktuell = strichBeidseitig(aktuell, zahl(negativ(linksZahl)));
    schritte.push(schritt(strichText(linksZahl), aktuell));
  }

  // Und jetzt der Punkt, um den es geht.
  let zeichen = aktuell.zeichen;
  if (!bruchGleich(a, bruch(1))) {
    const dreht = istNegativ(a);
    if (dreht) {
      zeichen = drehe(zeichen);
    }
    aktuell = ungleichung(
      multipliziereAus(produktMitZahl(aktuell.links, kehrwert(a))).term,
      zeichen,
      multipliziereAus(produktMitZahl(aktuell.rechts, kehrwert(a))).term
    );
    schritte.push(schritt(punktText(a), aktuell, dreht));
  }

  // x ⋛ grenze
  const grenze = zahl(negativ(geteilt(b, a)));
  const nachRechts = zeichen === '>' || zeichen === '≥';
  const offen = istStreng(zeichen);
  const iv = nachRechts ? intervall(grenze, offen, null, false) : intervall(null, false, grenze, offen);

  return { art: 'loesung', intervalle: [iv], schritte, ungleichung: aktuell };
}

// ---------------------------------------------------------------------
// Zweiten Grades
// ---------------------------------------------------------------------
//
// a·x² + b·x + c ⋛ 0. Gelöst wird über die NULLSTELLEN und die
// Öffnungsrichtung der Parabel — nicht über eine Vorzeichentabelle mit
// Testpunkten. Der Grund ist derselbe wie bei den Koeffizienten in
// gleichung.js: Wer an Stichproben misst, wird von einem Sonderfall
// belogen. Die Parabel dagegen ist vollständig bestimmt.
//
//   a > 0, zwei Nullstellen x₁ < x₂:  negativ ZWISCHEN ihnen
//   a > 0, eine  Nullstelle  x₀:      nirgends negativ, null bei x₀
//   a > 0, keine Nullstelle:          überall positiv
//
// Für a < 0 spiegelt sich alles; deshalb wird vorher normiert.

function loeseQuadratisch(u, differenz, name, schritte) {
  const a = differenz[2];
  const zeichen = u.zeichen;

  // Auf die Form "Ausdruck ⋛ 0" bringen — das ist der Schritt, den man
  // im Unterricht als Erstes macht.
  const linkeSeite = polynomTerm(differenz, name);
  let aktuell = ungleichung(multipliziereAus(linkeSeite).term, zeichen, zahl(bruch(0)));
  if (alsText(aktuell) !== alsText(u)) {
    schritte.push(schritt('alles auf eine Seite bringen', aktuell));
  }

  // Nullstellen über gleichung.js — dieselbe pq-Formel, derselbe Weg.
  const nullstellen = loeseGleichung(gleichung(aktuell.links, zahl(bruch(0))));
  if (nullstellen.art === 'unklar') {
    return unklar(nullstellen.grund, schritte, aktuell);
  }

  const nachOben = !istNegativ(a);
  const streng = istStreng(zeichen);
  const suchtPositiv = zeichen === '>' || zeichen === '≥';

  const stellen = (nullstellen.loesungen ?? [])
    .slice()
    .sort((p, q) => auswerte(p) - auswerte(q));

  // Keine Nullstelle: die Parabel hat überall dasselbe Vorzeichen.
  if (stellen.length === 0) {
    const immerPositiv = nachOben;
    const stimmt = suchtPositiv === immerPositiv;
    return {
      art: stimmt ? 'alle' : 'keine',
      grund: stimmt
        ? `Die Parabel hat keine Nullstelle und ist überall ${immerPositiv ? 'positiv' : 'negativ'} — jede Zahl erfüllt die Ungleichung.`
        : `Die Parabel hat keine Nullstelle und ist überall ${immerPositiv ? 'positiv' : 'negativ'} — es gibt keine Lösung.`,
      schritte,
      ungleichung: aktuell,
    };
  }

  // Eine doppelte Nullstelle: die Parabel berührt die Achse nur.
  if (stellen.length === 1) {
    return beruehrung(stellen[0], nachOben, suchtPositiv, streng, schritte, aktuell, name);
  }

  const [x1, x2] = stellen;
  // Innen hat die Parabel das Vorzeichen von −a, außen das von a.
  const innenPositiv = !nachOben;
  const innen = suchtPositiv === innenPositiv;

  if (innen) {
    return {
      art: 'loesung',
      intervalle: [intervall(x1, streng, x2, streng)],
      schritte,
      ungleichung: aktuell,
    };
  }
  return {
    art: 'loesung',
    intervalle: [
      intervall(null, false, x1, streng),
      intervall(x2, streng, null, false),
    ],
    schritte,
    ungleichung: aktuell,
  };
}

// Doppelte Nullstelle: die Parabel liegt ganz auf einer Seite der Achse
// und berührt sie an genau einer Stelle. Vier Fälle, und drei davon sind
// die, bei denen man sich im Unterricht vertut.
function beruehrung(x0, nachOben, suchtPositiv, streng, schritte, u, name) {
  const immerPositiv = nachOben;

  if (suchtPositiv === immerPositiv) {
    // "≥ 0" bei nach oben offener Parabel: überall, auch am Berührpunkt.
    if (!streng) {
      return {
        art: 'alle',
        grund: `Die Parabel berührt die Achse bei ${name} = ${termAlsText(x0)} und liegt sonst ganz ${immerPositiv ? 'darüber' : 'darunter'} — jede Zahl erfüllt die Ungleichung.`,
        schritte,
        ungleichung: u,
      };
    }
    // "> 0": überall AUSSER am Berührpunkt. Das ist die Stelle, an der
    // man aus Versehen "alle Zahlen" schreibt.
    return {
      art: 'loesung',
      intervalle: [intervall(null, false, x0, true), intervall(x0, true, null, false)],
      grund: `Nur ${name} = ${termAlsText(x0)} fällt heraus — dort ist der Ausdruck null, und null ist nicht ${suchtPositiv ? 'größer' : 'kleiner'} als null.`,
      schritte,
      ungleichung: u,
    };
  }

  // Gesucht ist die andere Seite: höchstens der Berührpunkt selbst.
  if (streng) {
    return {
      art: 'keine',
      grund: `Die Parabel liegt ganz ${immerPositiv ? 'über' : 'unter'} der Achse und berührt sie nur bei ${name} = ${termAlsText(x0)} — es gibt keine Lösung.`,
      schritte,
      ungleichung: u,
    };
  }
  return {
    art: 'loesung',
    intervalle: [intervall(x0, false, x0, false)],
    grund: `Nur die Berührstelle ${name} = ${termAlsText(x0)} erfüllt die Ungleichung — dort ist der Ausdruck genau null.`,
    schritte,
    ungleichung: u,
  };
}

// ---------------------------------------------------------------------
// Der Rechenweg als Text
// ---------------------------------------------------------------------

export function alsRechenweg(u, ergebnis) {
  const zeilen = [alsText(u)];
  for (const s of ergebnis.schritte) {
    zeilen.push(`         | ${s.operation}`);
    zeilen.push(s.text);
  }
  return zeilen;
}
