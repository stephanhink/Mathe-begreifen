import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// SafeAreaView kommt aus react-native-safe-area-context, nicht aus react-native:
// die eingebaute Variante ist auf Android wirkungslos und seit React Native 0.86
// abgekündigt. Seit Expo SDK 55 zeichnet Android verpflichtend "edge-to-edge",
// also bis unter Status- und Gestenleiste — ohne echte Insets würde die
// Tab-Leiste unten darunter rutschen.
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { farben } from './utils/konstanten';
import BaustelleScreen from './screens/BaustelleScreen';
import RechnerScreen from './screens/RechnerScreen';
import LueckenScreen from './screens/LueckenScreen';
import ZahlenScreen from './screens/ZahlenScreen';

// Jeder Tab bekommt einen Schlüssel, ein Label für die Tab-Leiste und die
// Screen-Komponente, die angezeigt wird. Ein neues Themengebiet bedeutet:
// neue Screen-Datei bauen und hier den Eintrag austauschen — mehr nicht.
//
// Die Labels sind bewusst kurz: Bei sieben Tabs nebeneinander bleibt auf
// einem Handy-Display kaum mehr als ein Wort Platz. Wird es zu eng, zieht
// der Lückenfinder als Startbildschirm vor die Tabs, dann bleiben sechs.
//
// Der Lückenfinder steht ganz links, weil er der eigentliche Einstieg ist:
// Wer nicht weiß, wo seine Lücke sitzt, kann sich auch keinen Tab
// aussuchen.
const TABS = [
  // Der eigentliche Einstieg: Wer nicht weiß, wo seine Lücke sitzt,
  // kann sich auch keinen Tab aussuchen.
  { key: 'luecken', label: 'Lücken', Screen: LueckenScreen },
  { key: 'zahlen', label: 'Zahlen', Screen: ZahlenScreen },
  {
    key: 'terme',
    label: 'Terme',
    Screen: () => (
      <BaustelleScreen
        titel="Terme"
        inhalt="Klammern, Binome, Faktorisieren, Bruchterme, Formeln umstellen."
      />
    ),
  },
  // Der erste fertige Screen. Er sitzt beim Tab "Gleichungen", kann aber
  // schon beides: Terme umformen und lineare Gleichungen lösen.
  { key: 'gleichungen', label: 'Gleich.', Screen: RechnerScreen },
  {
    key: 'funktionen',
    label: 'Funkt.',
    Screen: () => (
      <BaustelleScreen
        titel="Funktionen"
        inhalt="Linear, quadratisch, exponentiell, trigonometrisch — bis zu Ableitung und Integral."
      />
    ),
  },
  {
    key: 'geometrie',
    label: 'Geom.',
    Screen: () => (
      <BaustelleScreen
        titel="Geometrie"
        inhalt="Pythagoras, Trigonometrie, Flächen und Körper, Vektoren."
      />
    ),
  },
  {
    key: 'zufall',
    label: 'Zufall',
    Screen: () => (
      <BaustelleScreen
        titel="Zufall"
        inhalt="Laplace, Baumdiagramm, Kombinatorik, Binomialverteilung, Erwartungswert."
      />
    ),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const ActiveScreen = TABS.find((tab) => tab.key === activeTab).Screen;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <StatusBar style="auto" />
        <View style={styles.inhalt}>
          <ActiveScreen />
        </View>
        <View style={styles.tabLeiste}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab.key === activeTab }}
            >
              <Text
                style={[styles.tabText, tab.key === activeTab && styles.tabTextAktiv]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inhalt: {
    flex: 1,
  },
  tabLeiste: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 11,
    color: '#888',
  },
  tabTextAktiv: {
    color: farben.primaer,
    fontWeight: '700',
  },
});
