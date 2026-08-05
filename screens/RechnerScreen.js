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
import {
  alsText as ungleichungAlsText,
  loese as loeseUngleichung,
  loesungAlsText,
} from '../utils/ungleichung';
import {
  alsText as systemAlsText,
  loese as loeseSystem,
  loesungAlsText as systemLoesungAlsText,
  probe as systemProbe,
  VERFAHREN,
  ZEILEN,
} from '../utils/system';
import { parseEingabe } from '../utils/parser';
import Zahlenstrahl from '../components/Zahlenstrahl';
import { auswerte } from '../utils/term';

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
  '(x+1)(x-3) = 0',
  '(x+1)(x-3)(x+5) = 0',
  'x^2 + 3x + 1 = 0',
  'x^2 + 1 = 0',
  '(x + 3)^2',
  '3x + 5 + 2x',
  '3x + 5 < 14',
  '-3x + 5 < 14',
  '2x + 1 <= 5x + 7',
  'x^2 < 4',
  'x^2 > 4',
  '3x + 2y = 7\nx - y = 1',
  'x + 2y = 4\n3x - y = 5',
  'x + y = 3\nx + y = 5',
  'x + y = 3\n2x + 2y = 6',
  '√50',
  '√(x^2)',
  'x + 1 = x + 2',
];

