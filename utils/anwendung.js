// Wozu braucht man das? — Mathematik an echten Zahlen.
//
// Die Frage, an der Schulmathematik am häufigsten scheitert. Diese
// Datei beantwortet sie nach einer Regel, die vor der ersten Zeile Code
// festgelegt wurde (siehe CLAUDE.md):
//
//     EINE ANWENDUNG WENDET DIE FORMEL NICHT AN — SIE BRINGT SIE HERVOR.
//
// Zinseszins ist kein Beispiel FÜR die Exponentialfunktion. Zinseszins
// IST der Ort, an dem sie entsteht: nach einem Jahr K · 1,03, nach zwei
// Jahren K · 1,03², nach n Jahren K · 1,03ⁿ. Wer das einmal selbst
// hingeschrieben hat, braucht die Exponentialfunktion nicht mehr
// erklärt zu bekommen.
//
// Andersherum gebaut — erst die Formel, dann ein hübsches Beispiel —
// entstünde genau das, woran Schulmathematik krankt: der Bauer mit den
// 37 Melonen. Eine erfundene Verpackung um eine Rechnung, die man auch
// ohne sie gemacht hätte.
//
// Die zweite Regel: SAGEN, WAS DAS MODELL NICHT WEISS. Zinseszins mit
// festem Satz kennt keine Inflation und keine Steuer; exponentielles
// Wachstum hört in der Wirklichkeit irgendwann auf. Eine App, die „sie
// rät nicht" verspricht und dann ein Modell für die Wirklichkeit
// ausgibt, hätte ihr eigenes Versprechen gebrochen. Und gerade dieser
// Absatz ist das Wertvollste daran: Zu verstehen, wo ein Modell aufhört
// zu gelten, ist mehr wert als die Formel selbst.

import {
  bruch,
  plus,
  minus,
  mal,
  geteilt,
  hoch,
  istNegativ,
  alsZahl,
} from './bruch.js';

// ---------------------------------------------------------------------
// Zinseszins
// ---------------------------------------------------------------------
//
// Der Weg ist wichtiger als das Ergebnis, deshalb kommen die ersten
// Jahre einzeln zurück. Erst daran sieht man, dass sich der Faktor
// WIEDERHOLT — und genau das ist die Potenz.

export function zinseszins({ startkapital, zinssatz, jahre }) {
  pruefeZahl(startkapital, 'Das Startkapital', 0);
  pruefeZahl(jahre, 'Die Laufzeit', 0);
  if (!Number.isInteger(jahre)) {
    throw new Error('zinseszins: die Laufzeit muss eine ganze Zahl von Jahren sein');
  }
  if (zinssatz <= -100) {
    throw new Error(
      `zinseszins: ${zinssatz} % — bei −100 % wäre nach einem Jahr alles weg, darunter ` +
        'gibt es nichts mehr wegzunehmen'
    );
  }

  const faktor = 1 + zinssatz / 100;

  // Die ersten Jahre einzeln — hier entsteht die Potenz vor den Augen.
  const schritte = [];
  const zeigeJahre = Math.min(jahre, 3);
  for (let n = 1; n <= zeigeJahre; n++) {
    schritte.push({
      jahr: n,
      kapital: startkapital * faktor ** n,
      // So schreibt man es hin, bevor man die Potenz erkennt.
      ausgeschrieben:
        n === 1
          ? `K · ${zahlKurz(faktor)}`
          : `K · ${Array(n).fill(zahlKurz(faktor)).join(' · ')}`,
      alsPotenz: `K · ${zahlKurz(faktor)}${n === 1 ? '' : hochzahl(n)}`,
    });
  }

  const ende = startkapital * faktor ** jahre;
  const zinsen = ende - startkapital;
  // Zum Vergleich: OHNE Zinseszins, also nur einfache Zinsen. Der
  // Unterschied ist der ganze Punkt.
  const ohneZinseszins = startkapital * (1 + (zinssatz / 100) * jahre);

  return {
    art: 'zinseszins',
    startkapital,
    zinssatz,
    jahre,
    faktor,
    schritte,
    ende,
    zinsen,
    ohneZinseszins,
    unterschied: ende - ohneZinseszins,
    formel: `K(n) = ${zahlKurz(startkapital)} · ${zahlKurz(faktor)}ⁿ`,
    // Das ist der Satz, um den es geht.
    einsicht:
      `Derselbe Faktor ${zahlKurz(faktor)} wird jedes Jahr wieder angewandt. Genau das ` +
      `ist eine Potenz — und damit steht hier die Exponentialfunktion, ohne dass sie ` +
      `jemand hingeschrieben hätte.`,
    vorbehalt:
      'Dieses Modell kennt weder Inflation noch Steuern noch Gebühren, und es nimmt an, ' +
      'dass der Zinssatz sich nie ändert. In Wirklichkeit trifft keine dieser Annahmen ' +
      'genau zu — die Rechnung zeigt die Wirkung des Zinseszinses, nicht den Kontostand.',
  };
}

