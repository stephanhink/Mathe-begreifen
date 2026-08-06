// Prüfungen für den Logarithmus.
//
// Die tragende steht gleich als Erstes, und sie kennt keine einzige
// Regel — genau wie der Differenzenquotient bei der Ableitung:
//
//   Sagt die App log_b(a) = x, dann muss b^x wieder a ergeben.
//
// Weil x eine Bruchzahl sein darf (log₈(4) = 2/3), wird das ohne Wurzeln
// geprüft: aus b^(p/q) = a wird b^p = a^q, und das ist reine
// Bruchrechnung. Wäre irgendwo ein Exponent verdreht, ein Vorzeichen
// falsch oder die primitive Wurzel schief bestimmt, fiele es hier auf —
// die Prüfung weiß nichts von Potenzgesetzen.
//
// Die zweite Hälfte ist genauso wichtig: Wo KEIN Bruch herauskommt, darf
// keiner behauptet werden. Eine App, die lg(2) als 0,30103 ausgibt und
// das für exakt hält, hat gerundet und es verschwiegen.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import {
  bruch,
  mal,
  hoch,
  geteilt,
  plus,
  minus,
  vergleiche,
  gleich as bruchGleich,
  alsZahl,
  alsText as bruchAlsText,
} from '../utils/bruch.js';
import {
  E,
  logarithmus,
  logarithmusExakt,
  lg,
  ln,
  exponentVon,
  primitivwurzel,
  naeherung,
  einordnung,
  produktregel,
  quotientenregel,
  potenzregel,
  basiswechsel,
  schreibweise,
  alsRechenweg,
  zahlText,
} from '../utils/logarithmus.js';

const DURCHGAENGE = 200;

// b^x = a, nachgerechnet ohne eine einzige Logarithmusregel. Für x = p/q
// heißt das b^p = a^q — beides ganzzahlige Potenzen, also exakt.
function erfuelltDefinition(basis, numerus, x) {
  try {
    return bruchGleich(hoch(basis, x.z), hoch(numerus, x.n));
  } catch (fehler) {
    // Jenseits von 2^53 lässt sich das nicht mehr nachrechnen. Das ist
    // kein Verstoß, sondern eine Grenze — und sie wird gemeldet, nicht
    // stillschweigend als "bestanden" verbucht.
    if (fehler.zuGross) {
      return null;
    }
    throw fehler;
  }
}

// ---------------------------------------------------------------------
// Feste Fälle — die fängt man mit dem Kopf
// ---------------------------------------------------------------------

pruefung('Die ganzzahligen Fälle sind exakt', () => {
  const faelle = [
    [2, 8, '3'],
    [2, 32, '5'],
    [2, 1024, '10'],
    [10, 1000, '3'],
    [10, 1, '0'],
    [3, 81, '4'],
    [5, 125, '3'],
    [7, 7, '1'],
    [2, '1/8', '−3'],
    [10, '1/100', '−2'],
  ];

  for (const [basis, numerus, soll] of faelle) {
    const e = logarithmus(basis, numerus);
    gleichText(`${e.anfang} = ${soll}`, e.ergebnisText, soll);
    wahr(`${e.anfang}: ist als exakt gekennzeichnet`, e.exakt && !e.gerundet);
    wahr(`${e.anfang}: kein Hinweis auf Rundung nötig`, e.hinweis === null);
  }
});

pruefung('Auch Bruchexponenten sind exakt', () => {
  // log₈(4) = 2/3 ist keine Näherung, sondern der genaue Wert: 8^(2/3)
  // ist wirklich 4. Wer hier rundete, verlöre die schönste Stelle des
  // Themas — dass ein Exponent auch ein Bruch sein darf.
  const faelle = [
    [8, 4, '2/3'],
    [4, 2, '1/2'],
    [9, 27, '3/2'],
    [27, 9, '2/3'],
    [4, 8, '3/2'],
    ['1/2', 8, '−3'],
    ['1/3', 9, '−2'],
  ];

  for (const [basis, numerus, soll] of faelle) {
    const e = logarithmus(basis, numerus);
    gleichText(`${e.anfang} = ${soll}`, e.ergebnisText, soll);
    wahr(`${e.anfang}: exakt`, e.exakt);
  }
});

