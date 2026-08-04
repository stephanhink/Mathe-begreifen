// Hypothesentests — und der eine Satz, den fast jeder falsch lernt.
//
// Ein Signifikanztest fragt: Passt das, was ich beobachtet habe, noch
// zu meiner Annahme — oder ist es dafür zu unwahrscheinlich?
//
// Was er NICHT tut, und das ist der Kern dieser Datei:
//
//     EIN TEST BEWEIST NICHTS.
//
// „H₀ wird nicht verworfen" heißt nicht „H₀ ist wahr". Es heißt nur:
// Was ich gesehen habe, ist mit H₀ verträglich — mit anderen Annahmen
// vielleicht genauso gut oder besser. Ein Gericht, das freispricht,
// erklärt niemanden für unschuldig; es stellt fest, dass es nicht
// gereicht hat. Genau so ist ein Test gebaut, und genau so wird er
// überall falsch zitiert.
//
// Deshalb liefert jede Entscheidung hier einen SATZ mit, der das
// mitsagt. Eine App, die nur „H₀ beibehalten" ausgibt, züchtet den
// Denkfehler, statt ihn abzuräumen.
//
// ---------------------------------------------------------------------
//
// Zur Genauigkeit: Gerechnet wird NUMERISCH, und die Datei sagt es.
//
// Das ist eine Abweichung von der sonstigen Linie, und sie hat einen
// zwingenden Grund. Ein realistischer Test hat n = 100 oder mehr;
// „100 über 50" ist etwa 1 · 10²⁹ und sprengt die exakte Bruchrechnung
// um dreizehn Größenordnungen. zufall.js bricht dort zu Recht ab.
//
// Gerechnet wird deshalb über die Rekursion
//
//     P(X = k+1) = P(X = k) · (n − k)/(k + 1) · p/(1 − p)
//
// Sie kommt ohne einen einzigen Binomialkoeffizienten aus und bleibt
// dadurch auch bei n = 1000 im Wertebereich. Für kleine n lässt sich
// das Ergebnis gegen die exakte Rechnung aus zufall.js prüfen — genau
// das tut die Prüfung.

import { alsZahl } from './bruch.js';
import { binomialVerteilung } from './zufall.js';

export const ARTEN = Object.freeze({
  linksseitig: {
    name: 'linksseitig',
    frage: 'Ist der Anteil KLEINER als angenommen?',
    gegenhypothese: 'H₁: p < p₀',
    erklaerung:
      'Verworfen wird, wenn AUFFÄLLIG WENIGE Treffer auftreten. Der Ablehnungsbereich liegt links, bei den kleinen Trefferzahlen.',
  },
  rechtsseitig: {
    name: 'rechtsseitig',
    frage: 'Ist der Anteil GRÖSSER als angenommen?',
    gegenhypothese: 'H₁: p > p₀',
    erklaerung:
      'Verworfen wird, wenn auffällig VIELE Treffer auftreten. Der Ablehnungsbereich liegt rechts.',
  },
  zweiseitig: {
    name: 'zweiseitig',
    frage: 'Ist der Anteil ANDERS als angenommen — egal in welche Richtung?',
    gegenhypothese: 'H₁: p ≠ p₀',
    erklaerung:
      'Verworfen wird bei auffällig wenigen ODER auffällig vielen Treffern. Das Signifikanzniveau wird dafür auf beide Seiten aufgeteilt, je die Hälfte.',
  },
});

// ---------------------------------------------------------------------
// Die Verteilung, numerisch und überlaufsicher
// ---------------------------------------------------------------------

// P(X = k) für alle k von 0 bis n.
//
// Über die Rekursion statt über Binomialkoeffizienten — sonst wäre bei
// n = 100 Schluss. Der Startwert (1 − p)ⁿ kann bei großem n selbst zu
// klein werden; deshalb wird von der WAHRSCHEINLICHSTEN Stelle aus
// gerechnet und am Ende normiert.
export function verteilung(n, p) {
  pruefeEingaben(n, p);

  if (p === 0) {
    return Array.from({ length: n + 1 }, (unused, k) => (k === 0 ? 1 : 0));
  }
  if (p === 1) {
    return Array.from({ length: n + 1 }, (unused, k) => (k === n ? 1 : 0));
  }

  // Vom Erwartungswert aus nach beiden Seiten — dort sind die Werte am
  // größten, und alles Weitere wird kleiner statt zu verschwinden.
  const mitte = Math.min(n, Math.max(0, Math.round(n * p)));
  const werte = new Array(n + 1).fill(0);
  werte[mitte] = 1;

  const q = p / (1 - p);
  for (let k = mitte; k < n; k++) {
    werte[k + 1] = (werte[k] * ((n - k) / (k + 1))) * q;
  }
  for (let k = mitte; k > 0; k--) {
    werte[k - 1] = (werte[k] * (k / (n - k + 1))) / q;
  }

  const summe = werte.reduce((s, w) => s + w, 0);
  return werte.map((w) => w / summe);
}

