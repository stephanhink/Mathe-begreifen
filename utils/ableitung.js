// Ableiten — Schritt für Schritt, mit dem Namen jeder Regel.
//
//     f(x) = 3x² + 5x
//              | Summenregel: jeden Summanden einzeln
//              | Faktorregel und Potenzregel: 3x² → 3 · 2x = 6x
//              | Potenzregel: 5x → 5
//     f′(x) = 6x + 5
//
// Diese Datei ist der Punkt, auf den der ganze Lernpfad zuläuft. Aus
// CLAUDE.md:
//
//   Wer die Potenzgesetze nicht sicher beherrscht, scheitert an der
//   Kettenregel und weiß nicht, warum. Er glaubt, er verstehe
//   Ableitungen nicht — in Wahrheit versteht er x⁻² nicht.
//
// Deshalb sind die beiden Umschreibungen HIER eigene, benannte
// Schritte und keine stille Vorbereitung:
//
//     1 : x  =  x⁻¹        √x  =  x^(1/2)
//
// Wer sie sieht, sieht auch, warum die Ableitung von √x plötzlich einen
// Bruch im Exponenten hat. Wer sie nicht sieht, lernt eine Formel
// auswendig, die vom Himmel fällt.
//
// Umfang: ganzrationale Funktionen, Wurzeln, Brüche — also alles, was
// term.js darstellen kann. Sinus, e-Funktion und Logarithmus fehlen,
// weil term.js sie nicht kennt; die Datei sagt das, statt zu raten.

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
  alsText as termAlsText,
  zahlAlsText,
  vereinfache,
  multipliziereAus,
} from './term.js';

// ---------------------------------------------------------------------
// Die Regeln, mit Namen
// ---------------------------------------------------------------------
//
// Der Name ist kein Beiwerk. „= 6x" hilft niemandem; „Potenzregel: der
// Exponent kommt nach vorn und wird um eins kleiner" kann man beim
// nächsten Mal selbst anwenden.

export const REGELN = Object.freeze({
  konstante: {
    name: 'Konstantenregel',
    satz: 'Eine Zahl allein ändert sich nicht — ihre Ableitung ist 0.',
    formel: 'c′ = 0',
  },
  variable: {
    name: 'Ableitung von x',
    satz: 'x wächst genau so schnell wie x. Die Steigung ist überall 1.',
    formel: 'x′ = 1',
  },
  summe: {
    name: 'Summenregel',
    satz: 'Eine Summe wird abgeleitet, indem man jeden Summanden einzeln ableitet.',
    formel: '(f + g)′ = f′ + g′',
  },
  faktor: {
    name: 'Faktorregel',
    satz: 'Eine Zahl vor der Funktion bleibt stehen — sie streckt die Kurve und damit auch die Steigung.',
    formel: '(c · f)′ = c · f′',
  },
  potenz: {
    name: 'Potenzregel',
    satz: 'Der Exponent kommt als Faktor nach vorn, und der Exponent wird um eins kleiner.',
    formel: '(xⁿ)′ = n · xⁿ⁻¹',
  },
  produkt: {
    name: 'Produktregel',
    satz: 'Erster abgeleitet mal zweiter, plus erster mal zweiter abgeleitet.',
    formel: '(f · g)′ = f′ · g + f · g′',
  },
  quotient: {
    name: 'Quotientenregel',
    satz: 'Nenner mal Zähler abgeleitet, minus Zähler mal Nenner abgeleitet, alles durch den Nenner zum Quadrat.',
    formel: '(f : g)′ = (f′ · g − f · g′) : g²',
  },
  kette: {
    name: 'Kettenregel',
    satz: 'Äußere Ableitung mal innere Ableitung. Die innere wird gern vergessen — sie ist der ganze Unterschied.',
    formel: "f(g(x))′ = f′(g(x)) · g′(x)",
  },
  alsPotenz: {
    name: 'Als Potenz schreiben',
    satz: 'Wurzeln und Brüche sind Potenzen. Erst so aufgeschrieben, greift die Potenzregel.',
    formel: '√x = x^(1/2)     1 : x = x⁻¹',
  },
});

// ---------------------------------------------------------------------
// Ableiten
// ---------------------------------------------------------------------
//
// Ergebnis:
//   { art: 'ableitung', ableitung, schritte }
//   { art: 'unklar', grund }
//
// 'unklar' ist ein gültiges Ergebnis und keine Ausnahme — dieselbe
// Haltung wie in gleichung.js und system.js.

