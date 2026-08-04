import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import InfoButton from '../components/InfoButton';
import ZahlenTasten from '../components/ZahlenTasten';
import Baumdiagramm from '../components/Baumdiagramm';
import { farben } from '../utils/konstanten';
import { bruch, alsZahl } from '../utils/bruch';
import {
  test as hypothesenTest,
  entscheide,
  fehlerZweiterArt,
  alsRechenweg as testAlsRechenweg,
  prozent,
  ARTEN,
} from '../utils/hypothese';
import {
  laplace,
  zaehleMoeglichkeiten,
  ZIEHUNGSARTEN,
  zweistufig,
  pfadeSumme,
  binomial,
  binomialVerteilung,
  alsProzent,
  alsBruchText,
  BEISPIELE,
} from '../utils/zufall';

// Der Zufall-Bildschirm: Laplace, Kombinatorik, Baumdiagramm,
// Binomialverteilung.
//
// Alles rechnet exakt in Brüchen — 1/6 ist 1/6, nicht 0,1667. Die
// Prozentzahl steht daneben, nicht anstelle.

// --------------------------------------------------------------------
// Hypothesentest
// --------------------------------------------------------------------
//
// Der Bildschirm zeigt nicht nur den Ablehnungsbereich, sondern immer
// auch den Vorbehalt dazu. Eine App, die bloß "H₀ beibehalten" ausgibt,
// züchtet den häufigsten Denkfehler der Statistik, statt ihn
// abzuräumen: "nicht verworfen" heißt nicht "bewiesen".

