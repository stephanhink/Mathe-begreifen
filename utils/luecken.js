// Der Lückenfinder.
//
// Aus CLAUDE.md, und es ist das wichtigste Feature der App:
//
//   Zehn bis fünfzehn Aufgaben, quer durch die Stoffhierarchie
//   gestreut, adaptiv: Geht eine schief, geht die App eine Ebene tiefer
//   statt weiter. Am Ende steht nicht "6 von 15 richtig", sondern:
//
//   "Dein Problem ist nicht die Ableitung. Dein Problem sind die
//    Potenzgesetze — hier ist der Weg von dort nach oben."
//
// ---------------------------------------------------------------------
// Wie er sucht
// ---------------------------------------------------------------------
//
// Gestartet wird oben, an den Spitzen der Ketten. Eine Frage dort
// verrät am meisten: Wer sie kann, kann mit einiger Wahrscheinlichkeit
// auch das darunter.
//
//   richtig  →  Der Zweig darunter wird vorerst übersprungen. Weiter
//               mit dem nächsten Thema.
//   falsch   →  Eine Ebene tiefer: Die direkten Voraussetzungen kommen
//               als Nächstes dran, und zwar VOR allem anderen.
//
// So läuft die Suche nach unten, bis sie auf ein Thema trifft, das
// sitzt. Darüber liegt dann die Lücke.
//
// ---------------------------------------------------------------------
// Vermutung und Wissen werden auseinandergehalten
// ---------------------------------------------------------------------
//
// Aus "kann die pq-Formel" folgt nicht streng, dass jemand auch Wurzeln
// ziehen kann — er könnte Glück gehabt haben. Die Annahme ist trotzdem
// nützlich, sonst bräuchte jede Sitzung zwanzig Fragen.
//
// Deshalb: Angenommenes steuert nur, WAS ALS NÄCHSTES GEFRAGT wird.
// Im Bericht steht ausschließlich, was tatsächlich abgefragt wurde.
// Eine App, die ungefragt behauptet "Brüche kannst du", verspielt genau
// das Vertrauen, für das sie gebaut ist.

import {
  THEMEN,
  alleThemen,
  holeThema,
  voraussetzungenVon,
  alleVoraussetzungen,
  spitzen,
  wegNachOben,
} from './lernpfad.js';

const STANDARD_MAX_FRAGEN = 15;

// ---------------------------------------------------------------------
// Zustand
// ---------------------------------------------------------------------
//
// Der Zustand ist ein einfaches Objekt und wird nie verändert, sondern
// ersetzt. Das macht die Prüfungen einfach und den Screen auch: Er hält
// den Zustand in useState und ersetzt ihn bei jeder Antwort.

// `bereitsSicher` sind Themen, die in einer FRÜHEREN Sitzung abgefragt
// wurden, saßen und noch nicht wieder fällig sind (utils/fortschritt.js).
// Sie werden übersprungen — das ist der Grund, warum die zweite Sitzung
// kürzer ist als die erste.
//
// Achtung, feiner Unterschied: Diese Themen sind GEPRÜFT, nicht bloß
// angenommen. Trotzdem landen sie im selben Feld, weil beides dasselbe
// bewirkt: Sie werden nicht von sich aus gefragt. Wird beim Abstieg
// eines davon gebraucht, kommt es sehr wohl dran — dann gibt es ja einen
// Anlass, an ihm zu zweifeln.
//
// `faellig` sind Themen, deren Pause um ist. Sie kommen VOR die Spitzen,
// denn Wiedervorlage ist der eigentliche Zweck des gespeicherten Stands.
export function starte({
  maxFragen = STANDARD_MAX_FRAGEN,
  mischen = null,
  bereitsSicher = [],
  faellig = [],
} = {}) {
  const start = spitzen().filter((id) => !bereitsSicher.includes(id));
  const gemischt = mischen ? mischen([...start]) : start;

  const zuerst = faellig.filter((id) => !bereitsSicher.includes(id));
  const stapel = [...zuerst, ...gemischt.filter((id) => !zuerst.includes(id))];

  // Aus "sitzt" folgt dasselbe wie aus einer richtigen Antwort: Was
  // darunter liegt, wird vorerst mit angenommen. Ohne das brächte
  // Vorwissen fast nichts — die App überspränge zwar die Spitze, fragte
  // aber sofort eine Ebene tiefer weiter und wäre genauso lang.
  const angenommen = [...bereitsSicher];
  for (const id of bereitsSicher) {
    for (const v of alleVoraussetzungen(id)) {
      if (!angenommen.includes(v) && !faellig.includes(v)) {
        angenommen.push(v);
      }
    }
  }

  return Object.freeze({
    stapel: Object.freeze(stapel),
    ergebnisse: Object.freeze({}),
    angenommen: Object.freeze(angenommen),
    // Für den Bericht zählt nur, was WIRKLICH einmal abgefragt wurde.
    // Die mitangenommenen Voraussetzungen gehören nicht dazu — über die
    // ist nach wie vor nichts bekannt.
    uebersprungen: Object.freeze([...bereitsSicher]),
    verlauf: Object.freeze([]),
    maxFragen,
  });
}

