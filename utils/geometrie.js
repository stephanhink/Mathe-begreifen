// Geometrie: Pythagoras, rechtwinklige Dreiecke, Flächen und Umfänge.
//
// Wie überall in diesem Projekt wird der Weg mitgeliefert, nicht nur das
// Ergebnis — und wo etwas nicht geht, wird es gesagt statt geraten.
//
// ---------------------------------------------------------------------
// Wo hier exakt gerechnet wird und wo nicht
// ---------------------------------------------------------------------
//
// Das ist die Frage, an der sich diese Datei entscheidet:
//
//   Pythagoras  EXAKT. c = √(3² + 4²) ist 5, und c = √(2² + 3²) ist √13
//               — nicht 3,606. term.js kann Wurzeln, also werden sie
//               benutzt.
//   Kreis       EXAKT bis auf π. Der Flächeninhalt eines Kreises mit
//               r = 3 ist 9π; die Kommazahl steht daneben, nicht
//               anstelle.
//   Winkel      NUMERISCH. sin 30° ist 1/2, sin 37° ist keine Zahl, die
//               sich hinschreiben lässt. Hier wird gerundet — und die
//               App sagt das auch.
//
// Die Trennung ist keine Pedanterie: Wer 3,606 sieht, weiß nicht, ob das
// exakt ist. Wer √13 sieht, weiß es.

import {
  bruch,
  plus,
  minus,
  mal,
  geteilt,
  hoch,
  istNull,
  istNegativ,
  vergleiche,
  gleich as bruchGleich,
  alsZahl,
  alsText as bruchAlsText,
} from './bruch.js';
import { zahl, produkt, wurzel, vereinfache, auswerte, alsText as termAlsText } from './term.js';

// ---------------------------------------------------------------------
// Eingaben
// ---------------------------------------------------------------------

// Eine Länge muss positiv sein. Eine Strecke von −3 cm gibt es nicht,
// und eine von 0 cm ist kein Dreieck mehr.
function laenge(wert, name) {
  const b = alsBruch(wert, name);
  if (istNegativ(b) || istNull(b)) {
    throw new Error(`${name} muss größer als 0 sein — eine Länge von ${zahlText(b)} gibt es nicht.`);
  }
  return b;
}

function alsBruch(wert, name) {
  if (typeof wert === 'object' && wert !== null && Number.isInteger(wert.z)) {
    return wert;
  }
  if (typeof wert !== 'number' || !Number.isFinite(wert)) {
    throw new Error(`${name} ist keine Zahl.`);
  }
  if (Number.isInteger(wert)) {
    return bruch(wert);
  }
  const text = String(wert);
  const punkt = text.indexOf('.');
  const nenner = 10 ** (text.length - punkt - 1);
  return bruch(Math.round(wert * nenner), nenner);
}

export function zahlText(wert) {
  if (typeof wert === 'number') {
    return String(Math.round(wert * 1e4) / 1e4).replace('.', ',').replace('-', '−');
  }
  return wert.n === 1
    ? String(wert.z).replace('-', '−')
    : `${String(wert.z).replace('-', '−')}/${wert.n}`;
}

function schritt(regel, text) {
  return { regel, text };
}

// ---------------------------------------------------------------------
// Der Satz des Pythagoras
// ---------------------------------------------------------------------