pruefung('Die primitive Wurzel', () => {
  // Darauf steht die ganze Exaktheit: 8 ist 2³, 1/8 ist (1/2)³, und 6 ist
  // keine Potenz von etwas Kleinerem.
  const proben = [
    [bruch(8), '2', 3],
    [bruch(1, 8), '1/2', 3],
    [bruch(81), '3', 4],
    [bruch(6), '6', 1],
    [bruch(1000), '10', 3],
    [bruch(4, 9), '2/3', 2],
    [bruch(1), '1', 1],
  ];

  for (const [wert, basis, exponent] of proben) {
    const p = primitivwurzel(wert);
    gleichText(`${bruchAlsText(wert)}: Basis`, bruchAlsText(p.basis), basis);
    zahlIst(`${bruchAlsText(wert)}: Exponent`, p.exponent, exponent);
    // Und die Probe: Basis hoch Exponent muss wieder der Wert sein.
    wahr(`${bruchAlsText(wert)}: passt zusammen`, bruchGleich(hoch(p.basis, p.exponent), wert));
  }
});

// ---------------------------------------------------------------------
// Die Prüfung, die alles trägt
// ---------------------------------------------------------------------

// Der Generator baut GEZIELT die Formen, auf die der exakte Weg wartet:
// Basis und Numerus als Potenzen derselben Zahl, auch mit negativen
// Exponenten und mit Stammbrüchen als Basis. Ein Zufallstest, der den
// geprüften Code nie erreicht, gibt falsche Sicherheit (siehe CLAUDE.md).
function exaktesPaar(naechste) {
  const c = [2, 3, 5, 6, 7, 10][naechste(6)];
  const m = naechste(3) + 1; // 1 bis 3
  const k = naechste(9) - 4; // −4 bis 4
  const gestuerzt = naechste(4) === 0;

  const basis = gestuerzt ? bruch(1, c ** m) : bruch(c ** m);
  const numerus = k < 0 ? bruch(1, c ** -k) : bruch(c ** k);
  return { basis, numerus, c, m, k, gestuerzt };
}

pruefung(`Jedes exakte Ergebnis erfüllt die Definition (${DURCHGAENGE} Proben)`, () => {
  const naechste = wuerfel(startwertFuer('definition'));
  let verstoss = null;
  let geprueft = 0;

  for (let i = 0; i < DURCHGAENGE && verstoss === null; i++) {
    const { basis, numerus } = exaktesPaar(naechste);
    const e = logarithmus(basis, numerus);

    if (!e.exakt) {
      verstoss =
        `${e.anfang}: als gerundet ausgegeben, obwohl ${bruchAlsText(numerus)} ` +
        `eine Potenz von ${bruchAlsText(basis)} ist`;
      break;
    }

    const stimmt = erfuelltDefinition(basis, numerus, e.ergebnis);
    if (stimmt === false) {
      verstoss =
        `${e.anfang} = ${e.ergebnisText}, aber ` +
        `${bruchAlsText(basis)}^${e.ergebnis.z} ≠ ${bruchAlsText(numerus)}^${e.ergebnis.n}`;
      break;
    }
    if (stimmt === true) {
      geprueft++;
    }
  }

  wahr('b^x ergibt wieder a', verstoss === null, verstoss ?? undefined);
  wahr(`und zwar nachgerechnet (${geprueft} Fälle)`, geprueft >= DURCHGAENGE / 2, `${geprueft}`);
});

