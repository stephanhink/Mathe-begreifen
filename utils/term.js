// Terme darstellen, auswerten und umformen — mit benannten Schritten.
//
// Das ist die technische Hauptarbeit der App. Die eiserne Regel aus
// CLAUDE.md lautet:
//
//   Jeder Rechenschritt wird hergeleitet, nie nachgeschlagen — und jeder
//   Schritt hat einen Namen.
//
// Deshalb gibt keine Funktion hier einfach ein Ergebnis zurück. Sie gibt
// den Weg zurück: eine Liste von Schritten, jeder mit dem Namen der
// Regel, die angewandt wurde, und dem Term danach. Was man vorlesen kann,
// hat man verstanden.
//
// Ein Term ist ein Baum aus eingefrorenen Objekten. Gerechnet wird
// ausschließlich über utils/bruch.js, also exakt — ein Zwischenergebnis
// wie 0,30000000000000004 würde einem Schüler die ganze Rechnung
// kaputtmachen.
//
// Was hier NICHT steht: Gleichungen lösen. Das ist utils/gleichung.js und
// baut hierauf auf ("beide Seiten − 5" ist eine Aussage über eine
// Gleichung, nicht über einen Term).

import {
  bruch,
  ggT,
  kgV,
  plus,
  mal,
  geteilt,
  hoch,
  negativ,
  istBruch,
  istNull,
  istGanz,
  istNegativ,
  gleich as bruchGleich,
  alsZahl,
  ausDezimal,
  alsText as bruchAlsText,
} from './bruch.js';

// ---------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------
//
// summe und produkt sind mehrstellig, nicht zweistellig. a + b + c ist
// EINE Summe mit drei Gliedern, kein verschachteltes (a + b) + c. Das ist
// keine Kosmetik: "gleichartige Glieder zusammenfassen" muss alle Glieder
// gleichzeitig sehen können, sonst findet die Regel 3x + 5 + 2x nicht.
//
// Deshalb ziehen die Konstruktoren verschachtelte Summen und Produkte
// sofort flach und lassen entartete Fälle gar nicht erst entstehen.

export function zahl(wert) {
  const b = istBruch(wert) ? wert : bruch(wert);
  return Object.freeze({ art: 'zahl', wert: b });
}

export function variable(name) {
  if (typeof name !== 'string' || !/^[a-zA-Zα-ωΑ-Ω][0-9]?$/.test(name)) {
    throw new Error(`variable: "${name}" ist kein zulässiger Variablenname`);
  }
  return Object.freeze({ art: 'variable', name });
}

export function summe(...teile) {
  const flach = [];
  for (const t of teile) {
    pruefeTerm(t, 'summe');
    if (t.art === 'summe') {
      flach.push(...t.teile);
    } else {
      flach.push(t);
    }
  }
  if (flach.length === 0) {
    return zahl(0);
  }
  if (flach.length === 1) {
    return flach[0];
  }
  return Object.freeze({ art: 'summe', teile: Object.freeze(flach) });
}

export function produkt(...teile) {
  const flach = [];
  for (const t of teile) {
    pruefeTerm(t, 'produkt');
    if (t.art === 'produkt') {
      flach.push(...t.teile);
    } else {
      flach.push(t);
    }
  }
  if (flach.length === 0) {
    return zahl(1);
  }
  if (flach.length === 1) {
    return flach[0];
  }
  return Object.freeze({ art: 'produkt', teile: Object.freeze(flach) });
}

export function potenz(basis, exponent) {
  pruefeTerm(basis, 'potenz');
  pruefeTerm(exponent, 'potenz');
  return Object.freeze({ art: 'potenz', basis, exponent });
}

export function quotient(zaehler, nenner) {
  pruefeTerm(zaehler, 'quotient');
  pruefeTerm(nenner, 'quotient');
  return Object.freeze({ art: 'quotient', zaehler, nenner });
}

const ARTEN = ['zahl', 'variable', 'summe', 'produkt', 'potenz', 'quotient'];

export function istTerm(wert) {
  return typeof wert === 'object' && wert !== null && ARTEN.includes(wert.art);
}

function pruefeTerm(wert, wo) {
  if (!istTerm(wert)) {
    throw new Error(`${wo}: "${kurz(wert)}" ist kein Term`);
  }
  return wert;
}

