import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import MatheTastatur from './MatheTastatur';
import { farben } from '../utils/konstanten';

// Ein Eingabefeld für Mathematik — Feld und Tastenleiste in einem.
//
// Vorher stand dieselbe Handhabung der Schreibmarke in drei Screens,
// jedes Mal etwas anders: einmal mehrzeilig und hoch, einmal mehrzeilig
// und flach, einmal einzeilig. Wer zwischen den Tabs wechselt, muss sich
// aber nicht umgewöhnen — Eingabe ist Eingabe.
//
// Die Schreibmarke wird hier verwaltet, weil sie zur Tastenleiste
// gehört: Ein Zeichen soll dort erscheinen, wo der Strich blinkt, nicht
// am Ende. Wer mitten in einer Zeile ein Malzeichen vergessen hat, soll
// es dort nachtragen können.
export default function MatheFeld({
  wert,
  setWert,
  platzhalter,
  mehrzeilig = false,
  bearbeitbar = true,
  tasten = true,
  hoehe,
}) {
  const [auswahl, setAuswahl] = useState({ start: 0, end: 0 });

  function einfuegen(zeichen) {
    const neu = wert.slice(0, auswahl.start) + zeichen + wert.slice(auswahl.end);
    const stelle = auswahl.start + zeichen.length;
    setWert(neu);
    setAuswahl({ start: stelle, end: stelle });
  }

  function loeschen() {
    if (auswahl.start !== auswahl.end) {
      setWert(wert.slice(0, auswahl.start) + wert.slice(auswahl.end));
      setAuswahl({ start: auswahl.start, end: auswahl.start });
      return;
    }
    if (auswahl.start === 0) {
      return;
    }
    setWert(wert.slice(0, auswahl.start - 1) + wert.slice(auswahl.start));
    setAuswahl({ start: auswahl.start - 1, end: auswahl.start - 1 });
  }

  return (
    <View>
      <TextInput
        style={[
          styles.feld,
          mehrzeilig && styles.mehrzeilig,
          hoehe ? { minHeight: hoehe } : null,
          !bearbeitbar && styles.gesperrt,
        ]}
        value={wert}
        onChangeText={setWert}
        selection={auswahl}
        onSelectionChange={(e) => setAuswahl(e.nativeEvent.selection)}
        placeholder={platzhalter}
        placeholderTextColor={farben.textSehrLeise}
        autoCapitalize="none"
        autoCorrect={false}
        editable={bearbeitbar}
        multiline={mehrzeilig}
        // Bewusst KEIN keyboardType: Die gewöhnliche Tastatur des
        // Geräts hat Ziffern und Buchstaben, und beides wird gebraucht
        // — "2x" besteht aus beidem. Eine reine Zifferntastatur wäre
        // hier die falsche Hilfe.
      />
      {tasten && bearbeitbar ? (
        <MatheTastatur aufTaste={einfuegen} aufLoeschen={loeschen} />
      ) : null}
    </View>
  );
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
    minHeight: 48,
  },
  mehrzeilig: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  gesperrt: {
    backgroundColor: farben.hintergrundHell,
    color: farben.textLeise,
  },
});