// Welches Thema kommt als Nächstes? null heißt: fertig.
export function naechstesThema(zustand) {
  if (zustand.verlauf.length >= zustand.maxFragen) {
    return null;
  }

  // Was auf dem Stapel liegt, wurde absichtlich dorthin gelegt — beim
  // Abstieg nach einer falschen Antwort. Eine Annahme darf das nicht
  // überstimmen: Sonst bliebe ausgerechnet die Voraussetzung ungefragt,
  // wegen der wir überhaupt heruntergestiegen sind.
  const ausStapel = zustand.stapel.find((id) => !(id in zustand.ergebnisse));
  if (ausStapel) {
    return ausStapel;
  }

  // Der Stapel ist leer. Dann das schwierigste noch offene Thema —
  // oben verrät eine Frage mehr als unten. Hier zählt die Annahme sehr
  // wohl, sonst würde jede Sitzung den ganzen Graphen abfragen.
  const uebrig = alleThemen()
    .filter((id) => !(id in zustand.ergebnisse) && !zustand.angenommen.includes(id))
    .sort((a, b) => THEMEN[b].klasse - THEMEN[a].klasse);
  return uebrig[0] ?? null;
}

// Eine Antwort verbuchen. Gibt einen NEUEN Zustand zurück.
export function antworte(zustand, themaId, richtig) {
  if (!holeThema(themaId)) {
    throw new Error(`luecken: unbekanntes Thema "${themaId}"`);
  }

  const ergebnisse = { ...zustand.ergebnisse, [themaId]: richtig };
  const verlauf = [...zustand.verlauf, { thema: themaId, richtig }];
  let stapel = zustand.stapel.filter((id) => id !== themaId);
  let angenommen = [...zustand.angenommen];

  if (richtig) {
    // Was darunter liegt, wird vorerst als sitzend angenommen — außer
    // es wurde schon abgefragt. Gemessenes schlägt Vermutetes.
    for (const v of alleVoraussetzungen(themaId)) {
      if (!(v in ergebnisse) && !angenommen.includes(v)) {
        angenommen.push(v);
      }
    }
  } else {
    // Eine Ebene tiefer. Die direkten Voraussetzungen kommen zuerst
    // dran — und eine Annahme über sie ist damit hinfällig.
    const tiefer = voraussetzungenVon(themaId).filter((v) => !(v in ergebnisse));
    angenommen = angenommen.filter((id) => !tiefer.includes(id));
    stapel = [...tiefer, ...stapel.filter((id) => !tiefer.includes(id))];
  }

  return Object.freeze({
    ...zustand,
    stapel: Object.freeze(stapel),
    ergebnisse: Object.freeze(ergebnisse),
    angenommen: Object.freeze(angenommen),
    verlauf: Object.freeze(verlauf),
  });
}

