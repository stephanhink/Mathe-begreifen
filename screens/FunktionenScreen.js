import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import FeldLabel from '../components/FeldLabel';
import InfoButton from '../components/InfoButton';
import MatheFeld from '../components/MatheFeld';
import Funktionsgraph from '../components/Funktionsgraph';
import { farben } from '../utils/konstanten';
import { parseTerm } from '../utils/parser';
import { auswerteExakt } from '../utils/term';
import { funktionsvariable, passenderBereich, xBereichUm } from '../utils/graph';
import { beschreibe, nullstellen, scheitelpunkt, yAchsenabschnitt, wertetabelle } from '../utils/funktion';
import { ableite, ableiteMehrfach, tangente, REGELN } from '../utils/ableitung';
import { integriere, bestimmtesIntegral, flaeche } from '../utils/integral';
import { alsText as termAlsText } from '../utils/term';
import { alsText as bruchAlsText, ausText as bruchAusText } from '../utils/bruch';

// Der Funktionen-Bildschirm: eintippen, sehen, verstehen.
//
// Der Screen rechnet nichts. Was die Funktion ausmacht, steht in
// utils/funktion.js; wo die Kurve verläuft, in utils/graph.js. Hier
// werden nur Eingabe, Bild und Text zusammengesetzt.

const BEISPIELE = [
  { text: '2x + 3', was: 'Gerade' },
  { text: '-0,5x + 4', was: 'fallende Gerade' },
  { text: 'x^2', was: 'Normalparabel' },
  { text: 'x^2 - 6x + 8', was: 'Parabel mit zwei Nullstellen' },
  { text: '-x^2 + 4', was: 'nach unten geöffnet' },
  { text: '(x-2)^2 + 1', was: 'verschoben' },
  { text: 'x^2 + 1', was: 'ohne Nullstelle' },
  { text: '1/x', was: 'Definitionslücke' },
  { text: '√x', was: 'nur für x ≥ 0' },
];

// Das Beispielmaterial aus dem Konzept: Die Physik bekommt keinen
// eigenen Bereich, sondern sitzt dort, wo das Werkzeug erklärt wird.
const PHYSIK = {
  text: '20t',
  frage: 'Weg-Zeit-Diagramm: s = 20t',
  erklaerung:
    'Ein Auto fährt mit gleichbleibender Geschwindigkeit. Die Steigung des Graphen IST die ' +
    'Geschwindigkeit — hier 20 Meter pro Sekunde. Wird die Gerade steiler, fährt es schneller.',
};

function untersuche(eingabe) {
  const text = eingabe.trim();
  if (text === '') {
    return { leer: true };
  }

  let term;
  try {
    term = parseTerm(text);
  } catch (fehler) {
    return { fehler: fehler.message };
  }

  try {
    const name = funktionsvariable(term);
    const punkte = besonderePunkte(term, name);

    // Erst der x-Bereich nach den besonderen Stellen, dann der y-Bereich
    // darin. Andersherum sähe man bei einer Parabel nur den Rand.
    const xBereich = xBereichUm([0, ...punkte.map((p) => p.x)]);
    const fenster = { ...xBereich, ...passenderBereich(term, name, xBereich) };

    return {
      term,
      name,
      fenster,
      beschreibung: beschreibe(term, name),
      punkte,
      tabelle: wertetabelle(term, name, { von: -3, bis: 3, schritt: 1 }),
    };
  } catch (fehler) {
    return { fehler: fehler.message };
  }
}

// Die Ableitung und die Tangente an einer wählbaren Stelle.
//
// Der Screen rechnet auch hier nichts: ableite() und tangente() stehen
// in utils/ableitung.js und sind gegen den Differenzenquotienten
// geprüft.
function untersucheAbleitung(term, name, stelleText) {
  const e = ableite(term, name);
  if (e.art !== 'ableitung') {
    return { unklar: e.grund };
  }

  let stelle = null;
  try {
    stelle = bruchAusText(String(stelleText).trim().replace('−', '-'));
  } catch {
    stelle = null;
  }

  let t = null;
  let beruehrpunkt = null;
  if (stelle !== null) {
    try {
      const gefunden = tangente(term, stelle, name);
      if (gefunden.art === 'tangente') {
        t = gefunden;
        beruehrpunkt = {
          x: stelle.z / stelle.n,
          y: gefunden.beruehrpunkt.z / gefunden.beruehrpunkt.n,
        };
      }
    } catch {
      t = null;
    }
  }

  const zweite = ableiteMehrfach(term, 2, name);
  return {
    ableitung: e.ableitung,
    schritte: e.schritte,
    zweite: zweite.art === 'ableitung' ? zweite.ableitung : null,
    tangente: t,
    beruehrpunkt,
  };
}

