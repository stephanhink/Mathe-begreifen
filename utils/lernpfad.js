// Der Themengraph: Was setzt was voraus?
//
// Das ist die Datei, wegen der das ganze Projekt so aufgebaut ist. Aus
// CLAUDE.md:
//
//   Chemie ist ein Netz: Man kann fast überall einsteigen. Mathematik
//   ist eine Kette. Wer die Potenzgesetze nicht sicher beherrscht,
//   scheitert an der Kettenregel und weiß nicht, warum.
//
// Deshalb sind die Themen hier kein flaches Verzeichnis, sondern ein
// gerichteter Graph. Jedes Thema kennt seine Vorbedingungen; der
// Lückenfinder (utils/luecken.js) läuft ihn nach unten, bis er festen
// Boden findet.
//
// ---------------------------------------------------------------------
// Warum das NICHT dieselbe Datei wie wissen.js ist
// ---------------------------------------------------------------------
//
// Das Konzept ließ offen, ob wissen.js und lernpfad.js eine Datenquelle
// sein sollten. Beim Bauen wurde klar: besser nicht, aber fest
// verbunden.
//
// Der Grund ist ein Unterschied, den man erst sieht, wenn man es
// versucht: wissen.js beschreibt BEGRIFFE ("Was ist ein Bruch?"),
// lernpfad.js beschreibt FERTIGKEITEN ("einen Bruch kürzen können").
// Zu einem Begriff gehören mehrere Fertigkeiten — Brüche kürzen,
// addieren, multiplizieren sind drei Dinge, die man einzeln können oder
// nicht können kann, aber sie teilen sich einen Erklärtext. Presste man
// beides in eine Struktur, müsste eines von beiden sich verbiegen: Man
// bekäme entweder Erklärtexte, die dreimal fast dasselbe sagen, oder
// Fertigkeiten, die man nicht einzeln prüfen kann.
//
// Verbunden sind sie über das Feld `wissen`: Jedes Thema zeigt auf den
// Text, der es erklärt. Dass diese Verweise nicht ins Leere gehen,
// prüft tests/lernpfad.mjs.
//
// ---------------------------------------------------------------------
// Aufbau eines Eintrags
// ---------------------------------------------------------------------
//
//   titel            Was man können soll, als Fertigkeit formuliert
//   klasse           Ab welcher Jahrgangsstufe (grobe Einordnung)
//   voraussetzungen  IDs der Themen, die man vorher können muss
//   wissen           ID in utils/wissen.js — der Text dazu
//
// Die Reihenfolge in dieser Datei ist von unten nach oben sortiert:
// Grundlagen zuerst. Das ist nur Lesbarkeit — verbindlich ist allein
// das Feld `voraussetzungen`.

