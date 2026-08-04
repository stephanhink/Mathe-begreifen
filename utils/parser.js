// Getippten Text in Terme und Gleichungen übersetzen.
//
//   "3x + 5 = 14"   →   gleichung(summe(produkt(3, x), 5), 14)
//
// Ohne diese Datei gäbe es kein Eingabefeld: Alles andere in utils/ baut
// Terme im Code zusammen, und niemand tippt Klammerausdrücke in
// JavaScript.
//
// Zwei Dinge sind der Datei wichtiger als Vollständigkeit:
//
// 1. Sie liest, was die App selbst schreibt. `parse(alsText(t))` muss
//    wieder denselben Term ergeben — und genau das prüft
//    tests/parser.mjs an Zufallstermen. Diese eine Prüfung fängt jede
//    mehrdeutige Schreibweise: "√4/9" wäre daran gescheitert, weil es
//    als (√4)/9 zurückkäme.
//
// 2. Sie sagt bei einem Fehler, WO er steckt. "Unerwartetes Zeichen"
//    hilft niemandem; "an Stelle 5: hier fehlt eine Zahl" schon.

import { bruch, negativ } from './bruch.js';
import { zahl, variable, summe, produkt, potenz, quotient, wurzel, betrag } from './term.js';
import { gleichung } from './gleichung.js';
import { ungleichung } from './ungleichung.js';
import { system } from './system.js';

// Was der Mensch tippt und was die App schreibt, ist nicht dasselbe
// Zeichen: Auf der Tastatur liegt der Bindestrich, gesetzt wird das
// typografische Minus. Beides muss gehen.
const MINUSZEICHEN = /[-−–—]/;
const MALZEICHEN = /[*·×]/;
const GETEILTZEICHEN = /[:/÷]/;

// Die vier Vergleichszeichen — jeweils in der Form, die gesetzt wird,
// und in der, die man auf einer Handytastatur überhaupt tippen kann.
// Die zweizeichigen stehen VORNE: Wer "<=" liest und zuerst auf "<"
// prüft, verbraucht das Kleiner und lässt ein "=" liegen.
const VERGLEICHE = [
  ['<=', '≤'],
  ['>=', '≥'],
  ['=<', '≤'],
  ['=>', '≥'],
  ['≤', '≤'],
  ['≥', '≥'],
  ['<', '<'],
  ['>', '>'],
];

const HOCHZIFFERN = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁻': '-',
};

const WURZELGRADE = { '√': 2, '∛': 3, '∜': 4 };

// Ausgeschriebene Namen. Wer sie tippt, meint sicher keine Folge von
// Variablen.
const WURZELWOERTER = ['wurzel', 'sqrt', 'quadratwurzel'];
const BETRAGSWOERTER = ['betrag', 'abs'];

// ---------------------------------------------------------------------

class Leser {
  constructor(text) {
    this.text = String(text);
    this.stelle = 0;
  }

  get zeichen() {
    return this.text[this.stelle];
  }

  get amEnde() {
    this.ueberspringeLeerzeichen();
    return this.stelle >= this.text.length;
  }

  ueberspringeLeerzeichen() {
    while (this.stelle < this.text.length && /\s/.test(this.text[this.stelle])) {
      this.stelle++;
    }
  }

  // Steht hier dieses Zeichen? Dann verbrauchen und true melden.
  nimm(zeichen) {
    this.ueberspringeLeerzeichen();
    if (this.zeichen === zeichen) {
      this.stelle++;
      return true;
    }
    return false;
  }

  nimmPassend(muster) {
    this.ueberspringeLeerzeichen();
    if (this.zeichen !== undefined && muster.test(this.zeichen)) {
      const gefunden = this.zeichen;
      this.stelle++;
      return gefunden;
    }
    return null;
  }

  schau() {
    this.ueberspringeLeerzeichen();
    return this.zeichen;
  }