// Aus der Eingabe wird entweder ein Rechenweg oder ein Fehler. Beides
// wird hier einmal berechnet und dann nur noch angezeigt.
function rechne(eingabe, verfahren = 'addition') {
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
    if ('gleichungen' in gelesen) {
      return { art: 'system', eingelesen: gelesen, ergebnis: loeseSystem(gelesen, verfahren) };
    }
    // Die Reihenfolge zählt: Eine Ungleichung hat auch eine linke Seite.
    if ('zeichen' in gelesen) {
      return { art: 'ungleichung', eingelesen: gelesen, ergebnis: loeseUngleichung(gelesen) };
    }
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
  // Welches Verfahren gewählt ist, gehört zum Bildschirm und nicht zur
  // Eingabe: Man will dieselbe Aufgabe auf allen drei Wegen ansehen.
  const [verfahren, setVerfahren] = useState('addition');
  const ergebnis = useMemo(() => rechne(eingabe, verfahren), [eingabe, verfahren]);


  return (
    <ScreenGeruest titel="Rechner" untertitel="Term, Gleichung, Ungleichung oder System">
      <FeldLabel thema="term">Deine Eingabe</FeldLabel>
      <MatheFeld
        wert={eingabe}
        setWert={setEingabe}
        platzhalter="z. B. 3x + 5 = 14 oder 2x − 1 < 7"
        mehrzeilig
      />

      <View style={styles.beispiele}>
        {BEISPIELE.map((b) => (
          <Pressable key={b} style={styles.beispiel} onPress={() => setEingabe(b)}>
            <Text style={styles.beispielText}>{b}</Text>
          </Pressable>
        ))}
      </View>

      {ergebnis.art === 'system' ? (
        <VerfahrenWahl gewaehlt={verfahren} setzen={setVerfahren} />
      ) : null}

      <Ausgabe ergebnis={ergebnis} />

      <View style={styles.hilfeKasten}>
        <Text style={styles.hilfeTitel}>Schreibweise</Text>
        <Text style={styles.hilfe}>
          Die Leiste über den Beispielen setzt die Zeichen, die auf der Handytastatur
          fehlen. Es geht aber auch ohne: ^ für Potenzen (x^2 ist dasselbe wie x²),
          * oder gar nichts für Mal (3x, 2(x+1)), / oder : für Geteilt, - für Minus.
          Komma und Punkt gelten beide als Dezimaltrennzeichen. Für Ungleichungen
          gehen &lt;= und &gt;= genauso wie ≤ und ≥. Ein Gleichungssystem schreibt man
          als zwei Zeilen untereinander.
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

  if (ergebnis.art === 'system') {
    return <SystemWeg eingelesen={ergebnis.eingelesen} ergebnis={ergebnis.ergebnis} />;
  }
  if (ergebnis.art === 'ungleichung') {
    return <UngleichungsWeg eingelesen={ergebnis.eingelesen} ergebnis={ergebnis.ergebnis} />;
  }
  return ergebnis.art === 'gleichung' ? (
    <GleichungsWeg eingelesen={ergebnis.eingelesen} ergebnis={ergebnis.ergebnis} />
  ) : (
    <TermWeg eingelesen={ergebnis.eingelesen} ergebnis={ergebnis.ergebnis} />
  );
}

// --------------------------------------------------------------------
// Ein Gleichungssystem
// --------------------------------------------------------------------
//
// Im Unterricht heißt es "nimm das Additionsverfahren", und niemand
// sagt, warum. Hier kann man dieselbe Aufgabe auf allen drei Wegen
// ansehen — und sieht dabei, dass alle drei dasselbe Ergebnis liefern
// und sich nur im Aufwand unterscheiden.

function VerfahrenWahl({ gewaehlt, setzen }) {
  return (
    <View style={styles.verfahrenKasten}>
      <FeldLabel thema="gleichungssystem">Verfahren</FeldLabel>
      <View style={styles.verfahrenReihe}>
        {Object.entries(VERFAHREN).map(([id, v]) => (
          <Pressable
            key={id}
            style={[styles.verfahren, gewaehlt === id && styles.verfahrenAktiv]}
            onPress={() => setzen(id)}
          >
            <Text style={[styles.verfahrenText, gewaehlt === id && styles.verfahrenTextAktiv]}>
              {v.name.replace('verfahren', '')}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hilfe}>{VERFAHREN[gewaehlt].wann}</Text>
    </View>
  );
}

function SystemWeg({ eingelesen, ergebnis }) {
  return (
    <View style={styles.wegKasten}>
      <FeldLabel thema="gleichungssystem">{ergebnis.verfahrenName}</FeldLabel>

      <SystemZeilen text={systemAlsText(eingelesen)} />

      {ergebnis.schritte.map((s, i) => (
        <View key={i}>
          <Text style={styles.regel}>| {s.operation}</Text>
          <SystemZeilen text={s.text} />
        </View>
      ))}

      <SystemLoesung eingelesen={eingelesen} ergebnis={ergebnis} />
    </View>
  );
}

// Die Zeilennummern I und II stehen in einer eigenen, schmalen Spalte —
// sonst rutschen die Gleichungen gegeneinander und man sieht nicht mehr,
// was untereinander steht.
function SystemZeilen({ text }) {
  return (
    <View style={styles.systemBlock}>
      {text.split('\n').map((zeile, i) => {
        const teile = zeile.split(/\s{2}/);
        return (
          <View key={i} style={styles.systemZeile}>
            <Text style={styles.systemNummer}>{teile[0]}</Text>
            <Text style={styles.zeile}>{teile.slice(1).join('  ')}</Text>
          </View>
        );
      })}
    </View>
  );
}

function SystemLoesung({ eingelesen, ergebnis }) {
  if (ergebnis.art === 'unklar') {
    return (
      <View style={styles.unklarKasten}>
        <View style={styles.zeileMitKnopf}>
          <Text style={styles.unklarTitel}>Das kann ich noch nicht lösen</Text>
          <InfoButton thema="gleichungssystem" />
        </View>
        <Text style={styles.unklarText}>{ergebnis.grund}</Text>
      </View>
    );
  }

  if (ergebnis.art === 'keine' || ergebnis.art === 'alle') {
    return (
      <View style={styles.ergebnisKasten}>
        <View style={styles.zeileMitKnopf}>
          <Text style={styles.ergebnis}>
            {ergebnis.art === 'keine' ? 'L = { }' : 'unendlich viele Lösungen'}
          </Text>
          <InfoButton thema="loesungsmenge" />
        </View>
        <Text style={styles.begruendung}>{ergebnis.grund}</Text>
      </View>
    );
  }

  const namen = Object.keys(ergebnis.loesung).sort();
  const p = systemProbe(eingelesen, ergebnis.loesung);

  return (
    <View style={styles.ergebnisKasten}>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.ergebnis}>L = &#123; ({systemLoesungAlsText(ergebnis)}) &#125;</Text>
        <InfoButton thema="loesungsmenge" />
      </View>

      <View style={[styles.zeileMitKnopf, styles.probeUeberschrift]}>
        <Text style={styles.probeTitel}>Probe</Text>
        <InfoButton thema="probe" />
      </View>
      {/* Beide Zeilen einzeln — bei einem System reicht es nicht, dass
          EINE stimmt. Genau das ist der Unterschied zur Gleichung. */}
      {p.map((zeile, i) => (
        <Text key={i} style={styles.probeZeile}>
          {ZEILEN[i]}: links {bruchAlsText(zeile.links)}, rechts {bruchAlsText(zeile.rechts)}
          {zeile.stimmt ? ' ✓' : ' ✗'}
        </Text>
      ))}
    </View>
  );
}

// --------------------------------------------------------------------
// Eine Ungleichung
// --------------------------------------------------------------------
//
// Fast wie eine Gleichung — bis auf zwei Dinge, und beide sind der
// eigentliche Lernstoff: der Schritt, bei dem sich das Zeichen dreht,
// und die Lösungsmenge als Bereich statt als Zahl.

function UngleichungsWeg({ eingelesen, ergebnis }) {
  return (
    <View style={styles.wegKasten}>
      <FeldLabel thema="ungleichung">Rechenweg</FeldLabel>

      <Text style={styles.zeile}>{ungleichungAlsText(eingelesen)}</Text>

      {ergebnis.schritte.map((s, i) => (
        <View key={i}>
          {/* Der drehende Schritt wird hervorgehoben. Er im Fließtext
              mitlaufen zu lassen wäre das Gegenteil dessen, was diese
              App tut: Genau hier geht es schief, also gehört genau hier
              die Aufmerksamkeit hin. */}
          <Text style={[styles.regel, s.dreht && styles.regelDreht]}>| {s.operation}</Text>
          <Text style={styles.zeile}>{s.text}</Text>
        </View>
      ))}

      <UngleichungsLoesung ergebnis={ergebnis} />
    </View>
  );
}

function UngleichungsLoesung({ ergebnis }) {
  if (ergebnis.art === 'unklar') {
    return (
      <View style={styles.unklarKasten}>
        <View style={styles.zeileMitKnopf}>
          <Text style={styles.unklarTitel}>Das kann ich noch nicht lösen</Text>
          <InfoButton thema="ungleichung" />
        </View>
        <Text style={styles.unklarText}>{ergebnis.grund}</Text>
      </View>
    );
  }

  // Für das Bild werden die Grenzen zu Zahlen — gezeichnet wird ohnehin
  // in Pixeln. Angeschrieben bleiben sie exakt: √5 steht als √5 da.
  const intervalle = (ergebnis.intervalle ?? []).map((iv) => ({
    von: iv.von === null ? null : auswerte(iv.von),
    vonOffen: iv.vonOffen,
    bis: iv.bis === null ? null : auswerte(iv.bis),
    bisOffen: iv.bisOffen,
  }));
  const fuersBild =
    ergebnis.art === 'alle'
      ? [{ von: null, vonOffen: false, bis: null, bisOffen: false }]
      : intervalle;

  return (
    <View style={styles.ergebnisKasten}>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.ergebnis}>{loesungAlsText(ergebnis)}</Text>
        <InfoButton thema="loesungsmenge" />
      </View>
      {ergebnis.grund ? <Text style={styles.begruendung}>{ergebnis.grund}</Text> : null}

      <Zahlenstrahl intervalle={fuersBild} />

      {ergebnis.art === 'keine' ? null : (
        <Text style={styles.begruendung}>
          Ein offener Kreis heißt: die Grenze gehört nicht dazu. Ein gefüllter heißt:
          sie gehört dazu.
        </Text>
      )}
    </View>
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

// Beim Nullprodukt ist der Weg die Aussage: Jeder Faktor wird einzeln
// null gesetzt, und was dabei herauskommt, steht daneben. Ein Faktor
// ohne reelle Lösung trägt nichts bei — auch das gehört hin, sonst
// fragt man sich, wo er geblieben ist.
function Nullprodukt({ faktoren }) {
  return (
    <View style={styles.pqKasten}>
      <View style={styles.zeileMitKnopf}>
        <Text style={styles.probeTitel}>Satz vom Nullprodukt</Text>
        <InfoButton thema="nullprodukt" />
      </View>
      {faktoren.map(({ faktor, ergebnis }, i) => (
        <Text key={i} style={styles.probeZeile}>
          {termAlsText(faktor)} = 0
          {'   →   '}
          {ergebnis.art === 'keine'
            ? 'keine reelle Lösung'
            : ergebnis.art === 'alle'
              ? 'jede Zahl'
              : `x = ${(ergebnis.loesungen ?? []).map(termAlsText).join(' oder x = ')}`}
        </Text>
      ))}
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
      {ergebnis.faktoren ? <Nullprodukt faktoren={ergebnis.faktoren} /> : null}

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
  verfahrenKasten: {
    marginTop: 16,
  },
  verfahrenReihe: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  verfahren: {
    flex: 1,
    borderWidth: 1,
    borderColor: farben.trenner,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  verfahrenAktiv: {
    backgroundColor: farben.primaer,
    borderColor: farben.primaer,
  },
  verfahrenText: {
    fontSize: 13,
    color: farben.primaer,
    fontWeight: '600',
  },
  verfahrenTextAktiv: {
    color: farben.weiss,
  },
  systemBlock: {
    marginVertical: 2,
  },
  systemZeile: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  systemNummer: {
    width: 30,
    fontSize: 13,
    color: farben.textSehrLeise,
    fontWeight: '600',
  },
  regelDreht: {
    color: farben.warnung,
    fontWeight: '700',
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
