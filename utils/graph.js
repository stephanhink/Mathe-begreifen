// Die Geometrie eines Funktionsgraphen — ohne zu zeichnen.
//
// Hier steht kein React und kein SVG. Diese Datei rechnet aus, WO etwas
// hingehört; components/Funktionsgraph.js malt es hin. Der Grund ist
// derselbe wie überall in utils/: So lässt sich das Rechnen mit blankem
// node prüfen, und der Zeichenteil bleibt kurz genug, um ihn zu
// überblicken.
//
// Drei Aufgaben stecken darin, und jede hat ihre eigene Tücke:
//
//   1. Eine schöne Achsenteilung finden. Ein Gitter im Abstand 0,7143
//      ist zwar korrekt, aber unlesbar.
//   2. Die Kurve abtasten — und dabei die Stellen erkennen, an denen
//      sie NICHT durchgezeichnet werden darf. Bei 1 : x eine Linie
//      durch die Null zu ziehen wäre schlicht falsch.
//   3. Zwischen Weltkoordinaten und Bildschirmpunkten umrechnen, wobei
//      die y-Achse auf dem Bildschirm nach unten zeigt und in der
//      Mathematik nach oben.

import { auswerte, variablen } from './term.js';

// ---------------------------------------------------------------------
// Schöne Zahlen
// ---------------------------------------------------------------------

// Ein Teilungsabstand, den ein Mensch lesen kann: 1, 2, 5, 10, 20, 50 …
// (und nach unten 0,5, 0,2, 0,1 …).
//
// Gesucht ist der Abstand, der ungefähr `zielAnzahl` Striche ergibt. Die
// Beschränkung auf 1, 2 und 5 ist keine Bequemlichkeit: Nur bei diesen
// Abständen kann man die Zwischenwerte im Kopf ablesen.
export function schoeneTeilung(spanne, zielAnzahl = 6) {
  if (!Number.isFinite(spanne) || spanne <= 0) {
    throw new Error('graph: die Spanne muss eine positive Zahl sein');
  }

  const roh = spanne / Math.max(1, zielAnzahl);
  const groessenordnung = 10 ** Math.floor(Math.log10(roh));
  const vielfaches = roh / groessenordnung;

  const stufe = vielfaches <= 1 ? 1 : vielfaches <= 2 ? 2 : vielfaches <= 5 ? 5 : 10;
  return stufe * groessenordnung;
}

// Die Striche zwischen zwei Grenzen, in schönen Abständen.
export function teilstriche(von, bis, zielAnzahl = 6) {
  const abstand = schoeneTeilung(bis - von, zielAnzahl);
  const erster = Math.ceil(von / abstand) * abstand;

  // Auf so viele Nachkommastellen, wie der Abstand selbst hat.
  //
  // Ohne das stünde am Gitter "0.6000000000000001": Ein Vielfaches von
  // 0,2 zu bilden reicht nicht, denn schon 3 · 0,2 ergibt in
  // Gleitkommazahlen genau diesen Staub. Gerundet werden muss das
  // ERGEBNIS, nicht der Faktor.
  const stellen = Math.max(0, -Math.floor(Math.log10(abstand)));

  const striche = [];
  for (let i = 0; ; i++) {
    const wert = Number((erster + i * abstand).toFixed(stellen));
    if (wert > bis + abstand * 1e-9) {
      break;
    }
    striche.push(wert);
  }
  return { abstand, striche };
}

// ---------------------------------------------------------------------
// Umrechnen
// ---------------------------------------------------------------------

// Eine Skala rechnet Weltkoordinaten in Bildschirmpunkte um.
//
// `umgedreht` ist für die y-Achse: In der Mathematik zeigt sie nach
// oben, auf dem Bildschirm nach unten. Diese eine Umkehrung ist die
// häufigste Fehlerquelle beim Zeichnen von Graphen — deshalb steckt sie
// hier an einer einzigen Stelle und nicht in jeder Zeichenzeile.
export function skala({ von, bis, pixel, umgedreht = false }) {
  if (!(bis > von)) {
    throw new Error(`graph: der Bereich ${von}…${bis} ist leer oder verkehrt herum`);
  }
  if (!(pixel > 0)) {
    throw new Error('graph: die Pixelbreite muss positiv sein');
  }

  const faktor = pixel / (bis - von);
  return (wert) => (umgedreht ? (bis - wert) * faktor : (wert - von) * faktor);
}

// ---------------------------------------------------------------------
// Die Kurve abtasten
// ---------------------------------------------------------------------