function kurz(wert) {
  if (wert === null || wert === undefined) {
    return String(wert);
  }
  return typeof wert === 'object' ? JSON.stringify(wert).slice(0, 60) : String(wert);
}

// ---------------------------------------------------------------------
// Durch den Baum laufen
// ---------------------------------------------------------------------

function kinderVon(term) {
  switch (term.art) {
    case 'summe':
    case 'produkt':
      return term.teile;
    case 'potenz':
      return [term.basis, term.exponent];
    case 'quotient':
      return [term.zaehler, term.nenner];
    default:
      return [];
  }
}

function mitKind(term, index, neu) {
  switch (term.art) {
    case 'summe': {
      const teile = [...term.teile];
      teile[index] = neu;
      return summe(...teile);
    }
    case 'produkt': {
      const teile = [...term.teile];
      teile[index] = neu;
      return produkt(...teile);
    }
    case 'potenz':
      return index === 0 ? potenz(neu, term.exponent) : potenz(term.basis, neu);
    case 'quotient':
      return index === 0 ? quotient(neu, term.nenner) : quotient(term.zaehler, neu);
    default:
      throw new Error(`mitKind: ${term.art} hat keine Kinder`);
  }
}

// Alle Variablennamen im Term, alphabetisch und ohne Wiederholung.
export function variablen(term) {
  pruefeTerm(term, 'variablen');
  const gefunden = new Set();
  (function sammle(t) {
    if (t.art === 'variable') {
      gefunden.add(t.name);
    }
    kinderVon(t).forEach(sammle);
  })(term);
  return [...gefunden].sort();
}

// Strukturelle Gleichheit. Bewusst NICHT mathematische Gleichheit:
// x + 1 und 1 + x sind hier verschieden. Wer wissen will, ob zwei Terme
// denselben Wert haben, wertet sie aus — das ist eine andere Frage, und
// sie zu verwechseln ist der Anfang aller Fehler in so einem Modul.
export function istGleich(a, b) {
  pruefeTerm(a, 'istGleich');
  pruefeTerm(b, 'istGleich');
  return alsText(a) === alsText(b);
}

// ---------------------------------------------------------------------
// Auswerten
// ---------------------------------------------------------------------

// Exakt, in Brüchen. Die Belegung ordnet jedem Variablennamen einen Bruch
// zu: auswerteExakt(t, { x: bruch(1, 2) }).
//
// Wirft, wo es nichts zu rechnen gibt: unbelegte Variable, Division durch
// null, gebrochener Exponent. Nie eine Zahl raten — das ist dieselbe
// Haltung wie in der Chemie-App, wo kein Reaktionsprodukt erfunden wird.
export function auswerteExakt(term, belegung = {}) {
  pruefeTerm(term, 'auswerteExakt');

  switch (term.art) {
    case 'zahl':
      return term.wert;

    case 'variable': {
      const wert = belegung[term.name];
      if (wert === undefined) {
        throw new Error(`auswerteExakt: Variable "${term.name}" ist nicht belegt`);
      }
      if (!istBruch(wert)) {
        throw new Error(
          `auswerteExakt: Belegung für "${term.name}" ist kein Bruch — bitte bruch(z, n) benutzen`
        );
      }
      return wert;
    }

    case 'summe':
      return term.teile.reduce((s, t) => plus(s, auswerteExakt(t, belegung)), bruch(0));

    case 'produkt':
      return term.teile.reduce((p, t) => mal(p, auswerteExakt(t, belegung)), bruch(1));

    case 'potenz': {
      const e = auswerteExakt(term.exponent, belegung);
      if (!istGanz(e)) {
        throw new Error(
          `auswerteExakt: Exponent ${bruchAlsText(e)} ist keine ganze Zahl — ` +
            'gebrochene Exponenten sind Wurzeln und im Allgemeinen keine Brüche'
        );
      }
      return hoch(auswerteExakt(term.basis, belegung), e.z);
    }

    case 'quotient':
      return geteilt(auswerteExakt(term.zaehler, belegung), auswerteExakt(term.nenner, belegung));

    default:
      throw new Error(`auswerteExakt: unbekannte Art "${term.art}"`);
  }
}

