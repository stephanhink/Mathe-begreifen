import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import ScreenGeruest from '../components/ScreenGeruest';
import InfoButton from '../components/InfoButton';
import ZahlenTasten from '../components/ZahlenTasten';
import { farben } from '../utils/konstanten';
import Wozu from '../components/Wozu';
import { zinseszins, verdopplungszeit, verdopplung, zahlKurz } from '../utils/anwendung';
import { rechne, kuerze, alsKommazahl, wertAlsText } from '../utils/bruchrechnung';
import {
  prozentwert,
  grundwert,
  prozentsatz,
  veraendere,
  grundwertAusVeraendert,
  alsProzentText,
} from '../utils/prozent';
import {
  logarithmus,
  produktregel,
  quotientenregel,
  potenzregel,
  basiswechsel,
  naeherungText,
} from '../utils/logarithmus';
import { ausText as bruchAusText } from '../utils/bruch';

// Der Zahlen-Bildschirm: Brüche, Prozente und Logarithmen, alles mit
// Rechenweg.
//
// Warum eigene Module dafür und nicht der Rechner? Weil term.js zwar
// 1/2 + 1/3 ausrechnen kann, aber in einem Schritt. Der Schritt, an dem
// es tatsächlich hakt — das Gleichnamigmachen — wäre unsichtbar.
//
// Wie überall: Der Screen rechnet nichts, er ruft utils/ auf.

// Merkt sich, in welches Feld zuletzt getippt wurde — die Leiste
// darunter wirkt dann darauf. Ohne das bräuchte jedes der sechs Felder
// eine eigene Leiste.
function useAktivesFeld() {
  const [feld, setFeld] = useState(null);

  return {
    aktiv: feld !== null,
    merkeFeld: (setWert, holeWert) => setFeld({ setWert, holeWert }),
    anhaengen: (zeichen) => {
      if (feld) {
        feld.setWert(feld.holeWert() + zeichen);
      }
    },
    letztesWeg: () => {
      if (feld) {
        feld.setWert(feld.holeWert().slice(0, -1));
      }
    },
  };
}

// Der Zinseszins hängt an der Prozentrechnung und bringt die
// Exponentialfunktion hervor — deshalb steht er hier und nicht in einem
// eigenen Bereich.
function WozuZinseszins() {
  const z = zinseszins({ startkapital: 1000, zinssatz: 3, jahre: 30 });
  const v = verdopplungszeit(3);
  const cent = verdopplung({ start: 0.01, schritte: 30 });

  return (
    <>
      <Wozu
        titel="Zinseszins — hier entsteht die Exponentialfunktion"
        thema="zinseszins"
        zeilen={[
          '1000 € zu 3 % angelegt:',
          ...z.schritte.map(
            (s) => `nach ${s.jahr} Jahr${s.jahr === 1 ? '' : 'en'}:  ${s.ausgeschrieben}  =  ${s.alsPotenz}`
          ),
          { text: `nach 30 Jahren:  ${zahlKurz(z.ende)} €`, stark: true },
          `ohne Zinseszins wären es nur ${zahlKurz(z.ohneZinseszins)} € — ${zahlKurz(z.unterschied)} € weniger`,
          `Verdopplung nach ${v.jahre} Jahren, unabhängig vom Startkapital`,
        ]}
        einsicht={z.einsicht}
        vorbehalt={z.vorbehalt}
      />

      <Wozu
        titel="Ein Cent, dreißigmal verdoppelt"
        thema="wachstum"
        zeilen={[
          `nach 10 Verdopplungen:  ${zahlKurz(cent.reihe[10].wert)} €`,
          `nach 15 Verdopplungen:  ${zahlKurz(cent.reihe[15].wert)} €`,
          `nach 20 Verdopplungen:  ${zahlKurz(cent.reihe[20].wert)} €`,
          { text: `nach 30 Verdopplungen:  ${zahlKurz(cent.ende)} €`, stark: true },
        ]}
        einsicht={cent.einsicht}
        vorbehalt={cent.vorbehalt}
      />
    </>
  );
}

const BEREICHE = [
  { key: 'brueche', label: 'Brüche' },
  { key: 'prozent', label: 'Prozent' },
  { key: 'logarithmus', label: 'Logarithmus' },
];

export default function ZahlenScreen() {
  const [bereich, setBereich] = useState('brueche');

  return (
    <ScreenGeruest titel="Zahlen" untertitel="Brüche, Prozente und Logarithmen — mit Rechenweg">
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

      {bereich === 'brueche' ? <Brueche /> : null}
      {bereich === 'prozent' ? <Prozent /> : null}
      {bereich === 'logarithmus' ? <Logarithmus /> : null}
      {bereich === 'prozent' ? <WozuZinseszins /> : null}
    </ScreenGeruest>
  );
}

// --------------------------------------------------------------------
// Brüche
// --------------------------------------------------------------------

const RECHENARTEN = ['+', '−', '·', ':'];

