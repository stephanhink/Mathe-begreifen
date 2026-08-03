// Prüfungen für die Wahrscheinlichkeitsrechnung.
//
// Aus CLAUDE.md, unter „Was die Prüfungen ablehnen müssen": „… eine
// Wahrscheinlichkeit > 1". Danach ist ein guter Teil hier gebaut.
//
// Die schönste Prüfung ist aber eine andere: Die Summe aller Pfade
// eines Baumdiagramms muss 1 ergeben. Das ist die eingebaute Probe
// jeder mehrstufigen Rechnung — und sie prüft alle Zweige auf einmal.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import {
  bruch,
  plus,
  gleich as bruchGleich,
  alsText as bruchAlsText,
  alsZahl,
} from '../utils/bruch.js';
import {
  laplace,
  fakultaet,
  binomialkoeffizient,
  zaehleMoeglichkeiten,
  ZIEHUNGSARTEN,
  zweistufig,
  pfadeSumme,
  binomial,
  binomialVerteilung,
  erwartungswert,
  alsProzent,
  alsBruchText,
  BEISPIELE,
} from '../utils/zufall.js';

// ---------------------------------------------------------------------
// Laplace
// ---------------------------------------------------------------------

pruefung('Laplace', () => {
  const w = laplace(1, 6);
  gleichText('eine Sechs beim Würfel', bruchAlsText(w.wahrscheinlichkeit), '1/6');
  gleichText('als Prozent', alsProzent(w.wahrscheinlichkeit), '16,67');
  gleichText('die Gegenwahrscheinlichkeit', bruchAlsText(w.gegenwahrscheinlichkeit), '5/6');

  // 1/6 ist 1/6 — nicht 0,1667. Wer nur die Kommazahl sieht, verliert
  // die Einsicht, um die es geht.
  wahr('das Ergebnis ist exakt', bruchGleich(w.wahrscheinlichkeit, bruch(1, 6)));

  gleichText('gerade Zahl', bruchAlsText(laplace(3, 6).wahrscheinlichkeit), '1/2');
  gleichText('sicheres Ereignis', bruchAlsText(laplace(6, 6).wahrscheinlichkeit), '1');
  gleichText('unmögliches Ereignis', bruchAlsText(laplace(0, 6).wahrscheinlichkeit), '0');
});

pruefung('Wahrscheinlichkeiten über 1 gibt es nicht', () => {
  // Die Regel aus dem Konzept. 7 von 6 wäre 1,17 — eine Zahl, die
  // aussieht wie ein Ergebnis und keines ist.
  wirft('mehr günstige als mögliche Fälle', () => laplace(7, 6));

  let meldung = '';
  try {
    laplace(7, 6);
  } catch (f) {
    meldung = f.message;
  }
  wahr('mit Begründung', meldung.includes('über 1'));
  wahr('und den Zahlen', meldung.includes('7') && meldung.includes('6'));

  wirft('keine möglichen Fälle', () => laplace(1, 0));
  wirft('negative Anzahl', () => laplace(-1, 6));
  wirft('Kommazahl', () => laplace(1.5, 6));
});

// ---------------------------------------------------------------------
// Kombinatorik
// ---------------------------------------------------------------------

