import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import InfoButton from '../components/InfoButton';
import ZahlenTasten from '../components/ZahlenTasten';
import Dreieck from '../components/Dreieck';
import { farben } from '../utils/konstanten';
import { alsText as bruchAlsText } from '../utils/bruch';
import {
  pythagoras,
  rechtwinkligesDreieck,
  berechneForm,
  FORMEN,
  zahlText,
} from '../utils/geometrie';
import {
  vektor,
  alsText as vektorAlsText,
  addiere,
  subtrahiere,
  strecke,
  skalarprodukt,
  betragAlsText,
  kreuzprodukt,
  istOrthogonal,
  istKollinear,
  winkel as vektorWinkel,
  dimension,
} from '../utils/vektor';
import { ausText as bruchAusText, alsText as zahlAlsText } from '../utils/bruch';

// Der Geometrie-Bildschirm.
//
// Drei Bereiche, die im Unterricht aufeinander folgen: erst der Satz des
// Pythagoras, dann die Winkelfunktionen am selben Dreieck, dann Flächen
// und Umfänge.
//
// Wie überall rechnet der Screen nichts — utils/geometrie.js tut es, und
// die Zeichnung kommt aus components/Dreieck.js.

const BEREICHE = [
  { key: 'pythagoras', label: 'Pythagoras' },
  { key: 'winkel', label: 'Winkel' },
  { key: 'flaechen', label: 'Flächen' },
  { key: 'vektoren', label: 'Vektoren' },
];

export default function GeometrieScreen() {
  const [bereich, setBereich] = useState('pythagoras');

  return (
    <ScreenGeruest titel="Geometrie" untertitel="Rechtwinklige Dreiecke, Flächen und Umfänge">
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

      {bereich === 'pythagoras' ? <Pythagoras /> : null}
      {bereich === 'winkel' ? <Winkel /> : null}
      {bereich === 'flaechen' ? <Flaechen /> : null}
      {bereich === 'vektoren' ? <Vektoren /> : null}
    </ScreenGeruest>
  );
}

// --------------------------------------------------------------------
// Vektoren
// --------------------------------------------------------------------
//
// Sie stehen hier und nicht in einem eigenen Tab, weil der Betrag aus
// dem Satz des Pythagoras kommt — der zwei Reiter weiter links steht.
// Wer den Zusammenhang sehen soll, darf nicht durch die App wandern
// müssen.

function Vektoren() {
  const [a1, setA1] = useState('3');
  const [a2, setA2] = useState('4');
  const [a3, setA3] = useState('0');
  const [b1, setB1] = useState('1');
  const [b2, setB2] = useState('1');
  const [b3, setB3] = useState('0');
  const [imRaum, setImRaum] = useState(false);

  const ergebnis = useMemo(
    () => rechneVektoren([a1, a2, a3], [b1, b2, b3], imRaum),
    [a1, a2, a3, b1, b2, b3, imRaum]
  );

  return (
    <View>
      <View style={styles.umschalterKlein}>
        <Pressable
          style={[styles.reiter, !imRaum && styles.reiterAktiv]}
          onPress={() => setImRaum(false)}
        >
          <Text style={[styles.reiterText, !imRaum && styles.reiterTextAktiv]}>Ebene</Text>
        </Pressable>
        <Pressable
          style={[styles.reiter, imRaum && styles.reiterAktiv]}
          onPress={() => setImRaum(true)}
        >
          <Text style={[styles.reiterText, imRaum && styles.reiterTextAktiv]}>Raum</Text>
        </Pressable>
      </View>

      <VektorFelder
        name="a"
        werte={[a1, a2, a3]}
        setzen={[setA1, setA2, setA3]}
        imRaum={imRaum}
      />
      <VektorFelder
        name="b"
        werte={[b1, b2, b3]}
        setzen={[setB1, setB2, setB3]}
        imRaum={imRaum}
      />
      <ZahlenTasten />

      {ergebnis.fehler ? (
        <Text style={styles.hinweis}>{ergebnis.fehler}</Text>
      ) : (
        <View style={styles.ergebnisKasten}>
          <Zeile titel="a + b" wert={ergebnis.summe} thema="vektor" />
          <Zeile titel="a − b" wert={ergebnis.differenz} />
          <Zeile titel="2 · a" wert={ergebnis.doppelt} />
          <Zeile titel="|a|" wert={ergebnis.betragA} thema="vektor" />
          <Zeile titel="|b|" wert={ergebnis.betragB} />
          <Zeile titel="a · b" wert={ergebnis.skalar} thema="skalarprodukt" />
          {ergebnis.kreuz ? <Zeile titel="a × b" wert={ergebnis.kreuz} thema="skalarprodukt" /> : null}
          <Zeile titel="Winkel" wert={ergebnis.winkelText} thema="trigonometrie" />

          <Text style={styles.deutung}>{ergebnis.deutung}</Text>
        </View>
      )}
    </View>
  );
}

