// Prüfungen für lineare Gleichungssysteme.
//
// Die tragende Aussage ist wieder eine andere als in den Nachbardateien:
//
//   Jede Umformung lässt die Lösungsmenge des SYSTEMS unverändert.
//
// Das ist mehr als "jede Zeile bleibt gleich" — eine einzelne Zeile DARF
// sich ändern. Aus II wird I + II, und das ist eine ganz andere
// Gleichung. Erlaubt ist es, weil das PAAR, das beide Zeilen zugleich
// löst, dasselbe bleibt.
//
// Und hier steckt dieselbe Falle wie bei gleichung.js, nur schärfer:
//
//   ZUFÄLLIGE PUNKTE TAUGEN NICHT. Ein beliebiges Paar (x | y) löst
//   fast nie ein System — vorher nicht und nachher auch nicht. Die
//   Stichprobe sähe überall "nicht erfüllt" und meldete nie etwas.
//
// Geprüft wird deshalb AN DEN LÖSUNGEN: Die Lösung des ursprünglichen
// Systems muss auch das umgeformte lösen, und umgekehrt. Wer aus II ein
// falsches I + II macht, ändert nichts an dem, was bei (7 | 3)
// passiert — aber alles an dem, was bei der Lösung passiert.

import { pruefung, wahr, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, alsText as bruchAlsText, gleich as bruchGleich } from '../utils/bruch.js';
import { zahl, variable, summe, produkt, auswerteExakt, alsText as termAlsText } from '../utils/term.js';
import { gleichung } from '../utils/gleichung.js';
import {
  system,
  istSystem,
  alsText,
  istErfuellt,
  loese,
  probe,
  loesungAlsText,
  alsRechenweg,
  VERFAHREN,
} from '../utils/system.js';

const x = variable('x');
const y = variable('y');
const k = (n) => zahl(bruch(n));
const mal = (n, t) => produkt(k(n), t);

const ALLE_VERFAHREN = Object.keys(VERFAHREN);
const SYSTEME = 120;

// I  a·x + b·y = c
const zeile = (a, b, c) => gleichung(summe(mal(a, x), mal(b, y)), k(c));

// ---------------------------------------------------------------------

pruefung('Systeme bauen und aufschreiben', () => {
  const s = system(zeile(3, 2, 7), zeile(1, -1, 1));
  gleichText('als Text', alsText(s), 'I  3x + 2y = 7\nII  x − y = 1');
  wahr('ist ein System', istSystem(s));
  wahr('eine einzelne Gleichung ist keins', !istSystem(zeile(1, 1, 2)));

  wirft('ein Term ist keine Gleichung', () => system(x, zeile(1, 1, 2)));
});

pruefung('Erfüllt heißt: BEIDE Zeilen', () => {
  const s = system(zeile(3, 2, 7), zeile(1, -1, 1));

  // (9/5 | 4/5) löst beide.
  wahr(
    'die Lösung erfüllt das System',
    istErfuellt(s, { x: bruch(9, 5), y: bruch(4, 5) })
  );

  // (1 | 2) löst die ERSTE Zeile (3 + 4 = 7), aber nicht die zweite.
  // Genau das ist der Unterschied zu einer einzelnen Gleichung.
  wahr(
    'eine Zeile allein genügt nicht',
    !istErfuellt(s, { x: bruch(1), y: bruch(2) })
  );
});

pruefung('Drei Verfahren, ein Ergebnis', () => {
  const s = system(zeile(3, 2, 7), zeile(1, -1, 1));

  for (const v of ALLE_VERFAHREN) {
    const e = loese(s, v);
    gleichText(`${v}: art`, e.art, 'eindeutig');
    gleichText(`${v}: Lösung`, loesungAlsText(e), 'x = 9/5,  y = 4/5');
    wahr(`${v}: hat einen Namen`, typeof e.verfahrenName === 'string' && e.verfahrenName.length > 5);
    wahr(`${v}: und einen Rechenweg`, e.schritte.length >= 2, `${e.schritte.length} Schritte`);
  }

  wirft('ein unbekanntes Verfahren wird abgelehnt', () => loese(s, 'raten'));
});

pruefung('Der Rechenweg nennt jeden Schritt', () => {
  const s = system(zeile(3, 2, 7), zeile(1, -1, 1));
  const weg = alsRechenweg(s, loese(s, 'addition'));
  const text = weg.join('\n');

  wahr('das Multiplizieren steht da', text.includes('II · (−3)'), text);
  wahr('das Addieren auch', text.includes('II + I'), text);
  wahr('und dass dabei x herausfällt', text.includes('x fällt heraus'), text);
  wahr('das Einsetzen am Ende ebenso', text.includes('in I einsetzen'), text);
});

