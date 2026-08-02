import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { farben } from '../utils/konstanten';
import { holeThema } from '../utils/wissen';

// Kleiner runder Info-Knopf, der neben einem Feld-Label sitzt und ein
// Fenster mit der Erklärung öffnet.
//
// Verwendung:  <InfoButton thema="loesungsmenge" />
//
// Die "Mehr dazu"-Links im Fenster wechseln das Thema, ohne dass man
// schließen und neu öffnen muss. Weil man sich dabei verlaufen kann,
// merken wir uns den Weg in einem Verlauf und blenden einen
// Zurück-Pfeil ein — so bleibt der Ausgangspunkt immer erreichbar.
export default function InfoButton({ thema }) {
  const [offen, setOffen] = useState(false);
  // Der Verlauf ist ein Stapel von Themen-IDs. Das letzte Element ist
  // das, was gerade angezeigt wird.
  const [verlauf, setVerlauf] = useState([thema]);

  const aktuelleId = verlauf[verlauf.length - 1];
  const inhalt = holeThema(aktuelleId);

  // Unbekannte ID: gar nichts anzeigen statt abzustürzen.
  if (!inhalt) {
    return null;
  }

  function oeffnen() {
    setVerlauf([thema]);
    setOffen(true);
  }

  function schliessen() {
    setOffen(false);
    setVerlauf([thema]);
  }

  function zurueck() {
    setVerlauf((alt) => alt.slice(0, -1));
  }

  function wechsleZu(neueId) {
    setVerlauf((alt) => [...alt, neueId]);
  }

  return (
    <>
      <Pressable
        onPress={oeffnen}
        style={styles.knopf}
        // Die Trefferfläche vergrößern, ohne den Knopf optisch
        // aufzublasen — 18 Punkte sind mit dem Finger sonst zu klein.
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Erklärung: ${inhalt.titel}`}
      >
        <Text style={styles.knopfText}>i</Text>
      </Pressable>

      <Modal
        visible={offen}
        animationType="slide"
        transparent
        onRequestClose={schliessen}
      >
        <View style={styles.hintergrund}>
          {/* Nur die freie Fläche über dem Blatt schließt das Fenster.
              Das Blatt selbst liegt daneben statt darin — läge es
              innerhalb des Pressable, müsste es jeden Tipp abfangen,
              und das käme der ScrollView bei Wischgesten in die Quere. */}
          <Pressable style={styles.freiFlaeche} onPress={schliessen} />

          <View style={styles.blatt}>
            <View style={styles.kopf}>
              {verlauf.length > 1 ? (
                <Pressable onPress={zurueck} hitSlop={10}>
                  <Text style={styles.kopfAktion}>‹ Zurück</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable onPress={schliessen} hitSlop={10}>
                <Text style={styles.kopfAktion}>Fertig</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.inhaltFlaeche}>
              <Text style={styles.titel}>{inhalt.titel}</Text>

              {inhalt.text.map((absatz, i) => (
                <Text key={i} style={styles.absatz}>
                  {absatz}
                </Text>
              ))}

              {/* Die Formel steht abgesetzt und in Monospace: So bleiben
                  Indizes und Vorzeichen lesbar, und man findet sie beim
                  Zurückblättern sofort wieder. */}
              {inhalt.formel ? (
                <View style={styles.formelKasten}>
                  <Text style={styles.formelText}>{inhalt.formel}</Text>
                </View>
              ) : null}

              {inhalt.beispiel ? (
                <View style={styles.beispielKasten}>
                  <Text style={styles.beispielTitel}>Zum Anfassen</Text>
                  <Text style={styles.beispielText}>{inhalt.beispiel}</Text>
                </View>
              ) : null}

              {inhalt.mehr?.length ? (
                <View style={styles.mehrBereich}>
                  <Text style={styles.mehrTitel}>Mehr dazu</Text>
                  {inhalt.mehr.map((id) => {
                    const ziel = holeThema(id);
                    if (!ziel) {
                      return null;
                    }
                    return (
                      <Pressable key={id} onPress={() => wechsleZu(id)}>
                        <Text style={styles.mehrLink}>{ziel.titel} ›</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <Text style={styles.fusszeile}>
                Lernhilfe für den Chemieunterricht. Kein Ersatz für
                Sicherheitsunterweisungen — Versuche nur unter Aufsicht.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  knopf: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: farben.primaer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knopfText: {
    color: farben.weiss,
    fontSize: 12,
    fontWeight: '700',
    // Das "i" sitzt in der Schrift leicht zu tief für einen Kreis.
    lineHeight: 14,
  },
  hintergrund: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  freiFlaeche: {
    flex: 1,
  },
  blatt: {
    backgroundColor: farben.weiss,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  kopf: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  kopfAktion: {
    fontSize: 16,
    color: farben.primaer,
    fontWeight: '600',
  },
  inhaltFlaeche: {
    padding: 20,
    paddingBottom: 40,
  },
  titel: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
  absatz: {
    fontSize: 15,
    lineHeight: 23,
    color: farben.text,
    marginBottom: 14,
  },
  formelKasten: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  formelText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
  },
  beispielKasten: {
    backgroundColor: farben.hintergrundHell,
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
  },
  beispielTitel: {
    fontSize: 12,
    fontWeight: '700',
    color: farben.primaer,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  beispielText: {
    fontSize: 15,
    lineHeight: 22,
    color: farben.primaerDunkel,
  },
  mehrBereich: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  mehrTitel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  mehrLink: {
    fontSize: 16,
    color: farben.primaer,
    paddingVertical: 7,
  },
  fusszeile: {
    fontSize: 11,
    lineHeight: 16,
    color: farben.textSehrLeise,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
});