// P(X ≤ k) — die kumulierte Wahrscheinlichkeit, die in jeder
// Formelsammlung tabelliert ist.
export function kumuliert(n, p, k) {
  const v = verteilung(n, p);
  let summe = 0;
  for (let i = 0; i <= Math.min(k, n); i++) {
    summe += v[i];
  }
  return summe;
}

function pruefeEingaben(n, p) {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`hypothese: n = ${n} — die Anzahl der Versuche muss eine ganze Zahl ≥ 1 sein`);
  }
  if (!(p >= 0 && p <= 1)) {
    throw new Error(
      `hypothese: p = ${p} — eine Wahrscheinlichkeit liegt zwischen 0 und 1. ` +
        'Mehr als 1 gibt es nicht.'
    );
  }
}

// ---------------------------------------------------------------------
// Der Test
// ---------------------------------------------------------------------
//
// Gesucht ist der Ablehnungsbereich: die Trefferzahlen, bei denen H₀
// verworfen wird. Er wird so groß gemacht, wie es geht, ohne dass die
// Wahrscheinlichkeit eines Fehlers 1. Art über α steigt.
//
// Dass er dabei meist NICHT genau α erreicht, ist kein Rechenfehler,
// sondern liegt an der Binomialverteilung selbst: Sie springt in
// Stufen. Bei n = 20 gibt es keinen Bereich mit genau 5 %, sondern nur
// einen mit 2,1 % und den nächsten mit 5,8 %. Genommen wird der größte,
// der noch unter α bleibt — und die Datei nennt das tatsächliche
// Niveau, statt α zu behaupten.

export function test({ n, p0, art = 'rechtsseitig', alpha = 0.05 }) {
  pruefeEingaben(n, p0);
  if (!(art in ARTEN)) {
    throw new Error(`hypothese: "${art}" ist keine bekannte Testart (${Object.keys(ARTEN).join(', ')})`);
  }
  if (!(alpha > 0 && alpha < 1)) {
    throw new Error(
      `hypothese: das Signifikanzniveau ${alpha} liegt nicht zwischen 0 und 1. ` +
        'Üblich sind 0,05 oder 0,01.'
    );
  }

  const v = verteilung(n, p0);

  if (art === 'linksseitig') {
    const grenze = linkeGrenze(v, alpha);
    return baue({ n, p0, art, alpha, v, links: grenze, rechts: null });
  }
  if (art === 'rechtsseitig') {
    const grenze = rechteGrenze(v, alpha);
    return baue({ n, p0, art, alpha, v, links: null, rechts: grenze });
  }
  // Zweiseitig: α wird halbiert und auf beide Seiten verteilt.
  return baue({
    n,
    p0,
    art,
    alpha,
    v,
    links: linkeGrenze(v, alpha / 2),
    rechts: rechteGrenze(v, alpha / 2),
  });
}

// Das größte k mit P(X ≤ k) ≤ α. Gibt −1, wenn schon P(X = 0) zu groß
// ist — dann gibt es links keinen Ablehnungsbereich.
function linkeGrenze(v, schranke) {
  let summe = 0;
  let grenze = -1;
  for (let k = 0; k < v.length; k++) {
    if (summe + v[k] > schranke) {
      break;
    }
    summe += v[k];
    grenze = k;
  }
  return grenze;
}

// Das kleinste k mit P(X ≥ k) ≤ α. Gibt n+1, wenn es keins gibt.
function rechteGrenze(v, schranke) {
  let summe = 0;
  let grenze = v.length;
  for (let k = v.length - 1; k >= 0; k--) {
    if (summe + v[k] > schranke) {
      break;
    }
    summe += v[k];
    grenze = k;
  }
  return grenze;
}

function baue({ n, p0, art, alpha, v, links, rechts }) {
  const bereiche = [];
  let niveau = 0;

  if (links !== null && links >= 0) {
    bereiche.push({ von: 0, bis: links, seite: 'links' });
    for (let k = 0; k <= links; k++) {
      niveau += v[k];
    }
  }
  if (rechts !== null && rechts <= n) {
    bereiche.push({ von: rechts, bis: n, seite: 'rechts' });
    for (let k = rechts; k <= n; k++) {
      niveau += v[k];
    }
  }

  return {
    art: 'test',
    testart: art,
    n,
    p0,
    alpha,
    verteilung: v,
    ablehnung: bereiche,
    // Das TATSÄCHLICHE Niveau — fast immer kleiner als α, weil die
    // Binomialverteilung in Stufen springt. α zu behaupten wäre falsch.
    niveau,
    exakt: false,
    leer: bereiche.length === 0,
    beschreibung: beschreibeBereich(bereiche, n),
  };
}

function beschreibeBereich(bereiche, n) {
  if (bereiche.length === 0) {
    return 'leer';
  }
  return bereiche
    .map((b) => (b.von === b.bis ? `k = ${b.von}` : `${b.von} ≤ k ≤ ${b.bis}`))
    .join('  oder  ');
}

// Liegt die beobachtete Trefferzahl im Ablehnungsbereich?
export function imAblehnungsbereich(t, k) {
  return t.ablehnung.some((b) => k >= b.von && k <= b.bis);
}