export const THEMEN = {
  // -----------------------------------------------------------------
  // Zahlen
  // -----------------------------------------------------------------

  ganzeZahlenAddieren: {
    titel: 'Mit negativen Zahlen addieren und subtrahieren',
    klasse: 5,
    voraussetzungen: [],
    wissen: null,
  },

  ganzeZahlenMultiplizieren: {
    titel: 'Mit negativen Zahlen multiplizieren und dividieren',
    klasse: 6,
    voraussetzungen: ['ganzeZahlenAddieren'],
    wissen: null,
  },

  bruchKuerzen: {
    titel: 'Brüche kürzen',
    klasse: 6,
    voraussetzungen: ['ganzeZahlenMultiplizieren'],
    wissen: 'bruch',
  },

  bruchAddieren: {
    titel: 'Brüche addieren und subtrahieren',
    klasse: 6,
    voraussetzungen: ['bruchKuerzen'],
    wissen: 'bruch',
  },

  bruchMultiplizieren: {
    titel: 'Brüche multiplizieren',
    klasse: 6,
    voraussetzungen: ['bruchKuerzen'],
    wissen: 'bruch',
  },

  bruchDividieren: {
    titel: 'Brüche dividieren',
    klasse: 6,
    voraussetzungen: ['bruchMultiplizieren'],
    wissen: 'bruch',
  },

  // -----------------------------------------------------------------
  // Potenzen und Wurzeln
  // -----------------------------------------------------------------

  potenzDefinition: {
    titel: 'Wissen, was eine Potenz bedeutet',
    klasse: 7,
    voraussetzungen: ['ganzeZahlenMultiplizieren'],
    wissen: 'potenz',
  },

  potenzgesetzMal: {
    titel: 'Potenzen mit gleicher Basis multiplizieren',
    klasse: 8,
    voraussetzungen: ['potenzDefinition'],
    wissen: 'potenz',
  },

  potenzgesetzGeteilt: {
    titel: 'Potenzen mit gleicher Basis dividieren',
    klasse: 8,
    voraussetzungen: ['potenzgesetzMal', 'bruchDividieren'],
    wissen: 'potenz',
  },

  negativeExponenten: {
    titel: 'Negative Exponenten verstehen',
    klasse: 9,
    voraussetzungen: ['potenzgesetzGeteilt'],
    wissen: 'potenz',
  },

  wurzelZiehen: {
    titel: 'Quadratwurzeln ziehen',
    klasse: 8,
    voraussetzungen: ['potenzDefinition'],
    wissen: 'wurzel',
  },

  wurzelTeilweise: {
    titel: 'Teilweise die Wurzel ziehen',
    klasse: 9,
    voraussetzungen: ['wurzelZiehen'],
    wissen: 'wurzel',
  },

  // -----------------------------------------------------------------
  // Terme
  // -----------------------------------------------------------------

  termZusammenfassen: {
    titel: 'Gleichartige Glieder zusammenfassen',
    klasse: 7,
    voraussetzungen: ['ganzeZahlenAddieren'],
    wissen: 'gleichartigeGlieder',
  },

  termMitPotenzen: {
    titel: 'Terme mit Potenzen zusammenfassen',
    klasse: 8,
    voraussetzungen: ['termZusammenfassen', 'potenzgesetzMal'],
    wissen: 'gleichartigeGlieder',
  },

  ausmultiplizieren: {
    titel: 'Eine Klammer ausmultiplizieren',
    klasse: 7,
    voraussetzungen: ['termZusammenfassen', 'ganzeZahlenMultiplizieren'],
    wissen: 'ausmultiplizieren',
  },

  binomischeFormeln: {
    titel: 'Zwei Klammern ausmultiplizieren (binomische Formeln)',
    klasse: 8,
    voraussetzungen: ['ausmultiplizieren', 'termMitPotenzen'],
    wissen: 'ausmultiplizieren',
  },

  ausklammern: {
    titel: 'Einen gemeinsamen Faktor ausklammern',
    klasse: 8,
    voraussetzungen: ['ausmultiplizieren'],
    wissen: 'ausklammern',
  },

  // -----------------------------------------------------------------
  // Gleichungen
  // -----------------------------------------------------------------

  gleichungEinschrittig: {
    titel: 'Eine Gleichung in einem Schritt lösen',
    klasse: 6,
    voraussetzungen: ['ganzeZahlenAddieren'],
    wissen: 'beideSeiten',
  },

  gleichungMehrschrittig: {
    titel: 'Eine Gleichung mit x auf beiden Seiten lösen',
    klasse: 7,
    voraussetzungen: ['gleichungEinschrittig', 'termZusammenfassen'],
    wissen: 'beideSeiten',
  },

  gleichungMitKlammern: {
    titel: 'Eine Gleichung mit Klammern lösen',
    klasse: 8,
    voraussetzungen: ['gleichungMehrschrittig', 'ausmultiplizieren'],
    wissen: 'beideSeiten',
  },

  gleichungMitBruechen: {
    titel: 'Eine Gleichung mit Brüchen lösen',
    klasse: 8,
    voraussetzungen: ['gleichungMehrschrittig', 'bruchDividieren'],
    wissen: 'beideSeiten',
  },

  quadratischeGleichung: {
    titel: 'Eine quadratische Gleichung mit der pq-Formel lösen',
    klasse: 9,
    voraussetzungen: ['gleichungMitKlammern', 'binomischeFormeln', 'wurzelZiehen'],
    wissen: 'pqFormel',
  },

  // Ungleichungen hängen an den Gleichungen — bis auf eine Regel, und
  // die hängt an etwas ganz anderem: am Rechnen mit negativen Zahlen.
  // Wer nicht sicher weiß, dass −2 größer ist als −3, kann den Dreh
  // nicht verstehen, sondern nur auswendig lernen. Genau deshalb steht
  // ganzeZahlenMultiplizieren als Voraussetzung darunter und nicht bloß
  // die Gleichung darüber.
  ungleichungEinfach: {
    titel: 'Eine einfache Ungleichung lösen',
    klasse: 7,
    voraussetzungen: ['gleichungMehrschrittig'],
    wissen: 'ungleichung',
  },

  // Die Oberstufe. Hier läuft der ganze Graph zusammen: Die Ableitung
  // steht auf den Potenzgesetzen, und die Kettenregel steht auf der
  // Ableitung. Wer bei der Kettenregel scheitert, wird vom Lückenfinder
  // nach UNTEN geschickt — und landet oft bei negativeExponenten. Genau
  // dieser Weg ist der Grund, warum es diese App gibt.
  ableitungPotenzregel: {
    titel: 'Mit der Potenzregel ableiten',
    klasse: 11,
    voraussetzungen: ['potenzDefinition', 'termMitPotenzen'],
    wissen: 'ableitung',
  },

  ableitungMitWurzel: {
    titel: 'Wurzeln und Brüche ableiten',
    klasse: 11,
    voraussetzungen: ['ableitungPotenzregel', 'negativeExponenten', 'wurzelZiehen'],
    wissen: 'ableitung',
  },

  kettenregel: {
    titel: 'Mit der Kettenregel ableiten',
    klasse: 11,
    voraussetzungen: ['ableitungPotenzregel', 'ausmultiplizieren'],
    wissen: 'kettenregel',
  },

  // Der Satz des Pythagoras. Er fehlte bisher im Graphen, obwohl der
  // Geometrie-Bildschirm ihn längst kann — aufgefallen ist das erst,
  // als der Betrag eines Vektors ihn als Voraussetzung brauchte.
  pythagorasSatz: {
    titel: 'Den Satz des Pythagoras anwenden',
    klasse: 9,
    voraussetzungen: ['potenzDefinition', 'wurzelZiehen'],
    wissen: 'pythagoras',
  },

  // Vektorgeometrie. Sie hängt an ganz anderen Voraussetzungen als die
  // Analysis — am Pythagoras für den Betrag und am Rechnen mit
  // negativen Zahlen für die Komponenten. Deshalb steht sie im Graphen
  // NEBEN der Analysis und nicht darunter: Wer bei Vektoren scheitert,
  // soll nicht zur Ableitung geschickt werden.
  vektorRechnen: {
    titel: 'Mit Vektoren rechnen',
    klasse: 11,
    voraussetzungen: ['ganzeZahlenAddieren', 'ganzeZahlenMultiplizieren'],
    wissen: 'vektor',
  },

  vektorBetrag: {
    titel: 'Den Betrag eines Vektors berechnen',
    klasse: 11,
    voraussetzungen: ['vektorRechnen', 'pythagorasSatz'],
    wissen: 'vektor',
  },

  skalarprodukt: {
    titel: 'Das Skalarprodukt und der rechte Winkel',
    klasse: 12,
    voraussetzungen: ['vektorRechnen'],
    wissen: 'skalarprodukt',
  },

  stammfunktion: {
    titel: 'Eine Stammfunktion bilden',
    klasse: 12,
    voraussetzungen: ['ableitungPotenzregel'],
    wissen: 'integral',
  },

  bestimmtesIntegral: {
    titel: 'Ein bestimmtes Integral berechnen',
    klasse: 12,
    voraussetzungen: ['stammfunktion'],
    wissen: 'integral',
  },

  gleichungssystem: {
    titel: 'Ein Gleichungssystem lösen',
    klasse: 9,
    voraussetzungen: ['gleichungMitKlammern', 'termZusammenfassen'],
    wissen: 'gleichungssystem',
  },

  ungleichungMitDreh: {
    titel: 'Eine Ungleichung mit negativem Vorfaktor lösen',
    klasse: 8,
    voraussetzungen: ['ungleichungEinfach', 'ganzeZahlenMultiplizieren'],
    wissen: 'ungleichung',
  },
};

