// Wahrscheinlichkeit: Laplace, Kombinatorik, Baumdiagramm,
// Binomialverteilung, Erwartungswert.
//
// Gerechnet wird exakt in Brüchen. Das ist hier nicht Pedanterie,
// sondern der Kern der Sache: Die Wahrscheinlichkeit für eine Sechs ist
// 1/6 — nicht 0,1667. Wer nur die Kommazahl sieht, verliert genau die
// Einsicht, um die es geht: dass eine von sechs gleich wahrscheinlichen
// Möglichkeiten günstig ist.
//
// ---------------------------------------------------------------------
// Was hier abgelehnt wird
// ---------------------------------------------------------------------
//
// Aus CLAUDE.md, unter „Was die Prüfungen ablehnen müssen": „… eine
// Wahrscheinlichkeit > 1". Eine Wahrscheinlichkeit liegt zwischen 0 und
// 1, immer. Mehr günstige als mögliche Fälle gibt es nicht, und aus
// einer Urne mit fünf Kugeln lassen sich nicht sieben ziehen.
//
// Solche Eingaben werden zurückgewiesen, nicht klaglos verrechnet. Eine
// Zahl wie 1,4 als Wahrscheinlichkeit auszugeben wäre schlimmer als
// keine Antwort: Sie sieht aus wie ein Ergebnis.

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

// ---------------------------------------------------------------------
// Grundlagen
// ---------------------------------------------------------------------

function ganzeZahl(wert, name, mindestens = 0) {
  if (typeof wert !== 'number' || !Number.isInteger(wert)) {
    throw new Error(`${name} muss eine ganze Zahl sein.`);
  }
  if (wert < mindestens) {
    throw new Error(`${name} kann nicht ${wert} sein — mindestens ${mindestens} muss es sein.`);
  }
  if (wert > 170) {
    throw new Error(`${name} ist zu groß — ab etwa 170 wird die Rechnung ungenau.`);
  }
  return wert;
}

// Eine Wahrscheinlichkeit liegt zwischen 0 und 1. Punkt.
function pruefeWahrscheinlichkeit(p, name = 'Die Wahrscheinlichkeit') {
  if (istNegativ(p) || vergleiche(p, bruch(1)) > 0) {
    throw new Error(
      `${name} muss zwischen 0 und 1 liegen — ${alsProzent(p)} % gibt es nicht.`
    );
  }
  return p;
}

export function alsProzent(p, stellen = 2) {
  const wert = alsZahl(p) * 100;
  const gerundet = Math.round(wert * 10 ** stellen) / 10 ** stellen;
  return String(gerundet).replace('.', ',').replace('-', '−');
}

export function alsBruchText(p) {
  return bruchAlsText(p).replace('-', '−');
}

function schritt(regel, text) {
  return { regel, text };
}

// ---------------------------------------------------------------------
// Laplace
// ---------------------------------------------------------------------

// Der Grundfall: Alle Ergebnisse sind gleich wahrscheinlich, und man
// zählt ab.
export function laplace(guenstig, moeglich) {
  ganzeZahl(guenstig, 'Die Zahl der günstigen Fälle');
  ganzeZahl(moeglich, 'Die Zahl der möglichen Fälle', 1);

  if (guenstig > moeglich) {
    throw new Error(
      `Es kann nicht mehr günstige als mögliche Fälle geben — ${guenstig} von ${moeglich} ` +
        'ergäbe eine Wahrscheinlichkeit über 1.'
    );
  }

  const p = bruch(guenstig, moeglich);

  return {
    wahrscheinlichkeit: p,
    gegenwahrscheinlichkeit: minus(bruch(1), p),
    formel: 'P = günstige Fälle : mögliche Fälle',
    schritte: [
      schritt(
        'abzählen',
        `P = ${guenstig} : ${moeglich} = ${alsBruchText(p)}`
      ),
      schritt('als Prozent', `${alsProzent(p)} %`),
    ],
  };
}