// Genau eine der drei Seiten fehlt. Zurück kommt sie als TERM, nicht als
// Kommazahl: √13 ist die Antwort, 3,606 ist ihre Näherung.
export function pythagoras({ a = null, b = null, c = null }) {
  const gegeben = [a, b, c].filter((w) => w !== null && w !== '').length;
  if (gegeben !== 2) {
    throw new Error(
      'Für den Satz des Pythagoras müssen genau zwei der drei Seiten bekannt sein.'
    );
  }

  const schritte = [
    schritt('Der Satz des Pythagoras', 'a² + b² = c²'),
  ];

  if (c === null || c === '') {
    const ka = laenge(a, 'Die Kathete a');
    const kb = laenge(b, 'Die Kathete b');
    const summe = plus(mal(ka, ka), mal(kb, kb));

    schritte.push(
      schritt('nach c umstellen', 'c = √(a² + b²)'),
      schritt(
        'einsetzen',
        `c = √(${zahlText(ka)}² + ${zahlText(kb)}²) = √${zahlText(summe)}`
      )
    );

    return fertig('c', summe, schritte, { a: ka, b: kb });
  }

  // Eine Kathete fehlt. Dann muss die Hypotenuse die längste Seite sein
  // — sonst gibt es dieses Dreieck nicht.
  const kc = laenge(c, 'Die Hypotenuse c');
  const bekannt = a === null || a === '' ? laenge(b, 'Die Kathete b') : laenge(a, 'Die Kathete a');
  const gesucht = a === null || a === '' ? 'a' : 'b';
  const andere = gesucht === 'a' ? 'b' : 'a';

  if (vergleiche(bekannt, kc) >= 0) {
    throw new Error(
      `Die Hypotenuse ist die längste Seite im rechtwinkligen Dreieck. ` +
        `Mit c = ${zahlText(kc)} und ${andere} = ${zahlText(bekannt)} gibt es dieses Dreieck nicht.`
    );
  }

  const rest = minus(mal(kc, kc), mal(bekannt, bekannt));
  schritte.push(
    schritt(`nach ${gesucht} umstellen`, `${gesucht} = √(c² − ${andere}²)`),
    schritt(
      'einsetzen',
      `${gesucht} = √(${zahlText(kc)}² − ${zahlText(bekannt)}²) = √${zahlText(rest)}`
    )
  );

  return fertig(gesucht, rest, schritte, { c: kc, [andere]: bekannt });
}

function fertig(gesucht, unterDerWurzel, schritte, bekannt) {
  const roh = wurzel(zahl(unterDerWurzel));
  const gezogen = vereinfache(roh);

  for (const s of gezogen.schritte) {
    schritte.push(schritt(s.regel, `${gesucht} = ${s.text}`));
  }

  return {
    gesucht,
    ergebnis: gezogen.term,
    ergebnisText: termAlsText(gezogen.term),
    naeherung: auswerte(gezogen.term),
    // Eine Wurzel, die aufgeht, braucht keinen Näherungswert daneben.
    exakt: gezogen.term.art === 'zahl',
    schritte,
    bekannt,
  };
}

// ---------------------------------------------------------------------
// Das rechtwinklige Dreieck mit Winkeln
// ---------------------------------------------------------------------
//
// Bezeichnungen wie im Unterricht: Der rechte Winkel liegt bei C, die
// Hypotenuse ist c. Bezogen auf α ist a die Gegenkathete und b die
// Ankathete.

const GRAD = Math.PI / 180;

// Was ist bekannt? Zwei Angaben reichen, davon mindestens eine Seite —
// aus zwei Winkeln allein lässt sich kein Dreieck bestimmen, nur seine
// Form.
export function rechtwinkligesDreieck(eingaben) {
  const { a, b, c, alpha } = leseEingaben(eingaben);
  const seiten = [a, b, c].filter((w) => w !== null).length;

  if (seiten === 0) {
    throw new Error(
      'Aus Winkeln allein lässt sich die Größe nicht bestimmen — es fehlt mindestens eine Seite.'
    );
  }
  if (seiten + (alpha === null ? 0 : 1) < 2) {
    throw new Error('Es werden zwei Angaben gebraucht: zwei Seiten, oder eine Seite und ein Winkel.');
  }

  if (alpha !== null && (alpha <= 0 || alpha >= 90)) {
    throw new Error(
      `Im rechtwinkligen Dreieck liegen die anderen beiden Winkel zwischen 0° und 90°. ` +
        `${zahlText(alpha)}° geht nicht — die Winkelsumme wäre über 180°.`
    );
  }

  const schritte = [];
  let werte = { a, b, c, alpha };

  if (seiten >= 2) {
    werte = ausZweiSeiten(werte, schritte);
  } else {
    werte = ausSeiteUndWinkel(werte, schritte);
  }

  const beta = 90 - werte.alpha;
  schritte.push(
    schritt(
      'Die Winkelsumme im Dreieck ist 180°',
      `β = 180° − 90° − ${zahlText(werte.alpha)}° = ${zahlText(beta)}°`
    )
  );

  return {
    ...werte,
    beta,
    gamma: 90,
    schritte,
    // Sobald ein Winkel im Spiel ist, wird gerundet — sin 37° lässt sich
    // nicht hinschreiben. Das soll die App nicht verschweigen.
    gerundet: true,
  };
}

