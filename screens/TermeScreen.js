import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import FeldLabel from '../components/FeldLabel';
import InfoButton from '../components/InfoButton';
import MatheFeld from '../components/MatheFeld';
import { farben } from '../utils/konstanten';
import { variablen, alsText as termAlsText, multipliziereAus, klammereAus } from '../utils/term';
import { alsText as gleichungAlsText } from '../utils/gleichung';
import { parseTerm, parseGleichung } from '../utils/parser';
import { stelleUm, FORMELN } from '../utils/umstellen';
import { kuerze, alsRechenweg as kuerzWeg } from '../utils/bruchterm';
import { alsText as zahlAlsText } from '../utils/bruch';

// Der Terme-Bildschirm.
//
// Zwei Bereiche, und der erste ist der eigentliche Grund für die Seite:
// Formeln umstellen. Wer das nicht kann, kann eine Formelsammlung nur
// in einer Richtung benutzen — und genau daran hängt die Physik.
//
// Der zweite Bereich ist das Handwerk am Term: ausmultiplizieren und
// ausklammern, die beiden Richtungen derselben Sache.

const BEREICHE = [
  { key: 'umstellen', label: 'Formeln umstellen' },
  { key: 'klammern', label: 'Klammern' },
  { key: 'bruchterm', label: 'Bruchterme' },
];

// Bruchterme. Der Bereich steht hier und nicht bei den Zahlen, weil man
// zum Kürzen zerlegen muss — und das Ausklammern sitzt einen Reiter
// weiter links.
//
// Wichtig ist die Reihenfolge der Anzeige: Der Definitionsbereich steht
// ÜBER dem Ergebnis, nicht darunter. Er ist die erste Frage bei einem
// Bruchterm, nicht die Fußnote.
const BRUCH_BEISPIELE = [
  ['x^2 - 1', 'x - 1'],
  ['x^2 - 4', 'x + 2'],
  ['x^2 + 5x + 6', 'x + 2'],
  ['2x^2 - 8', 'x - 2'],
  ['x^2 - 3x', 'x'],
  ['x - 1', 'x^2 + 1'],
];

