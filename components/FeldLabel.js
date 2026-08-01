import { StyleSheet, Text, View } from 'react-native';

import InfoButton from './InfoButton';
import { farben } from '../utils/konstanten';

// Beschriftung über einem Eingabefeld, optional mit Info-Knopf dahinter.
//
//   <FeldLabel thema="phWert">c(H₃O⁺) in mol/L</FeldLabel>
//
// Ohne "thema" verhält es sich wie ein normales Label — praktisch für
// Felder, die keiner Erklärung bedürfen.
//
// "extra" nimmt zusätzliche Elemente auf, die rechts neben dem Label
// stehen sollen (z. B. ein Umschalter oder ein Ladekringel).
//
// Der Abstand nach unten sitzt bewusst an der Zeile und nicht am Text:
// Läge er am Text, würde "alignItems: center" den Info-Knopf gegen die
// Textbox samt Rand zentrieren und ihn dadurch zu hoch setzen.
export default function FeldLabel({ children, thema, extra }) {
  return (
    <View style={styles.zeile}>
      <Text style={styles.text}>{children}</Text>
      {thema ? <InfoButton thema={thema} /> : null}
      {extra}
    </View>
  );
}

const styles = StyleSheet.create({
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: '#444',
  },
});
