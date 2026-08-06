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
  negativ,
  istNull,
  istNegativ,
  alsZahl,
  ausDezimal,
} from './bruch.js';
import { logarithmus, exponentVon, zahlText, naeherungText } from './logarithmus.js';

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
// Dezibel und pH — die beiden Skalen, die der Logarithmus hervorbringt
// ---------------------------------------------------------------------
//
// Beide sind der Ort, an dem der Zehnerlogarithmus entsteht, und nicht
// bloß eine Aufgabe, in der er vorkommt. Das Problem ist in beiden
// Fällen dasselbe, einmal in der Physik und einmal in der Chemie:
//
//   Zwischen der leisesten hörbaren und der schmerzhaft lauten
//   Schallintensität liegt der Faktor 10¹² — eine Billion.
//   Zwischen der sauersten und der basischsten wässrigen Lösung liegt
//   der Faktor 10¹⁴.
//
// Eine Skala von 1 bis 1 000 000 000 000 kann niemand lesen, und auf
// keinem Messgerät ist dafür Platz. Der Logarithmus zählt statt der Zahl
// die NULLEN — und aus einer Billion werden 120 dB, aus vierzehn
// Zehnerpotenzen die Zahlen 0 bis 14. Wer das einmal gesehen hat, weiß,
// wozu es den Logarithmus überhaupt gibt.
//
// Gerechnet wird über logarithmus.js, und zwar aus einem Grund: Diese
// Datei soll nicht selbst entscheiden, ob ein Wert exakt ist. lg(10¹⁰)
// ist genau 10, lg(2) ist keine Bruchzahl — und die Anwendung, die einen
// gerundeten Wert für exakt hielte, wäre der schlimmste Fall.

const ZEHN = bruch(10);