  // Ein zusammenhängendes Wort aus mindestens zwei Buchstaben, dem eine
  // Klammer folgt. Nur dann ist es ein Funktionsname und keine Kette
  // aus Variablen: "xy(z)" bleibt x · y · z, "wurzel(4)" wird zur
  // Wurzel.
  //
  // Die Klammerbedingung ist wichtig. Ohne sie wäre "ab" plötzlich ein
  // unbekanntes Wort statt a · b.
  nimmWort() {
    this.ueberspringeLeerzeichen();
    let ende = this.stelle;
    while (ende < this.text.length && /[a-zA-Zα-ωΑ-Ω]/.test(this.text[ende])) {
      ende++;
    }
    const laenge = ende - this.stelle;
    if (laenge < 2) {
      return null;
    }
    let nachWort = ende;
    while (nachWort < this.text.length && /\s/.test(this.text[nachWort])) {
      nachWort++;
    }
    if (this.text[nachWort] !== '(') {
      return null;
    }
    const wort = this.text.slice(this.stelle, ende);
    this.stelle = ende;
    return wort;
  }

  fehler(nachricht) {
    const wo = Math.min(this.stelle, this.text.length);
    const fehler = new Error(
      `${nachricht} (an Stelle ${wo + 1} von "${this.text}")`
    );
    fehler.stelle = wo;
    throw fehler;
  }
}

// ---------------------------------------------------------------------
// Die Grammatik
// ---------------------------------------------------------------------
//
//   gleichung := summe ( "=" summe )?
//   summe     := produkt ( ("+"|"−") produkt )*
//   produkt   := vorzeichen ( ("·"|":") vorzeichen | potenz )*   ← auch ohne Zeichen
//   vorzeichen:= ("−"|"+")* potenz
//   potenz    := grundwert ( "^" vorzeichen | hochziffern )?
//   grundwert := zahl | buchstabe | "(" summe ")" | wurzel | "|" summe "|"
//
// Das Vorzeichen sitzt zwischen Produkt und Potenz, und das ist keine
// Geschmacksfrage: −2² ist −4, nicht 4. Das Minus bindet also LOCKERER
// als das Quadrat. Stünde es weiter unten, käme (−2)² heraus — ein
// Fehler, den man im Ergebnis nicht sieht, sondern nur im Vorzeichen.

function leseSumme(leser) {
  let ergebnis = leseProdukt(leser);

  for (;;) {
    if (leser.nimm('+')) {
      ergebnis = summe(ergebnis, leseProdukt(leser));
    } else if (leser.nimmPassend(MINUSZEICHEN)) {
      // a − b ist a + (−b). Eine eigene Differenz gäbe es in term.js
      // nicht, und sie wäre auch überflüssig.
      ergebnis = summe(ergebnis, negiere(leseProdukt(leser)));
    } else {
      return ergebnis;
    }
  }
}

function leseProdukt(leser) {
  let ergebnis = leseVorzeichen(leser);

  for (;;) {
    if (leser.nimmPassend(MALZEICHEN)) {
      ergebnis = produkt(ergebnis, leseVorzeichen(leser));
    } else if (leser.nimmPassend(GETEILTZEICHEN)) {
      ergebnis = quotient(ergebnis, leseVorzeichen(leser));
    } else if (beginntGrundwert(leser.schau())) {
      // Malpunkt ohne Malpunkt: 3x, 2(x+1), 5√2.
      //
      // Absichtlich NICHT nach einer Zahl vor einer Zahl: "2 3" ist
      // fast sicher ein Tippfehler und nicht 2·3 gemeint. Lieber
      // meckern als raten.
      ergebnis = produkt(ergebnis, lesePotenz(leser));
    } else {
      return ergebnis;
    }
  }
}

