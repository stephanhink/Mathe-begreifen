import { Pressable, StyleSheet, Text, View } from 'react-native';

import { farben } from '../utils/konstanten';

// Eine schmale Leiste für die Zahlenfelder.
//
// Auf einer Zifferntastatur fehlen ausgerechnet die beiden Zeichen, die
// man in der Mathematik am häufigsten braucht: das Minus und das Komma.
// Auf Android ist "numbers-and-punctuation" außerdem nicht überall
// vollständig — wer eine negative Zahl eintippen will, steht dann da.
//
// Sie wirkt auf das zuletzt angetippte Feld. Deshalb muss jedes Feld
// beim Hineintippen melden, dass es an der Reihe ist (`merkeFeld`) —
// eine Leiste über mehreren Feldern braucht sonst für jedes eine eigene.
export default function ZahlenTasten({ aufTaste, aufLoeschen, aktiv }) {
  const tasten = ['−', ',', '⌫'];

  return (
    <View style={[styles.leiste, !aktiv && styles.blass]}>
      {tasten.map((taste) => (
        <Pressable
          key={taste}
          style={styles.taste}
          disabled={!aktiv}
          onPress={() => (taste === '⌫' ? aufLoeschen() : aufTaste(taste))}
        >
          <Text style={styles.text}>{taste}</Text>
        </Pressable>
      ))}
      <Text style={styles.hinweis}>
        {aktiv ? 'wirkt auf das angetippte Feld' : 'erst ein Feld antippen'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  leiste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  blass: {
    opacity: 0.45,
  },
  taste: {
    minWidth: 44,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: farben.trenner,
    backgroundColor: farben.hintergrundHell,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: farben.primaerDunkel,
  },
  hinweis: {
    flex: 1,
    fontSize: 12,
    color: farben.textSehrLeise,
    marginLeft: 4,
  },
});