// Wie lange dauert es, bis sich das Kapital verdoppelt?
//
// Ohne Logarithmus lässt sich das nicht auflösen — also wird gezählt.
// Das ist keine Notlösung: Zählen zeigt, dass die Verdopplungszeit
// NICHT vom Startkapital abhängt, und genau das ist die überraschende
// Eigenschaft.
export function verdopplungszeit(zinssatz) {
  if (zinssatz <= 0) {
    return {
      art: 'unklar',
      grund:
        'Ohne Zins verdoppelt sich nichts. Bei einem negativen Satz wird es weniger statt ' +
        'mehr — dann gibt es keine Verdopplungszeit, sondern eine Halbwertszeit.',
    };
  }

  const faktor = 1 + zinssatz / 100;
  let jahre = 0;
  let wert = 1;
  while (wert < 2 && jahre < 10000) {
    wert *= faktor;
    jahre++;
  }

  // Die Faustformel aus der Praxis — und der ehrliche Vergleich dazu.
  const faustregel = 70 / zinssatz;

  return {
    art: 'verdopplung',
    zinssatz,
    jahre,
    genau: Math.log(2) / Math.log(faktor),
    faustregel,
    einsicht:
      'Die Verdopplungszeit hängt NICHT vom Startkapital ab. Ob 100 € oder eine Million: ' +
      'Es dauert gleich lange. Genau das ist das Kennzeichen exponentiellen Wachstums.',
    faustregelSatz:
      `Die Faustregel „70 durch den Zinssatz" gibt ${zahlKurz(faustregel)} Jahre — nah dran, ` +
      'aber eine Näherung. Exakt auflösen ließe es sich nur mit dem Logarithmus.',
  };
}

// ---------------------------------------------------------------------
// Exponentielles Wachstum — der Schock
// ---------------------------------------------------------------------
//
// Hier geht es nicht ums Rechnen, sondern ums Staunen. Die Zahlen sind
// so weit jenseits der Anschauung, dass sie nur als Reihe wirken: Wer
// bei Tag 20 noch mitschätzt, liegt bei Tag 30 um das Tausendfache
// daneben.