export function istFertig(zustand) {
  return naechstesThema(zustand) === null;
}

// ---------------------------------------------------------------------
// Auswertung
// ---------------------------------------------------------------------

// Wie viele Stufen liegt ein Thema über dem festen Boden? Ein Thema
// ohne Voraussetzung steht auf 0; darüber zählt der LÄNGSTE Weg nach
// unten, denn eine Kette ist so tief wie ihr tiefstes Glied.
//
// Gebraucht wird das für die Rangfolge der Lücken: Die unterste ist die
// Hauptdiagnose. Der Wert hängt allein am Graphen, nicht am Schüler —
// deshalb darf er zwischengespeichert werden.
const hoehen = new Map();

function hoeheUeberBoden(id) {
  if (hoehen.has(id)) {
    return hoehen.get(id);
  }
  const voraus = voraussetzungenVon(id);
  const hoehe = voraus.length === 0 ? 0 : 1 + Math.max(...voraus.map(hoeheUeberBoden));
  hoehen.set(id, hoehe);
  return hoehe;
}

// Die Rangfolge der Lücken. Sie ist der Grund, warum aus mehreren
// Befunden trotzdem EINE Diagnose wird:
//
//   1. Die unterste Lücke zuerst. Was weiter unten steht, trägt mehr —
//      und dort anzufangen ist der einzige Weg, der nach oben führt.
//   2. Bei gleicher Höhe: die Lücke, auf die MEHR beobachtete Fehler
//      zurückgehen. Sie erklärt mehr von dem, was heute schiefging.
//   3. Danach die niedrigere Klassenstufe, zuletzt der Name — damit
//      dieselbe Sitzung immer denselben Bericht ergibt. Eine Diagnose,
//      die zweimal anders ausfällt, ist keine.
function rangfolge(a, b) {
  if (a.hoehe !== b.hoehe) {
    return a.hoehe - b.hoehe;
  }
  if (a.erklaerteFehler.length !== b.erklaerteFehler.length) {
    return b.erklaerteFehler.length - a.erklaerteFehler.length;
  }
  const klasseA = holeThema(a.luecke).klasse;
  const klasseB = holeThema(b.luecke).klasse;
  if (klasseA !== klasseB) {
    return klasseA - klasseB;
  }
  return a.luecke < b.luecke ? -1 : a.luecke > b.luecke ? 1 : 0;
}