// Der Schallpegel: L = 10 · lg(I : I₀)
//
// I₀ = 10⁻¹² W/m² ist die Hörschwelle, also der Nullpunkt der Skala. Sie
// ist nicht "keine Schallenergie", sondern die kleinste, die ein gutes
// Ohr gerade noch wahrnimmt — 0 dB heißt "so leise wie die Hörschwelle",
// nicht "still".
export function dezibel({ intensitaet, bezug = 1e-12, verhaeltnis } = {}) {
  const I0 = alsBruchGenau(bezug, 'Die Bezugsintensität');
  const ueberVerhaeltnis = verhaeltnis !== undefined;

  if (istNull(I0) || istNegativ(I0)) {
    throw werfeUndefiniert('Die Bezugsintensität muss positiv sein — sonst gibt es kein Verhältnis');
  }

  const I = ueberVerhaeltnis ? null : alsBruchGenau(intensitaet, 'Die Intensität');
  const v = ueberVerhaeltnis ? alsBruchGenau(verhaeltnis, 'Das Verhältnis I : I₀') : geteilt(I, I0);

  if (istNull(v) || istNegativ(v)) {
    // Vollkommene Stille hat keinen Pegel. Der Logarithmus von null gibt
    // es nicht, und geraten wird dafür nichts.
    throw werfeUndefiniert(
      'Bei der Intensität 0 gibt es keinen Pegel: 10 hoch irgendetwas wird nie null. ' +
        'Der Pegel wird immer kleiner, je leiser es wird — bis in beliebig negative Zahlen —, ' +
        'aber er hört nie auf.'
    );
  }

  const log = logarithmus(10, v);
  const exakt = log.exakt;
  const pegelBruch = exakt ? mal(ZEHN, log.ergebnis) : null;
  const pegel = exakt ? alsZahl(pegelBruch) : 10 * log.naeherung;
  const pegelText = exakt ? zahlText(pegelBruch) : `≈ ${naeherungText(pegel, 2)}`;

  const vText = zehnerpotenzText(v);
  const schritte = [];

  if (!ueberVerhaeltnis) {
    schritte.push(
      schritt(
        `das Verhältnis bilden: ${zehnerpotenzText(I)} W/m² : ${zehnerpotenzText(I0)} W/m²`,
        `I : I₀ = ${vText}`
      )
    );
  }

  // Das Ungefähr-Zeichen ersetzt das Gleichheitszeichen, es steht nicht
  // zusätzlich davor: "lg(I : I₀) ≈ 0,3010" und nicht "= ≈ 0,3010".
  schritte.push(
    schritt(
      `lg(${vText}) — 10 hoch was ist ${vText}?`,
      exakt
        ? `lg(I : I₀) = ${zahlText(log.ergebnis)}`
        : `lg(I : I₀) ≈ ${naeherungText(log.naeherung, 4)}`
    ),
    schritt(
      'mit 10 malnehmen — ein Dezibel ist ein Zehntel Bel',
      exakt ? `L = ${pegelText} dB` : `L ≈ ${naeherungText(pegel, 2)} dB`
    )
  );

  // Die Leiter: jede Sprosse ist die zehnfache Intensität und genau
  // 10 dB mehr. Daran sieht man beides auf einmal — die Größe der
  // Spanne und die Gleichmäßigkeit der Skala.
  const leiter = [];
  for (let k = 0; k <= 12; k++) {
    leiter.push({ exponent: k, faktorText: `10${hochzahl(k)}`, pegel: 10 * k });
  }

  return {
    art: 'dezibel',
    intensitaet: ueberVerhaeltnis ? null : intensitaet,
    bezug,
    verhaeltnis: v,
    verhaeltnisText: vText,
    pegelBruch,
    pegel,
    pegelText,
    exakt,
    gerundet: !exakt,
    anfang: 'L = 10 · lg(I : I₀)',
    formel: 'L = 10 · lg(I : I₀)     I₀ = 10⁻¹² W/m²',
    ergebnisText: `${pegelText} dB`,
    schritte,
    leiter,
    // Jede Verzehnfachung bringt genau so viel dazu — das ist die
    // ganze Skala in einer Zahl.
    proVerzehnfachung: 10,
    hinweis: exakt
      ? null
      : `Dieser Pegel ist gerundet: ${vText} ist keine Zehnerpotenz, also ist lg(${vText}) keine ` +
        'Bruchzahl — genau wie √2. Nur bei glatten Zehnerpotenzen steht dort eine genaue Zahl.',
    einsicht:
      'Zwischen der Hörschwelle und der Schmerzgrenze liegt der Faktor 10¹² — eine Billion. ' +
      'Eine Skala von 1 bis 1 000 000 000 000 kann niemand lesen. Der Logarithmus zählt ' +
      'deshalb nicht die Zahl, sondern ihre NULLEN: Jede Verzehnfachung der Intensität bringt ' +
      'genau 10 dB dazu, und aus der Billion werden 120. Nicht das Ohr hat die Skala ' +
      'gemacht, sondern die Notwendigkeit, so etwas hinschreiben zu können.',
    vorbehalt:
      'Das Ohr empfindet nicht linear: 10 dB mehr sind die zehnfache Intensität, klingen aber ' +
      'nur ungefähr doppelt so laut — "doppelt so laut" ist eine Empfindung und keine ' +
      'Messgröße. Der Schalldruckpegel wird mit 20 · lg gerechnet und ist eine ANDERE Größe ' +
      'als der Intensitätspegel, obwohl beide dB heißen. Und über Schädigung sagt die Zahl ' +
      'nichts: Dafür zählt auch, wie lange man etwas hört.',
  };
}

