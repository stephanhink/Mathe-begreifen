import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import InfoButton from './InfoButton';
import { farben } from '../utils/konstanten';

// „Wozu braucht man das?" — der Streifen unter dem Ergebnis.
//
// Kein eigener Tab. Der wäre der bequeme Weg und der falsche, weil er
// das Wozu vom Stoff trennt: Man müsste danach SUCHEN, statt darüber zu
// stolpern. Dasselbe Argument wie beim Info-Knopf — die Erklärung steht
// dort, wo der Begriff auftaucht.
//
// Zugeklappt ist er eine Zeile und drängelt nicht. Aufgeklappt zeigt er
// eine konkrete Zahl und den Satz, um den es geht — und den Info-Knopf
// für alles Weitere.

export default function Wozu({ titel, zeilen, thema, einsicht, vorbehalt }) {
  const [offen, setOffen] = useState(false);

  return (
    <View style={styles.rahmen}>
      <Pressable style={styles.kopf} onPress={() => setOffen(!offen)}>
        <Text style={styles.frage}>Wozu braucht man das?</Text>
        <Text style={styles.pfeil}>{offen ? '▾' : '▸'}</Text>
      </Pressable>

      {offen ? (
        <View style={styles.inhalt}>
          <View style={styles.titelReihe}>
            <Text style={styles.titel}>{titel}</Text>
            {thema ? <InfoButton thema={thema} /> : null}
          </View>

          {zeilen.map((zeile, i) => (
            <Text key={i} style={zeile.stark ? styles.zeileStark : styles.zeile}>
              {zeile.text ?? zeile}
            </Text>
          ))}

          {einsicht ? <Text style={styles.einsicht}>{einsicht}</Text> : null}

          {/* Der Vorbehalt gehört dazu, nicht ins Kleingedruckte. Zu
              verstehen, wo ein Modell aufhört zu gelten, ist mehr wert
              als die Formel selbst. */}
          {vorbehalt ? (
            <View style={styles.vorbehaltKasten}>
              <Text style={styles.vorbehaltTitel}>Was dieses Modell nicht weiß</Text>
              <Text style={styles.vorbehalt}>{vorbehalt}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rahmen: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: farben.trenner,
    borderRadius: 10,
    overflow: 'hidden',
  },
  kopf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: farben.hintergrundHell,
  },
  frage: {
    fontSize: 15,
    fontWeight: '700',
    color: farben.primaer,
  },
  pfeil: {
    fontSize: 15,
    color: farben.primaer,
  },
  inhalt: {
    padding: 14,
  },
  titelReihe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  titel: {
    fontSize: 16,
    fontWeight: '700',
    color: farben.text,
  },
  zeile: {
    fontSize: 15,
    color: farben.text,
    marginBottom: 3,
  },
  zeileStark: {
    fontSize: 17,
    fontWeight: '700',
    color: farben.primaer,
    marginTop: 4,
    marginBottom: 4,
  },
  einsicht: {
    fontSize: 14,
    color: farben.textLeise,
    lineHeight: 20,
    marginTop: 10,
  },
  vorbehaltKasten: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: farben.warnungHintergrund,
  },
  vorbehaltTitel: {
    fontSize: 13,
    fontWeight: '700',
    color: farben.warnung,
    marginBottom: 4,
  },
  vorbehalt: {
    fontSize: 13,
    color: farben.text,
    lineHeight: 19,
  },
});