// Als Kommazahl — für Funktionsgraphen und alles, was ohnehin nur
// gezeichnet wird. Nicht zum Weiterrechnen.
//
// Die Belegung darf hier auch Kommazahlen enthalten; sie werden exakt
// umgerechnet (0,5 → 1/2). Gerechnet wird trotzdem in Brüchen, nur das
// Ergebnis ist eine Kommazahl.
export function auswerte(term, belegung = {}) {
  const alsBrueche = {};
  for (const [name, wert] of Object.entries(belegung)) {
    alsBrueche[name] = istBruch(wert) ? wert : ausDezimal(wert);
  }
  return alsZahl(auswerteExakt(term, alsBrueche));
}

// ---------------------------------------------------------------------
// Aufschreiben
// ---------------------------------------------------------------------

// Das Minuszeichen ist U+2212, nicht der Bindestrich der Tastatur.
// bruch.js liefert "-3" mit Bindestrich; hier wird daraus "−3".
//
// Das ist nicht Pedanterie: In einer Summe steht ohnehin schon "−"
// (a − b), und wenn der Koeffizient daneben einen Bindestrich trüge,
// stünden zwei verschieden lange Striche in derselben Zeile. Auf einem
// Handy-Display sieht das nach Fehler aus.
const MINUS = '−';

function zahlText(wert) {
  return bruchAlsText(wert).replace('-', MINUS);
}

const HOCHGESTELLT = {
  '-': '⁻',
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
};

// Bindungsstärke, damit nur die Klammern gesetzt werden, die man wirklich
// braucht. Zu viele Klammern sind fast so schlimm wie zu wenige: Sie
// lassen einen einfachen Term kompliziert aussehen.
const STAERKE = { summe: 1, produkt: 2, quotient: 2, potenz: 3, zahl: 4, variable: 4 };

export function alsText(term) {
  pruefeTerm(term, 'alsText');

  switch (term.art) {
    case 'zahl':
      return zahlText(term.wert);

    case 'variable':
      return term.name;

    case 'summe':
      return term.teile
        .map((t, i) => {
          const text = geklammert(t, 'summe');
          if (i === 0) {
            return text;
          }
          // Ein negatives Glied wird als Minus geschrieben, nicht als
          // "+ −3". So schreibt es auch der Unterricht.
          return text.startsWith(MINUS) ? ` ${MINUS} ${text.slice(1)}` : ` + ${text}`;
        })
        .join('');

    case 'produkt':
      return produktAlsText(term);

    case 'potenz':
      return potenzAlsText(term);

    case 'quotient':
      return `${geklammert(term.zaehler, 'quotient')} : ${geklammert(term.nenner, 'potenz')}`;

    default:
      throw new Error(`alsText: unbekannte Art "${term.art}"`);
  }
}

function geklammert(term, umgebung) {
  const text = alsText(term);
  return STAERKE[term.art] < STAERKE[umgebung] ? `(${text})` : text;
}

function produktAlsText(term) {
  const zahlen = term.teile.filter((t) => t.art === 'zahl');
  const rest = term.teile.filter((t) => t.art !== 'zahl');

  const faktor = zahlen.reduce((p, t) => mal(p, t.wert), bruch(1));
  const restText = rest.map((t) => geklammert(t, 'produkt')).join(' · ');

  if (rest.length === 0) {
    return zahlText(faktor);
  }
  // 1 · x ist x, (−1) · x ist −x. Beides wegzulassen ist kein
  // Vereinfachungsschritt, sondern nur Schreibweise.
  if (bruchGleich(faktor, bruch(1))) {
    return restText;
  }
  if (bruchGleich(faktor, bruch(-1))) {
    return `${MINUS}${restText}`;
  }

  // Zwischen Zahl und Buchstabe steht kein Malpunkt: 3x, nicht 3 · x.
  // Das gilt auch, wenn noch weitere Faktoren folgen — 2x · (1 + 3x)
  // liest sich wie im Heft, 2 · x · (1 + 3x) sieht nach Maschine aus.
  //
  // Vor einer Klammer bleibt der Punkt dagegen stehen: 2 · (x + 3).
  // Ohne ihn stünde dort 2(x + 3), und dann müsste man erklären, warum
  // hier ein unsichtbares Mal steht und bei f(x) nicht.
  const ersterOhnePunkt = rest[0].art === 'variable' || rest[0].art === 'potenz';
  if (!ersterOhnePunkt) {
    return `${zahlText(faktor)} · ${restText}`;
  }

  const kopf = geklammert(rest[0], 'produkt');
  const schwanz = rest.slice(1).map((t) => geklammert(t, 'produkt'));
  return [`${zahlText(faktor)}${kopf}`, ...schwanz].join(' · ');
}