pruefung('Die Gegenprobe: ein falsches Ergebnis wird gefunden', () => {
  // Ohne diese Zeile wäre die Prüfung oben eine Behauptung. Ein um eins
  // danebenliegender Exponent muss auffallen — sonst prüft sie nichts.
  wahr('log₂(8) = 3 besteht die Definition', erfuelltDefinition(bruch(2), bruch(8), bruch(3)));
  wahr('log₂(8) = 4 besteht sie nicht', erfuelltDefinition(bruch(2), bruch(8), bruch(4)) === false);
  wahr('log₈(4) = 2/3 besteht sie', erfuelltDefinition(bruch(8), bruch(4), bruch(2, 3)));
  wahr(
    'log₈(4) = 3/2 besteht sie nicht — die Vertauschung',
    erfuelltDefinition(bruch(8), bruch(4), bruch(3, 2)) === false
  );
});

// ---------------------------------------------------------------------
// Die andere Hälfte: wo es keinen Bruch gibt
// ---------------------------------------------------------------------

pruefung(`Wo kein Bruch herauskommt, wird es gesagt (${DURCHGAENGE} Proben)`, () => {
  const naechste = wuerfel(startwertFuer('gerundet'));
  let verstoss = null;
  let gerundete = 0;

  for (let i = 0; i < DURCHGAENGE && verstoss === null; i++) {
    const basis = bruch([2, 3, 5, 10][naechste(4)]);
    const numerus = bruch(naechste(200) + 2);
    const e = logarithmus(basis, numerus);

    if (e.exakt) {
      // Dann MUSS es auch wirklich aufgehen — sonst hätte die App eine
      // krumme Zahl für glatt erklärt.
      if (erfuelltDefinition(basis, numerus, e.ergebnis) === false) {
        verstoss = `${e.anfang}: als exakt ${e.ergebnisText} ausgegeben, stimmt aber nicht`;
      }
      continue;
    }

    gerundete++;
    if (e.ergebnis !== null) {
      verstoss = `${e.anfang}: gerundet, liefert aber trotzdem einen exakten Wert`;
    } else if (!e.gerundet || e.hinweis === null) {
      verstoss = `${e.anfang}: gerundet, sagt es aber nicht`;
    } else if (!e.ergebnisText.startsWith('≈')) {
      verstoss = `${e.anfang}: "${e.ergebnisText}" sieht aus wie ein exakter Wert`;
    } else if (Math.abs(alsZahl(basis) ** e.naeherung - alsZahl(numerus)) > 1e-6 * alsZahl(numerus)) {
      verstoss = `${e.anfang}: die Näherung ${e.naeherung} erfüllt b^x ≈ a nicht`;
    }
  }

  wahr('jede Näherung ist als solche gekennzeichnet', verstoss === null, verstoss ?? undefined);
  wahr('und es kamen genug Näherungsfälle vor', gerundete > 100, `${gerundete}`);
});

pruefung('Die Einordnung stimmt — und sie ist exakt', () => {
  // 10⁰ = 1 und 10¹ = 10, also liegt lg(2) zwischen 0 und 1. Dieser
  // Schritt ist genau, auch wenn der Logarithmus es nicht ist — und er
  // ist die Kontrolle, mit der man einen vertippten Taschenrechner
  // erwischt.
  const naechste = wuerfel(startwertFuer('einordnung'));
  let verstoss = null;

  for (let i = 0; i < DURCHGAENGE && verstoss === null; i++) {
    const basis = bruch([2, 3, 5, 10][naechste(4)]);
    const numerus = bruch(naechste(500) + 1, naechste(9) + 1);
    const grenzen = einordnung(basis, numerus);
    if (grenzen === null) {
      continue;
    }

    const wert = naeherung(basis, numerus);
    if (vergleiche(grenzen.wertUnten, numerus) > 0 || vergleiche(grenzen.wertOben, numerus) <= 0) {
      verstoss = `${bruchAlsText(basis)}, ${bruchAlsText(numerus)}: ${bruchAlsText(grenzen.wertUnten)} … ${bruchAlsText(grenzen.wertOben)} umschließt den Numerus nicht`;
    } else if (wert < grenzen.unten - 1e-9 || wert > grenzen.oben + 1e-9) {
      verstoss = `${bruchAlsText(basis)}, ${bruchAlsText(numerus)}: ${wert} liegt nicht zwischen ${grenzen.unten} und ${grenzen.oben}`;
    }
  }

  wahr('der Wert liegt zwischen den beiden Potenzen', verstoss === null, verstoss ?? undefined);

  const zwei = einordnung(bruch(10), bruch(2));
  zahlIst('lg(2): untere Grenze', zwei.unten, 0);
  zahlIst('lg(2): obere Grenze', zwei.oben, 1);
});