// Der Graph wird in ABSCHNITTE zerlegt, nicht in eine einzige Linie.
//
// Ein Abschnitt endet, wo die Funktion nicht definiert ist (1 : x bei
// null) oder wo sie so steil wird, dass die Verbindung zweier Punkte
// eine Lüge wäre — bei einer Polstelle springt der Wert von −1000 auf
// +1000, und eine durchgezogene Linie behauptete, dazwischen läge etwas.
//
// `hoehe` ist der sichtbare y-Bereich; alles weit außerhalb gilt als
// Sprung.
export function abtasten(term, name, { von, bis, unten, oben, punkte = 240 }) {
  if (!(bis > von)) {
    throw new Error(`graph: der Bereich ${von}…${bis} ist leer oder verkehrt herum`);
  }

  const schritt = (bis - von) / punkte;
  const spanne = oben - unten;
  // Ein Sprung um mehr als das Dreifache der Fensterhöhe zwischen zwei
  // benachbarten Punkten ist keine Steigung mehr, sondern eine
  // Definitionslücke.
  const sprungGrenze = spanne * 3;

  const abschnitte = [];
  let laufend = [];
  let vorigesY = null;

  for (let i = 0; i <= punkte; i++) {
    const x = von + i * schritt;
    let y = null;

    try {
      y = auswerte(term, { [name]: x });
    } catch {
      y = null; // hier nicht definiert
    }

    if (y === null || !Number.isFinite(y)) {
      abschnitte.push(laufend);
      laufend = [];
      vorigesY = null;
      continue;
    }

    if (vorigesY !== null && Math.abs(y - vorigesY) > sprungGrenze) {
      abschnitte.push(laufend);
      laufend = [];
    }

    laufend.push({ x, y });
    vorigesY = y;
  }

  abschnitte.push(laufend);
  // Ein Abschnitt aus einem einzelnen Punkt ergibt keine Linie.
  return abschnitte.filter((a) => a.length >= 2);
}

// ---------------------------------------------------------------------
// Das Fenster
// ---------------------------------------------------------------------

// Welcher y-Bereich soll gezeigt werden?
//
// Nicht einfach Minimum bis Maximum: Bei 1 : x ginge das von −10000 bis
// +10000, und der interessante Teil wäre ein Strich auf der Achse.
// Deshalb werden Ausreißer weggelassen — genommen wird der Bereich, in
// dem die mittleren neun Zehntel der Werte liegen, danach auf schöne
// Zahlen gerundet.
export function passenderBereich(term, name, { von, bis, punkte = 240, mindestens = 2 }) {
  const werte = [];
  const schritt = (bis - von) / punkte;

  for (let i = 0; i <= punkte; i++) {
    try {
      const y = auswerte(term, { [name]: von + i * schritt });
      if (Number.isFinite(y)) {
        werte.push(y);
      }
    } catch {
      /* hier nicht definiert */
    }
  }

  if (werte.length === 0) {
    return { unten: -mindestens, oben: mindestens };
  }

  werte.sort((a, b) => a - b);
  const rand = Math.floor(werte.length * 0.05);
  let unten = werte[rand];
  let oben = werte[werte.length - 1 - rand];

  // Die Null soll zu sehen sein, wenn sie in der Nähe liegt — ohne
  // x-Achse ist ein Graph schwer zu lesen.
  if (unten > 0 && unten < (oben - unten) * 2) {
    unten = 0;
  }
  if (oben < 0 && -oben < (oben - unten) * 2) {
    oben = 0;
  }

  if (oben - unten < mindestens) {
    const mitte = (oben + unten) / 2;
    unten = mitte - mindestens / 2;
    oben = mitte + mindestens / 2;
  }

  // Etwas Luft nach oben und unten, dann auf schöne Zahlen aufrunden.
  const luft = (oben - unten) * 0.1;
  const abstand = schoeneTeilung(oben - unten + 2 * luft);
  return {
    unten: Math.floor((unten - luft) / abstand) * abstand,
    oben: Math.ceil((oben + luft) / abstand) * abstand,
  };
}

// Welcher x-Bereich soll gezeigt werden?
//
// Ein festes Fenster von −6 bis 6 geht bei x² − 6x + 8 schief: Am Rand
// erreicht die Parabel 80, und der interessante Teil — Scheitel bei −1,
// Nullstellen bei 2 und 4 — wird zu einem Strich am unteren Rand.
//
// Deshalb richtet sich das Fenster nach den STELLEN, die etwas bedeuten:
// Nullstellen, Scheitel, die Null. Sie sollen mit Luft darum herum zu
// sehen sein.
export function xBereichUm(stellen, { mindestBreite = 8 } = {}) {
  const brauchbar = stellen.filter((s) => Number.isFinite(s));

  if (brauchbar.length === 0) {
    return { von: -mindestBreite / 2, bis: mindestBreite / 2 };
  }

  let links = Math.min(...brauchbar);
  let rechts = Math.max(...brauchbar);

  // Luft an den Rändern — sonst endet die Kurve genau im Scheitel.
  const spanne = Math.max(rechts - links, mindestBreite / 2);
  links -= spanne * 0.5;
  rechts += spanne * 0.5;

  if (rechts - links < mindestBreite) {
    const mitte = (links + rechts) / 2;
    links = mitte - mindestBreite / 2;
    rechts = mitte + mindestBreite / 2;
  }

  // Auf schöne Zahlen aufrunden, damit das Gitter aufgeht.
  const abstand = schoeneTeilung(rechts - links);
  return {
    von: Math.floor(links / abstand) * abstand,
    bis: Math.ceil(rechts / abstand) * abstand,
  };
}

// Welche Variable steckt in der Funktion? Ohne Variable ist es eine
// waagerechte Gerade — auch die lässt sich zeichnen.
export function funktionsvariable(term) {
  const namen = variablen(term);
  if (namen.length > 1) {
    throw new Error(
      `graph: mit mehreren Variablen (${namen.join(', ')}) lässt sich kein Graph zeichnen`
    );
  }
  return namen[0] ?? 'x';
}