function potenzAlsText(term) {
  const basisText = geklammert(term.basis, 'potenz');

  if (term.exponent.art === 'zahl' && istGanz(term.exponent.wert)) {
    const ziffern = String(term.exponent.wert.z);
    if ([...ziffern].every((z) => z in HOCHGESTELLT)) {
      return basisText + [...ziffern].map((z) => HOCHGESTELLT[z]).join('');
    }
  }
  return `${basisText}^(${alsText(term.exponent)})`;
}

// ---------------------------------------------------------------------
// Monome zerlegen
// ---------------------------------------------------------------------
//
// Ein Produkt wie 6x²y wird zerlegt in den Zahlfaktor 6 und die
// Potenzen { x: 2, y: 1 }. Darauf stützen sich gleich drei Regeln:
// Zahlen zusammenrechnen, Potenzgesetze, gleichartige Glieder finden.
//
// Als Schlüssel für "gleichartig" dient der Text der Basis. Zwei Terme,
// die verschieden geschrieben sind, gelten dabei als verschieden — das
// verhindert nichts Richtiges, es lässt nur eine Zusammenfassung aus.
// Ein Fehler in diese Richtung ist harmlos, in die andere wäre er es
// nicht.

function zerlegeMonom(term) {
  let koeffizient = bruch(1);
  const potenzen = new Map();

  const faktoren = term.art === 'produkt' ? term.teile : [term];

  for (const f of faktoren) {
    if (f.art === 'zahl') {
      koeffizient = mal(koeffizient, f.wert);
      continue;
    }

    let basis = f;
    let exponent = 1;
    if (f.art === 'potenz' && f.exponent.art === 'zahl' && istGanz(f.exponent.wert)) {
      basis = f.basis;
      exponent = f.exponent.wert.z;
    }

    const schluessel = alsText(basis);
    const vorhanden = potenzen.get(schluessel);
    if (vorhanden) {
      vorhanden.exponent += exponent;
    } else {
      potenzen.set(schluessel, { basis, exponent });
    }
  }

  return { koeffizient, potenzen };
}

function baueMonom({ koeffizient, potenzen }) {
  if (istNull(koeffizient)) {
    return zahl(0);
  }

  const faktoren = [];
  for (const { basis, exponent } of [...potenzen.values()].sort((a, b) =>
    alsText(a.basis) < alsText(b.basis) ? -1 : 1
  )) {
    if (exponent === 0) {
      continue;
    }
    faktoren.push(exponent === 1 ? basis : potenz(basis, zahl(exponent)));
  }

  if (faktoren.length === 0) {
    return zahl(koeffizient);
  }
  if (bruchGleich(koeffizient, bruch(1))) {
    return produkt(...faktoren);
  }
  return produkt(zahl(koeffizient), ...faktoren);
}

// Der Schlüssel, an dem "gleichartig" hängt: alles außer dem Zahlfaktor.
function monomSchluessel({ potenzen }) {
  return [...potenzen.values()]
    .filter((p) => p.exponent !== 0)
    .map((p) => `${alsText(p.basis)}^${p.exponent}`)
    .sort()
    .join('·');
}

// ---------------------------------------------------------------------
// Die Regeln
// ---------------------------------------------------------------------
//
// Jede Regel bekommt einen Term und gibt entweder einen umgeformten Term
// zurück oder null ("hier bin ich nicht zuständig"). Jede trägt einen
// Namen, der im Rechenweg erscheint — auf Deutsch, so wie man ihn
// vorlesen würde.
//
// Und jede muss den Wert des Terms unverändert lassen. Das ist keine
// Absichtsbekundung, sondern geprüft: tests/term.mjs wertet vor und nach
// jedem Schritt an 200 zufälligen Stellen exakt aus und vergleicht.