pruefung('Fakultät und Binomialkoeffizient', () => {
  gleichText('0! ist 1', bruchAlsText(fakultaet(0)), '1');
  gleichText('5!', bruchAlsText(fakultaet(5)), '120');

  gleichText('6 über 3', bruchAlsText(binomialkoeffizient(6, 3)), '20');
  gleichText('n über 0 ist immer 1', bruchAlsText(binomialkoeffizient(10, 0)), '1');
  gleichText('n über n ist auch 1', bruchAlsText(binomialkoeffizient(10, 10)), '1');

  // Lotto — die Zahl, die jeder kennt.
  gleichText('49 über 6', bruchAlsText(binomialkoeffizient(49, 6)), '13983816');

  // Der Grund für die Produktformel: 50! hätte 65 Stellen und sprengt
  // die exakte Rechnung, obwohl "50 über 2" nur 1225 ist.
  gleichText('50 über 2 geht trotzdem', bruchAlsText(binomialkoeffizient(50, 2)), '1225');
  gleichText('und 60 über 3', bruchAlsText(binomialkoeffizient(60, 3)), '34220');

  // Symmetrie: n über k ist dasselbe wie n über (n−k).
  for (const [n, k] of [[10, 3], [20, 7], [30, 12]]) {
    wahr(
      `${n} über ${k} = ${n} über ${n - k}`,
      bruchGleich(binomialkoeffizient(n, k), binomialkoeffizient(n, n - k))
    );
  }

  wirft('mehr auswählen als vorhanden', () => binomialkoeffizient(5, 7));
  wirft('negatives k', () => binomialkoeffizient(5, -1));
});

pruefung('Die vier Fälle des Urnenmodells', () => {
  // Zahlenschloss: vier Stellen, zehn Ziffern.
  gleichText('mit Zurücklegen, geordnet', bruchAlsText(zaehleMoeglichkeiten('geordnetMit', 10, 4).anzahl), '10000');
  // Treppchen: Erster, Zweiter, Dritter aus acht.
  gleichText('ohne Zurücklegen, geordnet', bruchAlsText(zaehleMoeglichkeiten('geordnetOhne', 8, 3).anzahl), '336');
  // Lotto.
  gleichText('ohne Zurücklegen, ungeordnet', bruchAlsText(zaehleMoeglichkeiten('ungeordnetOhne', 49, 6).anzahl), '13983816');
  // Drei Kugeln Eis aus fünf Sorten.
  gleichText('mit Zurücklegen, ungeordnet', bruchAlsText(zaehleMoeglichkeiten('ungeordnetMit', 5, 3).anzahl), '35');

  // Geordnet ist immer mindestens so viel wie ungeordnet — die
  // Reihenfolge kann nur zusätzliche Fälle unterscheiden.
  for (const [n, k] of [[6, 3], [10, 4], [8, 2]]) {
    const geordnet = alsZahl(zaehleMoeglichkeiten('geordnetOhne', n, k).anzahl);
    const ungeordnet = alsZahl(zaehleMoeglichkeiten('ungeordnetOhne', n, k).anzahl);
    wahr(`n=${n}, k=${k}: geordnet ≥ ungeordnet`, geordnet >= ungeordnet);
  }

  wirft('ohne Zurücklegen zu viele ziehen', () => zaehleMoeglichkeiten('ungeordnetOhne', 5, 7));
  wirft('unbekannte Ziehungsart', () => zaehleMoeglichkeiten('irgendwie', 5, 2));

  for (const [id, art] of Object.entries(ZIEHUNGSARTEN)) {
    wahr(`${id}: hat einen Titel`, Boolean(art.titel));
    wahr(`${id}: hat eine Formel`, Boolean(art.formel));
    wahr(`${id}: hat ein Beispiel aus dem Alltag`, art.beispiel.length > 20);
  }
});

// ---------------------------------------------------------------------
// Das Baumdiagramm
// ---------------------------------------------------------------------

pruefung('Zweistufiger Versuch', () => {
  // Drei rote, zwei blaue Kugeln, mit Zurücklegen.
  const mit = zweistufig({ rot: 3, blau: 2, mitZuruecklegen: true });
  zahlIst('vier Pfade', mit.pfade.length, 4);
  gleichText('rot-rot', bruchAlsText(mit.pfade[0].wahrscheinlichkeit), '9/25');

  // Ohne Zurücklegen ändert sich der zweite Zug — das ist der ganze
  // Unterschied, und man sieht ihn an den Zahlen.
  const ohne = zweistufig({ rot: 3, blau: 2, mitZuruecklegen: false });
  gleichText('rot-rot ohne Zurücklegen', bruchAlsText(ohne.pfade[0].wahrscheinlichkeit), '3/10');
  gleichText('der zweite Zug hat einen anderen Nenner', bruchAlsText(ohne.pfade[0].zweite), '1/2');

  wirft('zu wenige Kugeln', () => zweistufig({ rot: 1, blau: 0, mitZuruecklegen: false }));
  wirft('negative Anzahl', () => zweistufig({ rot: -1, blau: 3, mitZuruecklegen: true }));
});

