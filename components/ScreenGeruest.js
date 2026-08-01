import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

// Gemeinsamer Rahmen für alle Screens: Überschrift, scrollbarer Inhalt
// und das Ausweichen vor der eingeblendeten Tastatur.
//
//   <ScreenGeruest titel="pH-Rechner" untertitel="Starke und schwache Säuren">
//     …Eingabefelder und Ergebnisse…
//   </ScreenGeruest>
//
// Ohne diesen Rahmen müsste jeder Screen dieselben drei Wrapper von Hand
// aufbauen — und beim fünften wäre garantiert einer davon anders.
//
// Das KeyboardAvoidingView braucht nur iOS: Android schiebt den Inhalt
// von sich aus hoch, ein zusätzliches "padding" würde dort doppelt
// wirken und den Screen stauchen.
export default function ScreenGeruest({ titel, untertitel, children }) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titel}>{titel}</Text>
        {untertitel ? (
          <Text style={styles.untertitel}>{untertitel}</Text>
        ) : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  titel: {
    fontSize: 26,
    fontWeight: '700',
  },
  untertitel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
  },
});
