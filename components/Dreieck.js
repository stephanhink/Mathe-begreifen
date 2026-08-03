import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

import { farben } from '../utils/konstanten';

// Ein rechtwinkliges Dreieck, maßstabsgetreu gezeichnet.
//
// Maßstabsgetreu ist hier keine Spielerei. Ein Dreieck mit a = 1 und
// b = 10, das quadratisch gezeichnet wird, erzählt etwas Falsches — und
// die halbe Trigonometrie besteht darin, ein Gefühl dafür zu bekommen,
// welcher Winkel zu welchem Seitenverhältnis gehört.
//
// Der rechte Winkel liegt bei C unten rechts, die Hypotenuse c verläuft
// von A nach B. Das ist die übliche Lage im deutschen Unterricht.

export default function Dreieck({ a, b, alpha, beta, breite = 300, hoehe = 220 }) {
  if (!(a > 0) || !(b > 0)) {
    return null;
  }

  const rand = { links: 28, rechts: 34, oben: 26, unten: 30 };
  const platzBreite = breite - rand.links - rand.rechts;
  const platzHoehe = hoehe - rand.oben - rand.unten;

  // Gemeinsamer Maßstab für beide Richtungen — sonst wäre es nicht mehr
  // maßstabsgetreu, sondern nur noch hübsch.
  const massstab = Math.min(platzBreite / b, platzHoehe / a);
  const bildB = b * massstab;
  const bildA = a * massstab;

  // C unten rechts, B unten links, A oben rechts.
  const cx = rand.links + bildB;
  const cy = rand.oben + bildA;
  const bx = rand.links;
  const by = cy;
  const ax = cx;
  const ay = rand.oben;

  // Das Kästchen für den rechten Winkel.
  const k = Math.min(14, bildA * 0.3, bildB * 0.3);

  return (
    <View style={styles.rahmen}>
      <Svg width={breite} height={hoehe}>
        <Polygon
          points={`${ax},${ay} ${bx},${by} ${cx},${cy}`}
          fill={farben.hintergrundHell}
          stroke={farben.primaer}
          strokeWidth={2}
        />

        {/* Der rechte Winkel als Kästchen — das Zeichen dafür, dass es
            hier wirklich 90° sind und nicht ungefähr. */}
        <Path
          d={`M ${cx - k} ${cy} L ${cx - k} ${cy - k} L ${cx} ${cy - k}`}
          stroke={farben.primaerDunkel}
          strokeWidth={1.5}
          fill="none"
        />

        {/* Seitenbeschriftung */}
        <SvgText x={(bx + cx) / 2} y={cy + 18} fontSize={13} fill={farben.text} textAnchor="middle">
          b
        </SvgText>
        <SvgText x={cx + 12} y={(ay + cy) / 2 + 4} fontSize={13} fill={farben.text}>
          a
        </SvgText>
        <SvgText
          x={(ax + bx) / 2 - 8}
          y={(ay + by) / 2 - 6}
          fontSize={13}
          fill={farben.text}
          textAnchor="middle"
        >
          c
        </SvgText>

        {/* Eckpunkte */}
        <SvgText x={ax + 8} y={ay - 8} fontSize={12} fill={farben.textLeise}>
          A
        </SvgText>
        <SvgText x={bx - 14} y={by + 4} fontSize={12} fill={farben.textLeise}>
          B
        </SvgText>
        <SvgText x={cx + 8} y={cy + 14} fontSize={12} fill={farben.textLeise}>
          C
        </SvgText>

        {/* Winkel, sofern bekannt */}
        {Number.isFinite(alpha) ? (
          <SvgText x={ax - 16} y={ay + 20} fontSize={12} fill={farben.primaerDunkel}>
            α
          </SvgText>
        ) : null}
        {Number.isFinite(beta) ? (
          <SvgText x={bx + 10} y={by - 8} fontSize={12} fill={farben.primaerDunkel}>
            β
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  rahmen: {
    borderWidth: 1,
    borderColor: farben.rand,
    borderRadius: 10,
    backgroundColor: farben.weiss,
    alignItems: 'center',
    overflow: 'hidden',
  },
});
