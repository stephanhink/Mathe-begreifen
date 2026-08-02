// Prüfungen für den Lückenfinder.
//
// Hier lässt sich etwas prüfen, was sonst schwer zu fassen ist: ob die
// App das Richtige HERAUSFINDET. Dafür wird ein Schüler simuliert, dem
// man vorher sagt, was er kann und was nicht — und dann muss der
// Lückenfinder genau das finden.
//
// Der Fall aus dem Konzept ist der wichtigste: Jemand scheitert an der
// quadratischen Gleichung, in Wahrheit fehlen ihm die Potenzgesetze.
// Am Ende darf nicht "6 von 15 richtig" stehen, sondern der Satz, der
// den Unterschied macht.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import {
  alleThemen,
  holeThema,
  alleVoraussetzungen,
  voraussetzungenVon,
  spitzen,
} from '../utils/lernpfad.js';
import {
  starte,
  naechstesThema,
  antworte,
  istFertig,
  auswertung,
  alsBericht,
} from '../utils/luecken.js';

// Ein simulierter Schüler: Er kann alles außer den Themen in `luecken`
// und allem, was darauf aufbaut.
//
// Das "und allem, was darauf aufbaut" ist der Kern der Sache: Wer die
// Potenzgesetze nicht kann, scheitert auch an der quadratischen
// Gleichung — nicht weil die schwer wäre, sondern weil ihm darunter
// etwas fehlt. Genau diese Verkettung soll der Lückenfinder auflösen.
function schueler(luecken) {
  return (thema) => {
    if (luecken.includes(thema)) {
      return false;
    }
    return !alleVoraussetzungen(thema).some((v) => luecken.includes(v));
  };
}

// Eine ganze Sitzung durchspielen.
function sitzung(kann, optionen = {}) {
  let zustand = starte(optionen);
  const gefragt = [];

  while (!istFertig(zustand)) {
    const thema = naechstesThema(zustand);
    gefragt.push(thema);
    zustand = antworte(zustand, thema, kann(thema));
  }
  return { zustand, gefragt };
}

// ---------------------------------------------------------------------

pruefung('Der Ablauf', () => {
  const start = starte();
  zahlIst('am Anfang wurde nichts gefragt', start.verlauf.length, 0);
  wahr('und es gibt ein erstes Thema', naechstesThema(start) !== null);
  wahr('das eine Spitze ist', spitzen().includes(naechstesThema(start)));
  wahr('der Zustand ist eingefroren', Object.isFrozen(start));

  // Der Zustand wird ersetzt, nicht verändert — davon hängt der Screen ab.
  const danach = antworte(start, naechstesThema(start), true);
  zahlIst('der alte Zustand bleibt unberührt', start.verlauf.length, 0);
  zahlIst('der neue kennt eine Antwort', danach.verlauf.length, 1);

  wirft('ein unbekanntes Thema wird abgelehnt', () => antworte(start, 'gibtEsNicht', true));
});

pruefung('Wer alles kann, ist schnell fertig', () => {
  const { zustand, gefragt } = sitzung(() => true);
  const a = auswertung(zustand);

  zahlIst('keine Lücke', a.luecken.length, 0);
  wahr('und nicht alle Themen mussten gefragt werden', gefragt.length < alleThemen().length, `${gefragt.length} Fragen`);
  wahr('der Bericht sagt das auch', alsBericht(zustand).join(' ').includes('Keine Lücke gefunden'));

  // Was nicht gefragt wurde, wird auch nicht als "sicher" ausgegeben.
  // Eine App, die ungefragt behauptet "Brüche kannst du", verspielt
  // genau das Vertrauen, für das sie gebaut ist.
  for (const id of a.sicher) {
    wahr(`${id}: stand wirklich zur Prüfung`, gefragt.includes(id));
  }
  wahr('und der Rest steht getrennt als "nicht gefragt"', a.nichtGefragt.length > 0);
});

