// Integrieren — die Umkehrung des Ableitens, Schritt für Schritt.
//
//     f(x) = 3x² + 5x
//              | Summenregel: jeden Summanden einzeln
//              | Potenzregel rückwärts: 3x² → 3 · x³/3 = x³
//              | Potenzregel rückwärts: 5x → 5 · x²/2
//     F(x) = x³ + 5/2 · x² + C
//
// Zwei Dinge unterscheiden diese Datei von ableitung.js, und beide sind
// der eigentliche Lernstoff:
//
// 1. DAS +C IST NICHT SCHMUCK. Beim Ableiten fällt jede Konstante weg;
//    beim Integrieren weiß man deshalb nicht, welche es war. Es gibt
//    nicht DIE Stammfunktion, sondern unendlich viele, die sich nur in
//    der Höhe unterscheiden. Wer das C wegläßt, behauptet, es gäbe nur
//    eine.
//
// 2. DIE POTENZREGEL HAT EINE LÜCKE. xⁿ⁺¹/(n+1) versagt bei n = −1,
//    weil dort durch null geteilt würde. Das ist keine Schlamperei der
//    Formel — 1:x hat tatsächlich eine Stammfunktion ganz anderer Art
//    (ln|x|), und die kann term.js nicht darstellen. Also sagt die
//    Datei das, statt zu raten.
//
// Die tragende Prüfung schreibt sich von selbst:
//
//     Leitet man die Stammfunktion wieder ab, muss die Ausgangsfunktion
//     herauskommen.
//
// Und weil ableitung.js seinerseits gegen den Differenzenquotienten
// geprüft ist, hängt am Ende alles an der Definition.

import {
  bruch,
  plus,
  minus,
  mal,
  geteilt,
  negativ,
  istNull,
  gleich as bruchGleich,
} from './bruch.js';
import {
  zahl,
  variable,
  summe,
  produkt,
  potenz,
  quotient,
  istTerm,
  variablen,
  auswerteExakt,
  auswerte,
  alsText as termAlsText,
  zahlAlsText,
  vereinfache,
  multipliziereAus,
} from './term.js';

export const REGELN = Object.freeze({
  konstante: {
    name: 'Konstante integrieren',
    satz: 'Eine Zahl integriert sich zu Zahl mal x — denn abgeleitet ergibt c · x wieder c.',
    formel: '∫ c dx = c · x + C',
  },
  potenz: {
    name: 'Potenzregel rückwärts',
    satz: 'Der Exponent wird um eins GRÖSSER, und durch den neuen Exponenten wird geteilt. Genau umgekehrt zum Ableiten.',
    formel: '∫ xⁿ dx = xⁿ⁺¹ : (n + 1) + C,   n ≠ −1',
  },
  summe: {
    name: 'Summenregel',
    satz: 'Eine Summe wird integriert, indem man jeden Summanden einzeln integriert.',
    formel: '∫ (f + g) dx = ∫ f dx + ∫ g dx',
  },
  faktor: {
    name: 'Faktorregel',
    satz: 'Eine Zahl vor der Funktion bleibt stehen.',
    formel: '∫ c · f dx = c · ∫ f dx',
  },
  alsPotenz: {
    name: 'Als Potenz schreiben',
    satz: 'Wurzeln und Brüche sind Potenzen. Erst so aufgeschrieben, greift die Potenzregel.',
    formel: '√x = x^(1/2)     1 : x² = x⁻²',
  },
  linear: {
    name: 'Lineare Substitution',
    satz: 'Steht in der Klammer ax + b, integriert man wie gewohnt und teilt zum Schluss durch a — das ist die Kettenregel rückwärts.',
    formel: '∫ f(ax + b) dx = F(ax + b) : a + C',
  },
  konstanteC: {
    name: 'Die Integrationskonstante',
    satz: 'Beim Ableiten fällt jede Konstante weg. Beim Integrieren weiß man deshalb nicht, welche es war — deshalb + C.',
    formel: '(F(x) + C)′ = F′(x)',
  },
});

// ---------------------------------------------------------------------
// Die Stammfunktion
// ---------------------------------------------------------------------
//
// Ergebnis:
//   { art: 'stammfunktion', stammfunktion, schritte }
//   { art: 'unklar', grund }

