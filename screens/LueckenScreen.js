import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import InfoButton from '../components/InfoButton';
import MatheTastatur from '../components/MatheTastatur';
import { farben } from '../utils/konstanten';
import { holeThema } from '../utils/lernpfad';
import { erzeugeAufgabe, pruefeAntwort } from '../utils/aufgaben';
import { pruefeRechenweg, alsText as rechenwegAlsText } from '../utils/rechenweg';
import {
  starte,
  naechstesThema,
  antworte,
  istFertig,
  auswertung,
  alsBericht,
} from '../utils/luecken';
import {
  leererStand,
  verbuche,
  sichereThemen,
  faelligeThemen,
  uebersicht,
  heute,
  alleVergessen,
} from '../utils/fortschritt';
import { ladeFortschritt, sichereFortschritt } from '../utils/speicher';

// Der Lückenfinder.
//
// Der Screen hält nur den Zustand und stellt dar. Was gefragt wird,
// entscheidet utils/luecken.js; die Aufgabe kommt aus utils/aufgaben.js;
// ob die Antwort stimmt, sagt pruefeAntwort. Deshalb steht hier keine
// einzige Zeile Mathematik.

export default function LueckenScreen() {
  const [lauf, setLauf] = useState(null);
  // Der gespeicherte Lernstand. `null` heißt: noch nicht geladen — erst
  // danach darf eine Sitzung starten, sonst würde sie das Vorwissen
  // nicht kennen.
  const [stand, setStand] = useState(null);

  useEffect(() => {
    let abgebrochen = false;
    ladeFortschritt().then((geladen) => {
      if (!abgebrochen) {
        setStand(geladen);
      }
    });
    return () => {
      abgebrochen = true;
    };
  }, []);

  // Eine Antwort wandert in den Stand und wird gesichert. Schlägt das
  // Sichern fehl, läuft die Sitzung trotzdem weiter — der Lauf ist
  // wichtiger als sein Andenken.
  function verbucheAntwort(themaId, richtig) {
    setStand((alt) => {
      const neu = verbuche(alt ?? leererStand(), themaId, richtig);
      sichereFortschritt(neu);
      return neu;
    });
  }

  function vergessen() {
    const leer = alleVergessen();
    setStand(leer);
    sichereFortschritt(leer);
    setLauf(null);
  }

  if (stand === null) {
    return (
      <ScreenGeruest titel="Lückenfinder" untertitel="einen Moment">
        <Text style={styles.absatz}>Lernstand wird geladen …</Text>
      </ScreenGeruest>
    );
  }

  if (lauf === null) {
    return (
      <Start stand={stand} aufStart={() => setLauf(neuerLauf(stand))} vergessen={vergessen} />
    );
  }
  if (istFertig(lauf.zustand)) {
    return (
      <Ergebnis
        zustand={lauf.zustand}
        stand={stand}
        nochmal={() => setLauf(neuerLauf(stand))}
      />
    );
  }
  return (
    <Frage
      lauf={lauf}
      setLauf={setLauf}
      verbucheAntwort={verbucheAntwort}
      abbrechen={() => setLauf(null)}
    />
  );
}

// Eine neue Sitzung — mit dem, was schon bekannt ist. Was sitzt, wird
// übersprungen; was fällig ist, kommt zuerst dran.
function neuerLauf(stand) {
  const tag = heute();
  const zustand = starte({
    bereitsSicher: sichereThemen(stand, tag),
    faellig: faelligeThemen(stand, tag),
  });
  const naechstes = naechstesThema(zustand);
  return { zustand, aufgabe: naechstes ? erzeugeAufgabe(naechstes) : null };
}

// --------------------------------------------------------------------