function Ableitung({ analysis, stelleText, setStelleText, name }) {
  if (!analysis) {
    return null;
  }
  if (analysis.unklar) {
    return (
      <View style={styles.abschnitt}>
        <View style={styles.angabeKopf}>
          <Text style={styles.abschnittTitel}>Ableitung</Text>
          <InfoButton thema="ableitung" />
        </View>
        <Text style={styles.angabeErklaerung}>{analysis.unklar}</Text>
      </View>
    );
  }

  return (
    <View style={styles.abschnitt}>
      <View style={styles.angabeKopf}>
        <Text style={styles.abschnittTitel}>Ableitung</Text>
        <InfoButton thema="ableitung" />
      </View>

      <Text style={styles.ableitungZeile}>
        f′({name}) = {termAlsText(analysis.ableitung)}
      </Text>
      {analysis.zweite ? (
        <Text style={styles.ableitungZweite}>
          f″({name}) = {termAlsText(analysis.zweite)}
        </Text>
      ) : null}

      {/* Der Rechenweg — jede Regel mit Namen. Das ist der Grund, warum
          es diese App gibt: nicht das Ergebnis, sondern der Weg. */}
      <View style={styles.regelnKasten}>
        {analysis.schritte.map((s, i) => (
          <Text key={i} style={styles.regelZeile}>
            <Text style={styles.regelName}>{s.regel}</Text>
            {'  '}
            {s.text}
          </Text>
        ))}
      </View>

      <View style={styles.angabeKopf}>
        <Text style={styles.abschnittTitel}>Tangente anlegen</Text>
        <InfoButton thema="tangente" />
      </View>
      <View style={styles.stelleReihe}>
        <Text style={styles.stelleLabel}>bei {name} =</Text>
        <TextInput
          style={styles.stelleFeld}
          value={stelleText}
          onChangeText={setStelleText}
          placeholder="1"
        />
      </View>

      {analysis.tangente ? (
        <View style={styles.tangenteKasten}>
          <Text style={styles.angabeWert}>y = {termAlsText(analysis.tangente.term)}</Text>
          <Text style={styles.angabeErklaerung}>
            Die Steigung dort ist {bruchAlsText(analysis.tangente.steigung)}. So schnell wächst
            die Funktion an dieser Stelle — die gestrichelte Gerade im Bild berührt die Kurve
            genau da und läuft in dieselbe Richtung.
          </Text>
        </View>
      ) : (
        <Text style={styles.angabeErklaerung}>
          Trage eine Zahl ein, dann wird die Tangente dort eingezeichnet.
        </Text>
      )}
    </View>
  );
}

// Stammfunktion, bestimmtes Integral und der Unterschied zur Fläche.
function untersucheIntegral(term, name, vonText, bisText, punkte) {
  const F = integriere(term, name);
  if (F.art !== 'stammfunktion') {
    return { unklar: F.grund };
  }

  let von = null;
  let bis = null;
  try {
    von = bruchAusText(String(vonText).trim().replace('−', '-'));
    bis = bruchAusText(String(bisText).trim().replace('−', '-'));
  } catch {
    return { F };
  }
  if (von.z / von.n >= bis.z / bis.n) {
    return { F, hinweis: 'Die untere Grenze muss kleiner sein als die obere.' };
  }

  let integral = null;
  let bereich = null;
  try {
    integral = bestimmtesIntegral(term, von, bis, name);
    // Die Nullstellen im Bereich trennen die Stücke über und unter der
    // Achse. Ohne sie wäre die Flächenangabe falsch — und zwar genau
    // dort, wo die meisten sich vertun.
    const stellen = punkte.filter((p) => Math.abs(p.y) < 1e-12).map((p) => p.x);
    bereich = flaeche(term, von, bis, stellen, name);
  } catch {
    integral = null;
  }

  return { F, integral, bereich, von, bis };
}

