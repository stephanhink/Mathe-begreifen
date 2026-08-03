import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import InfoButton from '../components/InfoButton';
import { farben } from '../utils/konstanten';
import { rechne, kuerze, alsKommazahl, wertAlsText } from '../utils/bruchrechnung';
import {
  prozentwert,
  grundwert,
  prozentsatz,
  veraendere,
  grundwertAusVeraendert,
  alsProzentText,
} from '../utils/prozent';

// Der Zahlen-Bildschirm: Brüche und Prozente, beides mit Rechenweg.
//
// Warum eigene Module dafür und nicht der Rechner? Weil term.js zwar
// 1/2 + 1/3 ausrechnen kann, aber in einem Schritt. Der Schritt, an dem
// es tatsächlich hakt — das Gleichnamigmachen — wäre unsichtbar.
//
// Wie überall: Der Screen rechnet nichts, er ruft utils/ auf.

const BEREICHE = [
  { key: 'brueche', label: 'Brüche' },
  { key: 'prozent', label: 'Prozent' },
];

export default function ZahlenScreen() {
  const [bereich, setBereich] = useState('brueche');

  return (
    <ScreenGeruest titel="Zahlen" untertitel="Brüche und Prozente — mit Rechenweg">
      <View style={styles.umschalter}>
        {BEREICHE.map((b) => (
          <Pressable
            key={b.key}
            style={[styles.reiter, bereich === b.key && styles.reiterAktiv]}
            onPress={() => setBereich(b.key)}
          >
            <Text style={[styles.reiterText, bereich === b.key && styles.reiterTextAktiv]}>
              {b.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {bereich === 'brueche' ? <Brueche /> : <Prozent />}
    </ScreenGeruest>
  );
}

// --------------------------------------------------------------------
// Brüche
// --------------------------------------------------------------------

const RECHENARTEN = ['+', '−', '·', ':'];

function Brueche() {
  const [za, setZa] = useState('1');
  const [na, setNa] = useState('2');
  const [zb, setZb] = useState('1');
  const [nb, setNb] = useState('3');
  const [zeichen, setZeichen] = useState('+');

  const ergebnis = useMemo(() => {
    const zahlen = [za, na, zb, nb].map(ganzeZahl);
    if (zahlen.some((w) => w === null)) {
      return { fehler: 'Bitte in alle vier Felder eine ganze Zahl schreiben.' };
    }
    try {
      return { weg: rechne(zahlen[0], zahlen[1], zeichen, zahlen[2], zahlen[3]) };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [za, na, zb, nb, zeichen]);

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Zwei Brüche</Text>
        <InfoButton thema="bruch" />
      </View>

      <View style={styles.bruchReihe}>
        <Bruchfeld zaehler={za} setZaehler={setZa} nenner={na} setNenner={setNa} />

        <View style={styles.zeichenSpalte}>
          {RECHENARTEN.map((r) => (
            <Pressable
              key={r}
              style={[styles.zeichenKnopf, zeichen === r && styles.zeichenKnopfAktiv]}
              onPress={() => setZeichen(r)}
            >
              <Text style={[styles.zeichenText, zeichen === r && styles.zeichenTextAktiv]}>
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        <Bruchfeld zaehler={zb} setZaehler={setZb} nenner={nb} setNenner={setNb} />
      </View>

      {ergebnis.fehler ? (
        <Hinweiskasten text={ergebnis.fehler} />
      ) : (
        <Rechenweg
          anfang={ergebnis.weg.anfang}
          schritte={ergebnis.weg.schritte}
          ergebnis={wertAlsText(ergebnis.weg.ergebnis)}
          nebenbei={`ungefähr ${alsKommazahl(ergebnis.weg.ergebnis)}`}
          thema="bruch"
        />
      )}

      <Kuerzen />
    </View>
  );
}

function Bruchfeld({ zaehler, setZaehler, nenner, setNenner }) {
  return (
    <View style={styles.bruch}>
      <TextInput
        style={styles.bruchFeld}
        value={zaehler}
        onChangeText={setZaehler}
        keyboardType="numbers-and-punctuation"
        textAlign="center"
      />
      <View style={styles.bruchstrich} />
      <TextInput
        style={styles.bruchFeld}
        value={nenner}
        onChangeText={setNenner}
        keyboardType="numbers-and-punctuation"
        textAlign="center"
      />
    </View>
  );
}

function Kuerzen() {
  const [zaehler, setZaehler] = useState('18');
  const [nenner, setNenner] = useState('24');

  const ergebnis = useMemo(() => {
    const z = ganzeZahl(zaehler);
    const n = ganzeZahl(nenner);
    if (z === null || n === null) {
      return { fehler: 'Bitte zwei ganze Zahlen eintragen.' };
    }
    try {
      return { weg: kuerze(z, n) };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [zaehler, nenner]);

  return (
    <View style={styles.unterAbschnitt}>
      <Text style={styles.abschnitt}>Kürzen</Text>

      <View style={styles.bruchReihe}>
        <Bruchfeld
          zaehler={zaehler}
          setZaehler={setZaehler}
          nenner={nenner}
          setNenner={setNenner}
        />
      </View>

      {ergebnis.fehler ? (
        <Hinweiskasten text={ergebnis.fehler} />
      ) : ergebnis.weg.schonGekuerzt ? (
        <Hinweiskasten
          text={`${ergebnis.weg.anfang} ist schon so weit gekürzt, wie es geht — Zähler und Nenner haben keinen gemeinsamen Teiler außer 1.`}
        />
      ) : (
        <Rechenweg
          anfang={ergebnis.weg.anfang}
          schritte={ergebnis.weg.schritte}
          ergebnis={wertAlsText(ergebnis.weg.ergebnis)}
        />
      )}
    </View>
  );
}

// --------------------------------------------------------------------
// Prozent
// --------------------------------------------------------------------

// Die fünf Fragen, die man an eine Prozentrechnung stellen kann. Der
// Reihe nach: die drei Grundaufgaben, dann Zunahme/Abnahme und deren
// Umkehrung.
const FRAGEN = [
  {
    key: 'wert',
    label: 'Wie viel sind p % von G?',
    felder: ['Grundwert G', 'Prozentsatz p'],
    anfang: ['250', '19'],
    rechne: (a, b) => prozentwert(a, b),
  },
  {
    key: 'grund',
    label: 'W sind p % — wie viel ist alles?',
    felder: ['Prozentwert W', 'Prozentsatz p'],
    anfang: ['47,5', '19'],
    rechne: (a, b) => grundwert(a, b),
  },
  {
    key: 'satz',
    label: 'W von G — wie viel Prozent?',
    felder: ['Prozentwert W', 'Grundwert G'],
    anfang: ['47,5', '250'],
    rechne: (a, b) => prozentsatz(a, b),
  },
  {
    key: 'aendern',
    label: 'G um p % erhöhen oder senken',
    felder: ['Grundwert G', 'Prozentsatz p (negativ = weniger)'],
    anfang: ['250', '19'],
    rechne: (a, b) => veraendere(a, b),
  },
  {
    key: 'zurueck',
    label: 'Nach p % Änderung ist es W — was war es vorher?',
    felder: ['Wert danach', 'Prozentsatz p'],
    anfang: ['119', '19'],
    rechne: (a, b) => grundwertAusVeraendert(a, b),
  },
];

function Prozent() {
  const [frageKey, setFrageKey] = useState('wert');
  const frage = FRAGEN.find((f) => f.key === frageKey);
  const [eins, setEins] = useState(frage.anfang[0]);
  const [zwei, setZwei] = useState(frage.anfang[1]);

  function wechsle(neu) {
    const f = FRAGEN.find((x) => x.key === neu);
    setFrageKey(neu);
    setEins(f.anfang[0]);
    setZwei(f.anfang[1]);
  }

  const ergebnis = useMemo(() => {
    const a = kommazahl(eins);
    const b = kommazahl(zwei);
    if (a === null || b === null) {
      return { fehler: 'Bitte in beide Felder eine Zahl schreiben.' };
    }
    try {
      return { weg: frage.rechne(a, b) };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [eins, zwei, frageKey]);

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Was ist gesucht?</Text>
        <InfoButton thema="prozent" />
      </View>

      {FRAGEN.map((f) => (
        <Pressable
          key={f.key}
          style={[styles.frageZeile, frageKey === f.key && styles.frageZeileAktiv]}
          onPress={() => wechsle(f.key)}
        >
          <Text style={[styles.frageText, frageKey === f.key && styles.frageTextAktiv]}>
            {f.label}
          </Text>
        </Pressable>
      ))}

      <View style={styles.eingabeReihe}>
        <Zahlenfeld beschriftung={frage.felder[0]} wert={eins} setWert={setEins} />
        <Zahlenfeld beschriftung={frage.felder[1]} wert={zwei} setWert={setZwei} />
      </View>

      {ergebnis.fehler ? (
        <Hinweiskasten text={ergebnis.fehler} />
      ) : (
        <>
          <Rechenweg
            anfang={ergebnis.weg.anfang}
            schritte={ergebnis.weg.schritte}
            ergebnis={
              alsProzentText(ergebnis.weg.ergebnis) + (ergebnis.weg.einheit ? ' %' : '')
            }
            formel={ergebnis.weg.formel}
          />
          {ergebnis.weg.falle ? <Falle text={ergebnis.weg.falle.text} /> : null}
        </>
      )}
    </View>
  );
}

function Zahlenfeld({ beschriftung, wert, setWert }) {
  return (
    <View style={styles.zahlenfeld}>
      <Text style={styles.feldLabel}>{beschriftung}</Text>
      <TextInput
        style={styles.feld}
        value={wert}
        onChangeText={setWert}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  );
}

// --------------------------------------------------------------------
// Gemeinsames
// --------------------------------------------------------------------

function Rechenweg({ anfang, schritte, ergebnis, nebenbei, formel, thema }) {
  return (
    <View style={styles.wegKasten}>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Rechenweg</Text>
        {thema ? <InfoButton thema={thema} /> : null}
      </View>

      {formel ? <Text style={styles.formel}>{formel}</Text> : null}
      <Text style={styles.zeile}>{anfang}</Text>

      {schritte.map((s, i) => (
        <View key={i}>
          <Text style={styles.regel}>| {s.regel}</Text>
          <Text style={styles.zeile}>= {s.text}</Text>
        </View>
      ))}

      <View style={styles.ergebnisKasten}>
        <Text style={styles.ergebnis}>{ergebnis}</Text>
        {nebenbei ? <Text style={styles.nebenbei}>{nebenbei}</Text> : null}
      </View>
    </View>
  );
}

// Der häufigste Fehler, ausdrücklich hingeschrieben. Ihn nur zu
// vermeiden reicht nicht — man muss ihn einmal gesehen haben, um zu
// verstehen, warum er falsch ist.
function Falle({ text }) {
  return (
    <View style={styles.falleKasten}>
      <Text style={styles.falleTitel}>Achtung, häufiger Fehler</Text>
      <Text style={styles.falleText}>{text}</Text>
    </View>
  );
}

function Hinweiskasten({ text }) {
  return (
    <View style={styles.hinweisKasten}>
      <Text style={styles.hinweisText}>{text}</Text>
    </View>
  );
}

// Eingaben aus einem Textfeld. Leere oder unfertige Eingaben geben null
// zurück, statt zu werfen — beim Tippen ist ein Feld nun mal kurz leer.
function ganzeZahl(text) {
  const sauber = String(text).trim().replace('−', '-');
  return /^-?\d+$/.test(sauber) ? Number(sauber) : null;
}

function kommazahl(text) {
  const sauber = String(text).trim().replace('−', '-').replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(sauber) ? Number(sauber) : null;
}

const styles = StyleSheet.create({
  umschalter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  reiter: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: farben.trenner,
    alignItems: 'center',
  },
  reiterAktiv: {
    backgroundColor: farben.primaer,
    borderColor: farben.primaer,
  },
  reiterText: {
    fontSize: 15,
    color: farben.primaerDunkel,
  },
  reiterTextAktiv: {
    color: farben.weiss,
    fontWeight: '700',
  },

  abschnitt: {
    fontSize: 14,
    fontWeight: '700',
    color: farben.textLeise,
    marginBottom: 8,
  },
  zeileMitKnopf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unterAbschnitt: {
    marginTop: 26,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: farben.trenner,
  },

  bruchReihe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  bruch: {
    alignItems: 'center',
    minWidth: 74,
  },
  bruchFeld: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 20,
    color: farben.text,
    backgroundColor: farben.weiss,
    minWidth: 70,
  },
  bruchstrich: {
    height: 2,
    alignSelf: 'stretch',
    backgroundColor: farben.text,
    marginVertical: 5,
  },
  zeichenSpalte: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 82,
    gap: 4,
  },
  zeichenKnopf: {
    width: 38,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: farben.trenner,
    alignItems: 'center',
  },
  zeichenKnopfAktiv: {
    backgroundColor: farben.primaer,
    borderColor: farben.primaer,
  },
  zeichenText: {
    fontSize: 18,
    color: farben.primaerDunkel,
  },
  zeichenTextAktiv: {
    color: farben.weiss,
    fontWeight: '700',
  },

  frageZeile: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: farben.trenner,
    marginBottom: 6,
  },
  frageZeileAktiv: {
    backgroundColor: farben.hintergrundHell,
    borderColor: farben.primaer,
  },
  frageText: {
    fontSize: 14,
    color: farben.text,
  },
  frageTextAktiv: {
    fontWeight: '700',
    color: farben.primaerDunkel,
  },

  eingabeReihe: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  zahlenfeld: {
    flex: 1,
  },
  feldLabel: {
    fontSize: 12,
    color: farben.textLeise,
    marginBottom: 4,
  },
  feld: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 17,
    color: farben.text,
    backgroundColor: farben.weiss,
  },

  wegKasten: {
    marginTop: 14,
  },
  formel: {
    fontSize: 15,
    color: farben.primaer,
    marginBottom: 8,
  },
  zeile: {
    fontSize: 18,
    color: farben.text,
    marginBottom: 2,
  },
  regel: {
    fontSize: 13,
    color: farben.primaer,
    marginLeft: 20,
    marginTop: 4,
    marginBottom: 2,
  },
  ergebnisKasten: {
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.hintergrundHell,
  },
  ergebnis: {
    fontSize: 24,
    fontWeight: '700',
    color: farben.primaerDunkel,
  },
  nebenbei: {
    fontSize: 14,
    color: farben.textLeise,
    marginTop: 4,
  },

  falleKasten: {
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.warnungHintergrund,
  },
  falleTitel: {
    fontSize: 15,
    fontWeight: '700',
    color: farben.warnung,
  },
  falleText: {
    fontSize: 14,
    color: farben.text,
    marginTop: 6,
    lineHeight: 21,
  },

  hinweisKasten: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: farben.trenner,
  },
  hinweisText: {
    fontSize: 14,
    color: farben.textLeise,
    lineHeight: 20,
  },
});