// ---------------------------------------------------------------------
// Den Graphen abfragen
// ---------------------------------------------------------------------

export function holeThema(id) {
  return THEMEN[id];
}

export function alleThemen() {
  return Object.keys(THEMEN);
}

export function voraussetzungenVon(id) {
  return THEMEN[id]?.voraussetzungen ?? [];
}

// Wer setzt dieses Thema voraus? Die Gegenrichtung — sie beantwortet
// "wozu brauche ich das?" und trägt den Weg nach oben im Bericht.
export function baut_auf(id) {
  return alleThemen().filter((k) => THEMEN[k].voraussetzungen.includes(id));
}

// Alle Voraussetzungen, auch die der Voraussetzungen. Die Reihenfolge
// ist von nah nach fern.
export function alleVoraussetzungen(id) {
  const gesehen = new Set();
  const ergebnis = [];
  const warteschlange = [...voraussetzungenVon(id)];

  while (warteschlange.length > 0) {
    const naechstes = warteschlange.shift();
    if (gesehen.has(naechstes)) {
      continue;
    }
    gesehen.add(naechstes);
    ergebnis.push(naechstes);
    warteschlange.push(...voraussetzungenVon(naechstes));
  }
  return ergebnis;
}

// Themen, auf die nichts weiter aufbaut — die Spitzen der Ketten. Von
// dort startet der Lückenfinder, weil eine Frage dort am meisten
// verrät: Wer sie kann, kann mit einiger Wahrscheinlichkeit auch alles
// darunter.
export function spitzen() {
  return alleThemen().filter((id) => baut_auf(id).length === 0);
}