const NEUTRALE_ELEMENTE = {
  name: 'neutrale Elemente weglassen',
  anwenden(t) {
    if (t.art === 'summe') {
      const ohneNull = t.teile.filter((x) => !(x.art === 'zahl' && istNull(x.wert)));
      if (ohneNull.length !== t.teile.length) {
        return ohneNull.length === 0 ? zahl(0) : summe(...ohneNull);
      }
    }

    if (t.art === 'produkt') {
      // Ein einziger Faktor 0 macht das ganze Produkt zu 0.
      if (t.teile.some((x) => x.art === 'zahl' && istNull(x.wert))) {
        return zahl(0);
      }
      const ohneEins = t.teile.filter((x) => !(x.art === 'zahl' && bruchGleich(x.wert, bruch(1))));
      if (ohneEins.length !== t.teile.length) {
        return ohneEins.length === 0 ? zahl(1) : produkt(...ohneEins);
      }
    }

    if (t.art === 'potenz' && t.exponent.art === 'zahl' && istGanz(t.exponent.wert)) {
      const e = t.exponent.wert.z;
      if (e === 1) {
        return t.basis;
      }
      // x⁰ ist 1 — außer für x = 0, wo 0⁰ nicht definiert ist. Diese
      // Regel darf deshalb nur greifen, wenn die Basis sicher nicht null
      // ist, also bei einer Zahl ungleich null. Bei x⁰ mit unbekanntem x
      // bleibt der Term stehen. Genau daran scheitern große
      // Computeralgebra-Systeme regelmäßig, und für eine Lern-App wäre
      // ein stillschweigend falscher Definitionsbereich das Schlimmste.
      if (e === 0 && t.basis.art === 'zahl' && !istNull(t.basis.wert)) {
        return zahl(1);
      }
    }

    if (t.art === 'quotient' && t.nenner.art === 'zahl' && bruchGleich(t.nenner.wert, bruch(1))) {
      return t.zaehler;
    }

    return null;
  },
};

const ZAHLEN_ZUSAMMENRECHNEN = {
  name: 'Zahlen zusammenrechnen',
  anwenden(t) {
    if (t.art === 'summe') {
      const zahlen = t.teile.filter((x) => x.art === 'zahl');
      if (zahlen.length < 2) {
        return null;
      }
      const wert = zahlen.reduce((s, x) => plus(s, x.wert), bruch(0));
      const rest = t.teile.filter((x) => x.art !== 'zahl');
      return summe(...rest, zahl(wert));
    }

    if (t.art === 'produkt') {
      const zahlen = t.teile.filter((x) => x.art === 'zahl');
      if (zahlen.length < 2) {
        return null;
      }
      const wert = zahlen.reduce((p, x) => mal(p, x.wert), bruch(1));
      const rest = t.teile.filter((x) => x.art !== 'zahl');
      return produkt(zahl(wert), ...rest);
    }

    if (t.art === 'quotient' && t.zaehler.art === 'zahl' && t.nenner.art === 'zahl') {
      return zahl(geteilt(t.zaehler.wert, t.nenner.wert));
    }

    if (
      t.art === 'potenz' &&
      t.basis.art === 'zahl' &&
      t.exponent.art === 'zahl' &&
      istGanz(t.exponent.wert) &&
      !(istNull(t.basis.wert) && t.exponent.wert.z <= 0)
    ) {
      return zahl(hoch(t.basis.wert, t.exponent.wert.z));
    }

    return null;
  },
};

const POTENZGESETZ = {
  name: 'Potenzgesetz: gleiche Basis, Exponenten addieren',
  anwenden(t) {
    if (t.art !== 'produkt') {
      return null;
    }
    const zerlegt = zerlegeMonom(t);
    // Nur zuständig, wenn dabei wirklich Potenzen verschmelzen.
    const anzahlVorher = t.teile.filter((x) => x.art !== 'zahl').length;
    const anzahlNachher = [...zerlegt.potenzen.values()].filter((p) => p.exponent !== 0).length;
    if (anzahlNachher >= anzahlVorher) {
      return null;
    }
    return baueMonom(zerlegt);
  },
};

const GLEICHARTIGE_GLIEDER = {
  name: 'gleichartige Glieder zusammenfassen',
  anwenden(t) {
    if (t.art !== 'summe') {
      return null;
    }

    const gruppen = new Map();
    for (const glied of t.teile) {
      const zerlegt = zerlegeMonom(glied);
      const schluessel = monomSchluessel(zerlegt);
      const vorhanden = gruppen.get(schluessel);
      if (vorhanden) {
        vorhanden.koeffizient = plus(vorhanden.koeffizient, zerlegt.koeffizient);
      } else {
        gruppen.set(schluessel, zerlegt);
      }
    }

    if (gruppen.size === t.teile.length) {
      return null;
    }
    return summe(...[...gruppen.values()].map(baueMonom));
  },
};