function Start({ stand, aufStart, vergessen }) {
  const u = uebersicht(stand, heute());

  return (
    <ScreenGeruest titel="Lückenfinder" untertitel="Finden, woran es wirklich hakt">
      <Lernstand uebersicht={u} vergessen={vergessen} />
      <View style={styles.kasten}>
        <Text style={styles.absatz}>
          Mathematik ist eine Kette. Wer bei der pq-Formel scheitert, hat oft gar kein Problem
          mit der pq-Formel — sondern mit den Potenzgesetzen, drei Jahre weiter unten.
        </Text>
        <Text style={styles.absatz}>
          Der Lückenfinder stellt bis zu 15 Aufgaben quer durch den Stoff. Geht eine schief,
          fragt er eine Ebene tiefer nach, statt einfach weiterzugehen — so lange, bis er
          festen Boden findet.
        </Text>
        <Text style={styles.absatz}>
          Am Ende steht deshalb nicht „9 von 15 richtig", sondern der Satz, um den es geht:
          wo es wirklich anfängt.
        </Text>
      </View>

      <Pressable style={styles.knopf} onPress={aufStart}>
        <Text style={styles.knopfText}>Losgehen</Text>
      </Pressable>

      <Text style={styles.kleingedrucktes}>
        Falsche Antworten sind hier nützlich, nicht peinlich — sie sind das Einzige, woran
        sich eine Lücke erkennen lässt.
      </Text>
    </ScreenGeruest>
  );
}

// Was aus früheren Sitzungen bekannt ist.
//
// Der Lernstand bleibt auf dem Gerät — kein Konto, keine Anmeldung,
// nichts verlässt das Handy. Deshalb steht hier auch der Knopf zum
// Löschen: Wer seinen Stand nicht loswerden kann, ist ihm ausgeliefert.
//
// Der Kasten steht IMMER da, auch wenn noch nichts geübt wurde. Vorher
// erschien er erst nach der ersten verbuchten Antwort — mit dem
// Ergebnis, dass jemand, der nachsehen wollte, ob überhaupt etwas
// gespeichert wird, eine leere Seite fand. Ein Schalter, den man nur
// findet, wenn man ihn nicht mehr sucht, ist keiner.
function Lernstand({ uebersicht: u, vergessen }) {
  const nochNichts = u.geuebt === 0;

  return (
    <View style={styles.standKasten}>
      <Text style={styles.standTitel}>Dein Stand</Text>

      {nochNichts ? (
        <Text style={styles.standZeile}>
          Noch nichts geübt. Sobald du die erste Aufgabe beantwortet hast, steht hier, was
          sitzt und was mal wieder dran wäre.
        </Text>
      ) : (
        <>
          <Text style={styles.standZeile}>
            {u.sicher.length} von {u.geuebt} geübten Themen sitzen gerade.
            {u.faellig.length > 0 ? `  ${u.faellig.length} wären mal wieder dran.` : ''}
          </Text>
          <Text style={styles.standZeile}>
            {u.richtig} von {u.versuche} Aufgaben richtig · zuletzt geübt am{' '}
            {alsDatum(u.zuletzt)}
          </Text>
        </>
      )}

      <Text style={styles.standKlein}>
        Alles bleibt auf diesem Gerät. Kein Konto, keine Anmeldung.
      </Text>

      {nochNichts ? null : (
        <Pressable onPress={vergessen} style={styles.vergessenKnopf}>
          <Text style={styles.vergessenText}>Lernstand löschen</Text>
        </Pressable>
      )}
    </View>
  );
}

function alsDatum(iso) {
  if (!iso) {
    return '—';
  }
  const [jahr, monat, tag] = iso.split('-');
  return `${Number(tag)}.${Number(monat)}.${jahr}`;
}

// --------------------------------------------------------------------