pruefung('Wer nichts kann, landet unten', () => {
  const { zustand } = sitzung(() => false);
  const a = auswertung(zustand);

  wahr('es wird mindestens eine Lücke gefunden', a.luecken.length >= 1);
  // Ganz unten: Die gefundene Lücke darf keine Voraussetzung haben, die
  // ebenfalls schiefging.
  for (const luecke of a.luecken) {
    for (const v of voraussetzungenVon(luecke)) {
      wahr(`${luecke}: unter der Lücke liegt kein weiterer Fehler (${v})`, zustand.ergebnisse[v] !== false);
    }
  }
});

// ---------------------------------------------------------------------
// Der Fall aus dem Konzept
// ---------------------------------------------------------------------

pruefung('Die Lücke sitzt tiefer, als es aussieht', () => {
  // Der Schüler kann die Potenzgesetze nicht. Alles, was darauf
  // aufbaut, geht deshalb ebenfalls schief — auch die quadratische
  // Gleichung, an der er eigentlich gar nicht scheitert.
  const { zustand } = sitzung(schueler(['potenzgesetzMal']));
  const a = auswertung(zustand);

  gleichText('genau eine Lücke', String(a.luecken.length), '1');
  gleichText('und zwar die Potenzgesetze', a.luecken[0], 'potenzgesetzMal');

  const bericht = a.berichte[0];
  wahr('der Bericht nennt ein höheres Thema, das daran hing', bericht.obenGescheitert !== null);
  wahr(
    'und der Weg führt von der Lücke dorthin',
    bericht.weg[0] === 'potenzgesetzMal' && bericht.weg[bericht.weg.length - 1] === bericht.obenGescheitert
  );

  // Der Satz, um den es geht.
  wahr('der Text sagt zuerst, was NICHT das Problem ist', bericht.text.startsWith('Dein Problem ist nicht'));
  wahr('und dann, was es ist', bericht.text.includes('Dein Problem ist:'));
  wahr(
    'und nennt die Potenzgesetze beim Namen',
    bericht.text.includes(holeThema('potenzgesetzMal').titel)
  );

  // Die quadratische Gleichung wird ausdrücklich NICHT als Lücke
  // ausgegeben, obwohl sie schiefging. Genau das ist der Unterschied
  // zu "6 von 15 richtig".
  wahr('die quadratische Gleichung ging schief', zustand.ergebnisse.quadratischeGleichung === false);
  wahr('gilt aber nicht als Lücke', !a.luecken.includes('quadratischeGleichung'));
});

pruefung('Ganz unten in der Kette', () => {
  // Wer schon mit negativen Zahlen nicht zurechtkommt, scheitert an
  // fast allem. Der Lückenfinder muss trotzdem bis nach unten
  // durchlaufen und dort ankommen.
  const { zustand } = sitzung(schueler(['ganzeZahlenAddieren']));
  const a = auswertung(zustand);

  gleichText('die Lücke liegt ganz unten', a.luecken.join(','), 'ganzeZahlenAddieren');
  zahlIst('und es ist die einzige', a.luecken.length, 1);
  wahr('das Thema hat keine Voraussetzung mehr', voraussetzungenVon('ganzeZahlenAddieren').length === 0);
});

pruefung('Zwei Lücken in verschiedenen Zweigen', () => {
  // Brüche und Terme hängen nicht voneinander ab. Wer beides nicht
  // kann, hat wirklich zwei Probleme — und beide sollen genannt werden.
  const { zustand } = sitzung(schueler(['bruchKuerzen', 'termZusammenfassen']));
  const a = auswertung(zustand);

  zahlIst('zwei Lücken', a.luecken.length, 2);
  wahr('die Brüche sind dabei', a.luecken.includes('bruchKuerzen'));
  wahr('die Terme auch', a.luecken.includes('termZusammenfassen'));
  zahlIst('und der Bericht hat zwei Absätze', a.berichte.length, 2);
});