// ---------------------------------------------------------------------
// Die Kennzeichen — drei Sorten Fehler, die man auseinanderhalten muss
// ---------------------------------------------------------------------

function fehlerVon(fn) {
  try {
    fn();
    return null;
  } catch (fehler) {
    return fehler;
  }
}

pruefung('log(0) und log(−4) gibt es nicht — und zwar gekennzeichnet', () => {
  for (const [name, fn] of [
    ['log₂(0)', () => logarithmus(2, 0)],
    ['log₂(−4)', () => logarithmus(2, -4)],
    ['lg(0)', () => lg(0)],
    ['ln(−1)', () => ln(-1)],
    ['Basis 0', () => logarithmus(0, 8)],
    ['Basis 1', () => logarithmus(1, 8)],
    ['Basis −2', () => logarithmus(-2, 8)],
  ]) {
    const fehler = fehlerVon(fn);
    wahr(`${name}: wird abgelehnt`, fehler !== null);
    wahr(`${name}: trägt das Kennzeichen "undefiniert"`, fehler?.undefiniert === true);
    wahr(`${name}: ist NICHT als irrational gekennzeichnet`, !fehler?.irrational);
    wahr(
      `${name}: die Meldung sagt auch, warum`,
      typeof fehler?.message === 'string' && fehler.message.length > 40,
      fehler?.message
    );
  }
});

pruefung('lg(2) ist kein Rechenfehler, sondern irrational', () => {
  // Der Unterschied, um den es geht: "das gibt es nicht" und "das ist
  // kein Bruch, aber es gibt es" sehen gleich aus und bedeuten
  // Verschiedenes. Wer sie gleich behandelt, antwortet auf eine offene
  // Frage mit einem sachlichen Nein.
  const fehler = fehlerVon(() => logarithmusExakt(10, 2));
  wahr('logarithmusExakt(10, 2) wirft', fehler !== null);
  wahr('mit dem Kennzeichen "irrational"', fehler?.irrational === true);
  wahr('und NICHT mit "undefiniert"', !fehler?.undefiniert);

  // Der exakte Weg liefert dagegen einen Bruch, keinen Fehler.
  gleichText('logarithmusExakt(2, 8)', bruchAlsText(logarithmusExakt(2, 8)), '3');
  gleichText('logarithmusExakt(8, 4)', bruchAlsText(logarithmusExakt(8, 4)), '2/3');

  // Und logarithmus() selbst wirft NICHT — es rechnet weiter und sagt
  // dazu, dass gerundet wurde. Ablehnen heißt nicht abstürzen.
  const e = logarithmus(10, 2);
  wahr('logarithmus(10, 2) liefert trotzdem ein Ergebnis', e.gerundet && e.naeherung > 0.3);
  wirft('aber log(0) wirft auch dort', () => logarithmus(10, 0));
});

pruefung('Der natürliche Logarithmus', () => {
  // Exakt ist bei Basis e nur ln(1) = 0. Alles andere ist irrational —
  // und e³ lässt sich als Bruchzahl gar nicht hinschreiben, also kommt
  // dieser Fall hier auch nicht vor. Das ist eine Grenze, und sie wird
  // gesagt statt umgangen.
  gleichText('ln(1) = 0', ln(1).ergebnisText, '0');
  wahr('ln(1) ist exakt', ln(1).exakt);
  wahr('ln(5) ist gerundet', ln(5).gerundet);
  zahlIst('ln(5) ≈ 1,6094379', ln(5).naeherung, Math.log(5), 1e-9);
  gleichText('die Schreibweise', ln(5).anfang, 'ln(5)');
  wahr('ln(5) hat keine Einordnung — e-Potenzen sind keine Bruchzahlen', !ln(5).grenzen);
});

