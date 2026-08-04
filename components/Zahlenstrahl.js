import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { zahlenstrahl, zahlenstrahlBereich } from '../utils/graph';
import { farben } from '../utils/konstanten';

// Die Lösungsmenge einer Ungleichung als Bild.
//
// "x > −3" ist eine Behauptung über eine Zahl, "der Strahl rechts von
// −3" ist ein Bild. Wer nur das eine hat, hat es halb — und deshalb
// steht im Unterricht beides nebeneinander.
//
// Wie bei Funktionsgraph.js gilt: Diese Datei rechnet nichts. Wo die
// Balken liegen, wo die Kreise sitzen und wo Pfeile hingehören, steht in
// utils/graph.js und ist dort mit blankem node geprüft.
//
// Der offene und der gefüllte Kreis sind keine Verzierung: Sie sind der
// ganze Unterschied zwischen < und ≤.

const HOEHE = 78;
const ACHSE_Y = 34;
const RAND = 14;
const PFEIL = 9;

export default function Zahlenstrahl({ intervalle, breite = 300 }) {
  const nutzbar = Math.max(breite - 2 * RAND, 40);
  const grenzen = intervalle.flatMap((iv) => [iv.von, iv.bis]).filter((w) => w !== null);
  const bereich = zahlenstrahlBereich(grenzen);
  const bild = zahlenstrahl({ intervalle, pixel: nutzbar, ...bereich });

  return (
    <View style={styles.rahmen}>
      <Svg width={breite} height={HOEHE}>
        {/* Die Zahlengerade selbst, mit Pfeilspitze rechts. */}
        <Line
          x1={RAND}
          y1={ACHSE_Y}
          x2={breite - RAND + 4}
          y2={ACHSE_Y}
          stroke={farben.rand}
          strokeWidth={1.5}
        />

        {bild.striche.map((s) => (
          <Line
            key={`t${s.wert}`}
            x1={RAND + s.x}
            y1={ACHSE_Y - 4}
            x2={RAND + s.x}
            y2={ACHSE_Y + 4}
            stroke={farben.rand}
            strokeWidth={1}
          />
        ))}

        {bild.striche.map((s) => (
          <SvgText
            key={`b${s.wert}`}
            x={RAND + s.x}
            y={ACHSE_Y + 20}
            fontSize={11}
            fill={farben.textLeise}
            textAnchor="middle"
          >
            {String(s.wert).replace('-', '−')}
          </SvgText>
        ))}

        {/* Der Lösungsbereich als dicker Balken darüber. */}
        {bild.balken.map((b, i) => (
          <Line
            key={`s${i}`}
            x1={RAND + b.x1}
            y1={ACHSE_Y - 12}
            x2={RAND + b.x2}
            y2={ACHSE_Y - 12}
            stroke={farben.primaer}
            strokeWidth={5}
            strokeLinecap="round"
          />
        ))}

        {/* Wo der Balken über den Rand läuft, gehört ein Pfeil hin — ein
            glattes Ende behauptete eine Grenze, die es nicht gibt. */}
        {bild.balken.map((b, i) =>
          b.pfeilRechts ? (
            <Polygon
              key={`pr${i}`}
              points={`${RAND + b.x2},${ACHSE_Y - 12 - PFEIL / 2} ${RAND + b.x2 + PFEIL},${ACHSE_Y - 12} ${RAND + b.x2},${ACHSE_Y - 12 + PFEIL / 2}`}
              fill={farben.primaer}
            />
          ) : null
        )}
        {bild.balken.map((b, i) =>
          b.pfeilLinks ? (
            <Polygon
              key={`pl${i}`}
              points={`${RAND + b.x1},${ACHSE_Y - 12 - PFEIL / 2} ${RAND + b.x1 - PFEIL},${ACHSE_Y - 12} ${RAND + b.x1},${ACHSE_Y - 12 + PFEIL / 2}`}
              fill={farben.primaer}
            />
          ) : null
        )}

        {/* Offen heißt: die Grenze gehört NICHT dazu. */}
        {bild.punkte.map((p, i) => (
          <Circle
            key={`k${i}`}
            cx={RAND + p.x}
            cy={ACHSE_Y - 12}
            r={5}
            fill={p.offen ? farben.weiss : farben.primaer}
            stroke={farben.primaer}
            strokeWidth={2}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  rahmen: {
    alignItems: 'center',
    marginTop: 10,
  },
});
