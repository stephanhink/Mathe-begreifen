import { StyleSheet, Text, View } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import { farben } from '../utils/konstanten';

// Platzhalter, solange ein Themengebiet noch keinen eigenen Screen hat.
//
// Er steht hier aus einem einzigen Grund: damit die Tab-Leiste von Anfang
// an vollständig ist und sich auf dem Handy anfassen lässt. Sieben Tabs
// nebeneinander sind eng — ob das auf einem echten Display trägt, sieht
// man erst, wenn man es sieht, und nicht erst nach dem siebten fertigen
// Screen.
//
// Diese Datei verschwindet, wenn der letzte echte Screen steht.
export default function BaustelleScreen({ titel, inhalt }) {
  return (
    <ScreenGeruest titel={titel} untertitel="Noch nicht gebaut">
      <View style={styles.kasten}>
        <Text style={styles.text}>Hier entsteht:</Text>
        <Text style={styles.inhalt}>{inhalt}</Text>
      </View>
    </ScreenGeruest>
  );
}

const styles = StyleSheet.create({
  kasten: {
    backgroundColor: farben.hintergrundHell,
    borderRadius: 12,
    padding: 16,
  },
  text: {
    fontSize: 14,
    color: farben.textLeise,
  },
  inhalt: {
    fontSize: 16,
    color: farben.text,
    marginTop: 6,
    lineHeight: 24,
  },
});