function beginntGrundwert(zeichen) {
  if (zeichen === undefined) {
    return false;
  }
  // Der Betragsstrich fehlt hier mit Absicht: Er beginnt und beendet
  // denselben Ausdruck. Stünde er in dieser Liste, läse "|x|" sich als
  // "|" gefolgt von "x", gefolgt von einem weiteren Betrag — und die
  // schließende Klammer wäre verbraucht. Vor einem Betrag muss der
  // Malpunkt also stehen: 3 · |x|.
  return /[a-zA-Zα-ωΑ-Ω(]/.test(zeichen) || zeichen in WURZELGRADE;
}

// Vor einer nackten Zahl gehört das Minus zur Zahl: −2 ist zahl(−2),
// nicht (−1) · 2. Sonst käme "3 − 4" als "3 − 1 · 4" zurück und x^-2
// als x^((−1) · 2), das sich nicht mehr als x⁻² schreiben ließe.
function negiere(term) {
  if (term.art === 'zahl') {
    return zahl(negativ(term.wert));
  }
  // Steht vorn ein Zahlfaktor, wandert das Minus dorthin: −(1/5 · x)
  // wird (−1/5) · x. Sonst entstünde (−1) · 1/5 · x, und die App würde
  // etwas anderes zurückbekommen, als sie geschrieben hat.
  if (term.art === 'produkt' && term.teile[0].art === 'zahl') {
    return produkt(zahl(negativ(term.teile[0].wert)), ...term.teile.slice(1));
  }
  // Bei einem Bruch wandert es in den Zähler: −(4 : y) wird (−4) : y.
  // Auch das ist eine Frage des Wiedereinlesens, nicht des Werts —
  // aufgeschrieben steht dort "− 4 : y", und das muss dieselbe Form
  // ergeben, aus der es entstanden ist.
  if (term.art === 'quotient') {
    return quotient(negiere(term.zaehler), term.nenner);
  }
  return produkt(zahl(-1), term);
}

// Ein Minus (oder mehrere) vor einem Wert.
function leseVorzeichen(leser) {
  if (leser.nimmPassend(MINUSZEICHEN)) {
    return negiere(leseVorzeichen(leser));
  }
  if (leser.nimm('+')) {
    return leseVorzeichen(leser);
  }
  return lesePotenz(leser);
}

function lesePotenz(leser) {
  const basis = leseGrundwert(leser);

  if (leser.nimm('^')) {
    return potenz(basis, leseVorzeichen(leser));
  }

  // Hochgestellte Ziffern, wie die App sie selbst schreibt: x², x⁻².
  let hoch = '';
  while (leser.zeichen !== undefined && leser.zeichen in HOCHZIFFERN) {
    hoch += HOCHZIFFERN[leser.zeichen];
    leser.stelle++;
  }
  if (hoch !== '') {
    const wert = Number(hoch);
    if (!Number.isInteger(wert)) {
      leser.fehler(`"${hoch}" ist kein gültiger Exponent`);
    }
    return potenz(basis, zahl(wert));
  }

  return basis;
}

function leseGrundwert(leser) {
  leser.ueberspringeLeerzeichen();

  if (leser.amEnde) {
    leser.fehler('Hier fehlt noch etwas');
  }

  // Klammer
  if (leser.nimm('(')) {
    const inhalt = leseSumme(leser);
    if (!leser.nimm(')')) {
      leser.fehler('Hier fehlt die schließende Klammer');
    }
    return inhalt;
  }

  // Betrag
  if (leser.nimm('|')) {
    const inhalt = leseSumme(leser);
    if (!leser.nimm('|')) {
      leser.fehler('Hier fehlt der schließende Betragsstrich');
    }
    return betrag(inhalt);
  }

  // Wurzel — auch mit vorangestelltem Grad: ⁵√32
  const grad = leseWurzelgrad(leser);
  if (grad !== null) {
    return wurzel(leseGrundwert(leser), grad);
  }

  // Zahl
  if (/[0-9]/.test(leser.zeichen)) {
    return leseZahl(leser);
  }

  // Ausgeschriebene Funktionsnamen. Auf einer Handytastatur ist "wurzel"
  // schneller getippt als das Zeichen gesucht — und wer "wurzel(20)"
  // schreibt, meint ganz sicher nicht w · u · r · z · e · l · 20.
  const wort = leser.nimmWort();
  if (wort !== null) {
    if (WURZELWOERTER.includes(wort.toLowerCase())) {
      return wurzel(leseGrundwert(leser), 2);
    }
    if (BETRAGSWOERTER.includes(wort.toLowerCase())) {
      return betrag(leseGrundwert(leser));
    }
    leser.fehler(
      `"${wort}" kenne ich nicht. Bekannt sind wurzel(…) und betrag(…) — ` +
        'Variablen sind einzelne Buchstaben'
    );
  }

  // Buchstabe. Bewusst genau einer: Sonst wäre "xy" ein Variablenname
  // statt x · y, und "2x" ließe sich nicht von einer Variablen "x2"
  // unterscheiden.
  if (/[a-zA-Zα-ωΑ-Ω]/.test(leser.zeichen)) {
    const name = leser.zeichen;
    leser.stelle++;
    return variable(name);
  }

  leser.fehler(`Mit "${leser.zeichen}" kann ich hier nichts anfangen`);
}

function leseWurzelgrad(leser) {
  leser.ueberspringeLeerzeichen();

  // Hochgestellte Ziffern VOR einem Wurzelzeichen sind der Wurzelgrad.
  let vorne = '';
  let blick = leser.stelle;
  while (leser.text[blick] !== undefined && leser.text[blick] in HOCHZIFFERN) {
    vorne += HOCHZIFFERN[leser.text[blick]];
    blick++;
  }
  if (vorne !== '' && leser.text[blick] === '√') {
    leser.stelle = blick + 1;
    return Number(vorne);
  }

  const zeichen = leser.zeichen;
  if (zeichen !== undefined && zeichen in WURZELGRADE) {
    leser.stelle++;
    return WURZELGRADE[zeichen];
  }
  return null;
}

function leseZahl(leser) {
  let text = '';
  while (leser.zeichen !== undefined && /[0-9]/.test(leser.zeichen)) {
    text += leser.zeichen;
    leser.stelle++;
  }

  // Komma ODER Punkt als Dezimaltrennzeichen. Getippt wird in
  // Deutschland das Komma; der Punkt kommt von Tastaturen und aus dem
  // Netz. Beides zu nehmen kostet nichts.
  if ((leser.zeichen === ',' || leser.zeichen === '.') && /[0-9]/.test(leser.text[leser.stelle + 1] ?? '')) {
    leser.stelle++;
    let nachkomma = '';
    while (leser.zeichen !== undefined && /[0-9]/.test(leser.zeichen)) {
      nachkomma += leser.zeichen;
      leser.stelle++;
    }
    // Exakt umrechnen: 2,5 wird 5/2, nicht 2.5 als Kommazahl.
    const nenner = 10 ** nachkomma.length;
    return zahl(bruch(Number(text + nachkomma), nenner));
  }

  // Ein Schrägstrich DIREKT zwischen zwei Ziffern ist eine Bruchzahl,
  // keine Division: "1/9" ist eine Zahl, "1 : 9" eine Rechnung.
  //
  // Der Unterschied ist nicht Haarspalterei, sondern nötig, damit die
  // App wieder einlesen kann, was sie selbst schreibt: alsText schreibt
  // Brüche als "1/9" und Divisionen als "1 : 9". Ohne diese Regel käme
  // "1/9" als Quotient zurück und der Term sähe danach anders aus.
  //
  // Mit Leerzeichen ("1 / 9") bleibt es eine Division — dann hat der
  // Mensch offensichtlich gerechnet gemeint, und im Wert macht es
  // ohnehin keinen Unterschied.
  if (leser.zeichen === '/' && /[0-9]/.test(leser.text[leser.stelle + 1] ?? '')) {
    leser.stelle++;
    let nenner = '';
    while (leser.zeichen !== undefined && /[0-9]/.test(leser.zeichen)) {
      nenner += leser.zeichen;
      leser.stelle++;
    }
    if (Number(nenner) === 0) {
      leser.fehler('Ein Bruch mit Nenner 0 ist nicht definiert');
    }
    return zahl(bruch(Number(text), Number(nenner)));
  }

  return zahl(Number(text));
}

// ---------------------------------------------------------------------
// Was von außen benutzt wird
// ---------------------------------------------------------------------

// Einen Term lesen. Wirft mit Angabe der Stelle, wenn etwas nicht passt.
export function parseTerm(text) {
  const leser = new Leser(text);
  if (leser.amEnde) {
    throw new Error('Da steht noch nichts');
  }

  const ergebnis = leseSumme(leser);

  if (!leser.amEnde) {
    leser.fehler(`Mit "${leser.zeichen}" kann ich hier nichts anfangen`);
  }
  return ergebnis;
}

// Steht hier ein Vergleichszeichen? Dann verbrauchen und in der
// gesetzten Form zurückgeben.
function nimmVergleich(leser) {
  leser.ueberspringeLeerzeichen();
  for (const [getippt, gesetzt] of VERGLEICHE) {
    if (leser.text.startsWith(getippt, leser.stelle)) {
      leser.stelle += getippt.length;
      return gesetzt;
    }
  }
  return null;
}

// Eine Ungleichung lesen. Ohne Vergleichszeichen ist es keine.
export function parseUngleichung(text) {
  const leser = new Leser(text);
  if (leser.amEnde) {
    throw new Error('Da steht noch nichts');
  }

  const links = leseSumme(leser);
  const zeichen = nimmVergleich(leser);
  if (!zeichen) {
    leser.fehler('Hier fehlt ein Vergleichszeichen (< ≤ > ≥)');
  }
  const rechts = leseSumme(leser);

  if (!leser.amEnde) {
    const weiteres = nimmVergleich(leser);
    if (weiteres) {
      leser.fehler(
        'Zwei Vergleichszeichen in einer Zeile kann ich noch nicht — ' +
          'schreibe die beiden Bedingungen einzeln hin'
      );
    }
    leser.fehler(`Mit "${leser.zeichen}" kann ich hier nichts anfangen`);
  }
  return ungleichung(links, zeichen, rechts);
}

// Eine Gleichung lesen. Ohne "=" ist es keine.
export function parseGleichung(text) {
  const leser = new Leser(text);
  if (leser.amEnde) {
    throw new Error('Da steht noch nichts');
  }

  const links = leseSumme(leser);
  if (!leser.nimm('=')) {
    leser.fehler('Hier fehlt das Gleichheitszeichen');
  }
  const rechts = leseSumme(leser);

  if (!leser.amEnde) {
    leser.fehler(`Mit "${leser.zeichen}" kann ich hier nichts anfangen`);
  }
  return gleichung(links, rechts);
}

// Ein Gleichungssystem: zwei Gleichungen, eine pro Zeile. So schreibt
// man es im Heft, und so tippt man es auch — mit Zeilenumbruch statt
// mit einem Trennzeichen, das man erst lernen müsste.
//
// Führende Zeilennummern werden geschluckt: Wer "I  3x + 2y = 7"
// abtippt, meint die Gleichung und nicht ein I mal irgendwas.
export function parseSystem(text) {
  const zeilen = String(text)
    .split(/\r?\n/)
    .map((z) => z.replace(/^\s*(I{1,3}|\d)\s*[).:]?\s+/, '').trim())
    .filter((z) => z !== '');

  if (zeilen.length !== 2) {
    const fehler = new Error(
      zeilen.length < 2
        ? 'Ein Gleichungssystem braucht zwei Gleichungen — schreibe die zweite in die nächste Zeile'
        : `Hier stehen ${zeilen.length} Zeilen. Gelöst werden Systeme aus genau zwei Gleichungen`
    );
    throw fehler;
  }

  return system(parseGleichung(zeilen[0]), parseGleichung(zeilen[1]));
}