function VektorFelder({ name, werte, setzen, imRaum }) {
  const anzahl = imRaum ? 3 : 2;
  return (
    <View style={styles.vektorReihe}>
      <Text style={styles.vektorName}>{name} =</Text>
      {Array.from({ length: anzahl }, (unused, i) => (
        <TextInput
          key={i}
          style={styles.vektorFeld}
          value={werte[i]}
          onChangeText={setzen[i]}
        />
      ))}
    </View>
  );
}

function Zeile({ titel, wert, thema }) {
  return (
    <View style={styles.vektorZeile}>
      <View style={styles.vektorZeileKopf}>
        <Text style={styles.vektorZeileTitel}>{titel}</Text>
        {thema ? <InfoButton thema={thema} /> : null}
      </View>
      <Text style={styles.vektorZeileWert}>{wert}</Text>
    </View>
  );
}

function rechneVektoren(rohA, rohB, imRaum) {
  const anzahl = imRaum ? 3 : 2;
  let a;
  let b;
  try {
    a = vektor(...rohA.slice(0, anzahl).map((t) => bruchAusText(String(t).trim().replace('−', '-'))));
    b = vektor(...rohB.slice(0, anzahl).map((t) => bruchAusText(String(t).trim().replace('−', '-'))));
  } catch {
    return { fehler: 'Trage in jedes Feld eine Zahl ein.' };
  }

  const w = vektorWinkel(a, b);
  const senkrecht = istOrthogonal(a, b);
  const parallel = istKollinear(a, b);

  // Die Deutung ist der eigentliche Zweck: Zahlen allein sagen nichts.
  // Dass das Skalarprodukt null ist, heißt "senkrecht" — und das ist
  // exakt, auch wenn die Gradzahl gerundet ist.
  let deutung;
  if (senkrecht) {
    deutung =
      'Das Skalarprodukt ist null — die beiden Vektoren stehen senkrecht aufeinander. ' +
      'Diese Aussage ist exakt, nicht gerundet.';
  } else if (parallel) {
    deutung =
      'Der eine Vektor ist ein Vielfaches des anderen — sie zeigen in dieselbe oder in ' +
      'die genau entgegengesetzte Richtung und spannen keine Fläche auf.';
  } else {
    deutung =
      `Die Vektoren schließen einen Winkel von etwa ${w.art === 'winkel' ? zahlKurz(w.grad) : '?'}° ein. ` +
      'Der Winkel ist gerundet — das Skalarprodukt darüber ist exakt.';
  }

  return {
    summe: vektorAlsText(addiere(a, b)),
    differenz: vektorAlsText(subtrahiere(a, b)),
    doppelt: vektorAlsText(strecke(a, 2)),
    betragA: betragAlsText(a),
    betragB: betragAlsText(b),
    skalar: zahlAlsText(skalarprodukt(a, b)).replace('-', '−'),
    kreuz: imRaum ? vektorAlsText(kreuzprodukt(a, b)) : null,
    winkelText: w.art === 'winkel' ? `${zahlKurz(w.grad)}° (gerundet)` : w.grund,
    deutung,
  };
}

function zahlKurz(zahlWert) {
  return String(Math.round(zahlWert * 100) / 100).replace('.', ',');
}

// Merkt sich das zuletzt angetippte Feld, damit eine Leiste für mehrere
// Felder reicht.
function useAktivesFeld() {
  const [feld, setFeld] = useState(null);
  return {
    aktiv: feld !== null,
    merkeFeld: (setWert, holeWert) => setFeld({ setWert, holeWert }),
    anhaengen: (zeichen) => feld && feld.setWert(feld.holeWert() + zeichen),
    letztesWeg: () => feld && feld.setWert(feld.holeWert().slice(0, -1)),
  };
}