export function integriere(term, name = 'x') {
  if (!istTerm(term)) {
    throw new Error('integriere: das ist kein Term');
  }

  const fremde = variablen(term).filter((n) => n !== name);
  if (fremde.length > 0) {
    return {
      art: 'unklar',
      grund:
        `Hier kommen mehrere Variablen vor (${[name, ...fremde].join(', ')}). ` +
        'Integriert wird nach genau einer.',
    };
  }

  const schritte = [];
  let ergebnis;
  try {
    ergebnis = integriereTerm(term, name, schritte);
  } catch (fehler) {
    if (fehler.nichtIntegrierbar) {
      return { art: 'unklar', grund: fehler.message, schritte };
    }
    throw fehler;
  }

  const aufgeraeumt = aufraeumen(ergebnis);
  schritte.push({
    regel: REGELN.konstanteC.name,
    schluessel: 'konstanteC',
    text: 'Jede Konstante fällt beim Ableiten weg — deshalb gehört + C dazu.',
  });

  return {
    art: 'stammfunktion',
    stammfunktion: aufgeraeumt,
    // Mit dem C dahinter, so wie es hingeschrieben wird. Der Term selbst
    // bleibt ohne C — sonst könnte man ihn nicht auswerten.
    alsText: `${termAlsText(aufgeraeumt)} + C`,
    schritte,
    name,
  };
}

function nichtIntegrierbar(nachricht) {
  const fehler = new Error(nachricht);
  fehler.nichtIntegrierbar = true;
  return fehler;
}

function schritt(schritte, regel, von, zu) {
  schritte.push({
    regel: REGELN[regel].name,
    schluessel: regel,
    von,
    zu,
    text: `∫ ${termAlsText(von)} dx = ${termAlsText(aufraeumen(zu))}`,
  });
  return zu;
}

function istKonstant(term, name) {
  return !variablen(term).includes(name);
}

function integriereTerm(term, name, schritte) {
  // Eine Konstante wird zu c · x. Auch das ist die Umkehrung: c · x
  // abgeleitet ergibt wieder c.
  if (istKonstant(term, name)) {
    return schritt(schritte, 'konstante', term, produkt(term, variable(name)));
  }

  switch (term.art) {
    case 'variable':
      // x integriert ist x²/2.
      return schritt(
        schritte,
        'potenz',
        term,
        quotient(potenz(variable(name), zahl(bruch(2))), zahl(bruch(2)))
      );

    case 'summe': {
      schritte.push({
        regel: REGELN.summe.name,
        schluessel: 'summe',
        von: term,
        zu: term,
        text: `${term.teile.length} Summanden — jeden einzeln integrieren`,
      });
      return summe(...term.teile.map((t) => integriereTerm(t, name, schritte)));
    }

    case 'produkt':
      return produktRegel(term, name, schritte);

    case 'potenz':
      return potenzRegel(term, name, schritte);

    case 'quotient':
      return quotientRegel(term, name, schritte);

    case 'wurzel':
      return wurzelRegel(term, name, schritte);

    default:
      throw nichtIntegrierbar(`Terme der Art "${term.art}" kann ich noch nicht integrieren.`);
  }
}

// Eine Zahl vor der Funktion bleibt stehen. Stehen ZWEI veränderliche
// Faktoren da, hilft keine Regel weiter — es gibt keine Produktregel
// fürs Integrieren, und das ist der Punkt, an dem Integrieren schwerer
// ist als Ableiten.
function produktRegel(term, name, schritte) {
  const konstante = term.teile.filter((t) => istKonstant(t, name));
  const veraenderlich = term.teile.filter((t) => !istKonstant(t, name));

  if (veraenderlich.length !== 1) {
    // Es gibt keine Produktregel fürs Integrieren. Oft braucht man auch
    // keine: x · (x + 1) ist ausmultipliziert x² + x, und dann greift
    // die Summenregel. Genau so rechnet man es im Unterricht auch.
    const ausmultipliziert = multipliziereAus(term).term;
    if (termAlsText(ausmultipliziert) !== termAlsText(term)) {
      schritte.push({
        regel: 'Erst ausmultiplizieren',
        schluessel: 'ausmultiplizieren',
        von: term,
        zu: ausmultipliziert,
        text: `${termAlsText(term)} = ${termAlsText(ausmultipliziert)} — fürs Integrieren gibt es keine Produktregel`,
      });
      return integriereTerm(ausmultipliziert, name, schritte);
    }
    throw nichtIntegrierbar(
      'Hier stehen zwei Faktoren, die beide von x abhängen, und Ausmultiplizieren hilft ' +
        'nicht weiter. Anders als beim Ableiten gibt es fürs Integrieren KEINE ' +
        'Produktregel — dafür bräuchte man die partielle Integration, und die kann ' +
        'diese Datei noch nicht.'
    );
  }

  const faktor = konstante.length === 1 ? konstante[0] : produkt(...konstante);
  schritte.push({
    regel: REGELN.faktor.name,
    schluessel: 'faktor',
    von: term,
    zu: term,
    text: `${termAlsText(faktor)} bleibt stehen, ${termAlsText(veraenderlich[0])} wird integriert`,
  });
  return produkt(faktor, integriereTerm(veraenderlich[0], name, schritte));
}