function Bruchterme() {
  const [zaehler, setZaehler] = useState('x^2 - 1');
  const [nenner, setNenner] = useState('x - 1');

  const ergebnis = useMemo(() => rechneBruchterm(zaehler, nenner), [zaehler, nenner]);

  return (
    <View>
      <FeldLabel thema="bruchterm">Zähler</FeldLabel>
      <MatheFeld wert={zaehler} setWert={setZaehler} platzhalter="z. B. x^2 − 1" />
      <FeldLabel thema="definitionsbereich">Nenner</FeldLabel>
      <MatheFeld wert={nenner} setWert={setNenner} platzhalter="z. B. x − 1" />

      <View style={styles.beispiele}>
        {BRUCH_BEISPIELE.map(([z, n]) => (
          <Pressable
            key={z + n}
            style={styles.beispiel}
            onPress={() => {
              setZaehler(z);
              setNenner(n);
            }}
          >
            <Text style={styles.beispielText}>
              {z} : {n}
            </Text>
          </Pressable>
        ))}
      </View>

      {ergebnis.fehler ? (
        <View style={styles.fehlerKasten}>
          <Text style={styles.fehlerText}>{ergebnis.fehler}</Text>
        </View>
      ) : (
        <View style={styles.ergebnisKasten}>
          {/* Zuerst der Definitionsbereich. Er ist die erste Frage bei
              einem Bruchterm, nicht die Fußnote — und nach dem Kürzen
              sieht man ihm die Lücke nicht mehr an. */}
          <View style={styles.zeileMitKnopf}>
            <Text style={styles.abschnittTitel}>Definitionsbereich</Text>
            <InfoButton thema="definitionsbereich" />
          </View>
          <Text style={styles.hinweis}>{ergebnis.bereichText}</Text>

          {ergebnis.weg.map((zeile, i) => (
            <Text key={i} style={zeile.startsWith(' ') ? styles.regel : styles.zeile}>
              {zeile}
            </Text>
          ))}

          {ergebnis.vorbehalt ? (
            <View style={styles.warnKasten}>
              <Text style={styles.warnTitel}>Die Lücke bleibt</Text>
              <Text style={styles.hinweis}>{ergebnis.vorbehalt}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function rechneBruchterm(zaehlerText, nennerText) {
  let z;
  let n;
  try {
    z = parseTerm(zaehlerText);
    n = parseTerm(nennerText);
  } catch (fehler) {
    return { fehler: `Das kann ich nicht lesen: ${fehler.message}` };
  }

  const e = kuerze(z, n);
  if (e.art === 'unklar') {
    return { fehler: e.grund };
  }

  const stellen = e.ausgeschlossen ?? [];
  const bereichText =
    stellen.length === 0
      ? 'Der Nenner wird nie null — der Bruchterm ist für jede Zahl definiert.'
      : `Der Nenner wird null bei ${stellen
          .map((s) => `x = ${zahlAlsText(s).replace('-', '−')}`)
          .join(' und ')}. Dort ist der Bruchterm nicht definiert.`;

  return {
    bereichText,
    weg: kuerzWeg(z, n, e),
    vorbehalt: e.art === 'gekuerzt' ? e.vorbehalt : null,
  };
}

export default function TermeScreen() {
  const [bereich, setBereich] = useState('umstellen');

  return (
    <ScreenGeruest titel="Terme" untertitel="Formeln umstellen, Klammern auflösen">
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

      {bereich === 'umstellen' ? <Umstellen /> : null}
      {bereich === 'klammern' ? <Klammern /> : null}
      {bereich === 'bruchterm' ? <Bruchterme /> : null}
    </ScreenGeruest>
  );
}

// --------------------------------------------------------------------
// Formeln umstellen
// --------------------------------------------------------------------

function Umstellen() {
  const [eingabe, setEingabe] = useState('v = s/t');
  const [ziel, setZiel] = useState('t');

  const gelesen = useMemo(() => {
    try {
      return { formel: parseGleichung(eingabe.trim()) };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [eingabe]);

  const groessen = useMemo(() => {
    if (gelesen.fehler) {
      return [];
    }
    return [
      ...new Set([...variablen(gelesen.formel.links), ...variablen(gelesen.formel.rechts)]),
    ];
  }, [gelesen]);

  const ergebnis = useMemo(() => {
    if (gelesen.fehler || !groessen.includes(ziel)) {
      return null;
    }
    try {
      return stelleUm(gelesen.formel, ziel);
    } catch (fehler) {
      return { art: 'unklar', grund: fehler.message, schritte: [], vorbehalte: [] };
    }
  }, [gelesen, ziel, groessen]);

  function waehleFormel(eintrag) {
    setEingabe(gleichungAlsText(eintrag.formel));
    // Eine Größe wählen, die NICHT schon allein links steht — sonst
    // gäbe es nichts umzustellen.
    const alle = [...new Set([...variablen(eintrag.formel.links), ...variablen(eintrag.formel.rechts)])];
    const links = eintrag.formel.links;
    const schonFrei = links.art === 'variable' ? links.name : null;
    setZiel(alle.find((g) => g !== schonFrei) ?? alle[0]);
  }

  return (
    <View>
      <View style={styles.kasten}>
        <Text style={styles.absatz}>
          Eine Formel nach einer anderen Größe aufzulösen ist die Fertigkeit, ohne die man
          eine Formelsammlung nur in einer Richtung benutzen kann. Aus v = s : t wird durch
          Umstellen die Antwort auf „Wie lange dauert es?"
        </Text>
      </View>

      <Text style={styles.abschnitt}>Formel aus Physik und Alltag</Text>
      <View style={styles.chips}>
        {FORMELN.map((f) => (
          <Pressable key={f.id} style={styles.chip} onPress={() => waehleFormel(f)}>
            <Text style={styles.chipText}>{f.text}</Text>
          </Pressable>
        ))}
      </View>

      <FeldLabel thema="formelUmstellen">Oder eine eigene Formel</FeldLabel>
      <MatheFeld wert={eingabe} setWert={setEingabe} platzhalter="z. B. v = s/t" />

      {gelesen.fehler ? (
        <Fehlerkasten titel="Das kann ich nicht lesen" text={gelesen.fehler} />
      ) : (
        <>
          <Text style={styles.abschnitt}>Wonach auflösen?</Text>
          <View style={styles.chips}>
            {groessen.map((g) => (
              <Pressable
                key={g}
                style={[styles.zielKnopf, ziel === g && styles.zielKnopfAktiv]}
                onPress={() => setZiel(g)}
              >
                <Text style={[styles.zielText, ziel === g && styles.zielTextAktiv]}>{g}</Text>
              </Pressable>
            ))}
          </View>

          {ergebnis === null ? (
            <Text style={styles.hinweis}>Wähle eine Größe aus.</Text>
          ) : ergebnis.art === 'unklar' ? (
            <Fehlerkasten titel="Das bekomme ich nicht aufgelöst" text={ergebnis.grund} />
          ) : (
            <View>
              <Text style={styles.zeile}>{gleichungAlsText(gelesen.formel)}</Text>
              {ergebnis.schritte.map((s, i) => (
                <View key={i}>
                  <Text style={styles.regel}>| {s.operation}</Text>
                  <Text style={styles.zeile}>{s.text}</Text>
                </View>
              ))}

              <View style={styles.ergebnisKasten}>
                <Text style={styles.ergebnis}>{gleichungAlsText(ergebnis.ergebnis)}</Text>
              </View>

              {/* Die Vorbehalte gehören dazu. Eine Formelsammlung
                  schreibt sie nicht hin, weil dort nur positive Größen
                  vorkommen — eine App, die rechnen lehrt, sollte es
                  sagen. */}
              {ergebnis.vorbehalte.length > 0 ? (
                <View style={styles.vorbehaltKasten}>
                  <View style={styles.zeileMitKnopf}>
                    <Text style={styles.vorbehaltTitel}>Dabei gilt</Text>
                    <InfoButton thema="definitionsbereich" />
                  </View>
                  {ergebnis.vorbehalte.map((v) => (
                    <Text key={v} style={styles.vorbehaltText}>
                      · {v}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </>
      )}
    </View>
  );
}

// --------------------------------------------------------------------
// Klammern
// --------------------------------------------------------------------

const KLAMMER_BEISPIELE = ['3(x + 4)', '(x + 3)^2', '(x + 3)(x - 3)', '6x + 9', 'x^2 + x', '2(3x - 1) + 4x'];

function Klammern() {
  const [eingabe, setEingabe] = useState('(x + 3)^2');

  const ergebnis = useMemo(() => {
    const text = eingabe.trim();
    if (text === '') {
      return { leer: true };
    }
    try {
      const term = parseTerm(text);
      return { term, auf: multipliziereAus(term), zu: klammereAus(term) };
    } catch (fehler) {
      return { fehler: fehler.message };
    }
  }, [eingabe]);

  return (
    <View>
      <View style={styles.kasten}>
        <Text style={styles.absatz}>
          Ausmultiplizieren und Ausklammern sind dieselbe Sache in zwei Richtungen. Deshalb
          steht hier beides nebeneinander — und die eine Richtung ist die Probe für die andere.
        </Text>
      </View>

      <FeldLabel thema="ausmultiplizieren">Term</FeldLabel>
      <MatheFeld wert={eingabe} setWert={setEingabe} platzhalter="z. B. (x + 3)^2" />

      <View style={styles.chips}>
        {KLAMMER_BEISPIELE.map((b) => (
          <Pressable key={b} style={styles.chip} onPress={() => setEingabe(b)}>
            <Text style={styles.chipText}>{b}</Text>
          </Pressable>
        ))}
      </View>

      {ergebnis.leer ? null : ergebnis.fehler ? (
        <Fehlerkasten titel="Das kann ich nicht lesen" text={ergebnis.fehler} />
      ) : (
        <>
          <Richtung
            titel="Ausmultiplizieren"
            thema="ausmultiplizieren"
            term={ergebnis.term}
            weg={ergebnis.auf}
            leerText="Hier ist keine Klammer, die sich auflösen ließe."
          />
          <Richtung
            titel="Ausklammern"
            thema="ausklammern"
            term={ergebnis.term}
            weg={ergebnis.zu}
            leerText="Hier gibt es keinen gemeinsamen Faktor, den man herausziehen könnte."
          />
        </>
      )}
    </View>
  );
}

function Richtung({ titel, thema, term, weg, leerText }) {
  const nichtsPassiert = weg.schritte.length === 0;

  return (
    <View style={styles.richtung}>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>{titel}</Text>
        <InfoButton thema={thema} />
      </View>

      {nichtsPassiert ? (
        <Text style={styles.hinweis}>{leerText}</Text>
      ) : (
        <>
          <Text style={styles.zeile}>{termAlsText(term)}</Text>
          {weg.schritte.map((s, i) => (
            <View key={i}>
              <Text style={styles.regel}>| {s.regel}</Text>
              <Text style={styles.zeile}>= {s.text}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function Fehlerkasten({ titel, text }) {
  return (
    <View style={styles.fehlerKasten}>
      <Text style={styles.fehlerTitel}>{titel}</Text>
      <Text style={styles.fehlerText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  umschalter: { flexDirection: 'row', gap: 8, marginBottom: 18 },
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

  kasten: {
    backgroundColor: farben.hintergrundHell,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  absatz: { fontSize: 14, color: farben.text, lineHeight: 21 },

  abschnitt: { fontSize: 14, fontWeight: '700', color: farben.textLeise, marginBottom: 8 },
  zeileMitKnopf: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: farben.trenner,
    backgroundColor: farben.hintergrundHell,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontSize: 13, color: farben.primaerDunkel },

  zielKnopf: {
    minWidth: 44,
    borderWidth: 1,
    borderColor: farben.trenner,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  zielKnopfAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  zielText: { fontSize: 17, color: farben.primaerDunkel },
  zielTextAktiv: { color: farben.weiss, fontWeight: '700' },

  richtung: { marginTop: 20 },
  zeile: { fontSize: 18, color: farben.text, marginBottom: 2 },
  regel: { fontSize: 13, color: farben.primaer, marginLeft: 20, marginTop: 4, marginBottom: 2 },
  hinweis: { fontSize: 14, color: farben.textLeise, lineHeight: 20 },
  abschnittTitel: { fontSize: 15, fontWeight: '700', color: farben.text },
  zeileMitKnopf: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  warnKasten: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: farben.warnungHintergrund,
  },
  warnTitel: { fontSize: 14, fontWeight: '700', color: farben.warnung, marginBottom: 4 },

  ergebnisKasten: {
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.hintergrundHell,
  },
  ergebnis: { fontSize: 22, fontWeight: '700', color: farben.primaerDunkel },

  vorbehaltKasten: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: farben.warnungHintergrund,
  },
  vorbehaltTitel: { fontSize: 14, fontWeight: '700', color: farben.warnung, marginBottom: 4 },
  vorbehaltText: { fontSize: 14, color: farben.text, lineHeight: 20 },

  fehlerKasten: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: farben.falschHintergrund,
    marginTop: 14,
  },
  fehlerTitel: { fontSize: 16, fontWeight: '700', color: farben.falsch },
  fehlerText: { fontSize: 14, color: farben.text, marginTop: 6, lineHeight: 20 },
});