function Feld({ label, wert, setWert, merkeFeld, platzhalter }) {
  return (
    <View style={styles.feldSpalte}>
      <Text style={styles.feldLabel}>{label}</Text>
      <TextInput
        style={styles.feld}
        value={wert}
        onChangeText={setWert}
        onFocus={() => merkeFeld(setWert, () => wert)}
        keyboardType="numbers-and-punctuation"
        placeholder={platzhalter ?? '?'}
        placeholderTextColor={farben.textSehrLeise}
      />
    </View>
  );
}

// --------------------------------------------------------------------
// Pythagoras
// --------------------------------------------------------------------

function Pythagoras() {
  const feld = useAktivesFeld();
  const [a, setA] = useState('3');
  const [b, setB] = useState('4');
  const [c, setC] = useState('');
  const { width } = useWindowDimensions();

  const ergebnis = useMemo(() => {
    try {
      return { weg: pythagoras({ a: zahlOderNull(a), b: zahlOderNull(b), c: zahlOderNull(c) }) };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [a, b, c]);

  const breite = Math.min(width - 60, 330);

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Zwei Seiten eintragen, die dritte bleibt leer</Text>
        <InfoButton thema="pythagoras" />
      </View>

      <View style={styles.feldReihe}>
        <Feld label="Kathete a" wert={a} setWert={setA} merkeFeld={feld.merkeFeld} />
        <Feld label="Kathete b" wert={b} setWert={setB} merkeFeld={feld.merkeFeld} />
        <Feld label="Hypotenuse c" wert={c} setWert={setC} merkeFeld={feld.merkeFeld} />
      </View>
      <ZahlenTasten aufTaste={feld.anhaengen} aufLoeschen={feld.letztesWeg} aktiv={feld.aktiv} />

      {ergebnis.fehler ? (
        <Fehlerkasten text={ergebnis.fehler} />
      ) : (
        <>
          <View style={styles.bildRahmen}>
            <Dreieck
              a={ergebnis.weg.gesucht === 'a' ? ergebnis.weg.naeherung : zahlOderNull(a)}
              b={ergebnis.weg.gesucht === 'b' ? ergebnis.weg.naeherung : zahlOderNull(b)}
              breite={breite}
              hoehe={Math.round(breite * 0.7)}
            />
          </View>

          <Rechenweg schritte={ergebnis.weg.schritte} />

          <View style={styles.ergebnisKasten}>
            <Text style={styles.ergebnis}>
              {ergebnis.weg.gesucht} = {ergebnis.weg.ergebnisText}
            </Text>
            {/* Eine Wurzel, die aufgeht, braucht keine Näherung daneben.
                Eine, die nicht aufgeht, braucht beides: √13 ist die
                Antwort, 3,606 ihre Näherung. */}
            {ergebnis.weg.exakt ? null : (
              <Text style={styles.nebenbei}>ungefähr {zahlText(ergebnis.weg.naeherung)}</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

// --------------------------------------------------------------------
// Winkel
// --------------------------------------------------------------------

function Winkel() {
  const feld = useAktivesFeld();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('10');
  const [alpha, setAlpha] = useState('30');
  const { width } = useWindowDimensions();

  const ergebnis = useMemo(() => {
    try {
      return {
        d: rechtwinkligesDreieck({
          a: zahlOderNull(a),
          b: zahlOderNull(b),
          c: zahlOderNull(c),
          alpha: zahlOderNull(alpha),
        }),
      };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [a, b, c, alpha]);

  const breite = Math.min(width - 60, 330);

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Zwei Angaben, davon mindestens eine Seite</Text>
        <InfoButton thema="trigonometrie" />
      </View>

      <View style={styles.feldReihe}>
        <Feld label="a (Gegenkathete)" wert={a} setWert={setA} merkeFeld={feld.merkeFeld} />
        <Feld label="b (Ankathete)" wert={b} setWert={setB} merkeFeld={feld.merkeFeld} />
      </View>
      <View style={styles.feldReihe}>
        <Feld label="c (Hypotenuse)" wert={c} setWert={setC} merkeFeld={feld.merkeFeld} />
        <Feld label="Winkel α in Grad" wert={alpha} setWert={setAlpha} merkeFeld={feld.merkeFeld} />
      </View>
      <ZahlenTasten aufTaste={feld.anhaengen} aufLoeschen={feld.letztesWeg} aktiv={feld.aktiv} />

      {ergebnis.fehler ? (
        <Fehlerkasten text={ergebnis.fehler} />
      ) : (
        <>
          <View style={styles.bildRahmen}>
            <Dreieck
              a={ergebnis.d.a}
              b={ergebnis.d.b}
              alpha={ergebnis.d.alpha}
              beta={ergebnis.d.beta}
              breite={breite}
              hoehe={Math.round(breite * 0.7)}
            />
          </View>

          <Rechenweg schritte={ergebnis.d.schritte} />

          <View style={styles.ergebnisKasten}>
            <Text style={styles.werteZeile}>
              a = {zahlText(ergebnis.d.a)}   b = {zahlText(ergebnis.d.b)}   c ={' '}
              {zahlText(ergebnis.d.c)}
            </Text>
            <Text style={styles.werteZeile}>
              α = {zahlText(ergebnis.d.alpha)}°   β = {zahlText(ergebnis.d.beta)}°   γ = 90°
            </Text>
            <Text style={styles.nebenbei}>
              Die Winkelsumme ist 180° — das gilt in jedem Dreieck und ist hier die Probe.
            </Text>
            {/* sin 37° lässt sich nicht hinschreiben. Eine App, die das
                verschweigt, täuscht Genauigkeit vor. */}
            <Text style={styles.nebenbei}>
              Sobald Winkel im Spiel sind, wird gerundet: sin 37° ist keine Zahl, die sich
              exakt aufschreiben lässt.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

// --------------------------------------------------------------------
// Flächen
// --------------------------------------------------------------------

function Flaechen() {
  const feld = useAktivesFeld();
  const [formId, setFormId] = useState('rechteck');
  const [masse, setMasse] = useState({ a: '5', b: '3' });

  const form = FORMEN[formId];

  function wechsle(neu) {
    setFormId(neu);
    const start = {};
    for (const f of FORMEN[neu].felder) {
      start[f.id] = '4';
    }
    setMasse(start);
  }

  const ergebnis = useMemo(() => {
    try {
      const zahlen = {};
      for (const f of form.felder) {
        zahlen[f.id] = zahlOderNull(masse[f.id]);
      }
      return { e: berechneForm(formId, zahlen) };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [formId, masse]);

  return (
    <View>
      <Text style={styles.abschnitt}>Form wählen</Text>
      <View style={styles.formReihe}>
        {Object.entries(FORMEN).map(([id, f]) => (
          <Pressable
            key={id}
            style={[styles.formKnopf, formId === id && styles.formKnopfAktiv]}
            onPress={() => wechsle(id)}
          >
            <Text style={[styles.formText, formId === id && styles.formTextAktiv]}>{f.titel}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.feldReihe}>
        {form.felder.map((f) => (
          <Feld
            key={f.id}
            label={f.label}
            wert={masse[f.id] ?? ''}
            setWert={(wert) => setMasse((alt) => ({ ...alt, [f.id]: wert }))}
            merkeFeld={feld.merkeFeld}
          />
        ))}
      </View>
      <ZahlenTasten aufTaste={feld.anhaengen} aufLoeschen={feld.letztesWeg} aktiv={feld.aktiv} />

      {ergebnis.fehler ? (
        <Fehlerkasten text={ergebnis.fehler} />
      ) : (
        <View>
          <Text style={styles.formel}>{form.flaecheFormel}</Text>
          <Text style={styles.zeile}>{ergebnis.e.flaecheSchritt}</Text>

          {form.umfangFormel ? (
            <>
              <Text style={[styles.formel, styles.formelZweite]}>{form.umfangFormel}</Text>
              <Text style={styles.zeile}>{ergebnis.e.umfangSchritt}</Text>
            </>
          ) : null}

          <View style={styles.ergebnisKasten}>
            <Text style={styles.ergebnis}>
              A = {bruchAlsText(ergebnis.e.flaeche).replace('-', '−')}
              {ergebnis.e.mitPi ? 'π' : ''}
            </Text>
            {ergebnis.e.mitPi ? (
              <Text style={styles.nebenbei}>ungefähr {zahlText(ergebnis.e.flaecheZahl)}</Text>
            ) : null}

            {ergebnis.e.umfang !== null ? (
              <Text style={[styles.ergebnis, styles.ergebnisZweite]}>
                U = {bruchAlsText(ergebnis.e.umfang).replace('-', '−')}
                {ergebnis.e.mitPi ? 'π' : ''}
              </Text>
            ) : null}
            {ergebnis.e.mitPi && ergebnis.e.umfang !== null ? (
              <Text style={styles.nebenbei}>ungefähr {zahlText(ergebnis.e.umfangZahl)}</Text>
            ) : null}
          </View>

          {/* Wo kein Umfang berechenbar ist, wird auch keiner behauptet. */}
          {form.hinweis ? <Text style={styles.hinweis}>{form.hinweis}</Text> : null}
        </View>
      )}
    </View>
  );
}

// --------------------------------------------------------------------

function Rechenweg({ schritte }) {
  return (
    <View style={styles.wegKasten}>
      {schritte.map((s, i) => (
        <View key={i}>
          <Text style={styles.regel}>| {s.regel}</Text>
          <Text style={styles.zeile}>{s.text}</Text>
        </View>
      ))}
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

function zahlOderNull(text) {
  const sauber = String(text).trim().replace('−', '-').replace(',', '.');
  if (sauber === '') {
    return null;
  }
  return /^-?\d+(\.\d+)?$/.test(sauber) ? Number(sauber) : sauber;
}

const styles = StyleSheet.create({
  umschalterKlein: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  vektorReihe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vektorName: {
    fontSize: 17,
    fontWeight: '700',
    color: farben.text,
    width: 34,
  },
  vektorFeld: {
    flex: 1,
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    color: farben.text,
  },
  vektorZeile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  vektorZeileKopf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vektorZeileTitel: {
    fontSize: 15,
    color: farben.textLeise,
  },
  vektorZeileWert: {
    fontSize: 17,
    fontWeight: '600',
    color: farben.primaer,
  },
  deutung: {
    fontSize: 14,
    color: farben.textLeise,
    marginTop: 10,
    lineHeight: 20,
  },
  umschalter: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  reiter: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: farben.trenner,
    alignItems: 'center',
  },
  reiterAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  reiterText: { fontSize: 14, color: farben.primaerDunkel },
  reiterTextAktiv: { color: farben.weiss, fontWeight: '700' },

  abschnitt: { fontSize: 14, fontWeight: '700', color: farben.textLeise, marginBottom: 8 },
  zeileMitKnopf: { flexDirection: 'row', alignItems: 'center', gap: 6 },

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

  formReihe: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  formKnopf: {
    borderWidth: 1,
    borderColor: farben.trenner,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  formKnopfAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  formText: { fontSize: 13, color: farben.primaerDunkel },
  formTextAktiv: { color: farben.weiss, fontWeight: '700' },

  bildRahmen: { alignItems: 'center', marginVertical: 14 },

  wegKasten: { marginTop: 4 },
  formel: { fontSize: 16, color: farben.primaer, marginBottom: 4 },
  formelZweite: { marginTop: 14 },
  zeile: { fontSize: 17, color: farben.text, marginBottom: 2 },
  regel: { fontSize: 13, color: farben.primaer, marginLeft: 18, marginTop: 6, marginBottom: 2 },

  ergebnisKasten: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.hintergrundHell,
  },
  ergebnis: { fontSize: 22, fontWeight: '700', color: farben.primaerDunkel },
  ergebnisZweite: { marginTop: 10 },
  werteZeile: { fontSize: 16, color: farben.text, marginBottom: 4 },
  nebenbei: { fontSize: 13, color: farben.textLeise, marginTop: 4, lineHeight: 19 },
  hinweis: { fontSize: 13, color: farben.textLeise, marginTop: 12, lineHeight: 19 },

  fehlerKasten: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.falschHintergrund,
    marginTop: 14,
  },
  fehlerTitel: { fontSize: 16, fontWeight: '700', color: farben.falsch },
  fehlerText: { fontSize: 14, color: farben.text, marginTop: 6, lineHeight: 20 },
});