pruefung('Die beiden Sonderfälle', () => {
  // Parallele Geraden — dieselbe Steigung, andere Höhe.
  const parallel = loese(system(zeile(1, 1, 3), zeile(1, 1, 5)));
  gleichText('keine Lösung', parallel.art, 'keine');
  wahr('mit Begründung', parallel.grund.includes('parallel'), parallel.grund);
  gleichText('als Text', loesungAlsText(parallel), 'keine Lösung');

  // Dieselbe Gerade, nur anders hingeschrieben.
  const gleich = loese(system(zeile(1, 1, 3), zeile(2, 2, 6)));
  gleichText('unendlich viele', gleich.art, 'alle');
  wahr('mit Begründung', gleich.grund.includes('dieselbe Gerade'), gleich.grund);

  // Und beide Sonderfälle müssen alle drei Verfahren gleich sehen.
  for (const v of ALLE_VERFAHREN) {
    gleichText(`${v}: parallel`, loese(system(zeile(1, 1, 3), zeile(1, 1, 5)), v).art, 'keine');
    gleichText(`${v}: deckungsgleich`, loese(system(zeile(1, 1, 3), zeile(2, 2, 6)), v).art, 'alle');
  }
});

pruefung('Auch ohne Vorarbeit: die Zeilen werden erst geordnet', () => {
  // 3x = 7 − 2y — das y steht rechts. Ohne Ordnen wäre alles Weitere
  // unlesbar.
  const s = system(gleichung(mal(3, x), summe(k(7), mal(-2, y))), zeile(1, -1, 1));
  const e = loese(s);
  gleichText('trotzdem gelöst', loesungAlsText(e), 'x = 9/5,  y = 4/5');
  wahr('und das Ordnen steht im Weg', e.schritte[0].operation.includes('ordnen'), e.schritte[0].operation);
});

pruefung('Was diese Datei nicht kann, sagt sie', () => {
  const dreiUnbekannte = system(
    gleichung(summe(x, y, variable('z')), k(1)),
    gleichung(summe(x, y), k(2))
  );
  gleichText('drei Unbekannte', loese(dreiUnbekannte).art, 'unklar');
  wahr('mit Begründung', loese(dreiUnbekannte).grund.includes('zwei Unbekannte'));

  // x · y ist nicht linear — und genau das übersieht man.
  const nichtLinear = system(gleichung(produkt(x, y), k(6)), zeile(1, 1, 5));
  gleichText('x · y', loese(nichtLinear).art, 'unklar');
  wahr('nennt das Produkt', loese(nichtLinear).grund.includes('x · y'), loese(nichtLinear).grund);

  const eineUnbekannte = system(gleichung(mal(2, x), k(4)), gleichung(mal(3, x), k(6)));
  gleichText('nur eine Unbekannte', loese(eineUnbekannte).art, 'unklar');
});

pruefung('Die Probe rechnet gegen das ursprüngliche System', () => {
  const s = system(zeile(3, 2, 7), zeile(1, -1, 1));
  const e = loese(s);
  const p = probe(s, e.loesung);

  gleichText('zwei Zeilen geprüft', p.length, 2);
  wahr('beide stimmen', p.every((z) => z.stimmt));
  gleichText('Zeile I links', bruchAlsText(p[0].links), '7');
  gleichText('Zeile II links', bruchAlsText(p[1].links), '1');

  // Eine falsche Lösung fällt auf.
  const falsch = probe(s, { x: k(1), y: k(2) });
  wahr('Zeile I stimmt zufällig', falsch[0].stimmt);
  wahr('Zeile II nicht', !falsch[1].stimmt);
});

// ---------------------------------------------------------------------
// Die tragende Prüfung
// ---------------------------------------------------------------------

