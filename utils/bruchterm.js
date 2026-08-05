// Bruchterme kürzen — und den Definitionsbereich mitführen.
//
//     x² − 1
//     ──────  =  x + 1        aber nur für x ≠ 1
//     x − 1
//
// Das „aber" ist hier nicht Pedanterie, sondern der ganze Punkt. Setzt
// man x = 1 ein, steht links 0 : 0 — das gibt es nicht. Rechts steht 2.
// Die beiden Terme sind also NICHT überall gleich: Der gekürzte ist an
// einer Stelle definiert, an der der ursprüngliche es nicht ist.
//
// Und das ist die gefährliche Richtung. Beim Kürzen WÄCHST der
// Definitionsbereich; eine App, die den Vorbehalt wegließe, würde für
// x = 1 eine Antwort liefern, die es nie gab. Sie hätte einen Wert
// erfunden — genau das, was in diesem Projekt nie passieren darf.
//
// Verwandt mit zwei Stellen, die es schon gibt:
//
//   term.js schreibt √(x²) als |x|, nicht als x — und lässt (√x)²
//     stehen, weil das Kürzen dort den Definitionsbereich verschieben
//     würde.
//   umstellen.js führt die Vorbehalte mit (t ≠ 0), statt sie zu
//     verschweigen wie eine Formelsammlung.
//
// Hier ist es dieselbe Haltung, nur schärfer: Dort ging es um einen
// Rand, hier um ein Loch mitten in der Kurve.
//
// Umfang: Zähler und Nenner als Polynome bis zum zweiten Grad mit
// rationalen Nullstellen. Was darüber hinausgeht, sagt die Datei.

import {
  bruch,
  plus,
  minus,
  mal,
  geteilt,
  negativ,
  kehrwert,
  istNull,
  gleich as bruchGleich,
  alsText as bruchRoh,
} from './bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  quotient,
  istTerm,
  variablen,
  auswerteExakt,
  alsText as termAlsText,
  zahlAlsText,
  vereinfache,
  multipliziereAus,
} from './term.js';
import { koeffizienten, gradVon } from './gleichung.js';

// ---------------------------------------------------------------------
// Faktorisieren
// ---------------------------------------------------------------------
//
// a·x + b        wird zu   a · (x − (−b/a))
// a·x² + b·x + c wird zu   a · (x − r₁) · (x − r₂),  falls r₁, r₂ Brüche
//
// Nur rationale Nullstellen. Bei x² − 2 wären es ±√2 — dann lässt sich
// zwar zerlegen, aber nichts kürzen, was ein Schüler wiedererkennen
// würde. Dann sagt die Datei, dass sie es so lässt.

function faktorisiere(koeffs, name) {
  const grad = gradVon(koeffs);

  if (grad === 0) {
    return { vorfaktor: koeffs[0] ?? bruch(0), nullstellen: [], grad: 0 };
  }

  if (grad === 1) {
    const a = koeffs[1];
    const b = koeffs[0] ?? bruch(0);
    return { vorfaktor: a, nullstellen: [negativ(geteilt(b, a))], grad: 1 };
  }

  if (grad === 2) {
    const a = koeffs[2];
    const p = geteilt(koeffs[1] ?? bruch(0), a);
    const q = geteilt(koeffs[0] ?? bruch(0), a);
    // (p/2)² − q
    const halbesP = geteilt(p, bruch(2));
    const unterDerWurzel = minus(mal(halbesP, halbesP), q);

    if (istNegativ(unterDerWurzel)) {
      // Keine reelle Nullstelle — also auch kein reeller Linearfaktor.
      return { vorfaktor: a, nullstellen: [], grad: 2, unzerlegbar: true };
    }

    const w = wurzelAlsBruch(unterDerWurzel);
    if (w === null) {
      // Reell, aber irrational: √2 lässt sich nicht als Bruch schreiben.
      return { vorfaktor: a, nullstellen: [], grad: 2, irrational: true };
    }

    return {
      vorfaktor: a,
      nullstellen: [plus(negativ(halbesP), w), minus(negativ(halbesP), w)],
      grad: 2,
    };
  }

  return null;
}

function istNegativ(b) {
  return b.z < 0;
}

// Die Wurzel eines Bruchs, aber nur wenn sie wieder ein Bruch ist.
// √(9/4) ist 3/2, √2 ist null — im Sinne von „gibt es hier nicht".
function wurzelAlsBruch(b) {
  const z = Math.sqrt(b.z);
  const n = Math.sqrt(b.n);
  if (!Number.isInteger(z) || !Number.isInteger(n)) {
    return null;
  }
  return bruch(z, n);
}

