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

export function starte({ maxFragen = STANDARD_MAX_FRAGEN, mischen = null } = {}) {
  const start = spitzen();
  return Object.freeze({
    stapel: mischen ? mischen([...start]) : start,
    ergebnisse: Object.freeze({}),
    angenommen: Object.freeze([]),
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

// Eine Lücke ist ein Thema, das schiefging und unter dem fester Boden
// liegt: Alle direkten Voraussetzungen wurden abgefragt und saßen — oder
// es gibt gar keine.
//
// Das ist der Unterschied zu "6 von 15 richtig". Wer bei der pq-Formel
// scheitert UND bei den Potenzgesetzen, hat nicht zwei Probleme,
// sondern eines: die Potenzgesetze. Das andere ist die Folge.
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
  const berichte = luecken.map((luecke) => {
    const daraufAufbauendeFehler = falsch
      .filter((id) => id !== luecke && wegNachOben(luecke, id).length > 0)
      .sort((a, b) => THEMEN[b].klasse - THEMEN[a].klasse);

    const oben = daraufAufbauendeFehler[0] ?? null;
    return {
      luecke,
      obenGescheitert: oben,
      weg: oben ? wegNachOben(luecke, oben) : [luecke],
      text: berichtstext(luecke, oben),
    };
  });

  return {
    luecken,
    unklar,
    berichte,
    sicher: richtig,
    gefragt: zustand.verlauf.length,
    // Ausdrücklich getrennt ausgewiesen: Darüber ist nichts bekannt.
    nichtGefragt: alleThemen().filter((id) => !(id in ergebnisse)),
  };
}

function berichtstext(luecke, oben) {
  const name = (id) => holeThema(id).titel;

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

  for (const b of a.berichte) {
    zeilen.push(b.text);
  }
  return zeilen;
}