// Ein System mit ganzzahliger Lösung — so bleiben die Zwischenwerte
// lesbar und die Prüfung misst das Verfahren, nicht die Bruchrechnung.
function zufallssystem(naechste, entartet) {
  const x0 = naechste(13) - 6;
  const y0 = naechste(13) - 6;
  const a1 = naechste(9) - 4 || 1;
  const b1 = naechste(9) - 4 || 1;

  if (entartet) {
    // Zeile II ist ein Vielfaches von I — mal mit passender, mal mit
    // unpassender rechter Seite. Ohne diese Fälle träfe die Prüfung die
    // Sonderfall-Zweige nie, und ein Zufallstest, der den geprüften
    // Code nicht erreicht, gibt falsche Sicherheit.
    const faktor = (naechste(5) - 2) || 2;
    const c1 = a1 * x0 + b1 * y0;
    const versatz = naechste(2) === 0 ? 0 : naechste(4) + 1;
    return system(zeile(a1, b1, c1), zeile(a1 * faktor, b1 * faktor, c1 * faktor + versatz));
  }

  let a2 = naechste(9) - 4 || 2;
  let b2 = naechste(9) - 4 || 3;
  // Nicht parallel: die Determinante darf nicht null werden.
  if (a1 * b2 - a2 * b1 === 0) {
    b2 += 1;
  }
  return system(
    zeile(a1, b1, a1 * x0 + b1 * y0),
    zeile(a2, b2, a2 * x0 + b2 * y0)
  );
}

function erfuellt(s, belegung) {
  try {
    return { antwort: istErfuellt(s, belegung) };
  } catch (fehler) {
    if (fehler.zuGross) {
      return { unbekannt: true };
    }
    throw fehler;
  }
}

function alsBelegung(loesung) {
  const aus = {};
  for (const name of Object.keys(loesung)) {
    aus[name] = auswerteExakt(loesung[name]);
  }
  return aus;
}

pruefung('Jede Umformung lässt die Lösungsmenge des Systems unverändert', () => {
  const naechste = wuerfel(startwertFuer('system-schritte'));
  let verglichen = 0;
  let fehler = null;

  for (let i = 0; i < SYSTEME && fehler === null; i++) {
    const start = zufallssystem(naechste, i % 4 === 0);

    for (const v of ALLE_VERFAHREN) {
      const ergebnis = loese(start, v);
      if (ergebnis.art === 'unklar' || ergebnis.art !== 'eindeutig') {
        continue;
      }
      const echteLoesung = alsBelegung(ergebnis.loesung);

      let vorher = start;
      for (const s of ergebnis.schritte) {
        // Zufällige Punkte taugen hier nicht — sie lösen fast nie ein
        // System. Geprüft wird an der LÖSUNG, in beide Richtungen.
        const a = erfuellt(vorher, echteLoesung);
        const b = erfuellt(s.system, echteLoesung);
        if (!a.unbekannt && !b.unbekannt) {
          verglichen++;
          if (a.antwort !== b.antwort) {
            fehler =
              `Schritt "${s.operation}":\n${alsText(vorher)}\n→\n${alsText(s.system)}\n` +
              `bei ${beschreibe(echteLoesung)}: ` +
              `${a.antwort ? 'erfüllt' : 'nicht erfüllt'} wird zu ` +
              `${b.antwort ? 'erfüllt' : 'nicht erfüllt'}`;
            break;
          }
        }

        // Und andersherum: Was das umgeformte System löst, muss auch das
        // ursprüngliche lösen. Sonst wären Lösungen DAZUGEKOMMEN — der
        // Fehler, den man beim Multiplizieren mit null macht.
        const zwischen = loese(s.system, 'addition');
        if (zwischen.art === 'eindeutig') {
          const seins = alsBelegung(zwischen.loesung);
          const c = erfuellt(start, seins);
          if (!c.unbekannt) {
            verglichen++;
            if (!c.antwort) {
              fehler =
                `Schritt "${s.operation}" erzeugt die Lösung ${beschreibe(seins)}, ` +
                `die das ursprüngliche System nicht löst:\n${alsText(start)}`;
              break;
            }
          }
        }

        vorher = s.system;
      }
      if (fehler) {
        break;
      }
    }
  }

  wahr('jeder Schritt erhält die Lösungsmenge', fehler === null, fehler ?? undefined);
  wahr('es wurde wirklich verglichen', verglichen >= 1500, `nur ${verglichen} Vergleiche`);
});

function beschreibe(belegung) {
  return Object.keys(belegung)
    .sort()
    .map((n) => `${n} = ${bruchAlsText(belegung[n])}`)
    .join(', ');
}

