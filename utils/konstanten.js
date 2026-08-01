// Konstanten und Farben — beides steht hier zentral, damit es nicht in
// sieben Screens leicht unterschiedlich noch einmal auftaucht.
//
// In utils/ läuft grundsätzlich kein React: Diese Datei ist reines
// JavaScript und lässt sich deshalb auch außerhalb der App nachrechnen.

// ---------------------------------------------------------------------
// Mathematische Konstanten
// ---------------------------------------------------------------------

// π und e stehen in JavaScript als Math.PI und Math.E bereit; sie werden
// hier nicht noch einmal definiert. Was hier steht, ist das, was Math
// nicht mitbringt.

// Der Goldene Schnitt φ = (1 + √5) / 2. Taucht bei Fibonacci-Zahlen,
// beim regelmäßigen Fünfeck und in der Geometrie auf.
export const GOLDENER_SCHNITT = (1 + Math.sqrt(5)) / 2;

// Umrechnung Grad ↔ Bogenmaß. Im deutschen Unterricht wird bis Klasse 10
// in Grad gerechnet, ab der Oberstufe (Sinusfunktion, Ableitung) im
// Bogenmaß — und genau an dieser Stelle geht viel verloren. Die App muss
// immer dazusagen, in welchem Maß sie gerade rechnet.
export const GRAD_JE_BOGENMASS = 180 / Math.PI;

export function inBogenmass(grad) {
  return (grad * Math.PI) / 180;
}

export function inGrad(bogenmass) {
  return (bogenmass * 180) / Math.PI;
}

// Winkelsumme im Dreieck, in Grad. Steht hier, weil mehrere Prüfungen
// dagegen rechnen: Ein Dreieck mit einer anderen Winkelsumme gibt es in
// der ebenen Geometrie nicht, und die App muss das ablehnen statt eine
// Zahl zu raten.
export const WINKELSUMME_DREIECK = 180;

// Wie genau zwei Gleitkommazahlen übereinstimmen müssen, um in dieser App
// als gleich zu gelten. Wird von den Prüfungen benutzt, die eine
// Termumformung an zufälligen Stellen numerisch vergleichen.
//
// Nicht für Rechnungen verwenden, die exakt sein sollen: Dort wird mit
// Brüchen gerechnet (utils/bruch.js), nicht mit Kommazahlen.
export const TOLERANZ = 1e-9;

// ---------------------------------------------------------------------
// Physikalische Konstanten
// ---------------------------------------------------------------------
// Nicht Selbstzweck: Die Physik ist in dieser App kein eigener Bereich,
// sondern das durchgehende Beispielmaterial. Wer "v = s/t nach t
// umstellen" übt, soll echte Zahlen sehen.

// Fallbeschleunigung auf der Erde in m/s². Normwert nach ISO 80000-3;
// im Unterricht wird meist mit 9,81 gerechnet.
export const ERDBESCHLEUNIGUNG = 9.80665;

// Lichtgeschwindigkeit im Vakuum in m/s. Seit 1983 exakt definiert —
// das Meter hängt an ihr, nicht umgekehrt. Gutes Beispiel für
// Zehnerpotenzen und Größenordnungen (Lichtjahr).
export const LICHTGESCHWINDIGKEIT = 299792458;

// Ein Lichtjahr in Metern: Lichtgeschwindigkeit mal ein julianisches Jahr
// (365,25 Tage). Wird bei Zehnerpotenzen gebraucht.
export const LICHTJAHR = LICHTGESCHWINDIGKEIT * 365.25 * 24 * 3600;

// ---------------------------------------------------------------------
// Farben
// ---------------------------------------------------------------------
// Ein Indigo als Leitfarbe. Die Schwesterprojekte: Chemie = Grün
// (#1a7f5a), finanz-kids = Blau. Die Farbe taucht auch in app.json als
// adaptiveIcon.backgroundColor auf — wer sie hier ändert, muss sie dort
// mitändern.

export const farben = {
  primaer: '#4338CA',
  primaerDunkel: '#312E81',
  hintergrundHell: '#EEF0FC',
  trenner: '#C7CBF0',
  rand: '#ccc',
  text: '#333',
  textLeise: '#666',
  textSehrLeise: '#999',
  weiss: '#fff',
  // Für richtig/falsch beim Aufgabengenerator und beim Lückenfinder.
  richtig: '#15803d',
  richtigHintergrund: '#DCFCE7',
  falsch: '#b91c1c',
  falschHintergrund: '#FEE2E2',
  // Für Warnhinweise, z. B. wenn eine Formel außerhalb ihres
  // Gültigkeitsbereichs benutzt wird (Wurzel aus negativer Zahl,
  // Logarithmus von null).
  warnung: '#b45309',
  warnungHintergrund: '#FEF3C7',
};