function Hypothesentest() {
  const [n, setN] = useState('100');
  const [p0, setP0] = useState('0,5');
  const [alpha, setAlpha] = useState('5');
  const [art, setArt] = useState('rechtsseitig');
  const [k, setK] = useState('59');

  const ergebnis = useMemo(() => rechneTest(n, p0, alpha, art, k), [n, p0, alpha, art, k]);

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnittTitel}>Nullhypothese prüfen</Text>
        <InfoButton thema="hypothesentest" />
      </View>

      <View style={styles.testReihe}>
        <TestFeld label="Versuche n" wert={n} setzen={setN} />
        <TestFeld label="H₀: p =" wert={p0} setzen={setP0} />
      </View>
      <View style={styles.testReihe}>
        <TestFeld label="α in %" wert={alpha} setzen={setAlpha} />
        <TestFeld label="Treffer k" wert={k} setzen={setK} />
      </View>

      <View style={styles.artReihe}>
        {Object.entries(ARTEN).map(([id, a]) => (
          <Pressable
            key={id}
            style={[styles.reiter, art === id && styles.reiterAktiv]}
            onPress={() => setArt(id)}
          >
            <Text style={[styles.reiterText, art === id && styles.reiterTextAktiv]}>
              {a.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hilfe}>{ARTEN[art].frage}</Text>
      <ZahlenTasten />

      {ergebnis.fehler ? (
        <Text style={styles.hinweisText}>{ergebnis.fehler}</Text>
      ) : (
        <View style={styles.ergebnisKasten}>
          {ergebnis.weg.map((zeile, i) => (
            <Text key={i} style={zeile.startsWith(' ') ? styles.regelZeile : styles.wegZeile}>
              {zeile}
            </Text>
          ))}

          {ergebnis.entscheidung ? (
            <View style={styles.entscheidungKasten}>
              <Text style={styles.entscheidungSatz}>{ergebnis.entscheidung.satz}</Text>
              {/* Der Vorbehalt steht IMMER dabei — er ist der eigentliche
                  Lernstoff, nicht das Kleingedruckte. */}
              <Text style={styles.vorbehalt}>{ergebnis.entscheidung.vorbehalt}</Text>
            </View>
          ) : null}

          {ergebnis.fehler2 ? (
            <View style={styles.fehler2Kasten}>
              <Text style={styles.probeTitel}>Fehler 2. Art</Text>
              <Text style={styles.vorbehalt}>{ergebnis.fehler2.satz}</Text>
              <Text style={styles.vorbehalt}>{ergebnis.fehler2.hinweis}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function TestFeld({ label, wert, setzen }) {
  return (
    <View style={styles.testFeldRahmen}>
      <Text style={styles.testLabel}>{label}</Text>
      <TextInput style={styles.testFeld} value={wert} onChangeText={setzen} />
    </View>
  );
}

function rechneTest(nText, p0Text, alphaText, art, kText) {
  const zahlAus = (t) => Number(String(t).trim().replace('−', '-').replace(',', '.'));
  const n = zahlAus(nText);
  const p0 = zahlAus(p0Text);
  const alpha = zahlAus(alphaText) / 100;
  const k = zahlAus(kText);

  let t;
  try {
    t = hypothesenTest({ n, p0, art, alpha });
  } catch (fehler) {
    return { fehler: fehler.message };
  }

  const weg = testAlsRechenweg(t);
  let entscheidung = null;
  let fehler2 = null;
  if (Number.isInteger(k) && k >= 0 && k <= n) {
    entscheidung = entscheide(t, k);
    // Der Fehler 2. Art nur, wenn er etwas aussagt — bei p₀ selbst gibt
    // es keinen Unterschied zu erkennen.
    const pWahr = Math.min(0.99, Math.max(0.01, p0 + (art === 'linksseitig' ? -0.1 : 0.1)));
    if (!t.leer) {
      fehler2 = fehlerZweiterArt(t, pWahr);
    }
  }

  return { weg, entscheidung, fehler2 };
}

const BEREICHE = [
  { key: 'laplace', label: 'Laplace' },
  { key: 'baum', label: 'Baumdiagramm' },
  { key: 'zaehlen', label: 'Zählen' },
  { key: 'binomial', label: 'Binomial' },
  { key: 'test', label: 'Test' },
];

export default function ZufallScreen() {
  const [bereich, setBereich] = useState('laplace');

  return (
    <ScreenGeruest titel="Zufall" untertitel="Wahrscheinlichkeit — exakt in Brüchen">
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

      {bereich === 'laplace' ? <Laplace /> : null}
      {bereich === 'baum' ? <Baum /> : null}
      {bereich === 'zaehlen' ? <Zaehlen /> : null}
      {bereich === 'binomial' ? <Binomial /> : null}
      {bereich === 'test' ? <Hypothesentest /> : null}
    </ScreenGeruest>
  );
}

function useAktivesFeld() {
  const [feld, setFeld] = useState(null);
  return {
    aktiv: feld !== null,
    merkeFeld: (setWert, holeWert) => setFeld({ setWert, holeWert }),
    anhaengen: (z) => feld && feld.setWert(feld.holeWert() + z),
    letztesWeg: () => feld && feld.setWert(feld.holeWert().slice(0, -1)),
  };
}

function Feld({ label, wert, setWert, merkeFeld }) {
  return (
    <View style={styles.feldSpalte}>
      <Text style={styles.feldLabel}>{label}</Text>
      <TextInput
        style={styles.feld}
        value={wert}
        onChangeText={setWert}
        onFocus={() => merkeFeld(setWert, () => wert)}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  );
}

function ganzOderNull(text) {
  const sauber = String(text).trim().replace('−', '-');
  return /^-?\d+$/.test(sauber) ? Number(sauber) : sauber === '' ? null : sauber;
}

// --------------------------------------------------------------------

function Laplace() {
  const feld = useAktivesFeld();
  const [guenstig, setGuenstig] = useState('1');
  const [moeglich, setMoeglich] = useState('6');

  const ergebnis = useMemo(() => {
    try {
      return { w: laplace(ganzOderNull(guenstig), ganzOderNull(moeglich)) };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [guenstig, moeglich]);

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Günstige und mögliche Fälle abzählen</Text>
        <InfoButton thema="laplace" />
      </View>

      <View style={styles.chips}>
        {BEISPIELE.map((b) => (
          <Pressable
            key={b.titel}
            style={styles.chip}
            onPress={() => {
              setGuenstig(String(b.guenstig));
              setMoeglich(String(b.moeglich));
            }}
          >
            <Text style={styles.chipText}>{b.titel}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.feldReihe}>
        <Feld label="günstige Fälle" wert={guenstig} setWert={setGuenstig} merkeFeld={feld.merkeFeld} />
        <Feld label="mögliche Fälle" wert={moeglich} setWert={setMoeglich} merkeFeld={feld.merkeFeld} />
      </View>
      <ZahlenTasten aufTaste={feld.anhaengen} aufLoeschen={feld.letztesWeg} aktiv={feld.aktiv} />

      {ergebnis.fehler ? (
        <Fehlerkasten text={ergebnis.fehler} />
      ) : (
        <>
          <Text style={styles.formel}>{ergebnis.w.formel}</Text>
          {ergebnis.w.schritte.map((s, i) => (
            <View key={i}>
              <Text style={styles.regel}>| {s.regel}</Text>
              <Text style={styles.zeile}>{s.text}</Text>
            </View>
          ))}

          <View style={styles.ergebnisKasten}>
            <Text style={styles.ergebnis}>P = {alsBruchText(ergebnis.w.wahrscheinlichkeit)}</Text>
            <Text style={styles.nebenbei}>
              das sind {alsProzent(ergebnis.w.wahrscheinlichkeit)} %
            </Text>
            <Text style={styles.nebenbei}>
              Gegenwahrscheinlichkeit: {alsBruchText(ergebnis.w.gegenwahrscheinlichkeit)} — die
              beiden ergeben zusammen 1.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

// --------------------------------------------------------------------

function Baum() {
  const feld = useAktivesFeld();
  const [rot, setRot] = useState('3');
  const [blau, setBlau] = useState('2');
  const [mitZuruecklegen, setMit] = useState(false);
  const { width } = useWindowDimensions();

  const ergebnis = useMemo(() => {
    try {
      return {
        b: zweistufig({
          rot: ganzOderNull(rot),
          blau: ganzOderNull(blau),
          mitZuruecklegen,
        }),
      };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [rot, blau, mitZuruecklegen]);

  const breite = Math.min(width - 56, 360);

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Zweimal aus einer Urne ziehen</Text>
        <InfoButton thema="pfadregeln" />
      </View>

      <View style={styles.feldReihe}>
        <Feld label="rote Kugeln" wert={rot} setWert={setRot} merkeFeld={feld.merkeFeld} />
        <Feld label="blaue Kugeln" wert={blau} setWert={setBlau} merkeFeld={feld.merkeFeld} />
      </View>
      <ZahlenTasten aufTaste={feld.anhaengen} aufLoeschen={feld.letztesWeg} aktiv={feld.aktiv} />

      <View style={styles.schalterReihe}>
        {[false, true].map((wert) => (
          <Pressable
            key={String(wert)}
            style={[styles.schalter, mitZuruecklegen === wert && styles.schalterAktiv]}
            onPress={() => setMit(wert)}
          >
            <Text style={[styles.schalterText, mitZuruecklegen === wert && styles.schalterTextAktiv]}>
              {wert ? 'mit Zurücklegen' : 'ohne Zurücklegen'}
            </Text>
          </Pressable>
        ))}
      </View>

      {ergebnis.fehler ? (
        <Fehlerkasten text={ergebnis.fehler} />
      ) : (
        <>
          <View style={styles.bildRahmen}>
            <Baumdiagramm baum={ergebnis.b} breite={breite} hoehe={230} />
          </View>

          <Text style={styles.regel}>| entlang eines Pfades wird multipliziert</Text>
          <Text style={styles.regel}>| über mehrere Pfade wird addiert</Text>

          <View style={styles.ergebnisKasten}>
            <Text style={styles.werteZeile}>
              mindestens eine rote:{' '}
              {alsBruchText(pfadeSumme(ergebnis.b, (w) => w.includes('rot')).summe)}
            </Text>
            <Text style={styles.werteZeile}>
              zwei gleiche:{' '}
              {alsBruchText(pfadeSumme(ergebnis.b, (w) => w[0] === w[1]).summe)}
            </Text>
            {/* Die eingebaute Probe jedes Baumdiagramms. */}
            <Text style={styles.nebenbei}>
              Alle Pfade zusammen: {alsBruchText(ergebnis.b.summe)} — das muss 1 sein, sonst
              fehlt ein Zweig.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

// --------------------------------------------------------------------

function Zaehlen() {
  const feld = useAktivesFeld();
  const [art, setArt] = useState('ungeordnetOhne');
  const [n, setN] = useState('49');
  const [k, setK] = useState('6');

  const ergebnis = useMemo(() => {
    try {
      return { z: zaehleMoeglichkeiten(art, ganzOderNull(n), ganzOderNull(k)) };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [art, n, k]);

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Wie viele Möglichkeiten gibt es?</Text>
        <InfoButton thema="kombinatorik" />
      </View>

      {Object.entries(ZIEHUNGSARTEN).map(([id, a]) => (
        <Pressable
          key={id}
          style={[styles.artZeile, art === id && styles.artZeileAktiv]}
          onPress={() => setArt(id)}
        >
          <Text style={[styles.artTitel, art === id && styles.artTitelAktiv]}>{a.titel}</Text>
          <Text style={styles.artBeispiel}>{a.beispiel}</Text>
        </Pressable>
      ))}

      <View style={styles.feldReihe}>
        <Feld label="n (wie viele zur Auswahl)" wert={n} setWert={setN} merkeFeld={feld.merkeFeld} />
        <Feld label="k (wie viele gezogen)" wert={k} setWert={setK} merkeFeld={feld.merkeFeld} />
      </View>
      <ZahlenTasten aufTaste={feld.anhaengen} aufLoeschen={feld.letztesWeg} aktiv={feld.aktiv} />

      {ergebnis.fehler ? (
        <Fehlerkasten text={ergebnis.fehler} />
      ) : (
        <>
          <Text style={styles.formel}>{ergebnis.z.art.formel}</Text>
          {ergebnis.z.schritte.map((s, i) => (
            <Text key={i} style={styles.zeile}>
              {s.text}
            </Text>
          ))}
          <View style={styles.ergebnisKasten}>
            <Text style={styles.ergebnis}>{alsBruchText(ergebnis.z.anzahl)}</Text>
            <Text style={styles.nebenbei}>Möglichkeiten</Text>
          </View>
        </>
      )}
    </View>
  );
}

// --------------------------------------------------------------------

function Binomial() {
  const feld = useAktivesFeld();
  const [n, setN] = useState('10');
  const [zaehler, setZaehler] = useState('1');
  const [nenner, setNenner] = useState('6');
  const [k, setK] = useState('3');

  const ergebnis = useMemo(() => {
    try {
      const z = ganzOderNull(zaehler);
      const nn = ganzOderNull(nenner);
      if (typeof z !== 'number' || typeof nn !== 'number' || nn === 0) {
        return { fehler: 'Die Trefferwahrscheinlichkeit braucht Zähler und Nenner als ganze Zahlen.' };
      }
      const p = bruch(z, nn);
      return {
        b: binomial(ganzOderNull(n), p, ganzOderNull(k)),
        verteilung: binomialVerteilung(ganzOderNull(n), p),
      };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [n, zaehler, nenner, k]);

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>n-mal dasselbe versuchen</Text>
        <InfoButton thema="binomialverteilung" />
      </View>

      <View style={styles.feldReihe}>
        <Feld label="Versuche n" wert={n} setWert={setN} merkeFeld={feld.merkeFeld} />
        <Feld label="Treffer k" wert={k} setWert={setK} merkeFeld={feld.merkeFeld} />
      </View>
      <View style={styles.feldReihe}>
        <Feld label="p: Zähler" wert={zaehler} setWert={setZaehler} merkeFeld={feld.merkeFeld} />
        <Feld label="p: Nenner" wert={nenner} setWert={setNenner} merkeFeld={feld.merkeFeld} />
      </View>
      <ZahlenTasten aufTaste={feld.anhaengen} aufLoeschen={feld.letztesWeg} aktiv={feld.aktiv} />

      {ergebnis.fehler ? (
        <Fehlerkasten text={ergebnis.fehler} />
      ) : (
        <>
          <Text style={styles.formel}>{ergebnis.b.formel}</Text>
          {ergebnis.b.schritte.map((s, i) => (
            <View key={i}>
              <Text style={styles.regel}>| {s.regel}</Text>
              <Text style={styles.zeile}>{s.text}</Text>
            </View>
          ))}

          <View style={styles.ergebnisKasten}>
            <Text style={styles.ergebnis}>
              P(X = {k}) = {alsBruchText(ergebnis.b.wahrscheinlichkeit)}
            </Text>
            <Text style={styles.nebenbei}>
              das sind {alsProzent(ergebnis.b.wahrscheinlichkeit)} %
            </Text>
            <Text style={styles.nebenbei}>
              Erwartungswert: {alsBruchText(ergebnis.b.erwartungswert)} Treffer — so viele sind
              es im Schnitt.
            </Text>
          </View>

          <Text style={styles.abschnitt}>Die ganze Verteilung</Text>
          <Verteilung werte={ergebnis.verteilung} hervor={Number(k)} />
        </>
      )}
    </View>
  );
}

// Ein einfaches Säulendiagramm — aus Balken, nicht aus SVG. Für zwölf
// Säulen ist das genug, und es passt sich der Breite von selbst an.
function Verteilung({ werte, hervor }) {
  const groesste = Math.max(...werte.map((w) => alsZahl(w.wahrscheinlichkeit)));

  return (
    <View style={styles.verteilung}>
      {werte.map((w) => {
        const anteil = alsZahl(w.wahrscheinlichkeit) / (groesste || 1);
        return (
          <View key={w.k} style={styles.saeuleSpalte}>
            <View style={styles.saeuleRaum}>
              <View
                style={[
                  styles.saeule,
                  { height: Math.max(2, anteil * 90) },
                  w.k === hervor && styles.saeuleHervor,
                ]}
              />
            </View>
            <Text style={styles.saeuleText}>{w.k}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Fehlerkasten({ text }) {
  return (
    <View style={styles.fehlerKasten}>
      <Text style={styles.fehlerTitel}>Das gibt es so nicht</Text>
      <Text style={styles.fehlerText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  umschalter: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  reiter: {
    flexGrow: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: farben.trenner,
    alignItems: 'center',
  },
  reiterAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  reiterText: { fontSize: 13, color: farben.primaerDunkel },
  reiterTextAktiv: { color: farben.weiss, fontWeight: '700' },

  abschnitt: { fontSize: 14, fontWeight: '700', color: farben.textLeise, marginBottom: 8, marginTop: 4 },
  zeileMitKnopf: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderColor: farben.trenner,
    backgroundColor: farben.hintergrundHell,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, color: farben.primaerDunkel },

  feldReihe: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  feldSpalte: { flex: 1 },
  feldLabel: { fontSize: 12, color: farben.textLeise, marginBottom: 4 },
  feld: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 17,
    color: farben.text,
    backgroundColor: farben.weiss,
  },

  schalterReihe: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  schalter: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: farben.trenner,
    alignItems: 'center',
  },
  schalterAktiv: { backgroundColor: farben.hintergrundHell, borderColor: farben.primaer },
  schalterText: { fontSize: 13, color: farben.textLeise },
  schalterTextAktiv: { color: farben.primaerDunkel, fontWeight: '700' },

  artZeile: {
    borderWidth: 1,
    borderColor: farben.trenner,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  artZeileAktiv: { backgroundColor: farben.hintergrundHell, borderColor: farben.primaer },
  artTitel: { fontSize: 14, color: farben.text },
  artTitelAktiv: { fontWeight: '700', color: farben.primaerDunkel },
  artBeispiel: { fontSize: 12, color: farben.textLeise, marginTop: 3, lineHeight: 17 },

  bildRahmen: { alignItems: 'center', marginVertical: 14 },

  formel: { fontSize: 15, color: farben.primaer, marginTop: 10, marginBottom: 6 },
  zeile: { fontSize: 17, color: farben.text, marginBottom: 2 },
  regel: { fontSize: 13, color: farben.primaer, marginLeft: 16, marginTop: 4, marginBottom: 2 },

  testReihe: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  testFeldRahmen: {
    flex: 1,
  },
  testLabel: {
    fontSize: 13,
    color: farben.textLeise,
    marginBottom: 3,
  },
  testFeld: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: farben.text,
  },
  artReihe: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  wegZeile: {
    fontSize: 16,
    color: farben.text,
    marginBottom: 2,
  },
  regelZeile: {
    fontSize: 13,
    color: farben.primaer,
    marginBottom: 6,
  },
  entscheidungKasten: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: farben.trenner,
  },
  entscheidungSatz: {
    fontSize: 16,
    fontWeight: '700',
    color: farben.text,
    marginBottom: 6,
  },
  vorbehalt: {
    fontSize: 14,
    color: farben.textLeise,
    lineHeight: 20,
    marginBottom: 6,
  },
  fehler2Kasten: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: farben.hintergrundHell,
  },
  hinweisText: {
    fontSize: 14,
    color: farben.warnung,
    marginTop: 10,
  },
  ergebnisKasten: {
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.hintergrundHell,
  },
  ergebnis: { fontSize: 22, fontWeight: '700', color: farben.primaerDunkel },
  werteZeile: { fontSize: 16, color: farben.text, marginBottom: 4 },
  nebenbei: { fontSize: 13, color: farben.textLeise, marginTop: 4, lineHeight: 19 },

  verteilung: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 4 },
  saeuleSpalte: { flex: 1, alignItems: 'center' },
  saeuleRaum: { height: 92, justifyContent: 'flex-end' },
  saeule: { width: '80%', backgroundColor: farben.trenner, borderRadius: 2 },
  saeuleHervor: { backgroundColor: farben.primaer },
  saeuleText: { fontSize: 10, color: farben.textLeise, marginTop: 3 },

  fehlerKasten: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.falschHintergrund,
    marginTop: 14,
  },
  fehlerTitel: { fontSize: 16, fontWeight: '700', color: farben.falsch },
  fehlerText: { fontSize: 14, color: farben.text, marginTop: 6, lineHeight: 20 },
});
