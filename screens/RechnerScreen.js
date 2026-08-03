import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import FeldLabel from '../components/FeldLabel';
import InfoButton from '../components/InfoButton';
import MatheFeld from '../components/MatheFeld';
import { farben } from '../utils/konstanten';
import { alsText as bruchAlsText } from '../utils/bruch';
import { alsText as termAlsText, multipliziereAus } from '../utils/term';
import { alsText as gleichungAlsText, loese, probe } from '../utils/gleichung';
import { parseEingabe } from '../utils/parser';

// Der Rechner: Man tippt einen Term oder eine Gleichung, und die App
// zeigt den Weg — nicht nur das Ergebnis.
//
// Der Screen selbst rechnet nichts. Er ruft utils/ auf und stellt dar,
// was zurückkommt. Genau deshalb ist er kurz geblieben: Die ganze
// Fachlogik steckt in parser.js, term.js und gleichung.js, und die sind
// einzeln geprüft.

const BEISPIELE = [
  '3x + 5 = 14',
  '5x - 2 = 2x + 7',
  '2(x + 3) = 4x - 2',
  'x/3 = 2',
  'x^2 = 4',
  '2x^2 + 8x + 6 = 0',
  'x^2 + 3x + 1 = 0',
  'x^2 + 1 = 0',
  '(x + 3)^2',
  '3x + 5 + 2x',
  '√50',
  '√(x^2)',
  'x + 1 = x + 2',
];

// Aus der Eingabe wird entweder ein Rechenweg oder ein Fehler. Beides
// wird hier einmal berechnet und dann nur noch angezeigt.
function rechne(eingabe) {
  const text = eingabe.trim();
  if (text === '') {
    return { leer: true };
  }

  let gelesen;
  try {
    gelesen = parseEingabe(text);
  } catch (fehler) {
    return { fehler: fehler.message };
  }

  try {
    if ('links' in gelesen) {
      const ergebnis = loese(gelesen);
      return { art: 'gleichung', eingelesen: gelesen, ergebnis };
    }
    const ergebnis = multipliziereAus(gelesen);
    return { art: 'term', eingelesen: gelesen, ergebnis };
  } catch (fehler) {
    return { fehler: fehler.message };
  }
}

export default function RechnerScreen() {
  const [eingabe, setEingabe] = useState('3x + 5 = 14');
  const ergebnis = useMemo(() => rechne(eingabe), [eingabe]);


  return (
    <ScreenGeruest titel="Rechner" untertitel="Term oder Gleichung — mit Rechenweg">
      <FeldLabel thema="term">Deine Eingabe</FeldLabel>
      <MatheFeld
        wert={eingabe}
        setWert={setEingabe}
        platzhalter="z. B. 3x + 5 = 14"
        mehrzeilig
      />

      <View style={styles.beispiele}>
        {BEISPIELE.map((b) => (
          <Pressable key={b} style={styles.beispiel} onPress={() => setEingabe(b)}>
            <Text style={styles.beispielText}>{b}</Text>
          </Pressable>
        ))}
      </View>

      <Ausgabe ergebnis={ergebnis} />

      <View style={styles.hilfeKasten}>
        <Text style={styles.hilfeTitel}>Schreibweise</Text>
        <Text style={styles.hilfe}>
          Die Leiste über den Beispielen setzt die Zeichen, die auf der Handytastatur
          fehlen. Es geht aber auch ohne: ^ für Potenzen (x^2 ist dasselbe wie x²),
          * oder gar nichts für Mal (3x, 2(x+1)), / oder : für Geteilt, - für Minus.
          Komma und Punkt gelten beide als Dezimaltrennzeichen.
        </Text>
      </View>
    </ScreenGeruest>
  );
}