function Brueche() {
  const feld = useAktivesFeld();
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
        <Bruchfeld
          zaehler={za}
          setZaehler={setZa}
          nenner={na}
          setNenner={setNa}
          merkeFeld={feld.merkeFeld}
        />

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

        <Bruchfeld
          zaehler={zb}
          setZaehler={setZb}
          nenner={nb}
          setNenner={setNb}
          merkeFeld={feld.merkeFeld}
        />
      </View>

      <ZahlenTasten
        aufTaste={feld.anhaengen}
        aufLoeschen={feld.letztesWeg}
        aktiv={feld.aktiv}
      />

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

function Bruchfeld({ zaehler, setZaehler, nenner, setNenner, merkeFeld }) {
  return (
    <View style={styles.bruch}>
      <TextInput
        style={styles.bruchFeld}
        value={zaehler}
        onChangeText={setZaehler}
        onFocus={() => merkeFeld?.(setZaehler, () => zaehler)}
        keyboardType="numbers-and-punctuation"
        textAlign="center"
      />
      <View style={styles.bruchstrich} />
      <TextInput
        style={styles.bruchFeld}
        value={nenner}
        onChangeText={setNenner}
        onFocus={() => merkeFeld?.(setNenner, () => nenner)}
        keyboardType="numbers-and-punctuation"
        textAlign="center"
      />
    </View>
  );
}

function Kuerzen() {
  const feld = useAktivesFeld();
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
          merkeFeld={feld.merkeFeld}
        />
      </View>

      <ZahlenTasten
        aufTaste={feld.anhaengen}
        aufLoeschen={feld.letztesWeg}
        aktiv={feld.aktiv}
      />

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
  const feld = useAktivesFeld();
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
        <Zahlenfeld
          beschriftung={frage.felder[0]}
          wert={eins}
          setWert={setEins}
          merkeFeld={feld.merkeFeld}
        />
        <Zahlenfeld
          beschriftung={frage.felder[1]}
          wert={zwei}
          setWert={setZwei}
          merkeFeld={feld.merkeFeld}
        />
      </View>

      <ZahlenTasten
        aufTaste={feld.anhaengen}
        aufLoeschen={feld.letztesWeg}
        aktiv={feld.aktiv}
      />

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

function Zahlenfeld({ beschriftung, wert, setWert, merkeFeld }) {
  return (
    <View style={styles.zahlenfeld}>
      <Text style={styles.feldLabel}>{beschriftung}</Text>
      <TextInput
        style={styles.feld}
        value={wert}
        onChangeText={setWert}
        onFocus={() => merkeFeld?.(setWert, () => wert)}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  );
}

// --------------------------------------------------------------------
// Logarithmus
// --------------------------------------------------------------------
//
// Fünf Fragen, und die erste ist die Definition selbst: „b hoch was ist
// a?". Die drei Gesetze stehen darunter als eigene Fragen, weil sie
// eigene Fertigkeiten sind — im Lernpfad ebenso (logarithmusBestimmen
// und logarithmusgesetze).
//
// Der Basiswechsel steht dabei, weil er die Frage beantwortet, die beim
// ersten Blick auf den Taschenrechner kommt: Wo ist die log₂-Taste? Es
// gibt keine, und man braucht auch keine.
const LOG_FRAGEN = [
  {
    key: 'wert',
    label: 'log_b(a) — b hoch was ist a?',
    felder: ['Basis b', 'Numerus a'],
    anfang: ['2', '32'],
    rechne: (b, a) => logarithmus(b, a),
  },
  {
    key: 'produkt',
    label: 'log_b(a · c) — die Produktregel',
    felder: ['Basis b', 'a', 'c'],
    anfang: ['2', '8', '4'],
    rechne: (b, a, c) => produktregel(b, a, c),
  },
  {
    key: 'quotient',
    label: 'log_b(a : c) — die Quotientenregel',
    felder: ['Basis b', 'a', 'c'],
    anfang: ['10', '50', '5'],
    rechne: (b, a, c) => quotientenregel(b, a, c),
  },
  {
    key: 'potenz',
    label: 'log_b(aⁿ) — die Potenzregel',
    felder: ['Basis b', 'a', 'Exponent n'],
    anfang: ['2', '8', '3'],
    rechne: (b, a, n) => potenzregel(b, a, n),
  },
  {
    key: 'wechsel',
    label: 'log_b(a) über lg ausrechnen — der Basiswechsel',
    felder: ['Basis b', 'Numerus a'],
    anfang: ['2', '7'],
    rechne: (b, a) => basiswechsel(b, a, 10),
  },
];

function Logarithmus() {
  const feld = useAktivesFeld();
  const [frageKey, setFrageKey] = useState('wert');
  const frage = LOG_FRAGEN.find((f) => f.key === frageKey);
  const [werte, setWerte] = useState(frage.anfang);

  function wechsle(neu) {
    const f = LOG_FRAGEN.find((x) => x.key === neu);
    setFrageKey(neu);
    setWerte(f.anfang);
  }

  const setzeFeld = (i) => (text) =>
    setWerte((alt) => alt.map((w, k) => (k === i ? text : w)));

  const ergebnis = useMemo(() => {
    const zahlen = frage.felder.map((_, i) => logZahl(werte[i]));
    if (zahlen.some((w) => w === null)) {
      return { fehler: 'Bitte in jedes Feld eine Zahl schreiben — ein Bruch wie 1/8 geht auch.' };
    }
    try {
      return { weg: frage.rechne(...zahlen) };
    } catch (fehler) {
      // Ablehnen heißt nicht abstürzen: log(0), die Basis 1 und ein
      // negativer Numerus haben keine Antwort, und die Meldung aus
      // logarithmus.js sagt auch, warum.
      return { fehler: fehler.message };
    }
  }, [werte, frageKey]);

  const weg = ergebnis.weg;
  // "ungefähr 0,666667" hilft bei 2/3 und ist bei 5 nur Beiwerk.
  const nebenbei =
    weg && weg.exakt && weg.ergebnis && weg.ergebnis.n !== 1
      ? `ungefähr ${naeherungText(weg.naeherung)}`
      : null;

  return (
    <View>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Was ist gesucht?</Text>
        <InfoButton thema="logarithmus" />
      </View>

      {LOG_FRAGEN.map((f) => (
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
        {frage.felder.map((beschriftung, i) => (
          <Zahlenfeld
            key={beschriftung}
            beschriftung={beschriftung}
            wert={werte[i] ?? ''}
            setWert={setzeFeld(i)}
            merkeFeld={feld.merkeFeld}
          />
        ))}
      </View>

      <ZahlenTasten
        aufTaste={feld.anhaengen}
        aufLoeschen={feld.letztesWeg}
        aktiv={feld.aktiv}
      />

      {ergebnis.fehler ? (
        <Hinweiskasten text={ergebnis.fehler} />
      ) : (
        <>
          <Rechenweg
            anfang={weg.anfang}
            schritte={weg.schritte}
            ergebnis={weg.ergebnisText}
            nebenbei={nebenbei}
            formel={weg.formel}
            roh
          />
          {weg.hinweis ? <Hinweiskasten text={weg.hinweis} /> : null}
        </>
      )}

      <LogGesetze />
    </View>
  );
}

// Die drei Gesetze stehen immer da, egal welche Frage gerade offen ist
// — und darunter der Fehler, den fast jeder einmal macht. Ihn nur zu
// vermeiden reicht nicht: Man muss ihn einmal gesehen haben.
function LogGesetze() {
  return (
    <View style={styles.unterAbschnitt}>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.abschnitt}>Die Logarithmusgesetze</Text>
        <InfoButton thema="logarithmusgesetze" />
      </View>

      <Text style={styles.formel}>log(a · c) = log a + log c</Text>
      <Text style={styles.formel}>log(a : c) = log a − log c</Text>
      <Text style={styles.formel}>log(aⁿ) = n · log a</Text>

      <View style={styles.hinweisKasten}>
        <Text style={styles.hinweisText}>
          Sie fallen nicht vom Himmel: Beim Malnehmen von Potenzen mit gleicher Basis werden die
          Exponenten addiert. Der Logarithmus IST der Exponent — also werden die Logarithmen
          addiert. Aus Malnehmen wird Addieren, aus Teilen Subtrahieren, aus Potenzieren
          Malnehmen.
        </Text>
      </View>

      <Falle text="log(a · c) ist NICHT log a · log c. Man sieht es sofort: lg(2) + lg(5) ist genau 1, weil 2 · 5 = 10 ist. lg(2) · lg(5) ist dagegen rund 0,21." />
    </View>
  );
}

// --------------------------------------------------------------------
// Gemeinsames
// --------------------------------------------------------------------

// `roh` heißt: Die Zeilen bekommen kein "=" davor. Bei Brüchen und
// Prozenten ist jede Zeile die Fortsetzung derselben Rechnung, beim
// Logarithmus dagegen eine eigene Gleichung ("2^x = 32") — davor ein
// Gleichheitszeichen zu setzen ergäbe "= 2^x = 32" und wäre falsch
// gelesen. Dasselbe Zeichen, zwei Bedeutungen, siehe CLAUDE.md.
function Rechenweg({ anfang, schritte, ergebnis, nebenbei, formel, thema, roh }) {
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
          <Text style={styles.zeile}>{roh ? s.text : `= ${s.text}`}</Text>
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

// Beim Logarithmus darf auch ein Bruch dastehen: log₂(1/8) ist −3, und
// das ist genau der Fall, an dem sich zeigt, ob die negativen
// Exponenten sitzen. Deshalb geht das hier über bruch.ausText und nicht
// über kommazahl().
function logZahl(text) {
  const sauber = String(text ?? '').trim().replace(/−/g, '-').replace(',', '.');
  if (sauber === '') {
    return null;
  }
  try {
    return bruchAusText(sauber);
  } catch {
    return null;
  }
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