// (x − r) als Term, so wie man es hinschreibt: x − 3 statt x − (3).
function linearfaktor(nullstelle, name) {
  if (istNull(nullstelle)) {
    return variable(name);
  }
  return summe(variable(name), zahl(negativ(nullstelle)));
}

// ---------------------------------------------------------------------
// Kürzen
// ---------------------------------------------------------------------
//
// Ergebnis:
//   { art: 'gekuerzt', ergebnis, ausgeschlossen, gekuerzt, schritte }
//   { art: 'nichtKuerzbar', ausgeschlossen, grund }
//   { art: 'unklar', grund }

export function kuerze(zaehlerTerm, nennerTerm, name = 'x') {
  if (!istTerm(zaehlerTerm) || !istTerm(nennerTerm)) {
    throw new Error('kuerze: Zähler und Nenner müssen Terme sein');
  }

  const namen = [
    ...new Set([...variablen(zaehlerTerm), ...variablen(nennerTerm)]),
  ];
  if (namen.length > 1) {
    return {
      art: 'unklar',
      grund: `Hier kommen mehrere Variablen vor (${namen.join(', ')}). Gekürzt wird nach genau einer.`,
    };
  }

  const zaehlerKoeffs = koeffizienten(multipliziereAus(zaehlerTerm).term, name);
  const nennerKoeffs = koeffizienten(multipliziereAus(nennerTerm).term, name);

  if (zaehlerKoeffs === null || nennerKoeffs === null) {
    return {
      art: 'unklar',
      grund:
        'Zähler oder Nenner ist kein Polynom in einer Variablen. Wurzeln, Beträge und ' +
        'Variablen im Exponenten kann diese Datei noch nicht kürzen.',
    };
  }

  if (gradVon(nennerKoeffs) === 0 && istNull(nennerKoeffs[0] ?? bruch(0))) {
    return {
      art: 'unklar',
      grund: 'Der Nenner ist null. Durch null zu teilen gibt es nicht — auch nicht als Term.',
    };
  }

  const zaehler = faktorisiere(zaehlerKoeffs, name);
  const nenner = faktorisiere(nennerKoeffs, name);

  if (zaehler === null || nenner === null) {
    return {
      art: 'unklar',
      grund:
        `Zähler oder Nenner ist vom Grad ${Math.max(gradVon(zaehlerKoeffs), gradVon(nennerKoeffs))}. ` +
        'Gekürzt werden hier Terme bis zum zweiten Grad.',
    };
  }

  // Die Definitionslücken stehen VOR dem Kürzen fest — an den
  // Nullstellen des URSPRÜNGLICHEN Nenners. Daran ändert das Kürzen
  // nichts, und genau das ist der Punkt.
  const ausgeschlossen = [...nenner.nullstellen];

  const schritte = [];

  if (nenner.irrational || nenner.unzerlegbar || zaehler.irrational) {
    return {
      art: 'nichtKuerzbar',
      ausgeschlossen,
      grund: nenner.unzerlegbar
        ? 'Der Nenner hat keine reelle Nullstelle — er lässt sich nicht in Linearfaktoren zerlegen, und damit gibt es auch nichts zu kürzen. Dafür ist der Bruchterm überall definiert.'
        : 'Zähler oder Nenner hat irrationale Nullstellen (etwa ±√2). Zerlegen ginge, aber das Ergebnis wäre keine Schreibweise, die im Unterricht vorkommt.',
      schritte,
    };
  }

  // Faktoren als Nullstellen-Listen, mit Vielfachheit.
  let zaehlerRest = [...zaehler.nullstellen];
  const nennerRest = [];
  const gekuerzt = [];

  for (const stelle of nenner.nullstellen) {
    const treffer = zaehlerRest.findIndex((s) => bruchGleich(s, stelle));
    if (treffer === -1) {
      nennerRest.push(stelle);
      continue;
    }
    zaehlerRest.splice(treffer, 1);
    gekuerzt.push(stelle);
  }

  if (gekuerzt.length === 0) {
    return {
      art: 'nichtKuerzbar',
      ausgeschlossen,
      grund:
        'Zähler und Nenner haben keinen gemeinsamen Faktor — hier lässt sich nichts kürzen.',
      schritte,
    };
  }

  // Der Weg, wie man ihn im Heft schreibt.
  schritte.push({
    regel: 'Zähler und Nenner in Faktoren zerlegen',
    // termAlsText nicht vergessen — alsProdukt() liefert einen TERM,
    // keine Zeichenkette. Ohne das stand hier "[object Object]".
    // Klammern um beide Seiten, sonst liest sich
    // "(x − 1) · (x + 1) : x − 1" wie geteilt durch x, dann minus 1.
    text:
      `(${termAlsText(alsProdukt(zaehler.vorfaktor, zaehler.nullstellen, name))}) : ` +
      `(${termAlsText(alsProdukt(nenner.vorfaktor, nenner.nullstellen, name))})`,
  });

  schritte.push({
    regel: 'gemeinsame Faktoren kürzen',
    text: gekuerzt
      .map((s) => `${termAlsText(linearfaktor(s, name))} steht oben und unten`)
      .join(', '),
  });

  const vorfaktor = geteilt(zaehler.vorfaktor, nenner.vorfaktor);
  const obenRest = alsProdukt(vorfaktor, zaehlerRest, name);
  const untenRest = nennerRest.length === 0 ? null : alsProdukt(bruch(1), nennerRest, name);

  const ergebnis =
    untenRest === null
      ? vereinfache(multipliziereAus(obenRest).term).term
      : quotient(vereinfache(multipliziereAus(obenRest).term).term, untenRest);

  return {
    art: 'gekuerzt',
    ergebnis,
    ausgeschlossen,
    gekuerzt,
    schritte,
    // Der Satz, ohne den das Ergebnis falsch wäre.
    vorbehalt: vorbehaltText(ausgeschlossen, gekuerzt, name),
  };
}