// Themen ohne Voraussetzung — der feste Boden.
export function wurzeln() {
  return alleThemen().filter((id) => voraussetzungenVon(id).length === 0);
}

// Ein Weg von unten nach oben, entlang der Abhängigkeiten. Gibt es
// keinen, kommt eine leere Liste zurück.
//
// Gebraucht wird das für den Satz, der am Ende steht: "Dein Problem
// sind die Potenzgesetze — hier ist der Weg von dort nach oben."
export function wegNachOben(von, bis) {
  if (von === bis) {
    return [von];
  }
  const besucht = new Set([von]);
  const warteschlange = [[von]];

  while (warteschlange.length > 0) {
    const weg = warteschlange.shift();
    for (const naechstes of baut_auf(weg[weg.length - 1])) {
      if (besucht.has(naechstes)) {
        continue;
      }
      const neuerWeg = [...weg, naechstes];
      if (naechstes === bis) {
        return neuerWeg;
      }
      besucht.add(naechstes);
      warteschlange.push(neuerWeg);
    }
  }
  return [];
}

// Findet Zyklen. Ein Zyklus wäre ein Thema, das sich selbst voraussetzt
// — der Lückenfinder liefe darin endlos im Kreis. Die Prüfung dafür
// steht in tests/lernpfad.mjs; die Funktion selbst gehört hierher,
// damit sie auch zur Laufzeit greifbar ist.
export function findeZyklus() {
  const status = new Map(); // 'laeuft' oder 'fertig'
  let gefunden = null;

  function besuche(id, weg) {
    if (status.get(id) === 'fertig') {
      return;
    }
    if (status.get(id) === 'laeuft') {
      gefunden = [...weg.slice(weg.indexOf(id)), id];
      return;
    }
    status.set(id, 'laeuft');
    for (const v of voraussetzungenVon(id)) {
      if (gefunden) {
        return;
      }
      besuche(v, [...weg, id]);
    }
    status.set(id, 'fertig');
  }

  for (const id of alleThemen()) {
    if (!gefunden) {
      besuche(id, []);
    }
  }
  return gefunden;
}