// Eine Lücke ist ein Thema, das schiefging und unter dem fester Boden
// liegt: Alle direkten Voraussetzungen wurden abgefragt und saßen — oder
// es gibt gar keine.
//
// Das ist der Unterschied zu "6 von 15 richtig". Wer bei der pq-Formel
// scheitert UND bei den Potenzgesetzen, hat nicht zwei Probleme,
// sondern eines: die Potenzgesetze. Das andere ist die Folge.
//
// ---------------------------------------------------------------------
// Eine Hauptdiagnose, der Rest sind Nebenbefunde
// ---------------------------------------------------------------------
//
// Findet die Suche mehrere Lücken, standen sie hier zunächst
// gleichrangig nebeneinander — und der Schüler las drei Sätze "Dein
// Problem ist …". Drei Hauptsätze sind kein Befund mehr, sondern
// Rauschen; genau davon wollte diese App wegkommen.
//
// Deshalb wird sortiert: Die HAUPTDIAGNOSE ist die unterste Lücke im
// Graphen — der tiefste Punkt, auf den die beobachteten Fehler
// zurückgehen. Alles andere erscheint als Nebenbefund. Verschwiegen
// wird nichts: Was gemessen wurde, steht weiterhin da, nur eben nach
// Gewicht geordnet.
export function auswertung(zustand) {
  const { ergebnisse } = zustand;
  const falsch = Object.keys(ergebnisse).filter((id) => !ergebnisse[id]);
  const richtig = Object.keys(ergebnisse).filter((id) => ergebnisse[id]);

  // Fester Boden heißt: Jede direkte Voraussetzung wurde ABGEFRAGT und
  // saß. Eine ungefragte Voraussetzung zählt ausdrücklich NICHT als
  // fester Boden — nicht gefragt heißt nicht in Ordnung, es heißt
  // unbekannt.
  //
  // Diese Unterscheidung ist beim Bauen schiefgegangen und wurde von
  // der Prüfung gefunden: Der Lückenfinder meldete "binomische Formeln"
  // als Lücke, obwohl darunter ein ungefragtes Thema lag, in dem der
  // eigentliche Fehler steckte. Genau der Fehler, den diese Datei
  // vermeiden soll — nur eine Ebene höher.
  const luecken = falsch.filter((id) =>
    voraussetzungenVon(id).every((v) => ergebnisse[v] === true)
  );

  // Falsch beantwortet, aber darunter ist noch nicht alles geklärt.
  // Kommt vor, wenn die Sitzung vorzeitig endet.
  const unklar = falsch.filter((id) => !luecken.includes(id));

  // Zu jeder Lücke: das höchste abgefragte Thema, das daran hängt und
  // ebenfalls schiefging. Das ist der Satz "Dein Problem ist nicht X".
  //
  // Dazu die Fehler, die auf diese Lücke zurückgehen — sie selbst
  // eingerechnet, denn auch sie ist ein beobachteter Fehler. Diese Zahl
  // ist die Begründung dafür, WARUM ausgerechnet sie oben steht.
  const roh = luecken.map((luecke) => {
    const daraufAufbauendeFehler = falsch
      .filter((id) => id !== luecke && wegNachOben(luecke, id).length > 0)
      .sort((a, b) => THEMEN[b].klasse - THEMEN[a].klasse);

    const oben = daraufAufbauendeFehler[0] ?? null;
    return {
      luecke,
      obenGescheitert: oben,
      weg: oben ? wegNachOben(luecke, oben) : [luecke],
      hoehe: hoeheUeberBoden(luecke),
      erklaerteFehler: [luecke, ...daraufAufbauendeFehler],
    };
  });

  roh.sort(rangfolge);

  // Erst jetzt, wo die Rangfolge feststeht, bekommt jeder Befund seinen
  // Satz: Die Hauptdiagnose spricht Klartext, die Nebenbefunde stehen
  // daneben und sagen ausdrücklich, wie sie zur Hauptdiagnose stehen.
  const berichte = roh.map((b, i) => ({
    ...b,
    istHaupt: i === 0,
    text:
      i === 0
        ? hauptText(b, falsch.length)
        : nebenText(b, roh[0].luecke),
  }));

  const haupt = berichte[0] ?? null;
  const nebenbefunde = berichte.slice(1);

  // Drei Kategorien, streng getrennt — und die Trennung ist der Grund,
  // warum man dieser App glauben kann:
  //
  //   sicher        in DIESER Sitzung abgefragt und gesessen
  //   uebersprungen früher abgefragt, saß, Pause noch nicht um
  //   nichtGefragt  darüber ist nichts bekannt
  const uebersprungen = (zustand.uebersprungen ?? []).filter((id) => !(id in ergebnisse));

  return {
    luecken,
    unklar,
    // Alle Fehler dieser Sitzung — der Nenner für "3 der 5 Fehler gehen
    // darauf zurück".
    fehler: falsch,
    // `berichte` steht weiterhin da, jetzt aber sortiert: Der erste
    // Eintrag ist die Hauptdiagnose. Wer nur einen Satz zeigen will,
    // nimmt `haupt`.
    berichte,
    haupt,
    nebenbefunde,
    sicher: richtig,
    uebersprungen,
    gefragt: zustand.verlauf.length,
    nichtGefragt: alleThemen().filter(
      (id) => !(id in ergebnisse) && !uebersprungen.includes(id)
    ),
  };
}

const name = (id) => holeThema(id).titel;