// c · (x − r₁) · (x − r₂) — und ohne das „1 ·", das niemand schreibt.
function alsProdukt(vorfaktor, nullstellen, name) {
  const teile = nullstellen.map((s) => linearfaktor(s, name));
  if (!bruchGleich(vorfaktor, bruch(1))) {
    teile.unshift(zahl(vorfaktor));
  }
  if (teile.length === 0) {
    return zahl(vorfaktor);
  }
  return teile.length === 1 ? teile[0] : produkt(...teile);
}

function vorbehaltText(ausgeschlossen, gekuerzt, name) {
  if (ausgeschlossen.length === 0) {
    return '';
  }
  const liste = ausgeschlossen.map((s) => `${name} ≠ ${zahlAlsText(s)}`).join(' und ');

  const weggekuerzt = gekuerzt.map((s) => zahlAlsText(s));
  const zusatz =
    weggekuerzt.length > 0
      ? ` Besonders bei ${name} = ${weggekuerzt.join(' und ')}: Diese Stelle sieht man dem ` +
        'gekürzten Term nicht mehr an, denn der Faktor, der dort null wurde, ist weggekürzt. ' +
        'Ausgeschlossen bleibt sie trotzdem — der ursprüngliche Term ist dort nicht definiert, ' +
        'und Kürzen ändert daran nichts.'
      : '';

  return `Das gilt nur für ${liste}.${zusatz}`;
}

// ---------------------------------------------------------------------
// Der Definitionsbereich allein
// ---------------------------------------------------------------------
//
// Auch ohne Kürzen die wichtigste Frage bei einem Bruchterm: Wo ist er
// überhaupt definiert? Das ist keine Nebenrechnung — es ist die erste.

export function definitionsluecken(nennerTerm, name = 'x') {
  const koeffs = koeffizienten(multipliziereAus(nennerTerm).term, name);
  if (koeffs === null) {
    return { art: 'unklar', grund: 'Der Nenner ist kein Polynom in einer Variablen.' };
  }
  const zerlegt = faktorisiere(koeffs, name);
  if (zerlegt === null) {
    return { art: 'unklar', grund: `Der Nenner ist vom Grad ${gradVon(koeffs)}.` };
  }
  if (zerlegt.irrational) {
    return {
      art: 'unklar',
      grund: 'Der Nenner hat irrationale Nullstellen — sie lassen sich nicht als Bruch angeben.',
    };
  }
  return { art: 'luecken', stellen: zerlegt.nullstellen };
}

// ---------------------------------------------------------------------
// Ausgabe
// ---------------------------------------------------------------------

export function alsRechenweg(zaehlerTerm, nennerTerm, ergebnis, name = 'x') {
  const zeilen = [`(${termAlsText(zaehlerTerm)}) : (${termAlsText(nennerTerm)})`];

  for (const s of ergebnis.schritte ?? []) {
    zeilen.push(`         | ${s.regel}`);
    zeilen.push(s.text);
  }

  if (ergebnis.art === 'gekuerzt') {
    zeilen.push(`= ${termAlsText(ergebnis.ergebnis)}`);
    zeilen.push(`         | ${ergebnis.vorbehalt}`);
  }
  if (ergebnis.art === 'nichtKuerzbar' && ergebnis.ausgeschlossen.length > 0) {
    zeilen.push(
      `         | definiert für ${ergebnis.ausgeschlossen
        .map((s) => `${name} ≠ ${zahlAlsText(s)}`)
        .join(' und ')}`
    );
  }
  return zeilen;
}