function leseEingaben({ a, b, c, alpha }) {
  const zahlOderNull = (wert, name, istLaenge) => {
    if (wert === null || wert === undefined || wert === '') {
      return null;
    }
    const b2 = alsBruch(wert, name);
    if (istLaenge && (istNegativ(b2) || istNull(b2))) {
      throw new Error(`${name} muss größer als 0 sein.`);
    }
    return alsZahl(b2);
  };

  return {
    a: zahlOderNull(a, 'Die Kathete a', true),
    b: zahlOderNull(b, 'Die Kathete b', true),
    c: zahlOderNull(c, 'Die Hypotenuse c', true),
    alpha: zahlOderNull(alpha, 'Der Winkel α', false),
  };
}

function ausZweiSeiten(werte, schritte) {
  let { a, b, c } = werte;

  if (a !== null && b !== null && c === null) {
    c = Math.sqrt(a * a + b * b);
    schritte.push(schritt('Pythagoras', `c = √(a² + b²) = ${zahlText(c)}`));
  } else if (c !== null && a !== null && b === null) {
    pruefeHypotenuse(c, a, 'a');
    b = Math.sqrt(c * c - a * a);
    schritte.push(schritt('Pythagoras', `b = √(c² − a²) = ${zahlText(b)}`));
  } else if (c !== null && b !== null && a === null) {
    pruefeHypotenuse(c, b, 'b');
    a = Math.sqrt(c * c - b * b);
    schritte.push(schritt('Pythagoras', `a = √(c² − b²) = ${zahlText(a)}`));
  }

  const alpha = Math.asin(a / c) / GRAD;
  schritte.push(
    schritt(
      'sin α = Gegenkathete : Hypotenuse',
      `sin α = ${zahlText(a)} : ${zahlText(c)} = ${zahlText(a / c)}`
    ),
    schritt('Umkehrfunktion anwenden', `α = sin⁻¹(${zahlText(a / c)}) = ${zahlText(alpha)}°`)
  );

  return { a, b, c, alpha };
}

function pruefeHypotenuse(c, kathete, name) {
  if (kathete >= c) {
    throw new Error(
      `Die Hypotenuse ist die längste Seite. Mit c = ${zahlText(c)} und ` +
        `${name} = ${zahlText(kathete)} gibt es dieses Dreieck nicht.`
    );
  }
}

function ausSeiteUndWinkel(werte, schritte) {
  const { alpha } = werte;
  let { a, b, c } = werte;

  if (alpha === null) {
    throw new Error('Es werden zwei Angaben gebraucht.');
  }

  const sin = Math.sin(alpha * GRAD);
  const cos = Math.cos(alpha * GRAD);
  const tan = Math.tan(alpha * GRAD);

  if (c !== null) {
    a = c * sin;
    b = c * cos;
    schritte.push(
      schritt('sin α = a : c, also a = c · sin α', `a = ${zahlText(c)} · sin ${zahlText(alpha)}° = ${zahlText(a)}`),
      schritt('cos α = b : c, also b = c · cos α', `b = ${zahlText(c)} · cos ${zahlText(alpha)}° = ${zahlText(b)}`)
    );
  } else if (a !== null) {
    c = a / sin;
    b = a / tan;
    schritte.push(
      schritt('sin α = a : c, also c = a : sin α', `c = ${zahlText(a)} : sin ${zahlText(alpha)}° = ${zahlText(c)}`),
      schritt('tan α = a : b, also b = a : tan α', `b = ${zahlText(a)} : tan ${zahlText(alpha)}° = ${zahlText(b)}`)
    );
  } else {
    c = b / cos;
    a = b * tan;
    schritte.push(
      schritt('cos α = b : c, also c = b : cos α', `c = ${zahlText(b)} : cos ${zahlText(alpha)}° = ${zahlText(c)}`),
      schritt('tan α = a : b, also a = b · tan α', `a = ${zahlText(b)} · tan ${zahlText(alpha)}° = ${zahlText(a)}`)
    );
  }

  return { a, b, c, alpha };
}

// ---------------------------------------------------------------------
// Flächen und Umfänge
// ---------------------------------------------------------------------

