import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { farben } from '../utils/konstanten';
import { skala, teilstriche, abtasten } from '../utils/graph';

// Zeichnet einen Funktionsgraphen.
//
// Diese Datei rechnet nichts aus. Wo die Kurve verläuft, wo das Gitter
// sitzt und wo eine Linie unterbrochen werden muss, steht in
// utils/graph.js — hier wird es nur in SVG übersetzt. Deshalb ist der
// heikle Teil (Definitionslücken, schöne Achsenteilung, die umgedrehte
// y-Achse) mit blankem node geprüft und nicht bloß angeschaut.

const RAND = { links: 34, rechts: 10, oben: 10, unten: 22 };

export default function Funktionsgraph({
  term,
  name = 'x',
  fenster,
  breite = 320,
  hoehe = 240,
  punkte = [],
}) {
  const zeichenBreite = breite - RAND.links - RAND.rechts;
  const zeichenHoehe = hoehe - RAND.oben - RAND.unten;

  if (zeichenBreite <= 0 || zeichenHoehe <= 0) {
    return null;
  }

  const nachX = skala({ von: fenster.von, bis: fenster.bis, pixel: zeichenBreite });
  const nachY = skala({
    von: fenster.unten,
    bis: fenster.oben,
    pixel: zeichenHoehe,
    umgedreht: true,
  });

  const px = (wert) => RAND.links + nachX(wert);
  const py = (wert) => RAND.oben + nachY(wert);

  const senkrecht = teilstriche(fenster.von, fenster.bis, 6);
  const waagerecht = teilstriche(fenster.unten, fenster.oben, 5);

  // Jeder Abschnitt wird ein eigener Pfad. Das ist der ganze Grund für
  // die Zerlegung in utils/graph.js: Ein durchgezogener Pfad über eine
  // Definitionslücke hinweg behauptete, dort läge etwas.
  let abschnitte = [];
  let fehler = null;
  try {
    abschnitte = abtasten(term, name, { ...fenster, punkte: 240 });
  } catch (f) {
    fehler = f.message;
  }

  if (fehler) {
    return (
      <View style={[styles.rahmen, { width: breite, height: hoehe }]}>
        <Text style={styles.fehler}>{fehler}</Text>
      </View>
    );
  }

  const innerhalb = (p) => p.y >= fenster.unten - 1e-9 && p.y <= fenster.oben + 1e-9;

  return (
    <View style={styles.rahmen}>
      <Svg width={breite} height={hoehe}>
        {/* Gitter */}
        {senkrecht.striche.map((wert) => (
          <Line
            key={`v${wert}`}
            x1={px(wert)}
            y1={RAND.oben}
            x2={px(wert)}
            y2={RAND.oben + zeichenHoehe}
            stroke={farben.trenner}
            strokeWidth={1}
          />
        ))}
        {waagerecht.striche.map((wert) => (
          <Line
            key={`h${wert}`}
            x1={RAND.links}
            y1={py(wert)}
            x2={RAND.links + zeichenBreite}
            y2={py(wert)}
            stroke={farben.trenner}
            strokeWidth={1}
          />
        ))}

        {/* Die Achsen, sofern sie im Bild liegen */}
        {fenster.unten <= 0 && fenster.oben >= 0 ? (
          <Line
            x1={RAND.links}
            y1={py(0)}
            x2={RAND.links + zeichenBreite}
            y2={py(0)}
            stroke={farben.text}
            strokeWidth={1.5}
          />
        ) : null}
        {fenster.von <= 0 && fenster.bis >= 0 ? (
          <Line
            x1={px(0)}
            y1={RAND.oben}
            x2={px(0)}
            y2={RAND.oben + zeichenHoehe}
            stroke={farben.text}
            strokeWidth={1.5}
          />
        ) : null}

        {/* Beschriftung */}
        {senkrecht.striche
          .filter((wert) => wert !== 0)
          .map((wert) => (
            <SvgText
              key={`vt${wert}`}
              x={px(wert)}
              y={hoehe - 8}
              fontSize={10}
              fill={farben.textLeise}
              textAnchor="middle"
            >
              {String(wert).replace('.', ',').replace('-', '−')}
            </SvgText>
          ))}
        {waagerecht.striche
          .filter((wert) => wert !== 0)
          .map((wert) => (
            <SvgText
              key={`ht${wert}`}
              x={RAND.links - 4}
              y={py(wert) + 3}
              fontSize={10}
              fill={farben.textLeise}
              textAnchor="end"
            >
              {String(wert).replace('.', ',').replace('-', '−')}
            </SvgText>
          ))}

        {/* Die Kurve */}
        {abschnitte.map((abschnitt, i) => (
          <Path
            key={`k${i}`}
            d={alsPfad(abschnitt, px, py, fenster)}
            stroke={farben.primaer}
            strokeWidth={2.5}
            fill="none"
          />
        ))}

        {/* Besondere Punkte: Nullstellen, Scheitel, y-Achsenabschnitt */}
        {punkte.filter(innerhalb).map((p, i) => (
          <Circle
            key={`p${i}`}
            cx={px(p.x)}
            cy={py(p.y)}
            r={4}
            fill={farben.weiss}
            stroke={farben.primaerDunkel}
            strokeWidth={2}
          />
        ))}
      </Svg>
    </View>
  );
}

// Ein Abschnitt als SVG-Pfad. Punkte weit außerhalb des Fensters werden
// auf den Rand gezogen, damit die Linie dort endet statt in den Himmel
// zu laufen.
function alsPfad(abschnitt, px, py, fenster) {
  const klemme = (wert) => Math.min(fenster.oben, Math.max(fenster.unten, wert));

  return abschnitt
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x).toFixed(1)} ${py(klemme(p.y)).toFixed(1)}`)
    .join(' ');
}

const styles = StyleSheet.create({
  rahmen: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 10,
    backgroundColor: farben.weiss,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fehler: {
    fontSize: 14,
    color: farben.textLeise,
    padding: 20,
    textAlign: 'center',
  },
});