function Ausgabe({ ergebnis }) {
  if (ergebnis.leer) {
    return null;
  }

  if (ergebnis.fehler) {
    return (
      <View style={styles.fehlerKasten}>
        <Text style={styles.fehlerTitel}>Das kann ich nicht lesen</Text>
        <Text style={styles.fehlerText}>{ergebnis.fehler}</Text>
      </View>
    );
  }

  return ergebnis.art === 'gleichung' ? (
    <GleichungsWeg eingelesen={ergebnis.eingelesen} ergebnis={ergebnis.ergebnis} />
  ) : (
    <TermWeg eingelesen={ergebnis.eingelesen} ergebnis={ergebnis.ergebnis} />
  );
}

// --------------------------------------------------------------------
// Ein Term
// --------------------------------------------------------------------

function TermWeg({ eingelesen, ergebnis }) {
  const nichtsZuTun = ergebnis.schritte.length === 0;

  return (
    <View style={styles.wegKasten}>
      <FeldLabel thema="termUmformen">Rechenweg</FeldLabel>

      <Text style={styles.zeile}>{termAlsText(eingelesen)}</Text>

      {ergebnis.schritte.map((s, i) => (
        <View key={i}>
          <Text style={styles.regel}>| {s.regel}</Text>
          <Text style={styles.zeile}>= {s.text}</Text>
        </View>
      ))}

      {nichtsZuTun ? (
        <Text style={styles.hinweis}>
          An diesem Term gibt es nichts zu vereinfachen — er steht schon so einfach da,
          wie es geht.
        </Text>
      ) : null}
    </View>
  );
}

// --------------------------------------------------------------------
// Eine Gleichung
// --------------------------------------------------------------------

function GleichungsWeg({ eingelesen, ergebnis }) {
  return (
    <View style={styles.wegKasten}>
      <FeldLabel thema="beideSeiten">Rechenweg</FeldLabel>

      <Text style={styles.zeile}>{gleichungAlsText(eingelesen)}</Text>

      {ergebnis.schritte.map((s, i) => (
        <View key={i}>
          <Text style={styles.regel}>| {s.operation}</Text>
          <Text style={styles.zeile}>{s.text}</Text>
        </View>
      ))}

      <Loesung eingelesen={eingelesen} ergebnis={ergebnis} />
    </View>
  );
}

function Loesung({ eingelesen, ergebnis }) {
  if (ergebnis.art === 'unklar') {
    return (
      <View style={styles.unklarKasten}>
        <View style={styles.zeileMitKnopf}>
          <Text style={styles.unklarTitel}>Das kann ich noch nicht lösen</Text>
          <InfoButton thema="gleichung" />
        </View>
        <Text style={styles.unklarText}>{ergebnis.grund}</Text>
      </View>
    );
  }

  if (ergebnis.art === 'keine' || ergebnis.art === 'alle') {
    return (
      <View style={styles.ergebnisKasten}>
        {ergebnis.pq ? <PqRechnung pq={ergebnis.pq} /> : null}
        <View style={styles.zeileMitKnopf}>
          <Text style={styles.ergebnis}>{ergebnis.art === 'keine' ? 'L = { }' : 'L = G'}</Text>
          <InfoButton thema="loesungsmenge" />
        </View>
        <Text style={styles.begruendung}>{ergebnis.grund}</Text>
      </View>
    );
  }

  const mengenText = ergebnis.loesungen.map(termAlsText).join('; ');

  return (
    <View style={styles.ergebnisKasten}>
      {ergebnis.pq ? <PqRechnung pq={ergebnis.pq} /> : null}

      <View style={styles.zeileMitKnopf}>
        <Text style={styles.ergebnis}>L = &#123; {mengenText} &#125;</Text>
        <InfoButton thema="loesungsmenge" />
      </View>
      {ergebnis.grund ? <Text style={styles.begruendung}>{ergebnis.grund}</Text> : null}

      <View style={[styles.zeileMitKnopf, styles.probeUeberschrift]}>
        <Text style={styles.probeTitel}>Probe</Text>
        <InfoButton thema="probe" />
      </View>

      {/* Die Probe rechnet gegen die URSPRÜNGLICHE Gleichung, nicht
          gegen die letzte umgeformte Zeile — sonst könnte sie einen
          Fehler im Rechenweg gar nicht finden. */}
      {ergebnis.loesungen.map((l) => (
        <ProbeZeilen key={termAlsText(l)} gleichung={eingelesen} loesung={l} />
      ))}
    </View>
  );
}