// ---------------------------------------------------------------------
// Die Logarithmusgesetze, geprüft gegen die Definition
// ---------------------------------------------------------------------
//
// Die Gesetze werden NICHT gegeneinander geprüft — sonst könnten sich
// zwei Fehler gegenseitig decken. Geprüft wird jedes gegen den
// Logarithmus selbst, und der steht auf der Definition.

function gesetzesprobe(beschreibung, baue, sollWert) {
  const naechste = wuerfel(startwertFuer(beschreibung));
  let verstoss = null;

  for (let i = 0; i < DURCHGAENGE && verstoss === null; i++) {
    const basis = bruch([2, 3, 5, 10][naechste(4)]);
    const a = bruch(naechste(60) + 1);
    const c = bruch(naechste(20) + 1);

    let ergebnis;
    try {
      ergebnis = baue(basis, a, c);
    } catch (fehler) {
      verstoss = `Basis ${bruchAlsText(basis)}, a = ${bruchAlsText(a)}, c = ${bruchAlsText(c)} → ${fehler.message}`;
      break;
    }

    const soll = sollWert(basis, a, c);
    if (Math.abs(ergebnis.naeherung - soll) > 1e-9 * Math.max(1, Math.abs(soll))) {
      verstoss =
        `${ergebnis.anfang}: ${ergebnis.naeherung} statt ${soll} ` +
        `(Basis ${bruchAlsText(basis)}, a = ${bruchAlsText(a)}, c = ${bruchAlsText(c)})`;
      break;
    }

    // Und wo das Gesetz einen exakten Wert liefert, muss der die
    // Definition erfüllen — dieselbe Kontrolle wie oben.
    if (ergebnis.exakt) {
      const numerus = ergebnis.ganzes ?? null;
      if (numerus !== null && erfuelltDefinition(basis, numerus, ergebnis.ergebnis) === false) {
        verstoss = `${ergebnis.anfang}: exaktes Ergebnis ${ergebnis.ergebnisText} erfüllt die Definition nicht`;
      }
    }
  }

  wahr(beschreibung, verstoss === null, verstoss ? `verletzt bei ${verstoss}` : undefined);
}

pruefung(`Die Gesetze gelten (je ${DURCHGAENGE} Proben)`, () => {
  gesetzesprobe(
    'log(a · c) = log a + log c',
    (basis, a, c) => produktregel(basis, a, c),
    (basis, a, c) => naeherung(basis, a) + naeherung(basis, c)
  );
  gesetzesprobe(
    'log(a : c) = log a − log c',
    (basis, a, c) => quotientenregel(basis, a, c),
    (basis, a, c) => naeherung(basis, a) - naeherung(basis, c)
  );
  gesetzesprobe(
    'log(a³) = 3 · log a',
    (basis, a) => potenzregel(basis, a, 3),
    (basis, a) => 3 * naeherung(basis, a)
  );
  gesetzesprobe(
    'Basiswechsel: log_b(a) = lg(a) : lg(b)',
    (basis, a) => basiswechsel(basis, a, 10),
    (basis, a) => Math.log10(alsZahl(a)) / Math.log10(alsZahl(basis))
  );
});

pruefung('Die Gegenprobe: ein falsches Gesetz fällt auf', () => {
  // Der klassische Fehler ist, log(a · c) als log a · log c zu rechnen.
  // Er MUSS von der Prüfung oben gefunden werden — sonst prüfte sie
  // nichts. Nachgestellt an einem Fall, in dem beide Wege verschieden
  // sind: lg(2 · 5) ist 1, lg(2) · lg(5) ist rund 0,21.
  const richtig = naeherung(bruch(10), bruch(2)) + naeherung(bruch(10), bruch(5));
  const falsch = naeherung(bruch(10), bruch(2)) * naeherung(bruch(10), bruch(5));
  zahlIst('lg(2) + lg(5) = 1', richtig, 1, 1e-12);
  wahr('lg(2) · lg(5) ist etwas ganz anderes', Math.abs(falsch - 1) > 0.5, `${falsch}`);

  // Und beim Potenzgesetz: (log a)ⁿ statt n · log a.
  const nMal = 3 * naeherung(bruch(2), bruch(8));
  const hochN = naeherung(bruch(2), bruch(8)) ** 3;
  zahlIst('3 · log₂(8) = 9', nMal, 9, 1e-12);
  zahlIst('(log₂ 8)³ = 27 — und das ist falsch', hochN, 27, 1e-12);
});

