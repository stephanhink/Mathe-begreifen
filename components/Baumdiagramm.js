import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { farben } from '../utils/konstanten';
import { alsBruchText } from '../utils/zufall';

// Ein zweistufiges Baumdiagramm.
//
// Der Baum ist das Bild, an dem die beiden Pfadregeln sichtbar werden:
// entlang eines Pfades wird multipliziert, über mehrere Pfade addiert.
// Ohne Zeichnung bleibt das eine Rechenvorschrift; mit Zeichnung sieht
// man, warum sie so lautet.
//
// Gezeichnet wird, was utils/zufall.js ausgerechnet hat — hier steht
// keine Wahrscheinlichkeit, die nicht von dort käme.
export default function Baumdiagramm({ baum, breite = 320, hoehe = 250 }) {
  const links = 16;
  const mitteX = breite * 0.34;
  const rechtsX = breite * 0.72;
  const wurzelY = hoehe / 2;

  const farbeVon = (sorte) => (sorte === 'rot' ? '#c0392b' : '#2c6fb5');

  // Die erste Stufe: zwei Äste, sofern es die Sorte überhaupt gibt.
  const ersteSorten = ['rot', 'blau'].filter((s) => baum.erste[s].z > 0);
  const astY = (i) => (ersteSorten.length === 1 ? wurzelY : 40 + i * (hoehe - 80));

  return (
    <View style={styles.rahmen}>
      <Svg width={breite} height={hoehe}>
        <Circle cx={links} cy={wurzelY} r={4} fill={farben.text} />

        {ersteSorten.map((sorte, i) => {
          const y = astY(i);
          const zweitePfade = baum.pfade.filter((p) => p.weg[0] === sorte);

          return (
            <React.Fragment key={sorte}>
              <Line
                x1={links}
                y1={wurzelY}
                x2={mitteX}
                y2={y}
                stroke={farbeVon(sorte)}
                strokeWidth={2}
              />
              <SvgText
                x={(links + mitteX) / 2}
                y={(wurzelY + y) / 2 - 6}
                fontSize={11}
                fill={farben.textLeise}
                textAnchor="middle"
              >
                {alsBruchText(baum.erste[sorte])}
              </SvgText>
              <Circle cx={mitteX} cy={y} r={4} fill={farbeVon(sorte)} />
              <SvgText x={mitteX - 4} y={y - 10} fontSize={12} fill={farbeVon(sorte)}>
                {sorte === 'rot' ? 'r' : 'b'}
              </SvgText>

              {zweitePfade.map((p, k) => {
                const zy = y + (k === 0 ? -30 : 30);
                return (
                  <React.Fragment key={p.weg.join('')}>
                    <Line
                      x1={mitteX}
                      y1={y}
                      x2={rechtsX}
                      y2={zy}
                      stroke={farbeVon(p.weg[1])}
                      strokeWidth={2}
                    />
                    <SvgText
                      x={(mitteX + rechtsX) / 2}
                      y={(y + zy) / 2 - 5}
                      fontSize={11}
                      fill={farben.textLeise}
                      textAnchor="middle"
                    >
                      {alsBruchText(p.zweite)}
                    </SvgText>
                    <SvgText x={rechtsX + 8} y={zy + 4} fontSize={12} fill={farben.text}>
                      {p.weg.map((w) => (w === 'rot' ? 'r' : 'b')).join('')} ={' '}
                      {alsBruchText(p.wahrscheinlichkeit)}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
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