pruefung('Die Summe aller Pfade ist 1', () => {
  // Die eingebaute Probe jedes Baumdiagramms. Geht sie nicht auf, ist
  // irgendwo ein Zweig falsch — und zwar egal welcher.
  let fehler = null;

  for (let rot = 0; rot <= 6 && fehler === null; rot++) {
    for (let blau = 0; blau <= 6; blau++) {
      if (rot + blau < 2) {
        continue;
      }
      for (const mitZuruecklegen of [true, false]) {
        const baum = zweistufig({ rot, blau, mitZuruecklegen });
        if (!bruchGleich(baum.summe, bruch(1))) {
          fehler =
            `rot=${rot}, blau=${blau}, ${mitZuruecklegen ? 'mit' : 'ohne'} Zurücklegen: ` +
            `Summe ist ${bruchAlsText(baum.summe)} statt 1`;
          break;
        }
      }
      if (fehler) {
        break;
      }
    }
  }

  wahr('in jedem Baum ergeben die Pfade zusammen 1', fehler === null, fehler ?? undefined);
});

pruefung('Mehrere Pfade addieren', () => {
  // Die zweite Pfadregel: über mehrere Pfade wird addiert.
  const baum = zweistufig({ rot: 3, blau: 2, mitZuruecklegen: true });

  const mindestensEineRote = pfadeSumme(baum, (weg) => weg.includes('rot'));
  gleichText('mindestens eine rote', bruchAlsText(mindestensEineRote.summe), '21/25');
  zahlIst('das sind drei Pfade', mindestensEineRote.treffer.length, 3);

  const keineRote = pfadeSumme(baum, (weg) => !weg.includes('rot'));
  gleichText('keine rote', bruchAlsText(keineRote.summe), '4/25');

  // Beides zusammen ist wieder 1 — die Gegenwahrscheinlichkeit.
  wahr(
    'beides zusammen ergibt 1',
    bruchGleich(bruch(21, 25), bruch(1)) === false &&
      alsZahl(mindestensEineRote.summe) + alsZahl(keineRote.summe) === 1
  );
});

// ---------------------------------------------------------------------
// Binomialverteilung
// ---------------------------------------------------------------------

pruefung('Binomialverteilung', () => {
  // Zehnmal würfeln, wie oft eine Sechs?
  const drei = binomial(10, bruch(1, 6), 3);
  wahr('P(X = 3) ist ungefähr 15,5 %', Math.abs(alsZahl(drei.wahrscheinlichkeit) - 0.15505) < 1e-4);
  wahr('und exakt gerechnet', drei.wahrscheinlichkeit.n > 1);

  // Vier Münzwürfe, genau zwei Mal Kopf: (4 über 2) · (1/2)^4 = 6/16.
  gleichText('vier Münzen, zweimal Kopf', bruchAlsText(binomial(4, bruch(1, 2), 2).wahrscheinlichkeit), '3/8');

  // Der Erwartungswert ist n · p.
  gleichText('Erwartungswert bei 10 Würfen', bruchAlsText(drei.erwartungswert), '5/3');

  wirft('mehr Treffer als Versuche', () => binomial(5, bruch(1, 2), 7));
  wirft('Wahrscheinlichkeit über 1', () => binomial(5, bruch(3, 2), 2));
  wirft('negative Wahrscheinlichkeit', () => binomial(5, bruch(-1, 2), 2));
});