// Die pq-Formel sichtbar machen: Welche Zahlen wurden eingesetzt, und
// was steht unter der Wurzel? Genau daran entscheidet sich alles, und
// genau das übersieht man beim Auswendiglernen.
function PqRechnung({ pq }) {
  return (
    <View style={styles.pqKasten}>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.probeTitel}>pq-Formel</Text>
        <InfoButton thema="pqFormel" />
      </View>
      <Text style={styles.probeZeile}>
        p = {bruchAlsText(pq.p)},  q = {bruchAlsText(pq.q)}
      </Text>
      <Text style={styles.probeZeile}>
        unter der Wurzel: ({bruchAlsText(pq.halbesP)})² − ({bruchAlsText(pq.q)}) ={' '}
        {bruchAlsText(pq.diskriminante)}
      </Text>
    </View>
  );
}

function ProbeZeilen({ gleichung, loesung }) {
  const p = probe(gleichung, loesung);
  const seite = (wert) => (p.exakt ? bruchAlsText(wert) : String(Math.round(wert * 1e6) / 1e6));

  return (
    <View style={styles.probeBlock}>
      <Text style={styles.probeZeile}>
        x = {termAlsText(loesung)}: links {seite(p.links)}, rechts {seite(p.rechts)}
      </Text>
      <Text style={p.stimmt ? styles.probeGut : styles.probeSchlecht}>
        {p.stimmt ? 'stimmt' : 'stimmt nicht!'}
        {p.exakt ? '' : ' — gerundet gerechnet, weil die Lösung kein Bruch ist'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  beispiele: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    marginBottom: 18,
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

  wegKasten: {
    marginBottom: 18,
  },
  zeile: {
    fontSize: 18,
    color: farben.text,
    marginBottom: 2,
  },
  regel: {
    fontSize: 13,
    color: farben.primaer,
    marginLeft: 24,
    marginTop: 4,
    marginBottom: 2,
  },
  hinweis: {
    fontSize: 14,
    color: farben.textLeise,
    marginTop: 8,
    lineHeight: 20,
  },

  ergebnisKasten: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.hintergrundHell,
  },
  zeileMitKnopf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ergebnis: {
    fontSize: 22,
    fontWeight: '700',
    color: farben.primaerDunkel,
  },
  begruendung: {
    fontSize: 14,
    color: farben.text,
    marginTop: 6,
    lineHeight: 20,
  },
  probeUeberschrift: {
    marginTop: 14,
  },
  probeBlock: {
    marginTop: 6,
  },
  pqKasten: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: farben.trenner,
  },
  probeTitel: {
    fontSize: 14,
    fontWeight: '700',
    color: farben.text,
  },
  probeZeile: {
    fontSize: 15,
    color: farben.text,
    marginTop: 2,
  },
  probeGut: {
    fontSize: 14,
    color: farben.richtig,
    marginTop: 6,
    fontWeight: '600',
  },
  probeSchlecht: {
    fontSize: 14,
    color: farben.falsch,
    marginTop: 6,
    fontWeight: '600',
  },

  unklarKasten: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.warnungHintergrund,
  },
  unklarTitel: {
    fontSize: 16,
    fontWeight: '700',
    color: farben.warnung,
  },
  unklarText: {
    fontSize: 14,
    color: farben.text,
    marginTop: 6,
    lineHeight: 20,
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

  hilfeKasten: {
    marginTop: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: farben.trenner,
  },
  hilfeTitel: {
    fontSize: 13,
    fontWeight: '700',
    color: farben.textLeise,
    marginBottom: 4,
  },
  hilfe: {
    fontSize: 13,
    color: farben.textLeise,
    lineHeight: 19,
  },
});