function Integral({ stammfunktion, vonText, setVonText, bisText, setBisText, name }) {
  if (!stammfunktion) {
    return null;
  }
  if (stammfunktion.unklar) {
    return (
      <View style={styles.abschnitt}>
        <View style={styles.angabeKopf}>
          <Text style={styles.abschnittTitel}>Stammfunktion</Text>
          <InfoButton thema="integral" />
        </View>
        <Text style={styles.angabeErklaerung}>{stammfunktion.unklar}</Text>
      </View>
    );
  }

  const { F, integral, bereich } = stammfunktion;

  return (
    <View style={styles.abschnitt}>
      <View style={styles.angabeKopf}>
        <Text style={styles.abschnittTitel}>Stammfunktion</Text>
        <InfoButton thema="integral" />
      </View>
      <Text style={styles.ableitungZeile}>
        F({name}) = {F.alsText}
      </Text>
      <Text style={styles.angabeErklaerung}>
        Das + C gehört dazu: Beim Ableiten fällt jede Konstante weg, rückwärts weiß man
        deshalb nicht, welche es war. Beim bestimmten Integral hebt es sich auf.
      </Text>

      <View style={styles.stelleReihe}>
        <Text style={styles.stelleLabel}>∫ von</Text>
        <TextInput style={styles.stelleFeld} value={vonText} onChangeText={setVonText} />
        <Text style={styles.stelleLabel}>bis</Text>
        <TextInput style={styles.stelleFeld} value={bisText} onChangeText={setBisText} />
      </View>

      {stammfunktion.hinweis ? (
        <Text style={styles.angabeErklaerung}>{stammfunktion.hinweis}</Text>
      ) : null}

      {integral && integral.art === 'integral' ? (
        <View style={styles.tangenteKasten}>
          <Text style={styles.angabeWert}>
            F({bruchAlsText(integral.bis)}) − F({bruchAlsText(integral.von)}) ={' '}
            {bruchAlsText(integral.oben)} − {bruchAlsText(integral.unten)} ={' '}
            {bruchAlsText(integral.wert)}
          </Text>

          {/* Der Punkt, an dem sich fast jeder einmal vertut. */}
          {bereich && bereich.unterschied ? (
            <View style={styles.warnKasten}>
              <View style={styles.angabeKopf}>
                <Text style={styles.warnTitel}>Fläche ist hier NICHT das Integral</Text>
                <InfoButton thema="flaeche" />
              </View>
              <Text style={styles.angabeErklaerung}>
                Ein Stück der Kurve liegt unter der x-Achse und zählt deshalb negativ. Das
                Integral ist {bruchAlsText(integral.wert)}, der Flächeninhalt dagegen{' '}
                {String(Math.round(bereich.inhalt * 1e6) / 1e6).replace('.', ',')}. Für die
                Fläche muss man an den Nullstellen trennen und die Beträge addieren.
              </Text>
            </View>
          ) : bereich ? (
            <Text style={styles.angabeErklaerung}>
              Hier liegt nichts unter der x-Achse — Integral und Flächeninhalt sind
              dasselbe.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// Nullstellen, Scheitel und der Schnittpunkt mit der y-Achse — die
// Punkte, die man im Heft einzeichnet.
function besonderePunkte(term, name) {
  const punkte = [];

  const n = nullstellen(term, name);
  for (const stelle of n.stellen) {
    try {
      punkte.push({ x: Number(auswerteExakt(stelle).z) / Number(auswerteExakt(stelle).n), y: 0 });
    } catch {
      /* irrational — dann eben ohne Markierung */
    }
  }

  const y0 = yAchsenabschnitt(term, name);
  if (!y0.fehlt) {
    punkte.push({ x: 0, y: y0.wert.z / y0.wert.n });
  }

  const s = scheitelpunkt(term, name);
  if (s) {
    punkte.push({ x: s.x.z / s.x.n, y: s.y.z / s.y.n });
  }

  return punkte;
}

export default function FunktionenScreen() {
  const [eingabe, setEingabe] = useState('x^2 - 6x + 8');
  // Die Stelle, an der die Tangente anliegt. Sie gehört zum Bildschirm
  // und nicht zur Funktion: Man will dieselbe Kurve an verschiedenen
  // Stellen anfassen — genau darum heißt die App "begreifen".
  const [stelleText, setStelleText] = useState('1');
  const [vonText, setVonText] = useState('0');
  const [bisText, setBisText] = useState('2');
  const { width } = useWindowDimensions();

  const ergebnis = useMemo(() => untersuche(eingabe), [eingabe]);
  const analysis = useMemo(
    () => (ergebnis.term ? untersucheAbleitung(ergebnis.term, ergebnis.name, stelleText) : null),
    [ergebnis.term, ergebnis.name, stelleText]
  );
  const stammfunktion = useMemo(
    () =>
      ergebnis.term
        ? untersucheIntegral(ergebnis.term, ergebnis.name, vonText, bisText, ergebnis.punkte)
        : null,
    [ergebnis.term, ergebnis.name, vonText, bisText, ergebnis.punkte]
  );
  const breite = Math.min(width - 48, 420);


  return (
    <ScreenGeruest titel="Funktionen" untertitel="Eintippen, sehen, verstehen">
      <FeldLabel thema="funktion">f(x) =</FeldLabel>
      <MatheFeld
        wert={eingabe}
        setWert={setEingabe}
        platzhalter="z. B. x^2 − 6x + 8"
      />

      <View style={styles.beispiele}>
        {BEISPIELE.map((b) => (
          <Pressable key={b.text} style={styles.beispiel} onPress={() => setEingabe(b.text)}>
            <Text style={styles.beispielText}>{b.text}</Text>
          </Pressable>
        ))}
      </View>

      {ergebnis.leer ? null : ergebnis.fehler ? (
        <View style={styles.fehlerKasten}>
          <Text style={styles.fehlerTitel}>Das kann ich nicht zeichnen</Text>
          <Text style={styles.fehlerText}>{ergebnis.fehler}</Text>
        </View>
      ) : (
        <>
          <View style={styles.graphRahmen}>
            <Funktionsgraph
              term={ergebnis.term}
              name={ergebnis.name}
              fenster={ergebnis.fenster}
              breite={breite}
              hoehe={Math.round(breite * 0.75)}
              punkte={
                analysis && analysis.tangente
                  ? [...ergebnis.punkte, analysis.beruehrpunkt]
                  : ergebnis.punkte
              }
              nebenkurve={analysis && analysis.tangente ? analysis.tangente.term : null}
            />
          </View>

          <Ableitung
            analysis={analysis}
            stelleText={stelleText}
            setStelleText={setStelleText}
            name={ergebnis.name}
          />
          <Integral
            stammfunktion={stammfunktion}
            vonText={vonText}
            setVonText={setVonText}
            bisText={bisText}
            setBisText={setBisText}
            name={ergebnis.name}
          />
          <Beschreibung beschreibung={ergebnis.beschreibung} />
          <Wertetabelle zeilen={ergebnis.tabelle} name={ergebnis.name} />
        </>
      )}

      <Physik aufWaehlen={() => setEingabe(PHYSIK.text)} />
    </ScreenGeruest>
  );
}

function Beschreibung({ beschreibung }) {
  return (
    <View style={styles.abschnitt}>
      <Text style={styles.abschnittTitel}>Was man daran ablesen kann</Text>
      {beschreibung.angaben.map((angabe) => (
        <View key={angabe.titel} style={styles.angabe}>
          <View style={styles.angabeKopf}>
            <Text style={styles.angabeTitel}>{angabe.titel}</Text>
            {angabe.wissen ? <InfoButton thema={angabe.wissen} /> : null}
          </View>
          <Text style={styles.angabeWert}>{angabe.wert}</Text>
          <Text style={styles.angabeErklaerung}>{angabe.erklaerung}</Text>
        </View>
      ))}
    </View>
  );
}

function Wertetabelle({ zeilen, name }) {
  return (
    <View style={styles.abschnitt}>
      <View style={styles.angabeKopf}>
        <Text style={styles.abschnittTitel}>Wertetabelle</Text>
        <InfoButton thema="wertetabelle" />
      </View>
      <View style={styles.tabelle}>
        <View style={styles.tabellenZeile}>
          <Text style={[styles.zelle, styles.zelleKopf]}>{name}</Text>
          {zeilen.map((z) => (
            <Text key={`x${z.x}`} style={styles.zelle}>
              {formatZahl(z.x)}
            </Text>
          ))}
        </View>
        <View style={styles.tabellenZeile}>
          <Text style={[styles.zelle, styles.zelleKopf]}>f({name})</Text>
          {zeilen.map((z) => (
            <Text key={`y${z.x}`} style={styles.zelle}>
              {/* Wo die Funktion nicht definiert ist, steht ein Strich —
                  keine erfundene Zahl. */}
              {z.y === null ? '—' : formatZahl(z.y)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function Physik({ aufWaehlen }) {
  return (
    <Pressable style={styles.physikKasten} onPress={aufWaehlen}>
      <Text style={styles.physikTitel}>{PHYSIK.frage}</Text>
      <Text style={styles.physikText}>{PHYSIK.erklaerung}</Text>
      <Text style={styles.physikHinweis}>Antippen, um es zu zeichnen</Text>
    </Pressable>
  );
}

function formatZahl(wert) {
  const gerundet = Math.round(wert * 1000) / 1000;
  return String(gerundet).replace('.', ',').replace('-', '−');
}

const styles = StyleSheet.create({
  beispiele: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    marginBottom: 16,
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

  graphRahmen: {
    alignItems: 'center',
    marginBottom: 18,
  },

  abschnitt: {
    marginBottom: 20,
  },
  abschnittTitel: {
    fontSize: 14,
    fontWeight: '700',
    color: farben.textLeise,
    marginBottom: 8,
  },
  angabe: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: farben.trenner,
  },
  ableitungZeile: {
    fontSize: 19,
    color: farben.primaer,
    fontWeight: '700',
    marginTop: 4,
  },
  ableitungZweite: {
    fontSize: 15,
    color: farben.textLeise,
    marginTop: 2,
  },
  regelnKasten: {
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: farben.trenner,
  },
  regelZeile: {
    fontSize: 13,
    color: farben.textLeise,
    marginBottom: 3,
  },
  regelName: {
    color: farben.primaer,
    fontWeight: '600',
  },
  stelleReihe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  stelleLabel: {
    fontSize: 15,
    color: farben.text,
  },
  stelleFeld: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    minWidth: 80,
    color: farben.text,
  },
  tangenteKasten: {
    marginTop: 8,
  },
  warnKasten: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: farben.warnungHintergrund,
  },
  warnTitel: {
    fontSize: 14,
    fontWeight: '700',
    color: farben.warnung,
  },
  angabeKopf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  angabeTitel: {
    fontSize: 13,
    color: farben.textLeise,
  },
  angabeWert: {
    fontSize: 18,
    color: farben.primaerDunkel,
    fontWeight: '700',
    marginTop: 2,
  },
  angabeErklaerung: {
    fontSize: 14,
    color: farben.text,
    lineHeight: 20,
    marginTop: 3,
  },

  tabelle: {
    borderWidth: 1,
    borderColor: farben.trenner,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabellenZeile: {
    flexDirection: 'row',
  },
  zelle: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 13,
    color: farben.text,
    textAlign: 'center',
    borderWidth: 0.5,
    borderColor: farben.trenner,
  },
  zelleKopf: {
    fontWeight: '700',
    backgroundColor: farben.hintergrundHell,
    color: farben.primaerDunkel,
  },

  physikKasten: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.hintergrundHell,
    marginBottom: 10,
  },
  physikTitel: {
    fontSize: 15,
    fontWeight: '700',
    color: farben.primaerDunkel,
  },
  physikText: {
    fontSize: 14,
    color: farben.text,
    lineHeight: 20,
    marginTop: 6,
  },
  physikHinweis: {
    fontSize: 12,
    color: farben.textLeise,
    marginTop: 8,
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
});
