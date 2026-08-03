import { Pressable, StyleSheet, Text, View } from 'react-native';

import { farben } from '../utils/konstanten';

// Eine schmale Tastenleiste über dem Eingabefeld.
//
// Auf einer Handy-Tastatur gibt es kein √, kein ² und kein ·. Der Parser
// nimmt zwar auch die Ersatzschreibweisen (^ für Potenzen, * für Mal,
// / für Geteilt, - für Minus) — aber das weiß niemand, der die App zum
// ersten Mal öffnet. Und selbst wer es weiß, tippt lieber ein Zeichen
// als zwei.
//
// Eingefügt werden deshalb genau die Zeichen, die die App auch selbst
// schreibt. So sieht die eigene Zeile aus wie die darüber, und man kann
// einen Zwischenschritt der App abschreiben und weiterrechnen.

const REIHEN = [
  ['x', '(', ')', '^', '²', '³', '√', '='],
  ['+', '−', '·', ':', '/', ',', '⌫'],
];

export default function MatheTastatur({ aufTaste, aufLoeschen }) {
  return (
    <View style={styles.leiste}>
      {REIHEN.map((reihe, i) => (
        <View key={i} style={styles.reihe}>
          {reihe.map((taste) => (
            <Pressable
              key={taste}
              style={[styles.taste, taste === '⌫' && styles.tasteLoeschen]}
              onPress={() => (taste === '⌫' ? aufLoeschen() : aufTaste(taste))}
              accessibilityLabel={beschriftung(taste)}
            >
              <Text style={styles.tastenText}>{taste}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

// Für Vorlesehilfen: "√" allein sagt niemandem etwas.
function beschriftung(taste) {
  const namen = {
    '^': 'hoch',
    '²': 'hoch zwei',
    '³': 'hoch drei',
    '√': 'Wurzel',
    '·': 'mal',
    ':': 'geteilt durch',
    '/': 'Bruchstrich',
    '−': 'minus',
    '⌫': 'löschen',
    ',': 'Komma',
  };
  return namen[taste] ?? taste;
}

const styles = StyleSheet.create({
  leiste: {
    marginTop: 8,
    gap: 6,
  },
  reihe: {
    flexDirection: 'row',
    gap: 6,
  },
  taste: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: farben.trenner,
    backgroundColor: farben.hintergrundHell,
    alignItems: 'center',
  },
  tasteLoeschen: {
    backgroundColor: farben.weiss,
  },
  tastenText: {
    fontSize: 18,
    color: farben.primaerDunkel,
  },
});