function Frage({ lauf, setLauf, verbucheAntwort, abbrechen }) {
  const [eingabe, setEingabe] = useState('');
  const [auswahl, setAuswahl] = useState({ start: 0, end: 0 });
  const [geprueft, setGeprueft] = useState(null);

  const { zustand, aufgabe } = lauf;
  const nummer = zustand.verlauf.length + 1;

  // Ein Zeichen an der Schreibmarke einfügen, nicht am Ende. Wer mitten
  // in einer Zeile ein Malzeichen vergessen hat, soll es dort einsetzen
  // können, wo es hingehört.
  function einfuegen(zeichen) {
    const vorne = eingabe.slice(0, auswahl.start);
    const hinten = eingabe.slice(auswahl.end);
    setEingabe(vorne + zeichen + hinten);
    const neu = auswahl.start + zeichen.length;
    setAuswahl({ start: neu, end: neu });
  }

  function loeschen() {
    if (auswahl.start !== auswahl.end) {
      setEingabe(eingabe.slice(0, auswahl.start) + eingabe.slice(auswahl.end));
      setAuswahl({ start: auswahl.start, end: auswahl.start });
      return;
    }
    if (auswahl.start === 0) {
      return;
    }
    setEingabe(eingabe.slice(0, auswahl.start - 1) + eingabe.slice(auswahl.start));
    setAuswahl({ start: auswahl.start - 1, end: auswahl.start - 1 });
  }

  // Steht mehr als eine Zeile da, wird zuerst der Rechenweg geprüft und
  // erst danach das Ergebnis. So bekommt man bei einem Fehler in Zeile 3
  // auch Zeile 3 gesagt — und nicht bloß "falsch".
  function pruefen() {
    const zeilen = eingabe.split('\n').map((z) => z.trim()).filter(Boolean);

    if (zeilen.length === 0) {
      setGeprueft({ richtig: false, grund: 'Da steht noch nichts.' });
      return;
    }

    // Wann wird der Weg geprüft und wann nur die Antwort?
    //
    // Sobald mehr als eine Zeile dasteht — oder ein Gleichheitszeichen
    // vorkommt. Denn "√20 = √(4 · 5) = 2√5" ist ein Rechenweg, auch
    // wenn er in eine Zeile passt.
    //
    // Eine nackte Zahl ("3") ist dagegen einfach die Antwort. Sie durch
    // die Wegprüfung zu schicken hieße, bei einer Gleichungsaufgabe ein
    // fehlendes Gleichheitszeichen anzumahnen — obwohl genau das
    // gefragt war.
    const alsWeg = aufgabe.start && (zeilen.length > 1 || eingabe.includes('='));

    if (!alsWeg) {
      setGeprueft(pruefeAntwort(aufgabe, zeilen[0]));
      return;
    }

    const weg = pruefeRechenweg(zeilen, aufgabe.start);
    if (weg.ersterFehler !== null) {
      const zeile = weg.zeilen[weg.ersterFehler];
      const davor =
        weg.ersterFehler === 0
          ? 'Schon die erste Zeile stimmt nicht.'
          : `Bis Zeile ${weg.ersterFehler} stimmt alles.`;
      setGeprueft({ richtig: false, weg, grund: `${davor} ${zeile.grund}` });
      return;
    }

    // Der Weg trägt. Jetzt zählt noch, ob am Ende wirklich das Ergebnis
    // steht — geprüft wird das letzte Glied, nicht die letzte Zeile.
    // Bei "√20 = 2√5" ist die Antwort 2√5 und nicht die ganze Zeile.
    setGeprueft({ ...pruefeAntwort(aufgabe, rechenwegAlsText(weg.ergebnis)), weg });
  }

  function weiter() {
    verbucheAntwort(aufgabe.thema, geprueft.richtig);
    const neuerZustand = antworte(zustand, aufgabe.thema, geprueft.richtig);
    const naechstes = naechstesThema(neuerZustand);
    setLauf({
      zustand: neuerZustand,
      aufgabe: naechstes ? erzeugeAufgabe(naechstes) : null,
    });
    setEingabe('');
    setAuswahl({ start: 0, end: 0 });
    setGeprueft(null);
  }

  function weissNicht() {
    setGeprueft({ richtig: false, grund: 'Kein Problem — genau dafür ist das hier da.' });
  }

  return (
    <ScreenGeruest titel={`Aufgabe ${nummer}`} untertitel={aufgabe.titel}>
      {/* Der Verlauf der laufenden Sitzung — ein Haken je beantworteter
          Aufgabe. Ohne ihn weiß man mitten in der Sitzung nicht, wie
          weit man ist und wie es lief. */}
      {zustand.verlauf.length > 0 ? (
        <View style={styles.verlaufZeile}>
          {zustand.verlauf.map((v, i) => (
            <Text key={i} style={v.richtig ? styles.verlaufGut : styles.verlaufSchlecht}>
              {v.richtig ? '✓' : '✗'}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.frageKasten}>
        <Text style={styles.frage}>{aufgabe.frage}</Text>
        {aufgabe.wissen ? (
          <View style={styles.hilfeZeile}>
            <Text style={styles.hilfeLabel}>Erklärung dazu</Text>
            <InfoButton thema={aufgabe.wissen} />
          </View>
        ) : null}
      </View>

      <TextInput
        style={styles.feld}
        value={eingabe}
        onChangeText={setEingabe}
        selection={auswahl}
        onSelectionChange={(e) => setAuswahl(e.nativeEvent.selection)}
        placeholder={'Ergebnis — oder Zeile für Zeile rechnen'}
        placeholderTextColor={farben.textSehrLeise}
        autoCapitalize="none"
        autoCorrect={false}
        editable={geprueft === null}
        multiline
      />

      {geprueft === null ? (
        <>
          <MatheTastatur aufTaste={einfuegen} aufLoeschen={loeschen} />
          <Text style={styles.hinweis}>
            Du kannst gleich das Ergebnis hinschreiben — oder Schritt für Schritt rechnen.
            Dann sagt dir die App, ab welcher Stelle es nicht mehr stimmt. Beides geht:
            jeder Schritt in eine eigene Zeile, oder mit Gleichheitszeichen aneinander,
            so wie im Heft: {'\n'}√20 = √(4 · 5) = 2√5
          </Text>
          {aufgabe.hinweis ? <Text style={styles.hinweis}>{aufgabe.hinweis}</Text> : null}

          <View style={styles.knopfReihe}>
            <Pressable style={styles.knopf} onPress={pruefen}>
              <Text style={styles.knopfText}>Prüfen</Text>
            </Pressable>
            <Pressable style={styles.knopfLeise} onPress={weissNicht}>
              <Text style={styles.knopfLeiseText}>Weiß ich nicht</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View>
          {geprueft.weg ? <Wegkontrolle weg={geprueft.weg} start={aufgabe.start} /> : null}

          <View style={geprueft.richtig ? styles.richtigKasten : styles.falschKasten}>
            <Text style={geprueft.richtig ? styles.richtigText : styles.falschText}>
              {geprueft.richtig
                ? 'Richtig.'
                : geprueft.erkannt
                  ? 'Ich weiß, was passiert ist.'
                  : 'Noch nicht.'}
            </Text>
            {geprueft.grund ? <Text style={styles.begruendung}>{geprueft.grund}</Text> : null}
            {!geprueft.richtig ? (
              <Text style={styles.begruendung}>Richtig wäre: {aufgabe.loesungText}</Text>
            ) : null}

            {/* Bei einem erkannten Fehler führt der Weg weiter: Wer
                weiß, WAS er falsch gedacht hat, kann es nachlesen. */}
            {!geprueft.richtig && aufgabe.wissen ? (
              <View style={styles.diagnoseZeile}>
                <Text style={styles.diagnoseLabel}>Dazu die Erklärung</Text>
                <InfoButton thema={aufgabe.wissen} />
              </View>
            ) : null}
          </View>

          <Pressable style={styles.knopf} onPress={weiter}>
            <Text style={styles.knopfText}>Weiter</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.abbruch} onPress={abbrechen}>
        <Text style={styles.abbruchText}>Abbrechen</Text>
      </Pressable>
    </ScreenGeruest>
  );
}

// Der eigene Rechenweg, Zeile für Zeile abgehakt. Die Zeile mit dem
// Fehler wird hervorgehoben — nicht die letzte, sondern die erste, ab
// der es nicht mehr stimmt.
function Wegkontrolle({ weg, start }) {
  return (
    <View style={styles.wegKasten}>
      {start ? <Text style={styles.wegStart}>{rechenwegAlsText(start)}</Text> : null}
      {weg.zeilen.map((z) => (
        <View key={z.nummer} style={styles.wegZeileReihe}>
          <Text style={z.ok ? styles.hakenGut : styles.hakenSchlecht}>{z.ok ? '✓' : '✗'}</Text>
          <Text style={[styles.wegEigeneZeile, !z.ok && styles.wegZeileFalsch]}>{z.text}</Text>
        </View>
      ))}
    </View>
  );
}

// --------------------------------------------------------------------

function Ergebnis({ zustand, stand, nochmal }) {
  const a = auswertung(zustand);
  const zeilen = alsBericht(zustand);

  return (
    <ScreenGeruest titel="Das Ergebnis" untertitel={`${a.gefragt} Aufgaben`}>
      {a.berichte.length > 0 ? (
        a.berichte.map((b) => <Lueckenkasten key={b.luecke} bericht={b} />)
      ) : (
        <View style={styles.ergebnisKasten}>
          <Text style={styles.ergebnisTitel}>{zeilen[0]}</Text>
          <Text style={styles.absatz}>{zeilen.slice(1).join(' ')}</Text>
        </View>
      )}

      <View style={styles.kasten}>
        <Text style={styles.abschnitt}>Abgefragt und gesessen</Text>
        <Text style={styles.liste}>
          {a.sicher.length > 0
            ? a.sicher.map((id) => holeThema(id).titel).join(' · ')
            : '— nichts davon'}
        </Text>

        {/* Was nicht drankam, steht ausdrücklich als "unbekannt" da.
            Eine App, die ungefragt behauptet "Brüche kannst du",
            verspielt genau das Vertrauen, für das sie gebaut ist. */}
        {a.uebersprungen.length > 0 ? (
          <>
            <Text style={styles.abschnitt}>Übersprungen — saß schon früher</Text>
            <Text style={styles.liste}>
              {a.uebersprungen.map((id) => holeThema(id).titel).join(' · ')}
            </Text>
          </>
        ) : null}

        <Text style={styles.abschnitt}>Nicht abgefragt — darüber ist nichts bekannt</Text>
        <Text style={styles.liste}>
          {a.nichtGefragt.map((id) => holeThema(id).titel).join(' · ')}
        </Text>
      </View>

      <Pressable style={styles.knopf} onPress={nochmal}>
        <Text style={styles.knopfText}>Noch einmal</Text>
      </Pressable>
    </ScreenGeruest>
  );
}

function Lueckenkasten({ bericht }) {
  const thema = holeThema(bericht.luecke);

  return (
    <View style={styles.lueckeKasten}>
      <Text style={styles.lueckeText}>{bericht.text}</Text>

      <View style={styles.hilfeZeile}>
        <Text style={styles.lueckeTitel}>{thema.titel}</Text>
        {thema.wissen ? <InfoButton thema={thema.wissen} /> : null}
      </View>

      {bericht.weg.length > 1 ? (
        <>
          <Text style={styles.abschnitt}>Der Weg von dort nach oben</Text>
          {bericht.weg.map((id, i) => (
            <Text key={id} style={styles.wegZeile}>
              {i + 1}. {holeThema(id).titel}
            </Text>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kasten: {
    backgroundColor: farben.hintergrundHell,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
  },
  absatz: {
    fontSize: 15,
    color: farben.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  kleingedrucktes: {
    fontSize: 13,
    color: farben.textLeise,
    lineHeight: 19,
    marginTop: 16,
  },

  frageKasten: {
    marginBottom: 16,
  },
  frage: {
    fontSize: 20,
    color: farben.text,
    lineHeight: 28,
  },
  hilfeZeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  hilfeLabel: {
    fontSize: 13,
    color: farben.textLeise,
  },

  feld: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: farben.text,
    backgroundColor: farben.weiss,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  hinweis: {
    fontSize: 13,
    color: farben.textLeise,
    marginTop: 8,
    lineHeight: 19,
  },

  knopfReihe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  knopf: {
    backgroundColor: farben.primaer,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 14,
  },
  knopfText: {
    color: farben.weiss,
    fontSize: 16,
    fontWeight: '700',
  },
  knopfLeise: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  knopfLeiseText: {
    color: farben.textLeise,
    fontSize: 15,
  },
  abbruch: {
    marginTop: 22,
    alignItems: 'center',
  },
  abbruchText: {
    color: farben.textSehrLeise,
    fontSize: 14,
  },

  richtigKasten: {
    backgroundColor: farben.richtigHintergrund,
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  falschKasten: {
    backgroundColor: farben.falschHintergrund,
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  richtigText: {
    fontSize: 17,
    fontWeight: '700',
    color: farben.richtig,
  },
  falschText: {
    fontSize: 17,
    fontWeight: '700',
    color: farben.falsch,
  },
  begruendung: {
    fontSize: 15,
    color: farben.text,
    marginTop: 6,
    lineHeight: 21,
  },
  diagnoseZeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  diagnoseLabel: {
    fontSize: 13,
    color: farben.textLeise,
  },

  ergebnisKasten: {
    backgroundColor: farben.hintergrundHell,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
  },
  ergebnisTitel: {
    fontSize: 18,
    fontWeight: '700',
    color: farben.primaerDunkel,
    marginBottom: 8,
  },

  lueckeKasten: {
    backgroundColor: farben.warnungHintergrund,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
  },
  lueckeText: {
    fontSize: 16,
    color: farben.text,
    lineHeight: 24,
  },
  lueckeTitel: {
    fontSize: 17,
    fontWeight: '700',
    color: farben.warnung,
  },
  abschnitt: {
    fontSize: 13,
    fontWeight: '700',
    color: farben.textLeise,
    marginTop: 14,
    marginBottom: 4,
  },
  wegZeile: {
    fontSize: 15,
    color: farben.text,
    lineHeight: 22,
  },
  wegKasten: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: farben.trenner,
  },
  wegStart: {
    fontSize: 16,
    color: farben.textLeise,
    marginBottom: 6,
    marginLeft: 22,
  },
  wegZeileReihe: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  wegEigeneZeile: {
    flex: 1,
    fontSize: 16,
    color: farben.text,
    lineHeight: 24,
  },
  wegZeileFalsch: {
    color: farben.falsch,
    fontWeight: '700',
  },
  hakenGut: {
    fontSize: 16,
    color: farben.richtig,
    width: 14,
  },
  hakenSchlecht: {
    fontSize: 16,
    color: farben.falsch,
    width: 14,
  },
  liste: {
    fontSize: 14,
    color: farben.text,
    lineHeight: 21,
  },
  verlaufZeile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 14,
  },
  verlaufGut: {
    fontSize: 15,
    color: farben.richtig,
  },
  verlaufSchlecht: {
    fontSize: 15,
    color: farben.falsch,
  },
  standKasten: {
    borderWidth: 1,
    borderColor: farben.trenner,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  standTitel: {
    fontSize: 14,
    fontWeight: '700',
    color: farben.textLeise,
    marginBottom: 6,
  },
  standZeile: {
    fontSize: 15,
    color: farben.text,
    lineHeight: 22,
  },
  standKlein: {
    fontSize: 12,
    color: farben.textSehrLeise,
    marginTop: 8,
  },
  vergessenKnopf: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  vergessenText: {
    fontSize: 13,
    color: farben.falsch,
  },
});