export function ableite(term, name = 'x') {
  if (!istTerm(term)) {
    throw new Error('ableite: das ist kein Term');
  }

  const fremde = variablen(term).filter((n) => n !== name);
  if (fremde.length > 0) {
    return {
      art: 'unklar',
      grund:
        `Hier kommen mehrere Variablen vor (${[name, ...fremde].join(', ')}). ` +
        `Abgeleitet wird nach genau einer.`,
    };
  }

  const schritte = [];
  let ergebnis;
  try {
    ergebnis = leiteAb(term, name, schritte);
  } catch (fehler) {
    if (fehler.nichtAbleitbar) {
      return { art: 'unklar', grund: fehler.message, schritte };
    }
    throw fehler;
  }

  const aufgeraeumt = aufraeumen(ergebnis);
  return { art: 'ableitung', ableitung: aufgeraeumt, schritte, name };
}

// Mehrfach ableiten — f″ für die Krümmung, f‴ für den Wendepunkt.
export function ableiteMehrfach(term, ordnung, name = 'x') {
  if (!Number.isInteger(ordnung) || ordnung < 1) {
    throw new Error('ableiteMehrfach: die Ordnung muss eine ganze Zahl ≥ 1 sein');
  }
  let aktuell = term;
  const alle = [];
  for (let i = 0; i < ordnung; i++) {
    const e = ableite(aktuell, name);
    if (e.art !== 'ableitung') {
      return e;
    }
    alle.push(e);
    aktuell = e.ableitung;
  }
  return { art: 'ableitung', ableitung: aktuell, schritte: alle.flatMap((e) => e.schritte), name, alle };
}

function nichtAbleitbar(nachricht) {
  const fehler = new Error(nachricht);
  fehler.nichtAbleitbar = true;
  return fehler;
}

function schritt(schritte, regel, von, zu) {
  schritte.push({
    regel: REGELN[regel].name,
    schluessel: regel,
    von,
    zu,
    text: `(${termAlsText(von)})′ = ${termAlsText(aufraeumen(zu))}`,
  });
  return zu;
}

// Hängt der Term überhaupt von der Variablen ab? Wenn nicht, ist er
// eine Konstante — egal wie kompliziert er aussieht.
function istKonstant(term, name) {
  return !variablen(term).includes(name);
}

function leiteAb(term, name, schritte) {
  if (istKonstant(term, name)) {
    return schritt(schritte, 'konstante', term, zahl(bruch(0)));
  }

  switch (term.art) {
    case 'variable':
      return schritt(schritte, 'variable', term, zahl(bruch(1)));

    case 'summe': {
      const zu = summe(...term.teile.map(() => zahl(bruch(0))));
      schritte.push({
        regel: REGELN.summe.name,
        schluessel: 'summe',
        von: term,
        zu,
        text: `${term.teile.length} Summanden — jeden einzeln ableiten`,
      });
      return summe(...term.teile.map((t) => leiteAb(t, name, schritte)));
    }

    case 'produkt':
      return produktRegel(term, name, schritte);

    case 'potenz':
      return potenzRegel(term, name, schritte);

    case 'quotient':
      return quotientenRegel(term, name, schritte);

    case 'wurzel':
      return wurzelRegel(term, name, schritte);

    case 'betrag':
      throw nichtAbleitbar(
        'Der Betrag hat bei null einen Knick — dort gibt es keine Ableitung. ' +
          'Solche Stellen kann diese Datei noch nicht behandeln.'
      );

    default:
      throw nichtAbleitbar(`Terme der Art "${term.art}" kann ich noch nicht ableiten.`);
  }
}

// ---------------------------------------------------------------------
// Produkt: erst Faktorregel versuchen, dann Produktregel
// ---------------------------------------------------------------------
//
// 3x² ist ein Produkt, aber niemand rechnet dafür die Produktregel —
// die 3 ist eine Zahl und bleibt einfach stehen. Erst wenn ZWEI Faktoren
// von x abhängen, braucht man sie wirklich.