// Der pH-Wert: pH = −lg(c(H⁺))
//
// Die Brücke zur Schwester-App: Dieselbe Rechnung wie beim Dezibel, nur
// mit einem Minus davor — und das Minus ist kein Schmuck. Die
// Konzentrationen sind alle kleiner als 1, ihre Logarithmen also negativ.
// Das Minus dreht sie um, damit auf der Skala positive Zahlen stehen.
export function phWert({ konzentration } = {}) {
  const c = alsBruchGenau(konzentration, 'Die Konzentration c(H⁺)');

  if (istNull(c) || istNegativ(c)) {
    throw werfeUndefiniert(
      'Zu der Konzentration 0 gibt es keinen pH-Wert: 10 hoch irgendetwas wird nie null. ' +
        'In Wasser sind immer ein paar Wasserstoff-Ionen unterwegs — vollkommen frei davon ' +
        'ist keine Lösung.'
    );
  }

  const log = logarithmus(10, c);
  const exakt = log.exakt;
  const phBruch = exakt ? negativ(log.ergebnis) : null;
  const ph = exakt ? alsZahl(phBruch) : -log.naeherung;
  const phText = exakt ? zahlText(phBruch) : `≈ ${naeherungText(ph, 2)}`;

  const cText = zehnerpotenzText(c);
  const logText = exakt ? zahlText(log.ergebnis) : naeherungText(log.naeherung, 2);
  // Wie beim Dezibel: Das Ungefähr-Zeichen ersetzt das Gleichheitszeichen.
  const istGleich = exakt ? '=' : '≈';

  const schritte = [
    schritt(
      `die Konzentration als Zehnerpotenz schreiben: c(H⁺) = ${cText} mol/l`,
      `pH = −lg(${cText})`
    ),
    schritt(`lg(${cText}) — 10 hoch was ist ${cText}?`, `pH ${istGleich} −(${logText})`),
    schritt(
      'das Minus vor dem lg dreht das Vorzeichen um — deshalb steht auf der Skala eine positive Zahl',
      `pH ${istGleich} ${exakt ? phText : naeherungText(ph, 2)}`
    ),
  ];

  // Die Leiter: eine pH-Stufe ist ein Faktor 10 in der Konzentration.
  const leiter = [];
  for (let stufe = 0; stufe <= 14; stufe++) {
    leiter.push({
      ph: stufe,
      konzentrationText: `10${hochzahl(-stufe)} mol/l`,
    });
  }

  const einordnung =
    ph < 7 ? 'sauer' : ph > 7 ? 'basisch' : 'neutral';

  return {
    art: 'ph',
    konzentration,
    konzentrationBruch: c,
    konzentrationText: cText,
    phBruch,
    ph,
    phText,
    einordnung,
    exakt,
    gerundet: !exakt,
    anfang: 'pH = −lg(c(H⁺))',
    formel: 'pH = −lg(c(H⁺))     c in mol/l',
    ergebnisText: `pH ${phText}`,
    schritte,
    leiter,
    proStufe: 10,
    hinweis: exakt
      ? null
      : `Dieser pH-Wert ist gerundet: ${cText} ist keine Zehnerpotenz, also ist lg(${cText}) ` +
        'keine Bruchzahl. Glatt wird der pH-Wert nur bei glatten Zehnerpotenzen.',
    einsicht:
      'Die Konzentration der Wasserstoff-Ionen reicht von etwa 1 mol/l bis 10⁻¹⁴ mol/l — ' +
      'vierzehn Zehnerpotenzen. Der Logarithmus macht daraus die handlichen Zahlen 0 bis 14, ' +
      'und jede Stufe ist genau ein Faktor 10: pH 4 ist ZEHNMAL so sauer wie pH 5, nicht ein ' +
      'bisschen saurer. Das Minus in der Formel steht nur da, damit die Skala ohne negative ' +
      'Zahlen auskommt — die Logarithmen selbst sind alle negativ.',
    vorbehalt:
      'Die Formel gilt für verdünnte wässrige Lösungen. Chemisch genau steht dort nicht die ' +
      'Konzentration, sondern die Aktivität; bei hohen Konzentrationen gehen beide auseinander. ' +
      'Dass 7 der neutrale Punkt ist, gilt bei 25 °C — bei anderer Temperatur verschiebt er ' +
      'sich. Und pH-Werte unter 0 oder über 14 gibt es wirklich, auch wenn die Skala im ' +
      'Schulbuch dort aufhört.',
  };
}

// ---------------------------------------------------------------------
// Hilfsmittel
// ---------------------------------------------------------------------

function schritt(regel, text) {
  return { regel, text };
}