// Mehrere Zeilen, in jeder ein Gleichheitszeichen? Dann ist ein System
// gemeint.
//
// Absichtlich schon ab ZWEI Zeilen, nicht erst bei genau zwei: Wer drei
// Gleichungen hinschreibt, soll "das kann ich noch nicht" hören und
// nicht "Mit = kann ich hier nichts anfangen an Stelle 17". Die
// Absicht ist erkennbar, nur die Antwort fehlt.
export function istSystemEingabe(text) {
  const zeilen = String(text)
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter((z) => z !== '');
  return zeilen.length >= 2 && zeilen.every((z) => z.includes('='));
}

// Steht irgendwo ein Vergleichszeichen? Der Test muss VOR dem auf "="
// laufen: "x <= 3" enthält ein Gleichheitszeichen und wäre sonst als
// Gleichung gelesen worden — und dann an ihrem eigenen "<" gescheitert.
export function hatVergleich(text) {
  return /[<>≤≥]/.test(String(text));
}

// Für ein Eingabefeld, in dem alles drei stehen darf.
export function parseEingabe(text) {
  const roh = String(text);
  // Das System zuerst: Es enthält Gleichheitszeichen und würde sonst
  // als eine einzige (kaputte) Gleichung gelesen.
  if (istSystemEingabe(roh)) {
    return parseSystem(roh);
  }
  if (hatVergleich(roh)) {
    return parseUngleichung(roh);
  }
  return roh.includes('=') ? parseGleichung(roh) : parseTerm(roh);
}