pruefung('Exakt bleibt exakt, auch wenn die Teile es nicht sind', () => {
  // Die schönste Stelle des Themas: lg(2) und lg(5) sind beide
  // irrational, ihre Summe ist glatt 1. Käme das Ergebnis aus den
  // gerundeten Teilen, stünde hier 0,99999999. Es kommt aber aus dem
  // Ganzen — 2 · 5 = 10, und lg(10) ist genau 1.
  const p = produktregel(10, 2, 5);
  gleichText('lg(2 · 5) = 1', p.ergebnisText, '1');
  wahr('und ist als exakt gekennzeichnet', p.exakt);
  wahr('mit dem Hinweis, warum das geht', p.hinweis !== null && p.hinweis.includes('gerundet'));
  wahr('die Zwischenzeile zeigt die Näherung an', p.schritte[1].text.startsWith('≈'));

  const q = quotientenregel(10, 50, 5);
  gleichText('lg(50 : 5) = 1', q.ergebnisText, '1');

  // Umgekehrt: Sind beide Teile exakt, darf kein Ungefähr auftauchen.
  const glatt = produktregel(2, 8, 4);
  gleichText('log₂(8 · 4) = 5', glatt.ergebnisText, '5');
  wahr('ohne Rundungshinweis', glatt.hinweis === null);
  wahr('und ohne Ungefähr-Zeichen im Weg', glatt.schritte.every((s) => !s.text.includes('≈')));
});

// ---------------------------------------------------------------------
// Jeder Schritt hat einen Namen
// ---------------------------------------------------------------------

pruefung('Der Rechenweg von log₂(32), Zeile für Zeile', () => {
  // Die eiserne Regel des Projekts: hergeleitet, nicht nachgeschlagen.
  // Deshalb steht hier der ganze Weg, so wie er auf dem Bildschirm
  // erscheint — und nicht nur das Ergebnis.
  const weg = alsRechenweg(logarithmus(2, 32));
  gleichText('Zeile 1', weg[0], 'log₂(32)');
  gleichText('Zeile 2', weg[1], '         | Der Logarithmus fragt nach dem Exponenten');
  gleichText('Zeile 3', weg[2], '2^x = 32');
  gleichText('Zeile 4', weg[3], '         | 32 als Potenz von 2 schreiben: 32 = 2^5');
  gleichText('Zeile 5', weg[4], '2^x = 2^5');
  gleichText('Zeile 6', weg[5], '         | gleiche Basis heißt gleicher Exponent');
  gleichText('Zeile 7', weg[6], 'x = 5');
  gleichText('Zeile 8', weg[7], '= 5');
});