const AUSMULTIPLIZIEREN = {
  name: 'Klammer ausmultiplizieren',
  anwenden(t) {
    if (t.art !== 'produkt') {
      return null;
    }
    const klammern = t.teile.filter((x) => x.art === 'summe');
    if (klammern.length === 0) {
      return null;
    }
    const uebrig = t.teile.filter((x) => x.art !== 'summe');

    // Alle Klammern auf einmal, nicht eine nach der anderen.
    //
    // Das ist der Weg, den der Unterricht geht: "jedes Glied der einen
    // Klammer mit jedem Glied der anderen". Eine Klammer je Schritt
    // aufzulösen wäre technisch dasselbe, läse sich aber wie eine
    // Maschine — und bei (x + y + 1)⁴ bräuchte es Hunderte Schritte,
    // wo einer genügt.
    let kombinationen = [[]];
    for (const klammer of klammern) {
      const naechste = [];
      for (const bisher of kombinationen) {
        for (const glied of klammer.teile) {
          naechste.push([...bisher, glied]);
        }
      }
      kombinationen = naechste;
    }

    return summe(...kombinationen.map((glieder) => produkt(...uebrig, ...glieder)));
  },
};

const POTENZ_AUSSCHREIBEN = {
  name: 'Potenz als Produkt schreiben',
  anwenden(t) {
    if (t.art !== 'potenz' || t.basis.art !== 'summe') {
      return null;
    }
    if (t.exponent.art !== 'zahl' || !istGanz(t.exponent.wert)) {
      return null;
    }
    const e = t.exponent.wert.z;
    // Nur kleine positive Exponenten. (a + b)¹⁰ auszuschreiben hilft
    // niemandem beim Verstehen, und der Term würde unlesbar.
    if (e < 2 || e > 4) {
      return null;
    }
    return produkt(...Array.from({ length: e }, () => t.basis));
  },
};

const AUSKLAMMERN = {
  name: 'gemeinsamen Faktor ausklammern',
  anwenden(t) {
    if (t.art !== 'summe') {
      return null;
    }

    const zerlegt = t.teile.map(zerlegeMonom);
    if (zerlegt.some((m) => istNull(m.koeffizient))) {
      return null;
    }

    // Gemeinsamer Zahlfaktor: ggT der Zähler über kgV der Nenner.
    let faktor = zerlegt[0].koeffizient;
    for (const m of zerlegt.slice(1)) {
      faktor = bruch(
        ggT(Math.abs(faktor.z), Math.abs(m.koeffizient.z)),
        kgV(faktor.n, m.koeffizient.n)
      );
    }
    // Sind alle Glieder negativ, wandert das Minus mit nach vorn.
    if (zerlegt.every((m) => istNegativ(m.koeffizient))) {
      faktor = negativ(faktor);
    }

    // Gemeinsame Potenzen: kleinster Exponent, den alle Glieder haben.
    const gemeinsam = new Map();
    for (const [schluessel, eintrag] of zerlegt[0].potenzen) {
      let kleinster = eintrag.exponent;
      let inAllen = true;
      for (const m of zerlegt.slice(1)) {
        const andere = m.potenzen.get(schluessel);
        if (!andere) {
          inAllen = false;
          break;
        }
        kleinster = Math.min(kleinster, andere.exponent);
      }
      if (inAllen && kleinster > 0) {
        gemeinsam.set(schluessel, { basis: eintrag.basis, exponent: kleinster });
      }
    }

    const nichtsZuHolen = bruchGleich(faktor, bruch(1)) && gemeinsam.size === 0;
    if (nichtsZuHolen) {
      return null;
    }

    const vorne = baueMonom({ koeffizient: faktor, potenzen: gemeinsam });
    const drinnen = zerlegt.map((m) => {
      const potenzen = new Map();
      for (const [schluessel, eintrag] of m.potenzen) {
        const abzug = gemeinsam.get(schluessel);
        const exponent = eintrag.exponent - (abzug ? abzug.exponent : 0);
        if (exponent !== 0) {
          potenzen.set(schluessel, { basis: eintrag.basis, exponent });
        }
      }
      return baueMonom({ koeffizient: geteilt(m.koeffizient, faktor), potenzen });
    });

    return produkt(vorne, summe(...drinnen));
  },
};