// ---------------------------------------------------------------------
// Kombinatorik
// ---------------------------------------------------------------------

export function fakultaet(n) {
  ganzeZahl(n, 'n');
  let ergebnis = bruch(1);
  for (let i = 2; i <= n; i++) {
    ergebnis = mal(ergebnis, bruch(i));
  }
  return ergebnis;
}

// n über k — der Binomialkoeffizient.
//
// Gerechnet wird über das Produkt (n−k+i)/i statt über drei Fakultäten.
// Der Grund ist handfest: 50! hat 65 Stellen und sprengt die exakte
// Rechnung, obwohl "50 über 2" nur 1225 ist. So bleiben die
// Zwischenwerte klein.
export function binomialkoeffizient(n, k) {
  ganzeZahl(n, 'n');
  ganzeZahl(k, 'k');

  if (k > n) {
    throw new Error(
      `Aus ${n} Dingen lassen sich nicht ${k} auswählen — es sind zu wenige da.`
    );
  }

  const kleiner = Math.min(k, n - k);
  let ergebnis = bruch(1);
  for (let i = 1; i <= kleiner; i++) {
    ergebnis = geteilt(mal(ergebnis, bruch(n - kleiner + i)), bruch(i));
  }
  return ergebnis;
}

// Die vier Fälle des Urnenmodells — die Frage ist immer dieselbe: Kommt
// es auf die Reihenfolge an, und darf man mehrfach ziehen?
export const ZIEHUNGSARTEN = {
  geordnetMit: {
    titel: 'Mit Zurücklegen, mit Reihenfolge',
    formel: 'n^k',
    beispiel: 'Zahlenschloss: vier Stellen, jede Ziffer darf mehrfach vorkommen.',
    rechne: (n, k) => hoch(bruch(n), k),
    schrittText: (n, k) => `${n}^${k}`,
  },
  geordnetOhne: {
    titel: 'Ohne Zurücklegen, mit Reihenfolge',
    formel: 'n · (n−1) · … · (n−k+1)',
    beispiel: 'Wer wird Erster, Zweiter, Dritter? Niemand kann zweimal aufs Treppchen.',
    rechne: (n, k) => {
      let e = bruch(1);
      for (let i = 0; i < k; i++) {
        e = mal(e, bruch(n - i));
      }
      return e;
    },
    schrittText: (n, k) =>
      Array.from({ length: k }, (unused, i) => n - i).join(' · '),
  },
  ungeordnetOhne: {
    titel: 'Ohne Zurücklegen, ohne Reihenfolge',
    formel: 'n über k',
    beispiel: 'Lotto: sechs aus 49, und es ist gleichgültig, in welcher Reihenfolge sie kommen.',
    rechne: (n, k) => binomialkoeffizient(n, k),
    schrittText: (n, k) => `(${n} über ${k})`,
  },
  ungeordnetMit: {
    titel: 'Mit Zurücklegen, ohne Reihenfolge',
    formel: '(n+k−1) über k',
    beispiel: 'Wie viele Sorten-Kombinationen bei drei Kugeln Eis aus fünf Sorten?',
    rechne: (n, k) => binomialkoeffizient(n + k - 1, k),
    schrittText: (n, k) => `(${n + k - 1} über ${k})`,
  },
};

export function zaehleMoeglichkeiten(art, n, k) {
  const eintrag = ZIEHUNGSARTEN[art];
  if (!eintrag) {
    throw new Error(`Die Ziehungsart "${art}" kenne ich nicht.`);
  }
  ganzeZahl(n, 'n', 1);
  ganzeZahl(k, 'k');

  if ((art === 'geordnetOhne' || art === 'ungeordnetOhne') && k > n) {
    throw new Error(
      `Ohne Zurücklegen lassen sich aus ${n} Dingen nicht ${k} ziehen — es sind zu wenige da.`
    );
  }

  const anzahl = eintrag.rechne(n, k);
  return {
    art: eintrag,
    anzahl,
    schritte: [
      schritt(eintrag.formel, `${eintrag.schrittText(n, k)} = ${alsBruchText(anzahl)}`),
    ],
  };
}