function potenzRegel(term, name, schritte) {
  if (!istKonstant(term.exponent, name)) {
    throw nichtIntegrierbar(
      'Hier steht die Variable im EXPONENTEN. Dafür bräuchte man die e-Funktion — ' +
        'die kann diese Datei noch nicht.'
    );
  }

  // Erst die Potenzen zusammenziehen: (x²)⁻¹ ist x⁻², nicht x⁻¹. Ohne
  // das wurde 1 : x² fälschlich mit der Begründung abgelehnt, bei x⁻¹
  // versage die Potenzregel — der Exponent −1 gehörte aber zu x², nicht
  // zu x.
  const flach = zusammengezogen(term, name);

  let n;
  try {
    n = auswerteExakt(flach.exponent);
  } catch {
    throw nichtIntegrierbar('Der Exponent muss eine Zahl sein.');
  }

  // Die Lücke der Potenzregel. Sie ist kein Sonderfall, den man
  // übersehen darf: Bei n = −1 stünde im Nenner eine Null.
  if (bruchGleich(n, bruch(-1))) {
    throw nichtIntegrierbar(
      'Bei ∫ x⁻¹ dx versagt die Potenzregel: Der neue Exponent wäre 0, und man müsste ' +
        'durch 0 teilen. Die Stammfunktion von 1 : x ist ln|x| — der natürliche ' +
        'Logarithmus, und den kann diese Datei noch nicht darstellen.'
    );
  }

  const neu = plus(n, bruch(1));

  if (flach.basis.art === 'variable' && flach.basis.name === name) {
    return schritt(
      schritte,
      'potenz',
      term,
      quotient(potenz(variable(name), zahl(neu)), zahl(neu))
    );
  }

  // Innere Funktion: nur die lineare Substitution ist elementar. Alles
  // andere braucht Substitution im allgemeinen Sinn.
  const linear = alsLineareInnenfunktion(flach.basis, name);
  if (linear === null) {
    throw nichtIntegrierbar(
      `In der Klammer steht ${termAlsText(flach.basis)} — das ist nicht von der Form ax + b. ` +
        'Dafür bräuchte man die Substitutionsregel, und die kann diese Datei noch nicht.'
    );
  }

  schritte.push({
    regel: REGELN.linear.name,
    schluessel: 'linear',
    von: term,
    zu: term,
    text: `innen steht ${termAlsText(flach.basis)} — also am Ende durch ${zahlAlsText(linear.a)} teilen`,
  });

  return quotient(quotient(potenz(flach.basis, zahl(neu)), zahl(neu)), zahl(linear.a));
}

// (x²)⁻¹ → x⁻².  Potenz von Potenz heißt Exponenten malnehmen — das
// ist das Potenzgesetz, das der Lernpfad zwei Ebenen tiefer abfragt.
function zusammengezogen(term, name) {
  if (term.basis.art !== 'potenz') {
    return term;
  }
  try {
    const innen = auswerteExakt(term.basis.exponent);
    const aussen = auswerteExakt(term.exponent);
    return potenz(term.basis.basis, zahl(mal(innen, aussen)));
  } catch {
    return term;
  }
}