export function verdopplung({ start, schritte, einheit = '€' }) {
  pruefeZahl(start, 'Der Startwert', 0);
  pruefeZahl(schritte, 'Die Anzahl der Schritte', 1);
  if (schritte > 200) {
    throw new Error(
      `verdopplung: ${schritte} Verdopplungen — das übersteigt jede darstellbare Zahl. ` +
        'Schon 200 Verdopplungen sind mehr als es Atome im sichtbaren Universum gibt.'
    );
  }

  const reihe = [];
  for (let i = 0; i <= schritte; i++) {
    reihe.push({ schritt: i, wert: start * 2 ** i });
  }

  return {
    art: 'verdopplung',
    start,
    schritte,
    einheit,
    reihe,
    ende: start * 2 ** schritte,
    // Die Stelle, an der die Anschauung abreißt.
    beiHalbzeit: start * 2 ** Math.floor(schritte / 2),
    einsicht:
      `Nach der Hälfte der Zeit ist erst ${zahlKurz(start * 2 ** Math.floor(schritte / 2))} ` +
      `${einheit} erreicht — und am Ende ${zahlKurz(start * 2 ** schritte)} ${einheit}. ` +
      'Fast alles passiert ganz am Schluss. Das ist der Grund, warum exponentielles ' +
      'Wachstum immer zu spät bemerkt wird.',
    vorbehalt:
      'In der Wirklichkeit hört jedes Wachstum irgendwann auf: Der Platz wird knapp, das ' +
      'Futter, das Geld. Kein Bakterium füllt das Weltall. Die Rechnung sagt, was ' +
      'geschähe, WENN sich der Verlauf fortsetzt — nicht, dass er es tut.',
  };
}

// Halbwertszeit ist dasselbe rückwärts. Dass beides eine Formel ist,
// sieht man erst, wenn es nebeneinandersteht.
export function zerfall({ start, halbwertszeit, dauer, einheit = 'Jahre' }) {
  pruefeZahl(start, 'Die Startmenge', 0);
  pruefeZahl(halbwertszeit, 'Die Halbwertszeit', 0);
  pruefeZahl(dauer, 'Die Dauer', 0);
  if (halbwertszeit === 0) {
    throw new Error('zerfall: eine Halbwertszeit von 0 gibt es nicht');
  }

  const anzahl = dauer / halbwertszeit;
  const rest = start * 0.5 ** anzahl;

  return {
    art: 'zerfall',
    start,
    halbwertszeit,
    dauer,
    einheit,
    halbierungen: anzahl,
    rest,
    anteil: rest / start,
    einsicht:
      `Nach ${zahlKurz(dauer)} ${einheit} sind ${zahlKurz(anzahl)} Halbwertszeiten vergangen, ` +
      `also bleibt der Anteil (1/2)^${zahlKurz(anzahl)}. Das ist dieselbe Formel wie beim ` +
      'Zinseszins — nur mit einem Faktor unter 1. Wachstum und Zerfall sind dasselbe ' +
      'Gesetz, einmal vorwärts und einmal rückwärts.',
    vorbehalt:
      'Es wird nie exakt null. Nach jeder Halbwertszeit bleibt die Hälfte des Rests — ' +
      'rechnerisch immer etwas. In der Wirklichkeit endet es, wenn das letzte Atom ' +
      'zerfallen ist, und das ist Zufall, keine Kurve.',
  };
}

// ---------------------------------------------------------------------
// Der Optionspreis
// ---------------------------------------------------------------------
//
// Die Krone, und aus einem bestimmten Grund: Hier ist der naive
// Erwartungswert FALSCH, und man kann genau sagen warum. Das ist mehr
// wert als jedes Beispiel, bei dem die naheliegende Rechnung stimmt.
//
// Gerechnet wird exakt in Brüchen — die Zahlen sind klein genug, und
// gerade hier kommt es auf den Bruch an: 4/9 sieht man sofort an, dass
// es nicht 1/2 ist. An „0,444" sieht man das nicht.