// ---------------------------------------------------------------------
// Zweistufiger Versuch — das Baumdiagramm
// ---------------------------------------------------------------------

// Eine Urne mit zwei Sorten Kugeln, zweimal ziehen. Das ist der Kern
// der Mittelstufen-Stochastik, und der Unterschied zwischen „mit" und
// „ohne Zurücklegen" ist genau das, was man daran lernt.
//
// Die beiden Pfadregeln:
//   entlang eines Pfades  →  multiplizieren
//   über mehrere Pfade    →  addieren
export function zweistufig({ rot, blau, mitZuruecklegen }) {
  ganzeZahl(rot, 'Die Zahl der roten Kugeln', 0);
  ganzeZahl(blau, 'Die Zahl der blauen Kugeln', 0);

  const gesamt = rot + blau;
  if (gesamt < 2) {
    throw new Error('Für zwei Züge müssen mindestens zwei Kugeln in der Urne sein.');
  }
  if (!mitZuruecklegen && (rot > gesamt || blau > gesamt)) {
    throw new Error('Es können nicht mehr Kugeln gezogen werden, als da sind.');
  }

  const erste = {
    rot: bruch(rot, gesamt),
    blau: bruch(blau, gesamt),
  };

  // Nach dem ersten Zug: Beim Zurücklegen ändert sich nichts, sonst
  // fehlt genau die gezogene Kugel.
  const zweite = (zuerst) => {
    if (mitZuruecklegen) {
      return { rot: bruch(rot, gesamt), blau: bruch(blau, gesamt) };
    }
    const uebrigRot = zuerst === 'rot' ? rot - 1 : rot;
    const uebrigBlau = zuerst === 'blau' ? blau - 1 : blau;
    return {
      rot: bruch(uebrigRot, gesamt - 1),
      blau: bruch(uebrigBlau, gesamt - 1),
    };
  };

  const pfade = [];
  for (const eins of ['rot', 'blau']) {
    if (istNull(erste[eins])) {
      continue;
    }
    const danach = zweite(eins);
    for (const zwei of ['rot', 'blau']) {
      if (istNull(danach[zwei])) {
        continue;
      }
      pfade.push({
        weg: [eins, zwei],
        erste: erste[eins],
        zweite: danach[zwei],
        wahrscheinlichkeit: mal(erste[eins], danach[zwei]),
      });
    }
  }

  return {
    rot,
    blau,
    gesamt,
    mitZuruecklegen,
    erste,
    pfade,
    // Die Summe aller Pfade muss 1 sein. Das ist die eingebaute Probe
    // eines jeden Baumdiagramms — wenn sie nicht aufgeht, stimmt etwas
    // nicht.
    summe: pfade.reduce((s, p) => plus(s, p.wahrscheinlichkeit), bruch(0)),
  };
}

// „Mindestens eine rote" und ähnliche Fragen: mehrere Pfade addieren.
export function pfadeSumme(baum, passt) {
  const treffer = baum.pfade.filter((p) => passt(p.weg));
  const summe = treffer.reduce((s, p) => plus(s, p.wahrscheinlichkeit), bruch(0));
  return { treffer, summe };
}

// ---------------------------------------------------------------------
// Binomialverteilung
// ---------------------------------------------------------------------