function produktRegel(term, name, schritte) {
  const konstanteTeile = term.teile.filter((t) => istKonstant(t, name));
  const variableTeile = term.teile.filter((t) => !istKonstant(t, name));

  if (variableTeile.length === 1 && konstanteTeile.length > 0) {
    const faktor = konstanteTeile.length === 1 ? konstanteTeile[0] : produkt(...konstanteTeile);
    const innen = variableTeile[0];
    schritte.push({
      regel: REGELN.faktor.name,
      schluessel: 'faktor',
      von: term,
      zu: term,
      text: `${termAlsText(faktor)} bleibt stehen, ${termAlsText(innen)} wird abgeleitet`,
    });
    return produkt(faktor, leiteAb(innen, name, schritte));
  }

  // Mehrere veränderliche Faktoren: Produktregel, notfalls mehrfach.
  const [erster, ...rest] = variableTeile;
  const zweiter = rest.length === 1 ? rest[0] : produkt(...rest);
  const konstante = konstanteTeile.length === 0 ? null : konstanteTeile.length === 1 ? konstanteTeile[0] : produkt(...konstanteTeile);

  schritte.push({
    regel: REGELN.produkt.name,
    schluessel: 'produkt',
    von: term,
    zu: term,
    text: `f = ${termAlsText(erster)},  g = ${termAlsText(zweiter)}  →  f′ · g + f · g′`,
  });

  const abgeleitet = summe(
    produkt(leiteAb(erster, name, schritte), zweiter),
    produkt(erster, leiteAb(zweiter, name, schritte))
  );
  return konstante === null ? abgeleitet : produkt(konstante, abgeleitet);
}

// ---------------------------------------------------------------------
// Potenz: Potenzregel, bei zusammengesetzter Basis mit Kettenregel
// ---------------------------------------------------------------------

function potenzRegel(term, name, schritte) {
  if (!istKonstant(term.exponent, name)) {
    throw nichtAbleitbar(
      'Hier steht die Variable im EXPONENTEN. Das ist eine Exponentialfunktion, ' +
        'und dafür braucht man die e-Funktion und den natürlichen Logarithmus — ' +
        'die kann diese Datei noch nicht.'
    );
  }

  let n;
  try {
    n = auswerteExakt(term.exponent);
  } catch {
    throw nichtAbleitbar('Der Exponent muss eine Zahl sein.');
  }

  const neuerExponent = minus(n, bruch(1));
  const aeussere = produkt(zahl(n), potenz(term.basis, zahl(neuerExponent)));

  // Basis ist genau die Variable: die reine Potenzregel.
  if (term.basis.art === 'variable' && term.basis.name === name) {
    return schritt(schritte, 'potenz', term, aeussere);
  }

  // Sonst steckt eine innere Funktion darin — Kettenregel.
  schritte.push({
    regel: REGELN.kette.name,
    schluessel: 'kette',
    von: term,
    zu: term,
    text: `innen: ${termAlsText(term.basis)} — außen wird die Potenzregel angewandt, dann mal der inneren Ableitung`,
  });
  const innen = leiteAb(term.basis, name, schritte);
  return produkt(aeussere, innen);
}

// ---------------------------------------------------------------------
// Quotient
// ---------------------------------------------------------------------

function quotientenRegel(term, name, schritte) {
  // Durch eine Zahl teilen ist die Faktorregel — die Quotientenregel
  // dafür zu bemühen ist der häufigste unnötige Rechenweg im Unterricht.
  if (istKonstant(term.nenner, name)) {
    schritte.push({
      regel: REGELN.faktor.name,
      schluessel: 'faktor',
      von: term,
      zu: term,
      text: `durch ${termAlsText(term.nenner)} zu teilen ist eine Faktorregel — der Nenner bleibt stehen`,
    });
    return quotient(leiteAb(term.zaehler, name, schritte), term.nenner);
  }

  // 1 : g ist ein Sonderfall, den man als Potenz schreiben sollte —
  // sonst versteht niemand, warum in der Ableitung x⁻² auftaucht.
  if (istKonstant(term.zaehler, name)) {
    schritte.push({
      regel: REGELN.alsPotenz.name,
      schluessel: 'alsPotenz',
      von: term,
      zu: term,
      text: `${termAlsText(term.zaehler)} : ${termAlsText(term.nenner)} = ${termAlsText(term.zaehler)} · (${termAlsText(term.nenner)})⁻¹`,
    });
    const alsPotenz = produkt(term.zaehler, potenz(term.nenner, zahl(bruch(-1))));
    return leiteAb(alsPotenz, name, schritte);
  }

  schritte.push({
    regel: REGELN.quotient.name,
    schluessel: 'quotient',
    von: term,
    zu: term,
    text: `f = ${termAlsText(term.zaehler)},  g = ${termAlsText(term.nenner)}  →  (f′ · g − f · g′) : g²`,
  });

  const zaehlerAbleitung = leiteAb(term.zaehler, name, schritte);
  const nennerAbleitung = leiteAb(term.nenner, name, schritte);

  return quotient(
    summe(
      produkt(zaehlerAbleitung, term.nenner),
      produkt(zahl(bruch(-1)), term.zaehler, nennerAbleitung)
    ),
    potenz(term.nenner, zahl(bruch(2)))
  );
}