// Steht dort a·x + b? Dann gibt es a zurück, sonst null.
function alsLineareInnenfunktion(term, name) {
  const werte = [0, 1, 2].map((s) => {
    try {
      return auswerte(term, { [name]: s });
    } catch {
      return NaN;
    }
  });
  if (werte.some((w) => !Number.isFinite(w))) {
    return null;
  }
  const a = werte[1] - werte[0];
  // Linear heißt: die zweite Differenz ist null.
  if (Math.abs(werte[2] - werte[1] - a) > 1e-9 || Math.abs(a) < 1e-12) {
    return null;
  }
  // Der Faktor wird exakt bestimmt, nicht aus der Messung übernommen —
  // gemessen wurde nur, DASS es linear ist.
  try {
    const bei0 = auswerteExakt(term, { [name]: bruch(0) });
    const bei1 = auswerteExakt(term, { [name]: bruch(1) });
    return { a: minus(bei1, bei0) };
  } catch {
    return null;
  }
}

function quotientRegel(term, name, schritte) {
  if (istKonstant(term.nenner, name)) {
    schritte.push({
      regel: REGELN.faktor.name,
      schluessel: 'faktor',
      von: term,
      zu: term,
      text: `durch ${termAlsText(term.nenner)} zu teilen ist eine Faktorregel — der Nenner bleibt stehen`,
    });
    return quotient(integriereTerm(term.zaehler, name, schritte), term.nenner);
  }

  if (!istKonstant(term.zaehler, name)) {
    throw nichtIntegrierbar(
      'Hier steht x im Zähler UND im Nenner. Dafür bräuchte man Partialbruchzerlegung ' +
        'oder Substitution — beides kann diese Datei noch nicht.'
    );
  }

  // c : g wird zu c · g⁻¹ — und dann greift die Potenzregel, samt ihrer
  // Lücke bei n = −1.
  schritte.push({
    regel: REGELN.alsPotenz.name,
    schluessel: 'alsPotenz',
    von: term,
    zu: term,
    text: `${termAlsText(term.zaehler)} : ${termAlsText(term.nenner)} = ${termAlsText(term.zaehler)} · (${termAlsText(term.nenner)})⁻¹`,
  });
  return integriereTerm(
    produkt(term.zaehler, potenz(term.nenner, zahl(bruch(-1)))),
    name,
    schritte
  );
}

function wurzelRegel(term, name, schritte) {
  const exponent = bruch(1, term.grad);
  schritte.push({
    regel: REGELN.alsPotenz.name,
    schluessel: 'alsPotenz',
    von: term,
    zu: term,
    text: `${termAlsText(term)} = (${termAlsText(term.radikand)})^${zahlAlsText(exponent)}`,
  });
  return integriereTerm(potenz(term.radikand, zahl(exponent)), name, schritte);
}

function aufraeumen(term) {
  const knapp = vereinfache(term).term;
  let breit;
  try {
    breit = vereinfache(multipliziereAus(term).term).term;
  } catch {
    return knapp;
  }
  return termAlsText(breit).length < termAlsText(knapp).length ? breit : knapp;
}

// ---------------------------------------------------------------------
// Das bestimmte Integral
// ---------------------------------------------------------------------
//
// F(b) − F(a). Das C fällt dabei weg — es steht in beiden Klammern und
// hebt sich auf. Deshalb ist die Fläche eindeutig, obwohl die
// Stammfunktion es nicht ist. Das ist der Hauptsatz in einem Satz.

export function bestimmtesIntegral(term, von, bis, name = 'x') {
  const F = integriere(term, name);
  if (F.art !== 'stammfunktion') {
    return F;
  }

  let obenWert;
  let untenWert;
  try {
    obenWert = auswerteExakt(F.stammfunktion, { [name]: bis });
    untenWert = auswerteExakt(F.stammfunktion, { [name]: von });
  } catch (fehler) {
    if (fehler.irrational) {
      return {
        art: 'gerundet',
        stammfunktion: F.stammfunktion,
        wert: auswerte(F.stammfunktion, { [name]: bis.z / bis.n }) -
          auswerte(F.stammfunktion, { [name]: von.z / von.n }),
        schritte: F.schritte,
        von,
        bis,
      };
    }
    return {
      art: 'unklar',
      grund: `An den Grenzen lässt sich die Stammfunktion nicht auswerten: ${fehler.message}`,
      schritte: F.schritte,
    };
  }

  return {
    art: 'integral',
    stammfunktion: F.stammfunktion,
    oben: obenWert,
    unten: untenWert,
    wert: minus(obenWert, untenWert),
    schritte: F.schritte,
    von,
    bis,
  };
}

