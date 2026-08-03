import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import FeldLabel from '../components/FeldLabel';
import InfoButton from '../components/InfoButton';
import MatheTastatur from '../components/MatheTastatur';
import Funktionsgraph from '../components/Funktionsgraph';
import { farben } from '../utils/konstanten';
import { parseTerm } from '../utils/parser';
import { auswerteExakt } from '../utils/term';
import { bruch } from '../utils/bruch';
import { funktionsvariable, passenderBereich, xBereichUm } from '../utils/graph';
import { beschreibe, nullstellen, scheitelpunkt, yAchsenabschnitt, wertetabelle } from '../utils/funktion';

// Der Funktionen-Bildschirm: eintippen, sehen, verstehen.
//
// Der Screen rechnet nichts. Was die Funktion ausmacht, steht in
// utils/funktion.js; wo die Kurve verläuft, in utils/graph.js. Hier
// werden nur Eingabe, Bild und Text zusammengesetzt.

const BEISPIELE = [
  { text: '2x + 3', was: 'Gerade' },
  { text: '-0,5x + 4', was: 'fallende Gerade' },
  { text: 'x^2', was: 'Normalparabel' },
  { text: 'x^2 - 6x + 8', was: 'Parabel mit zwei Nullstellen' },
  { text: '-x^2 + 4', was: 'nach unten geöffnet' },
  { text: '(x-2)^2 + 1', was: 'verschoben' },
  { text: 'x^2 + 1', was: 'ohne Nullstelle' },
  { text: '1/x', was: 'Definitionslücke' },
  { text: '√x', was: 'nur für x ≥ 0' },
];

// Das Beispielmaterial aus dem Konzept: Die Physik bekommt keinen
// eigenen Bereich, sondern sitzt dort, wo das Werkzeug erklärt wird.
const PHYSIK = {
  text: '20t',
  frage: 'Weg-Zeit-Diagramm: s = 20t',
  erklaerung:
    'Ein Auto fährt mit gleichbleibender Geschwindigkeit. Die Steigung des Graphen IST die ' +
    'Geschwindigkeit — hier 20 Meter pro Sekunde. Wird die Gerade steiler, fährt es schneller.',
};

function untersuche(eingabe) {
  const text = eingabe.trim();
  if (text === '') {
    return { leer: true };
  }

  let term;
  try {
    term = parseTerm(text);
  } catch (fehler) {
    return { fehler: fehler.message };
  }

  try {
    const name = funktionsvariable(term);
    const punkte = besonderePunkte(term, name);

    // Erst der x-Bereich nach den besonderen Stellen, dann der y-Bereich
    // darin. Andersherum sähe man bei einer Parabel nur den Rand.
    const xBereich = xBereichUm([0, ...punkte.map((p) => p.x)]);
    const fenster = { ...xBereich, ...passenderBereich(term, name, xBereich) };

    return {
      term,
      name,
      fenster,
      beschreibung: beschreibe(term, name),
      punkte,
      tabelle: wertetabelle(term, name, { von: -3, bis: 3, schritt: 1 }),
    };
  } catch (fehler) {
    return { fehler: fehler.message };
  }
}

// Nullstellen, Scheitel und der Schnittpunkt mit der y-Achse — die
// Punkte, die man im Heft einzeichnet.
function besonderePunkte(term, name) {
  const punkte = [];

  const n = nullstellen(term, name);
  for (const stelle of n.stellen) {
    try {
      punkte.push({ x: Number(auswerteExakt(stelle).z) / Number(auswerteExakt(stelle).n), y: 0 });
    } catch {
      /* irrational — dann eben ohne Markierung */
    }
  }

  const y0 = yAchsenabschnitt(term, name);
  if (!y0.fehlt) {
    punkte.push({ x: 0, y: y0.wert.z / y0.wert.n });
  }

  const s = scheitelpunkt(term, name);
  if (s) {
    punkte.push({ x: s.x.z / s.x.n, y: s.y.z / s.y.n });
  }

  return punkte;
}