// n-mal dasselbe versuchen, jedes Mal mit derselben Wahrscheinlichkeit
// p — wie oft geht es gut?
export function binomial(n, p, k) {
  ganzeZahl(n, 'Die Zahl der Versuche', 1);
  ganzeZahl(k, 'Die Zahl der Treffer');
  pruefeWahrscheinlichkeit(p, 'Die Trefferwahrscheinlichkeit');

  if (k > n) {
    throw new Error(
      `Bei ${n} Versuchen kann es nicht ${k} Treffer geben — mehr als alle geht nicht.`
    );
  }

  const c = binomialkoeffizient(n, k);
  const gegen = minus(bruch(1), p);
  const wahrscheinlichkeit = mal(mal(c, hoch(p, k)), hoch(gegen, n - k));

  return {
    wahrscheinlichkeit,
    formel: 'P(X = k) = (n über k) · p^k · (1−p)^(n−k)',
    schritte: [
      schritt(
        'Wie viele Reihenfolgen gibt es?',
        `(${n} über ${k}) = ${alsBruchText(c)}`
      ),
      schritt(
        'Jede einzelne Reihenfolge hat diese Wahrscheinlichkeit',
        `${alsBruchText(p)}^${k} · ${alsBruchText(gegen)}^${n - k}`
      ),
      schritt(
        'zusammen',
        `${alsBruchText(c)} · ${alsBruchText(hoch(p, k))} · ${alsBruchText(hoch(gegen, n - k))} = ${alsBruchText(wahrscheinlichkeit)}`
      ),
    ],
    // Bei einer Binomialverteilung ist der Erwartungswert n · p — das
    // ist keine eigene Rechnung, sondern folgt aus der Definition.
    erwartungswert: mal(bruch(n), p),
  };
}

// Die ganze Verteilung, für das Säulendiagramm.
export function binomialVerteilung(n, p) {
  ganzeZahl(n, 'Die Zahl der Versuche', 1);
  pruefeWahrscheinlichkeit(p, 'Die Trefferwahrscheinlichkeit');

  const werte = [];
  for (let k = 0; k <= n; k++) {
    werte.push({ k, wahrscheinlichkeit: binomial(n, p, k).wahrscheinlichkeit });
  }
  return werte;
}

// ---------------------------------------------------------------------
// Erwartungswert
// ---------------------------------------------------------------------

// Was bekommt man im Schnitt heraus, wenn man das Spiel sehr oft
// spielt? Die Wahrscheinlichkeiten müssen sich dabei zu 1 addieren —
// sonst fehlt ein Fall oder es ist einer zu viel.
export function erwartungswert(paare) {
  if (!Array.isArray(paare) || paare.length === 0) {
    throw new Error('Für einen Erwartungswert braucht es mindestens einen Fall.');
  }

  let summeP = bruch(0);
  for (const { p } of paare) {
    pruefeWahrscheinlichkeit(p);
    summeP = plus(summeP, p);
  }

  if (!bruchGleich(summeP, bruch(1))) {
    throw new Error(
      `Die Wahrscheinlichkeiten müssen sich zu 1 addieren, hier sind es ${alsBruchText(summeP)} ` +
        `(${alsProzent(summeP)} %). Es fehlt ein Fall oder es ist einer zu viel.`
    );
  }

  let ergebnis = bruch(0);
  const schritte = [];
  for (const { wert, p, name } of paare) {
    const teil = mal(wert, p);
    ergebnis = plus(ergebnis, teil);
    schritte.push(
      schritt(
        name ? `${name}` : `Wert ${alsBruchText(wert)}`,
        `${alsBruchText(wert)} · ${alsBruchText(p)} = ${alsBruchText(teil)}`
      )
    );
  }

  schritte.push(schritt('alles addieren', alsBruchText(ergebnis)));

  return { erwartungswert: ergebnis, formel: 'E(X) = Σ  Wert · Wahrscheinlichkeit', schritte };
}

// ---------------------------------------------------------------------
// Fertige Beispiele
// ---------------------------------------------------------------------

export const BEISPIELE = [
  { titel: 'Würfel: eine Sechs', guenstig: 1, moeglich: 6 },
  { titel: 'Würfel: eine gerade Zahl', guenstig: 3, moeglich: 6 },
  { titel: 'Münze: Kopf', guenstig: 1, moeglich: 2 },
  { titel: 'Skatblatt: ein Ass', guenstig: 4, moeglich: 32 },
  { titel: 'Skatblatt: ein Herz', guenstig: 8, moeglich: 32 },
];