function berichtstext(luecke, oben) {
  if (!oben) {
    return (
      `Hier liegt eine Lücke: ${name(luecke)}. ` +
      'Darunter sitzt alles, was abgefragt wurde — das ist der Punkt zum Anfangen.'
    );
  }

  const weg = wegNachOben(luecke, oben);
  const dazwischen = weg.slice(1, -1).map(name);

  return (
    `Dein Problem ist nicht „${name(oben)}". ` +
    `Dein Problem ist: ${name(luecke)}.` +
    (dazwischen.length > 0
      ? ` Von dort führt der Weg über ${dazwischen.join(', ')} nach oben.`
      : ' Von dort führt der Weg direkt nach oben.')
  );
}

// Die Hauptdiagnose — derselbe Satz wie bisher, dazu die Begründung in
// Zahlen: Wie viel von dem, was heute schiefging, geht auf diese eine
// Lücke zurück? Ohne sie stünde da eine Behauptung; mit ihr kann man
// nachzählen.
function hauptText(bericht, anzahlFehler) {
  const satz = berichtstext(bericht.luecke, bericht.obenGescheitert);
  const erklaert = bericht.erklaerteFehler.length;

  if (anzahlFehler < 2) {
    return satz;
  }
  if (erklaert === anzahlFehler) {
    return `${satz} Alle ${anzahlFehler} Fehler dieser Sitzung gehen darauf zurück.`;
  }
  return `${satz} ${erklaert} der ${anzahlFehler} Fehler dieser Sitzung gehen darauf zurück.`;
}

// Ein Nebenbefund. Er wird genannt, aber nicht als zweiter Hauptsatz —
// und er sagt dazu, wie er zur Hauptdiagnose steht. Denn beides kommt
// vor: ein ganz eigener Zweig, oder etwas, das über der Hauptlücke
// liegt und sich beim Aufräumen von unten vielleicht miterledigt.
function nebenText(bericht, hauptLuecke) {
  const eigenerZweig = wegNachOben(hauptLuecke, bericht.luecke).length === 0;

  return (
    `Außerdem aufgefallen: ${name(bericht.luecke)}. ` +
    (eigenerZweig
      ? `Das hängt nicht an „${name(hauptLuecke)}" — es ist ein eigener Zweig und bleibt danach zu tun.`
      : `Das liegt über „${name(hauptLuecke)}"; fang unten an, dann sieh noch einmal hierher.`)
  );
}

// Eine Zusammenfassung in Sätzen — das, was am Ende auf dem Bildschirm
// steht.
export function alsBericht(zustand) {
  const a = auswertung(zustand);
  const zeilen = [];

  const anzahlRichtig = a.sicher.length;
  zeilen.push(`${anzahlRichtig} von ${a.gefragt} Aufgaben richtig.`);

  if (a.luecken.length === 0) {
    if (a.gefragt === 0) {
      zeilen.push('Es wurde noch nichts abgefragt.');
    } else if (a.unklar.length === 0) {
      zeilen.push('Keine Lücke gefunden — alles, was drankam, saß.');
    } else {
      // Ehrlicher Zwischenstand statt einer vorgetäuschten Antwort:
      // Etwas ging schief, aber die Suche nach unten war noch nicht zu
      // Ende.
      zeilen.push(
        'Die Suche war noch nicht zu Ende. Schiefgegangen ist: ' +
          a.unklar.map((id) => holeThema(id).titel).join(', ') +
          '. Worauf das zurückgeht, ist noch offen.'
      );
    }
    return zeilen;
  }

  // Zuerst die Hauptdiagnose, dann — deutlich abgesetzt — was sonst
  // noch auffiel. Vorher standen hier mehrere gleichrangige Sätze
  // "Dein Problem ist …", und damit war keiner mehr eine Antwort.
  zeilen.push(a.haupt.text);
  for (const b of a.nebenbefunde) {
    zeilen.push(b.text);
  }
  return zeilen;
}