// π steckt nicht in den Zahlen, sondern als Faktor daneben: Der
// Flächeninhalt eines Kreises mit r = 3 ist 9π. Die Kommazahl steht
// dabei, nicht anstelle.
export const FORMEN = {
  rechteck: {
    titel: 'Rechteck',
    felder: [
      { id: 'a', label: 'Länge a' },
      { id: 'b', label: 'Breite b' },
    ],
    flaecheFormel: 'A = a · b',
    umfangFormel: 'U = 2 · (a + b)',
    rechne({ a, b }) {
      return {
        flaeche: mal(a, b),
        umfang: mal(bruch(2), plus(a, b)),
        flaecheSchritt: `A = ${zahlText(a)} · ${zahlText(b)} = ${zahlText(mal(a, b))}`,
        umfangSchritt: `U = 2 · (${zahlText(a)} + ${zahlText(b)}) = ${zahlText(mal(bruch(2), plus(a, b)))}`,
      };
    },
  },

  quadrat: {
    titel: 'Quadrat',
    felder: [{ id: 'a', label: 'Seite a' }],
    flaecheFormel: 'A = a²',
    umfangFormel: 'U = 4 · a',
    rechne({ a }) {
      return {
        flaeche: mal(a, a),
        umfang: mal(bruch(4), a),
        flaecheSchritt: `A = ${zahlText(a)}² = ${zahlText(mal(a, a))}`,
        umfangSchritt: `U = 4 · ${zahlText(a)} = ${zahlText(mal(bruch(4), a))}`,
      };
    },
  },

  dreieck: {
    titel: 'Dreieck',
    felder: [
      { id: 'g', label: 'Grundseite g' },
      { id: 'h', label: 'Höhe h' },
    ],
    flaecheFormel: 'A = ½ · g · h',
    umfangFormel: null,
    hinweis:
      'Für den Umfang bräuchte man alle drei Seiten — die Höhe allein sagt darüber nichts.',
    rechne({ g, h }) {
      const flaeche = mal(bruch(1, 2), mal(g, h));
      return {
        flaeche,
        umfang: null,
        flaecheSchritt: `A = ½ · ${zahlText(g)} · ${zahlText(h)} = ${zahlText(flaeche)}`,
      };
    },
  },

  parallelogramm: {
    titel: 'Parallelogramm',
    felder: [
      { id: 'g', label: 'Grundseite g' },
      { id: 'h', label: 'Höhe h' },
    ],
    flaecheFormel: 'A = g · h',
    umfangFormel: null,
    hinweis: 'Die Höhe ist NICHT die Seitenlänge — für den Umfang bräuchte man die schräge Seite.',
    rechne({ g, h }) {
      return {
        flaeche: mal(g, h),
        umfang: null,
        flaecheSchritt: `A = ${zahlText(g)} · ${zahlText(h)} = ${zahlText(mal(g, h))}`,
      };
    },
  },

  trapez: {
    titel: 'Trapez',
    felder: [
      { id: 'a', label: 'Seite a' },
      { id: 'c', label: 'Seite c (parallel zu a)' },
      { id: 'h', label: 'Höhe h' },
    ],
    flaecheFormel: 'A = ½ · (a + c) · h',
    umfangFormel: null,
    rechne({ a, c, h }) {
      const flaeche = mal(bruch(1, 2), mal(plus(a, c), h));
      return {
        flaeche,
        umfang: null,
        flaecheSchritt: `A = ½ · (${zahlText(a)} + ${zahlText(c)}) · ${zahlText(h)} = ${zahlText(flaeche)}`,
      };
    },
  },

  kreis: {
    titel: 'Kreis',
    felder: [{ id: 'r', label: 'Radius r' }],
    flaecheFormel: 'A = π · r²',
    umfangFormel: 'U = 2 · π · r',
    mitPi: true,
    rechne({ r }) {
      const flaeche = mal(r, r);
      const umfang = mal(bruch(2), r);
      return {
        flaeche,
        umfang,
        flaecheSchritt: `A = π · ${zahlText(r)}² = ${zahlText(flaeche)}π`,
        umfangSchritt: `U = 2 · π · ${zahlText(r)} = ${zahlText(umfang)}π`,
      };
    },
  },
};

export function berechneForm(formId, eingaben) {
  const form = FORMEN[formId];
  if (!form) {
    throw new Error(`Die Form "${formId}" kenne ich nicht.`);
  }

  const masse = {};
  for (const feld of form.felder) {
    masse[feld.id] = laenge(eingaben[feld.id], feld.label);
  }

  const roh = form.rechne(masse);
  const piFaktor = form.mitPi ? Math.PI : 1;

  return {
    form,
    masse,
    flaeche: roh.flaeche,
    umfang: roh.umfang,
    flaecheSchritt: roh.flaecheSchritt,
    umfangSchritt: roh.umfangSchritt,
    mitPi: Boolean(form.mitPi),
    flaecheZahl: roh.flaeche === null ? null : alsZahl(roh.flaeche) * piFaktor,
    umfangZahl: roh.umfang === null ? null : alsZahl(roh.umfang) * piFaktor,
  };
}