pruefung('Kein Schritt bleibt ohne Namen', () => {
  const naechste = wuerfel(startwertFuer('schritte'));
  let ohne = null;

  const wege = [];
  for (let i = 0; i < 60; i++) {
    const basis = bruch([2, 3, 5, 10][naechste(4)]);
    const numerus = bruch(naechste(200) + 1);
    wege.push(logarithmus(basis, numerus));
    wege.push(produktregel(basis, numerus, bruch(naechste(9) + 1)));
    wege.push(potenzregel(basis, numerus, naechste(3) + 2));
  }

  for (const weg of wege) {
    for (const s of weg.schritte) {
      if (typeof s.regel !== 'string' || s.regel.length < 5 || typeof s.text !== 'string' || s.text === '') {
        ohne = `${weg.anfang}: "${s.regel}" / "${s.text}"`;
        break;
      }
    }
    if (ohne) {
      break;
    }
  }

  wahr('jeder Schritt hat Regel und Zeile', ohne === null, ohne ?? undefined);
  wahr('und es waren genug Wege', wege.length === 180, `${wege.length}`);

  // Bei log₈(4) muss das Potenzgesetz ausdrücklich dastehen — es ist der
  // Schritt, an dem der Bruch im Exponenten entsteht.
  const acht = logarithmus(8, 4);
  wahr(
    'log₈(4) nennt das Potenzgesetz',
    acht.schritte.some((s) => s.regel.includes('Potenzgesetz'))
  );
  wahr(
    'und den Teilungsschritt am Ende',
    acht.schritte.some((s) => s.regel === 'beide Seiten : 3')
  );
});

pruefung('Die Schreibweise ist die des Unterrichts', () => {
  gleichText('Basis 10 heißt lg', schreibweise(bruch(10), bruch(1000)), 'lg(1000)');
  gleichText('Basis e heißt ln', schreibweise(E, bruch(5)), 'ln(5)');
  gleichText('sonst tiefgestellt', schreibweise(bruch(2), bruch(8)), 'log₂(8)');
  gleichText('auch mehrstellig', schreibweise(bruch(16), bruch(4)), 'log₁₆(4)');
  gleichText('ein Bruch als Basis kommt in Klammern', schreibweise(bruch(1, 2), bruch(8)), 'log_(1/2)(8)');
  gleichText('der Numerus darf auch ein Term sein', schreibweise(bruch(2), '8 · 4'), 'log₂(8 · 4)');

  // Das typografische Minus, wie überall in der App.
  gleichText('Minus ist ein Minus, kein Bindestrich', zahlText(bruch(-3)), '−3');
  wahr('auch im Ergebnistext', logarithmus(2, '1/8').ergebnisText === '−3');
});

// ---------------------------------------------------------------------
// Was der Lückenfinder daraus macht, steht in tests/aufgaben.mjs.
// Hier nur noch die Verbindung: exponentVon ist die Stelle, an der
// "exakt oder nicht" entschieden wird, und sie darf sich nicht irren.
// ---------------------------------------------------------------------

pruefung('exponentVon sagt nur dann Nein, wenn es wirklich keinen gibt', () => {
  // Die Gegenrichtung der tragenden Prüfung: Für alle Paare aus kleinen
  // Potenzen MUSS ein Exponent gefunden werden. Findet er ihn nicht,
  // hielte die App einen exakten Wert für irrational — und zeigte eine
  // gerundete Zahl, wo eine glatte hingehört.
  let verpasst = null;
  for (const c of [2, 3, 5, 7]) {
    for (let m = 1; m <= 4 && verpasst === null; m++) {
      for (let k = -4; k <= 4; k++) {
        const basis = bruch(c ** m);
        const numerus = k < 0 ? bruch(1, c ** -k) : bruch(c ** k);
        const x = exponentVon(basis, numerus);
        if (x === null) {
          verpasst = `log_${c ** m}(${bruchAlsText(numerus)}) = ${k}/${m} wurde nicht gefunden`;
          break;
        }
        if (!bruchGleich(x, bruch(k, m))) {
          verpasst = `log_${c ** m}(${bruchAlsText(numerus)}): ${bruchAlsText(x)} statt ${bruchAlsText(bruch(k, m))}`;
          break;
        }
      }
    }
  }
  wahr('jeder Bruch-Exponent wird gefunden', verpasst === null, verpasst ?? undefined);

  // Und andersherum: Wo es keinen gibt, wird auch keiner erfunden.
  for (const [basis, numerus] of [
    [10, 2],
    [2, 3],
    [2, 6],
    [3, 10],
    [2, 10],
    [5, 12],
  ]) {
    wahr(
      `log_${basis}(${numerus}) ist kein Bruch`,
      exponentVon(bruch(basis), bruch(numerus)) === null
    );
  }
});