// ---------------------------------------------------------------------
// Der Antrieb
// ---------------------------------------------------------------------

// Wendet eine Regel an der ersten passenden Stelle an — von innen nach
// außen. Innen zuerst, weil eine äußere Regel oft erst greift, wenn
// innen aufgeräumt ist.
function ersteAnwendung(term, regel) {
  const kinder = kinderVon(term);
  for (let i = 0; i < kinder.length; i++) {
    const neu = ersteAnwendung(kinder[i], regel);
    if (neu !== null) {
      return mitKind(term, i, neu);
    }
  }
  const hier = regel.anwenden(term);
  if (hier === null || alsText(hier) === alsText(term)) {
    return null;
  }
  return hier;
}

// Die Notbremse. Eine Regel, die sich selbst wieder auslöst, würde die
// App sonst einfrieren — auf einem Handy ohne Fehlermeldung. Lieber ein
// klarer Abbruch, den eine Prüfung sichtbar macht.
const HOECHSTENS_SCHRITTE = 100;

function laufe(term, regeln) {
  pruefeTerm(term, 'laufe');
  const schritte = [];
  let aktuell = term;

  for (let i = 0; i < HOECHSTENS_SCHRITTE; i++) {
    let etwasGetan = false;
    for (const regel of regeln) {
      const neu = ersteAnwendung(aktuell, regel);
      if (neu !== null) {
        aktuell = neu;
        schritte.push({ regel: regel.name, term: neu, text: alsText(neu) });
        etwasGetan = true;
        break;
      }
    }
    if (!etwasGetan) {
      return { term: aktuell, schritte };
    }
  }

  throw new Error(
    `Umformung kommt nicht zur Ruhe: mehr als ${HOECHSTENS_SCHRITTE} Schritte bei "${alsText(term)}"`
  );
}

const AUFRAEUMEN = [
  NEUTRALE_ELEMENTE,
  ZAHLEN_ZUSAMMENRECHNEN,
  POTENZGESETZ,
  GLEICHARTIGE_GLIEDER,
];

// Zusammenfassen, ohne Klammern anzurühren.
//
// Rückgabe ist immer { term, schritte } — nie nur das Ergebnis. Wer nur
// das Ergebnis will, nimmt `.term`; wer den Rechenweg zeigen will, hat
// ihn schon.
export function vereinfache(term) {
  return laufe(term, AUFRAEUMEN);
}

// Klammern auflösen und danach aufräumen. Das ist der Weg, den man im
// Unterricht geht: erst ausmultiplizieren, dann zusammenfassen.
export function multipliziereAus(term) {
  return laufe(term, [POTENZ_AUSSCHREIBEN, AUSMULTIPLIZIEREN, ...AUFRAEUMEN]);
}

// Die Gegenrichtung: erst aufräumen, dann den gemeinsamen Faktor
// herausziehen. Ein einzelner Schritt, kein Lauf bis zur Ruhe — sonst
// würde er sich mit dem Ausmultiplizieren im Kreis drehen.
export function klammereAus(term) {
  const aufgeraeumt = vereinfache(term);
  const neu = ersteAnwendung(aufgeraeumt.term, AUSKLAMMERN);
  if (neu === null) {
    return aufgeraeumt;
  }
  return {
    term: neu,
    schritte: [
      ...aufgeraeumt.schritte,
      { regel: AUSKLAMMERN.name, term: neu, text: alsText(neu) },
    ],
  };
}

// Der Rechenweg als Zeilen, wie man ihn an die Tafel schreibt:
//
//   2 · (x + 3) + 4x
//   = 2x + 6 + 4x       | Klammer ausmultiplizieren
//   = 6x + 6            | gleichartige Glieder zusammenfassen
export function alsRechenweg(term, ergebnis) {
  const zeilen = [alsText(term)];
  for (const schritt of ergebnis.schritte) {
    zeilen.push(`= ${schritt.text}    | ${schritt.regel}`);
  }
  return zeilen;
}