pruefung('Die Suche bleibt kurz genug', () => {
  // Fünfzehn Aufgaben sagt das Konzept. Wer eine tiefe Lücke hat,
  // braucht mehr Fragen als jemand, bei dem alles sitzt — aber es darf
  // nicht ausufern.
  for (const luecke of alleThemen()) {
    const { gefragt } = sitzung(schueler([luecke]));
    wahr(
      `Lücke bei ${luecke}: höchstens 15 Fragen`,
      gefragt.length <= 15,
      `${gefragt.length} Fragen`
    );
    wahr(`Lücke bei ${luecke}: keine Frage doppelt`, new Set(gefragt).size === gefragt.length);
  }
});

pruefung('Die Obergrenze greift', () => {
  const { gefragt } = sitzung(() => false, { maxFragen: 5 });
  zahlIst('nach fünf Fragen ist Schluss', gefragt.length, 5);
});

// ---------------------------------------------------------------------
// Alle Fälle durchspielen
// ---------------------------------------------------------------------

pruefung('Für jede mögliche Lücke wird sie auch gefunden', () => {
  // Der Durchlauf über den ganzen Graphen: Für jedes einzelne Thema
  // wird ein Schüler simuliert, dem genau dieses fehlt. Der
  // Lückenfinder muss es finden — und zwar es allein, nicht die Folgen.
  let fehler = null;

  for (const luecke of alleThemen()) {
    const { zustand } = sitzung(schueler([luecke]));
    const a = auswertung(zustand);

    if (!a.luecken.includes(luecke)) {
      fehler = `Lücke bei "${luecke}" wurde nicht gefunden (gefunden: ${a.luecken.join(', ') || 'keine'})`;
      break;
    }
    if (a.luecken.length !== 1) {
      fehler = `Lücke bei "${luecke}": es wurden ${a.luecken.length} gemeldet statt einer (${a.luecken.join(', ')})`;
      break;
    }
    // Kein Thema darf als "sicher" gelten, das in Wahrheit schiefging.
    const kann = schueler([luecke]);
    for (const id of a.sicher) {
      if (!kann(id)) {
        fehler = `Lücke bei "${luecke}": "${id}" gilt als sicher, obwohl es schiefging`;
        break;
      }
    }
    if (fehler) {
      break;
    }
  }

  wahr('jede einzelne Lücke wird gefunden und benannt', fehler === null, fehler ?? undefined);
});

pruefung('Zufällige Schüler', () => {
  // Bis zu drei Lücken gleichzeitig, zufällig gestreut. Verlangt wird
  // dabei nicht mehr, dass GENAU die gesetzten Lücken herauskommen —
  // liegt eine unter der anderen, ist die obere gar nicht mehr
  // erkennbar, und das ist richtig so. Verlangt wird:
  //
  //   1. Jede gemeldete Lücke ist tatsächlich ein Thema, das der
  //      Schüler nicht kann.
  //   2. Es wird mindestens eine gemeldet, wenn es eine gibt.
  //   3. Nichts wird als sicher ausgegeben, was schiefging.
  const naechste = wuerfel(startwertFuer('schueler'));
  const themen = alleThemen();
  let fehler = null;

  for (let i = 0; i < 200 && fehler === null; i++) {
    const anzahl = naechste(3) + 1;
    const luecken = [];
    for (let k = 0; k < anzahl; k++) {
      const kandidat = themen[naechste(themen.length)];
      if (!luecken.includes(kandidat)) {
        luecken.push(kandidat);
      }
    }

    const kann = schueler(luecken);
    const { zustand } = sitzung(kann);
    const a = auswertung(zustand);

    for (const gemeldet of a.luecken) {
      if (kann(gemeldet)) {
        fehler = `bei Lücken [${luecken.join(', ')}] wurde "${gemeldet}" gemeldet, obwohl der Schüler es kann`;
      }
    }
    if (!fehler && a.luecken.length === 0) {
      fehler = `bei Lücken [${luecken.join(', ')}] wurde gar nichts gefunden`;
    }
    if (!fehler) {
      for (const id of a.sicher) {
        if (!kann(id)) {
          fehler = `bei Lücken [${luecken.join(', ')}] gilt "${id}" als sicher, obwohl es schiefging`;
        }
      }
    }
  }

  wahr('kein Fehlurteil in 200 Sitzungen', fehler === null, fehler ?? undefined);
});