export default function FunktionenScreen() {
  const [eingabe, setEingabe] = useState('x^2 - 6x + 8');
  const [auswahl, setAuswahl] = useState({ start: 0, end: 0 });
  const { width } = useWindowDimensions();

  const ergebnis = useMemo(() => untersuche(eingabe), [eingabe]);
  const breite = Math.min(width - 48, 420);

  function einfuegen(zeichen) {
    const neuerText = eingabe.slice(0, auswahl.start) + zeichen + eingabe.slice(auswahl.end);
    const neu = auswahl.start + zeichen.length;
    setEingabe(neuerText);
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

  return (
    <ScreenGeruest titel="Funktionen" untertitel="Eintippen, sehen, verstehen">
      <FeldLabel thema="funktion">f(x) =</FeldLabel>
      <TextInput
        style={styles.feld}
        value={eingabe}
        onChangeText={setEingabe}
        selection={auswahl}
        onSelectionChange={(e) => setAuswahl(e.nativeEvent.selection)}
        placeholder="z. B. x^2 − 6x + 8"
        placeholderTextColor={farben.textSehrLeise}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <MatheTastatur aufTaste={einfuegen} aufLoeschen={loeschen} />

      <View style={styles.beispiele}>
        {BEISPIELE.map((b) => (
          <Pressable key={b.text} style={styles.beispiel} onPress={() => setEingabe(b.text)}>
            <Text style={styles.beispielText}>{b.text}</Text>
          </Pressable>
        ))}
      </View>

      {ergebnis.leer ? null : ergebnis.fehler ? (
        <View style={styles.fehlerKasten}>
          <Text style={styles.fehlerTitel}>Das kann ich nicht zeichnen</Text>
          <Text style={styles.fehlerText}>{ergebnis.fehler}</Text>
        </View>
      ) : (
        <>
          <View style={styles.graphRahmen}>
            <Funktionsgraph
              term={ergebnis.term}
              name={ergebnis.name}
              fenster={ergebnis.fenster}
              breite={breite}
              hoehe={Math.round(breite * 0.75)}
              punkte={ergebnis.punkte}
            />
          </View>

          <Beschreibung beschreibung={ergebnis.beschreibung} />
          <Wertetabelle zeilen={ergebnis.tabelle} name={ergebnis.name} />
        </>
      )}

      <Physik aufWaehlen={() => setEingabe(PHYSIK.text)} />
    </ScreenGeruest>
  );
}

function Beschreibung({ beschreibung }) {
  return (
    <View style={styles.abschnitt}>
      <Text style={styles.abschnittTitel}>Was man daran ablesen kann</Text>
      {beschreibung.angaben.map((angabe) => (
        <View key={angabe.titel} style={styles.angabe}>
          <View style={styles.angabeKopf}>
            <Text style={styles.angabeTitel}>{angabe.titel}</Text>
            {angabe.wissen ? <InfoButton thema={angabe.wissen} /> : null}
          </View>
          <Text style={styles.angabeWert}>{angabe.wert}</Text>
          <Text style={styles.angabeErklaerung}>{angabe.erklaerung}</Text>
        </View>
      ))}
    </View>
  );
}

function Wertetabelle({ zeilen, name }) {
  return (
    <View style={styles.abschnitt}>
      <View style={styles.angabeKopf}>
        <Text style={styles.abschnittTitel}>Wertetabelle</Text>
        <InfoButton thema="wertetabelle" />
      </View>
      <View style={styles.tabelle}>
        <View style={styles.tabellenZeile}>
          <Text style={[styles.zelle, styles.zelleKopf]}>{name}</Text>
          {zeilen.map((z) => (
            <Text key={`x${z.x}`} style={styles.zelle}>
              {formatZahl(z.x)}
            </Text>
          ))}
        </View>
        <View style={styles.tabellenZeile}>
          <Text style={[styles.zelle, styles.zelleKopf]}>f({name})</Text>
          {zeilen.map((z) => (
            <Text key={`y${z.x}`} style={styles.zelle}>
              {/* Wo die Funktion nicht definiert ist, steht ein Strich —
                  keine erfundene Zahl. */}
              {z.y === null ? '—' : formatZahl(z.y)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function Physik({ aufWaehlen }) {
  return (
    <Pressable style={styles.physikKasten} onPress={aufWaehlen}>
      <Text style={styles.physikTitel}>{PHYSIK.frage}</Text>
      <Text style={styles.physikText}>{PHYSIK.erklaerung}</Text>
      <Text style={styles.physikHinweis}>Antippen, um es zu zeichnen</Text>
    </Pressable>
  );
}

function formatZahl(wert) {
  const gerundet = Math.round(wert * 1000) / 1000;
  return String(gerundet).replace('.', ',').replace('-', '−');
}

const styles = StyleSheet.create({
  feld: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: farben.text,
    backgroundColor: farben.weiss,
  },
  beispiele: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    marginBottom: 16,
  },
  beispiel: {
    borderWidth: 1,
    borderColor: farben.trenner,
    backgroundColor: farben.hintergrundHell,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  beispielText: {
    fontSize: 13,
    color: farben.primaerDunkel,
  },

  graphRahmen: {
    alignItems: 'center',
    marginBottom: 18,
  },

  abschnitt: {
    marginBottom: 20,
  },
  abschnittTitel: {
    fontSize: 14,
    fontWeight: '700',
    color: farben.textLeise,
    marginBottom: 8,
  },
  angabe: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: farben.trenner,
  },
  angabeKopf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  angabeTitel: {
    fontSize: 13,
    color: farben.textLeise,
  },
  angabeWert: {
    fontSize: 18,
    color: farben.primaerDunkel,
    fontWeight: '700',
    marginTop: 2,
  },
  angabeErklaerung: {
    fontSize: 14,
    color: farben.text,
    lineHeight: 20,
    marginTop: 3,
  },

  tabelle: {
    borderWidth: 1,
    borderColor: farben.trenner,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabellenZeile: {
    flexDirection: 'row',
  },
  zelle: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 13,
    color: farben.text,
    textAlign: 'center',
    borderWidth: 0.5,
    borderColor: farben.trenner,
  },
  zelleKopf: {
    fontWeight: '700',
    backgroundColor: farben.hintergrundHell,
    color: farben.primaerDunkel,
  },

  physikKasten: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.hintergrundHell,
    marginBottom: 10,
  },
  physikTitel: {
    fontSize: 15,
    fontWeight: '700',
    color: farben.primaerDunkel,
  },
  physikText: {
    fontSize: 14,
    color: farben.text,
    lineHeight: 20,
    marginTop: 6,
  },
  physikHinweis: {
    fontSize: 12,
    color: farben.textLeise,
    marginTop: 8,
  },

  fehlerKasten: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.falschHintergrund,
    marginBottom: 18,
  },
  fehlerTitel: {
    fontSize: 16,
    fontWeight: '700',
    color: farben.falsch,
  },
  fehlerText: {
    fontSize: 14,
    color: farben.text,
    marginTop: 6,
    lineHeight: 20,
  },
});