// ---------------------------------------------------------------------
// Wurzel
// ---------------------------------------------------------------------
//
// Es gibt keine eigene Wurzelregel. √x IST x^(1/2), und sobald das
// dasteht, greift die Potenzregel wie überall sonst. Genau deshalb ist
// das Umschreiben ein eigener, sichtbarer Schritt: Wer es einmal
// gesehen hat, braucht sich die „Wurzelableitung" nicht zu merken.

function wurzelRegel(term, name, schritte) {
  const exponent = bruch(1, term.grad);
  schritte.push({
    regel: REGELN.alsPotenz.name,
    schluessel: 'alsPotenz',
    von: term,
    zu: term,
    text: `${termAlsText(term)} = (${termAlsText(term.radikand)})^${zahlAlsText(exponent)}`,
  });
  return leiteAb(potenz(term.radikand, zahl(exponent)), name, schritte);
}

// ---------------------------------------------------------------------
// Aufräumen
// ---------------------------------------------------------------------
//
// Die Ableitung entsteht als Bauwerk aus Regeln und sieht entsprechend
// aus: "1 · 2 · x^1 + 0". Das ist richtig und unlesbar. Aufgeräumt wird
// mit denselben Werkzeugen wie überall — nicht mit einer eigenen
// Vereinfachung, die anders rechnen könnte als der Rest der App.

// Zwei Wege, und keiner gewinnt immer:
//
//   ausmultipliziert   (2x+1)³ → 24x² + 24x + 6      x²·(x+1) → 3x² + 2x
//   nur zusammengefasst (2x+1)³ → 6(2x + 1)²          x²·(x+1) → 2x · (x + 1) + x²
//
// Bei der Kettenregel ist die Klammerform die, die man im Heft
// stehen lässt; beim Produkt ist die ausmultiplizierte die, die man
// hinschreibt. Da BEIDE wertgleich sind — dafür sorgt die tragende
// Prüfung in term.js —, ändert die Wahl nichts am Ergebnis, nur an der
// Lesbarkeit. Also entscheidet die kürzere Schreibweise.
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
// Was man mit der Ableitung macht
// ---------------------------------------------------------------------

// Die Steigung an einer Stelle — das ist die ganze Bedeutung der
// Ableitung, und sie geht beim Rechnen leicht verloren.
export function steigungBei(term, stelle, name = 'x') {
  const e = ableite(term, name);
  if (e.art !== 'ableitung') {
    return e;
  }
  return { art: 'steigung', wert: auswerteExakt(e.ableitung, { [name]: stelle }), ableitung: e.ableitung };
}

// Die Tangente: die Gerade, die sich an dieser Stelle an die Kurve
// anschmiegt. y = f′(x₀) · (x − x₀) + f(x₀)
//
// Sie ist das Bild, das die Ableitung begreifbar macht — eine Zahl wie
// „f′(2) = 4" sagt wenig, eine Gerade, die die Kurve berührt, sagt alles.
export function tangente(term, stelle, name = 'x') {
  const e = ableite(term, name);
  if (e.art !== 'ableitung') {
    return e;
  }

  const m = auswerteExakt(e.ableitung, { [name]: stelle });
  const y0 = auswerteExakt(term, { [name]: stelle });
  // y = m·x + (y₀ − m·x₀)
  const b = minus(y0, mal(m, stelle));

  const glieder = [];
  if (!istNull(m)) {
    glieder.push(bruchGleich(m, bruch(1)) ? variable(name) : produkt(zahl(m), variable(name)));
  }
  if (!istNull(b) || glieder.length === 0) {
    glieder.push(zahl(b));
  }

  return {
    art: 'tangente',
    steigung: m,
    achsenabschnitt: b,
    stelle,
    beruehrpunkt: y0,
    term: glieder.length === 1 ? glieder[0] : summe(...glieder),
  };
}

// ---------------------------------------------------------------------
// Der Rechenweg als Text
// ---------------------------------------------------------------------

export function alsRechenweg(term, ergebnis, name = 'x') {
  const zeilen = [`f(${name}) = ${termAlsText(term)}`];
  for (const s of ergebnis.schritte) {
    zeilen.push(`         | ${s.regel}: ${s.text}`);
  }
  if (ergebnis.art === 'ableitung') {
    zeilen.push(`f′(${name}) = ${termAlsText(ergebnis.ableitung)}`);
  }
  return zeilen;
}