// ---------------------------------------------------------------------
// Die Entscheidung — mit dem Satz, auf den es ankommt
// ---------------------------------------------------------------------

export function entscheide(t, k) {
  if (!Number.isInteger(k) || k < 0 || k > t.n) {
    throw new Error(`entscheide: ${k} Treffer bei ${t.n} Versuchen — das kann nicht sein`);
  }

  const verwirft = imAblehnungsbereich(t, k);

  if (verwirft) {
    return {
      art: 'entscheidung',
      verwirft: true,
      satz:
        `Bei ${k} Treffern wird H₀ verworfen. Ein solches Ergebnis wäre unter H₀ so ` +
        `unwahrscheinlich, dass man die Annahme fallen lässt.`,
      vorbehalt:
        'Auch das kann daneben liegen: Mit einer Wahrscheinlichkeit von höchstens ' +
        `${(t.alpha * 100).toFixed(1).replace('.', ',')} % verwirft man H₀, obwohl sie stimmt. ` +
        'Das ist der Fehler 1. Art, und man kann ihn nie ausschließen — nur klein halten.',
    };
  }

  return {
    art: 'entscheidung',
    verwirft: false,
    satz: `Bei ${k} Treffern wird H₀ NICHT verworfen.`,
    // Der wichtigste Satz der ganzen Datei.
    vorbehalt:
      'Das heißt NICHT, dass H₀ stimmt. Es heißt nur: Was beobachtet wurde, ist mit H₀ ' +
      'verträglich — mit anderen Annahmen aber vielleicht genauso gut. Ein Test kann eine ' +
      'Annahme widerlegen, nie beweisen. Ein Gericht, das freispricht, erklärt niemanden ' +
      'für unschuldig; es stellt fest, dass es nicht gereicht hat.',
  };
}

// ---------------------------------------------------------------------
// Fehler 2. Art
// ---------------------------------------------------------------------
//
// Er ist die andere Sorte Irrtum: H₀ beibehalten, obwohl sie falsch ist.
//
// Und er lässt sich NUR ausrechnen, wenn man sagt, was stattdessen
// gelten soll. Ohne ein konkretes p ist die Frage unbeantwortbar —
// „irgendetwas anderes als 0,5" ist keine Verteilung. Genau das
// übersieht man, weil α ja auch ohne Zusatzangabe dasteht.

export function fehlerZweiterArt(t, pWahr) {
  pruefeEingaben(t.n, pWahr);

  const v = verteilung(t.n, pWahr);
  let beta = 0;
  for (let k = 0; k <= t.n; k++) {
    if (!imAblehnungsbereich(t, k)) {
      beta += v[k];
    }
  }

  return {
    art: 'fehler2',
    pWahr,
    beta,
    // Die Gegenwahrscheinlichkeit heißt Güte oder Macht des Tests: Wie
    // gut erkennt er, dass H₀ falsch ist?
    guete: 1 - beta,
    exakt: false,
    satz:
      `Wäre in Wirklichkeit p = ${zahlKurz(pWahr)}, würde dieser Test das mit einer ` +
      `Wahrscheinlichkeit von ${prozent(beta)} NICHT bemerken und H₀ trotzdem beibehalten.`,
    hinweis:
      'Der Fehler 2. Art lässt sich nur berechnen, wenn man sagt, was statt H₀ gelten soll. ' +
      'Ohne ein konkretes p gibt es darauf keine Antwort — „irgendetwas anderes" ist keine ' +
      'Verteilung.',
  };
}

// ---------------------------------------------------------------------
// Ausgabe
// ---------------------------------------------------------------------

export function prozent(p, stellen = 2) {
  return `${(p * 100).toFixed(stellen).replace('.', ',')} %`;
}

function zahlKurz(wert) {
  return String(Math.round(wert * 10000) / 10000).replace('.', ',');
}

export function alsRechenweg(t) {
  const beschreibung = ARTEN[t.testart];
  const zeilen = [
    `n = ${t.n} Versuche,  H₀: p = ${zahlKurz(t.p0)}`,
    `${beschreibung.gegenhypothese}  (${beschreibung.frage})`,
    `Signifikanzniveau α = ${prozent(t.alpha, 1)}`,
    `         | ${beschreibung.erklaerung}`,
  ];

  if (t.leer) {
    zeilen.push(
      'Ablehnungsbereich: leer — bei diesem n und diesem α kann H₀ gar nicht verworfen werden.'
    );
    zeilen.push(
      '         | Die Stichprobe ist zu klein. Selbst das äußerste Ergebnis wäre unter H₀ ' +
        'noch wahrscheinlicher als α.'
    );
    return zeilen;
  }

  zeilen.push(`Ablehnungsbereich: ${t.beschreibung}`);
  zeilen.push(
    `         | tatsächliches Niveau: ${prozent(t.niveau)} — höchstens α, meist darunter, ` +
      'weil die Binomialverteilung in Stufen springt'
  );
  return zeilen;
}