pruefung('Die gefundene Lösung löst das ursprüngliche System', () => {
  // Der Abschluss von außen — die Probe aus dem Unterricht. Sie fängt
  // einen Fehler im Rechenweg auch dann, wenn alle folgenden Schritte
  // sauber waren.
  const naechste = wuerfel(startwertFuer('system-probe'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < SYSTEME && fehler === null; i++) {
    const s = zufallssystem(naechste, false);
    for (const v of ALLE_VERFAHREN) {
      const e = loese(s, v);
      if (e.art !== 'eindeutig') {
        fehler = `${v}: "${alsText(s)}" ergibt "${e.art}", obwohl es genau eine Lösung gibt`;
        break;
      }
      geprueft++;
      if (!probe(s, e.loesung).every((z) => z.stimmt)) {
        fehler = `${v}: "${alsText(s)}" → ${loesungAlsText(e)} besteht die Probe nicht`;
        break;
      }
    }
  }

  wahr('jede Lösung besteht die Probe', fehler === null, fehler ?? undefined);
  wahr('und zwar oft genug', geprueft >= 300, `nur ${geprueft}`);
});

pruefung('Alle drei Verfahren finden dieselbe Lösung', () => {
  // Der Quervergleich: Drei verschiedene Wege, ein Ergebnis. Rechnet
  // eines von ihnen falsch, weichen die Antworten voneinander ab —
  // auch dann, wenn jede für sich plausibel aussieht.
  const naechste = wuerfel(startwertFuer('system-verfahren'));
  let fehler = null;
  let verglichen = 0;

  for (let i = 0; i < SYSTEME && fehler === null; i++) {
    const s = zufallssystem(naechste, i % 4 === 0);
    const antworten = ALLE_VERFAHREN.map((v) => {
      const e = loese(s, v);
      return { v, art: e.art, text: loesungAlsText(e) };
    });

    for (const a of antworten.slice(1)) {
      verglichen++;
      if (a.art !== antworten[0].art || a.text !== antworten[0].text) {
        fehler =
          `"${alsText(s)}":\n  ${antworten[0].v} sagt ${antworten[0].art} ${antworten[0].text}\n` +
          `  ${a.v} sagt ${a.art} ${a.text}`;
        break;
      }
    }
  }

  wahr('die Verfahren stimmen überein', fehler === null, fehler ?? undefined);
  wahr('und wurden verglichen', verglichen >= 200, `nur ${verglichen}`);
});

pruefung('Der gefährliche Schritt ist nicht der, den man vermutet', () => {
  // Erst der Fund, der beim Schreiben dieser Prüfung herauskam.
  //
  // Naheliegend als "typischer Fehler" wäre: statt II + I wird II − I
  // gerechnet, weil man ein Vorzeichen vergisst. Genau das war mein
  // erstes Gegenbeispiel — und es ist gar kein Fehler. Jede UMKEHRBARE
  // Zeilenkombination erhält die Lösungsmenge, weil das Lösungspaar
  // beide Zeilen erfüllt und damit auch jede Summe und jede Differenz
  // von ihnen. Man kann II − I durch Addieren von I rückgängig machen;
  // also geht keine Information verloren.
  const start = system(zeile(3, 2, 7), zeile(1, -1, 1));
  const echteLoesung = alsBelegung(loese(start).loesung);

  // II · (−3) → −3x + 3y = −3. Danach II + I ergibt 5y = 4, II − I
  // ergibt −6x + y = −10. BEIDE enthalten die Lösung.
  wahr('II + I enthält die Lösung', istErfuellt(system(zeile(3, 2, 7), zeile(0, 5, 4)), echteLoesung));
  wahr('II − I aber auch', istErfuellt(system(zeile(3, 2, 7), zeile(-6, 1, -10)), echteLoesung));

  // Gefährlich ist der Schritt, der NICHT umkehrbar ist: eine Zeile mit
  // null multiplizieren oder durch eine Kopie der anderen ersetzen.
  // Dabei geht Information verloren, und es kommen Lösungen DAZU, die
  // keine sind. Genau dagegen prüft die zweite Richtung der Invariante
  // oben — "was das umgeformte System löst, muss auch das
  // ursprüngliche lösen".
  const verloren = system(zeile(3, 2, 7), zeile(0, 0, 0)); // II · 0
  wahr('die echte Lösung erfüllt es weiterhin', istErfuellt(verloren, echteLoesung));

  // Aber jetzt löst auch (1 | 2) das System — und das ist keine Lösung
  // des ursprünglichen.
  const erfunden = { x: bruch(1), y: bruch(2) };
  wahr('und plötzlich auch ein Paar, das keine Lösung ist', istErfuellt(verloren, erfunden));
  wahr(
    'im ursprünglichen System löst es nichts',
    !istErfuellt(start, erfunden),
    'die Gegenprobe greift nicht — dann prüft die Invariante oben nichts'
  );

  // Dasselbe beim Ersetzen durch eine Kopie von I.
  const kopie = system(zeile(3, 2, 7), zeile(3, 2, 7));
  wahr('eine Kopie von I verliert genauso Information', loese(kopie).art === 'alle');
});