// Die Fläche zwischen Kurve und x-Achse.
//
// NICHT dasselbe wie das Integral, und das ist der Fehler, den fast
// jeder einmal macht: Wo die Kurve UNTER der Achse verläuft, zählt das
// Integral negativ. Bei ∫ von −1 bis 1 über x³ kommt null heraus, obwohl
// dort sehr wohl Fläche liegt — die beiden Hälften heben sich auf.
//
// Für die Fläche muss man deshalb an den Nullstellen trennen und die
// Beträge addieren. Diese Datei sagt beides und nennt den Unterschied.
export function flaeche(term, von, bis, nullstellen, name = 'x') {
  const grenzen = [von, bis, ...nullstellen]
    .map((g) => (typeof g === 'number' ? g : g.z / g.n))
    .filter((g) => g >= Math.min(von.z / von.n, bis.z / bis.n) - 1e-12)
    .filter((g) => g <= Math.max(von.z / von.n, bis.z / bis.n) + 1e-12)
    .sort((a, b) => a - b);

  const einmalig = grenzen.filter((g, i) => i === 0 || Math.abs(g - grenzen[i - 1]) > 1e-12);

  const abschnitte = [];
  for (let i = 0; i + 1 < einmalig.length; i++) {
    const a = einmalig[i];
    const b = einmalig[i + 1];
    const teil = numerisch(term, a, b, name);
    abschnitte.push({ von: a, bis: b, wert: teil, unterhalb: teil < 0 });
  }

  const integral = abschnitte.reduce((s, t) => s + t.wert, 0);
  const inhalt = abschnitte.reduce((s, t) => s + Math.abs(t.wert), 0);

  return {
    art: 'flaeche',
    abschnitte,
    integral,
    inhalt,
    // Wenn beide Zahlen auseinandergehen, liegt ein Stück unter der
    // Achse — und genau dann muss die App den Unterschied erklären.
    unterschied: Math.abs(integral - inhalt) > 1e-9,
  };
}

// Simpson — für die Flächenaufteilung und als unabhängige Kontrolle
// des bestimmten Integrals. Bewusst NUMERISCH: Ein zweiter exakter Weg
// über dieselbe Stammfunktion prüfte nichts, weil er denselben Fehler
// machen würde.
export function numerisch(term, von, bis, name = 'x', streifen = 400) {
  const n = streifen % 2 === 0 ? streifen : streifen + 1;
  const h = (bis - von) / n;
  if (h === 0) {
    return 0;
  }

  let summeWerte = auswerte(term, { [name]: von }) + auswerte(term, { [name]: bis });
  for (let i = 1; i < n; i++) {
    const x = von + i * h;
    summeWerte += (i % 2 === 0 ? 2 : 4) * auswerte(term, { [name]: x });
  }
  return (h / 3) * summeWerte;
}

// ---------------------------------------------------------------------
// Der Rechenweg als Text
// ---------------------------------------------------------------------

export function alsRechenweg(term, ergebnis, name = 'x') {
  const zeilen = [`f(${name}) = ${termAlsText(term)}`];
  for (const s of ergebnis.schritte) {
    zeilen.push(`         | ${s.regel}: ${s.text}`);
  }
  if (ergebnis.art === 'stammfunktion') {
    zeilen.push(`F(${name}) = ${ergebnis.alsText}`);
  }
  if (ergebnis.art === 'integral') {
    zeilen.push(`F(${name}) = ${termAlsText(ergebnis.stammfunktion)} + C`);
    zeilen.push(
      `         | Grenzen einsetzen: F(${zahlAlsText(ergebnis.bis)}) − F(${zahlAlsText(ergebnis.von)})`
    );
    zeilen.push(
      `         | ${zahlAlsText(ergebnis.oben)} − ${zahlAlsText(ergebnis.unten)}`
    );
    zeilen.push(`= ${zahlAlsText(ergebnis.wert)}`);
  }
  return zeilen;
}