pruefung('Die ganze Verteilung addiert sich zu 1', () => {
  // Auch das ist eine eingebaute Probe: Irgendeine Trefferzahl kommt
  // ganz sicher heraus.
  let fehler = null;

  for (const n of [1, 4, 8, 12]) {
    for (const p of [bruch(1, 2), bruch(1, 6), bruch(3, 4), bruch(1, 3)]) {
      const verteilung = binomialVerteilung(n, p);
      // Mit plus() aus bruch.js, nicht von Hand: Ohne Kürzen wachsen
      // die Nenner bei zwölf Summanden über 2^53 hinaus — der erste
      // Versuch hier ist genau daran gescheitert.
      const gesamt = verteilung.reduce((s, e) => plus(s, e.wahrscheinlichkeit), bruch(0));
      if (!bruchGleich(gesamt, bruch(1))) {
        fehler = `n=${n}, p=${bruchAlsText(p)}: Summe ist ${bruchAlsText(gesamt)}`;
        break;
      }
      zahlIst(`n=${n}: es gibt ${n + 1} mögliche Trefferzahlen`, verteilung.length, n + 1);
    }
    if (fehler) {
      break;
    }
  }

  wahr('jede Verteilung addiert sich zu 1', fehler === null, fehler ?? undefined);
});

// ---------------------------------------------------------------------
// Erwartungswert
// ---------------------------------------------------------------------

pruefung('Erwartungswert', () => {
  // Ein fairer Würfel: (1+2+3+4+5+6)/6 = 3,5.
  const wuerfelspiel = erwartungswert(
    [1, 2, 3, 4, 5, 6].map((w) => ({ wert: bruch(w), p: bruch(1, 6) }))
  );
  gleichText('beim Würfel 7/2', bruchAlsText(wuerfelspiel.erwartungswert), '7/2');

  // Ein Spiel mit Einsatz: 1 € Gewinn mit 1/4, sonst 1 € Verlust.
  const spiel = erwartungswert([
    { wert: bruch(3), p: bruch(1, 4), name: 'Gewinn' },
    { wert: bruch(-1), p: bruch(3, 4), name: 'Verlust' },
  ]);
  gleichText('das Spiel ist fair', bruchAlsText(spiel.erwartungswert), '0');

  // Die Wahrscheinlichkeiten müssen sich zu 1 addieren — sonst fehlt
  // ein Fall oder es ist einer zu viel.
  wirft('Summe unter 1', () =>
    erwartungswert([{ wert: bruch(1), p: bruch(1, 4) }, { wert: bruch(2), p: bruch(1, 4) }])
  );
  wirft('Summe über 1', () =>
    erwartungswert([{ wert: bruch(1), p: bruch(3, 4) }, { wert: bruch(2), p: bruch(3, 4) }])
  );

  let meldung = '';
  try {
    erwartungswert([{ wert: bruch(1), p: bruch(1, 4) }]);
  } catch (f) {
    meldung = f.message;
  }
  wahr('mit Begründung', meldung.includes('zu 1 addieren'));
  wahr('und dem tatsächlichen Wert', meldung.includes('1/4'));

  wirft('leere Liste', () => erwartungswert([]));
});

pruefung('Beispiele und Darstellung', () => {
  for (const b of BEISPIELE) {
    wahr(`${b.titel}: lässt sich rechnen`, laplace(b.guenstig, b.moeglich).wahrscheinlichkeit !== null);
    wahr(`${b.titel}: hat einen Titel`, b.titel.length > 5);
  }

  gleichText('Prozent mit Komma', alsProzent(bruch(1, 6)), '16,67');
  gleichText('glatte Prozent', alsProzent(bruch(1, 2)), '50');
  gleichText('Bruch mit richtigem Minus', alsBruchText(bruch(-1, 6)), '−1/6');
});
