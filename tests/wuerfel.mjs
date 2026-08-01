// Ein winziger Zufallsgenerator mit festem Startwert (xorshift32).
//
// Math.random() wäre in Prüfungen falsch: Eine Prüfung, die mal durchgeht
// und mal nicht, ist keine Prüfung. Schlägt hier etwas fehl, schlägt es
// beim nächsten Lauf wieder fehl — sonst könnte man den Fehler nicht
// suchen.
//
// Liegt in tests/ und nicht in utils/, weil es kein Teil der App ist:
// Die App würfelt später mit echtem Zufall (Aufgabengenerator), nur die
// Prüfungen brauchen Wiederholbarkeit.

export function wuerfel(startwert = 20260801) {
  let zustand = startwert | 0 || 1;
  return function naechste(bis) {
    zustand ^= zustand << 13;
    zustand ^= zustand >>> 17;
    zustand ^= zustand << 5;
    zustand |= 0;
    return Math.abs(zustand) % bis;
  };
}

// Jede Regel bekommt ihre eigene Zahlenfolge, damit nicht alle Regeln an
// denselben Proben scheitern oder durchgehen. Abgeleitet wird der
// Startwert aus einem Text — fest und damit wiederholbar.
export function startwertFuer(text) {
  let wert = 20260801;
  for (const zeichen of String(text)) {
    wert = (wert * 31 + zeichen.codePointAt(0)) | 0;
  }
  return wert || 1;
}