export function optionspreis({ kurs, hoch: kursHoch, tief, ausuebung }) {
  for (const [wert, name] of [
    [kurs, 'Der heutige Kurs'],
    [kursHoch, 'Der hohe Kurs'],
    [tief, 'Der tiefe Kurs'],
    [ausuebung, 'Der Ausübungspreis'],
  ]) {
    pruefeZahl(wert, name, 0);
  }
  if (!(tief < kurs && kurs < kursHoch)) {
    throw new Error(
      `optionspreis: der heutige Kurs (${kurs}) muss zwischen dem tiefen (${tief}) und dem ` +
        'hohen (' + kursHoch + ') liegen. Sonst stünde schon heute fest, wohin es geht — ' +
        'und dann gäbe es nichts zu bewerten.'
    );
  }

  const S = bruch(kurs);
  const Su = bruch(kursHoch);
  const Sd = bruch(tief);
  const K = bruch(ausuebung);

  // Was die Option am Ende wert ist: die Differenz, wenn sie sich lohnt,
  // sonst nichts. Man muss sie ja nicht ausüben.
  const Cu = kursHoch > ausuebung ? minus(Su, K) : bruch(0);
  const Cd = tief > ausuebung ? minus(Sd, K) : bruch(0);

  // Der Nachbau: Delta Aktien plus B Bargeld liefern in BEIDEN Fällen
  // dasselbe wie die Option.
  const delta = geteilt(minus(Cu, Cd), minus(Su, Sd));
  const bargeld = minus(Cd, mal(delta, Sd));
  const preis = plus(mal(delta, S), bargeld);

  // Die risikoneutrale Wahrscheinlichkeit — rückwärts aus dem Preis.
  const q = geteilt(minus(S, Sd), minus(Su, Sd));

  // Was der naive Erwartungswert sagen würde.
  const naiv = geteilt(plus(Cu, Cd), bruch(2));

  return {
    art: 'optionspreis',
    kurs,
    hoch: kursHoch,
    tief,
    ausuebung,
    auszahlungHoch: Cu,
    auszahlungTief: Cd,
    delta,
    bargeld,
    preis,
    q,
    naiv,
    // Der Satz, für den das ganze Beispiel da ist.
    einsicht:
      'Der Erwartungswert wird mit der FALSCHEN Wahrscheinlichkeit gerechnet — und gerade ' +
      'deshalb stimmt er. Nicht die echte Wahrscheinlichkeit steht in der Formel, sondern ' +
      'die eine, unter der sich mit dem Nachbau nichts verdienen ließe.',
    warumNichtNaiv:
      'Die naheliegende Rechnung „halbe-halbe" ist falsch, und man kann genau sagen, warum: ' +
      'Der Preis steht nicht durch eine Schätzung fest, sondern durch einen Zwang. Wer die ' +
      'Option teurer verkauft, baut sie billiger nach und hat den Unterschied sicher — in ' +
      'JEDEM der beiden Fälle.',
    vorbehalt:
      'Das Modell nimmt an, dass es nur zwei mögliche Kurse gibt, dass man beliebig teilbare ' +
      'Aktien handeln kann, dass keine Gebühren anfallen und dass sich mit dem Nachbau nichts ' +
      'verdienen lässt. Keine dieser Annahmen trifft genau zu. Der Preis ist die Antwort des ' +
      'Modells, nicht die des Marktes.',
  };
}

// ---------------------------------------------------------------------
// Hilfsmittel
// ---------------------------------------------------------------------

function pruefeZahl(wert, name, mindestens) {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) {
    throw new Error(`${name} muss eine Zahl sein`);
  }
  if (wert < mindestens) {
    throw new Error(`${name} darf nicht kleiner als ${mindestens} sein (${wert})`);
  }
}

// Geld und Größen lesbar: Tausenderpunkte, Komma, und ab einer gewissen
// Größe in Zehnerpotenzen — "9007199254740992 €" liest niemand.
export function zahlKurz(wert) {
  if (!Number.isFinite(wert)) {
    return '—';
  }
  if (Math.abs(wert) >= 1e15) {
    const exponent = Math.floor(Math.log10(Math.abs(wert)));
    const mantisse = wert / 10 ** exponent;
    return `${mantisse.toFixed(2).replace('.', ',')} · 10${hochzahl(exponent)}`;
  }
  const gerundet = Math.abs(wert) >= 100 ? Math.round(wert) : Math.round(wert * 100) / 100;
  return gerundet.toLocaleString('de-DE');
}

export function hochzahl(n) {
  const ziffern = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  return String(n)
    .split('')
    .map((z) => (z === '-' ? '⁻' : ziffern[Number(z)]))
    .join('');
}