// "Das gibt es nicht" — dasselbe Kennzeichen wie überall sonst im
// Projekt. Wer es weglässt, zwingt jeden Aufrufer, eine offene Frage wie
// einen Rechenfehler zu behandeln.
function werfeUndefiniert(nachricht) {
  const fehler = new Error(nachricht);
  fehler.undefiniert = true;
  return fehler;
}

// Eine Zahl exakt in einen Bruch, auch in Exponentialschreibweise.
//
// bruch.ausDezimal() lehnt "1e-12" ausdrücklich ab, und zu Recht: Für
// eine Eingabe aus einem Textfeld ist das die richtige Antwort. Hier
// kommen die Zahlen aber aus der Physik und der Chemie, und dort sind
// 10⁻¹² W/m² und 10⁻⁷ mol/l die Normalfälle. Deshalb wird die
// Schreibweise hier zerlegt statt abgelehnt — exakt, über den Text und
// nicht über den gespeicherten Gleitkommawert.
function alsBruchGenau(wert, name) {
  if (typeof wert === 'object' && wert !== null && Number.isInteger(wert.z)) {
    return wert;
  }
  if (typeof wert !== 'number' || !Number.isFinite(wert)) {
    throw new Error(`${name} muss eine Zahl sein`);
  }
  if (Number.isSafeInteger(wert)) {
    return bruch(wert);
  }

  const text = String(wert);
  const teile = text.match(/^(-?)(\d+)(?:\.(\d+))?e([+-]?\d+)$/i);

  if (!teile) {
    // Keine Exponentialschreibweise — dann kann ausDezimal es. Vorher
    // aber nachsehen, ob der Nenner überhaupt noch exakt darstellbar
    // ist: 10**-4 ist in Gleitkomma nicht 0,0001, sondern
    // 0,00009999999999999999, und daraus würde ein Nenner mit zwanzig
    // Nullen. Ohne diese Prüfung käme von weiter unten ein Fehler OHNE
    // Kennzeichen zurück — und wer den bekommt, kann eine offene Frage
    // nicht von einem Rechenfehler unterscheiden.
    const punkt = text.indexOf('.');
    if (punkt !== -1) {
      pruefeExaktDarstellbar(10 ** (text.length - punkt - 1), text, name);
    }
    return ausDezimal(wert);
  }

  const [, vorzeichen, ganz, nachkomma = '', exponentText] = teile;
  const ziffern = Number(`${ganz}${nachkomma}`);
  const stellen = Number(exponentText) - nachkomma.length;
  const zehnerpotenz = 10 ** Math.abs(stellen);

  pruefeExaktDarstellbar(ziffern, text, name);
  pruefeExaktDarstellbar(zehnerpotenz, text, name);

  const betragTeil =
    stellen >= 0 ? bruch(ziffern * zehnerpotenz) : bruch(ziffern, zehnerpotenz);
  return vorzeichen === '-' ? negativ(betragTeil) : betragTeil;
}

// Jenseits von 2^53 rechnet die Bruchrechnung nicht mehr exakt — und
// eine Anwendung, die unbemerkt ungenau wird, ist schlimmer als gar
// keine. Das Kennzeichen `zuGross` heißt: "Das kann ich nicht
// ausrechnen" — nicht "das gibt es nicht".
function pruefeExaktDarstellbar(zahl, text, name) {
  if (!Number.isSafeInteger(zahl)) {
    const fehler = new Error(
      `${name}: ${text} lässt sich hier nicht mehr exakt in einen Bruch umrechnen. ` +
        'Bitte als glatte Zehnerpotenz angeben, etwa 1e-12.'
    );
    fehler.zuGross = true;
    throw fehler;
  }
}

// "10⁻¹²", "10¹⁰", "1" — oder, wenn es keine Zehnerpotenz ist, die Zahl
// selbst. Der Renderer rechnet nicht: Was dasteht, ist das, was gefragt
// wurde.
function zehnerpotenzText(wert) {
  const k = exponentVon(ZEHN, wert);
  if (k === null || k.n !== 1) {
    return zahlText(wert);
  }
  if (k.z === 0) {
    return '1';
  }
  return k.z === 1 ? '10' : `10${hochzahl(k.z)}`;
}

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
