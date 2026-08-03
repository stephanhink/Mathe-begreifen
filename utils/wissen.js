// Hintergrundwissen zu den Fachbegriffen, die in den Screens vorkommen.
//
// Alle Texte stehen hier zentral, nicht in den Screens — so bleiben die
// Screens beim Rechnen und die Texte lassen sich bearbeiten, ohne durch
// fünf Dateien zu suchen.
//
// Aufbau eines Eintrags:
//   titel     Überschrift im Info-Fenster
//   text      Array von Absätzen (ein Eintrag = ein Absatz)
//   formel    optional: die zugehörige Formel, abgesetzt dargestellt
//   beispiel  optional: eine konkrete Rechnung zum Anfassen
//   mehr      optional: IDs verwandter Themen, erscheinen als Links
//
// Wie die Texte geschrieben sind (siehe CLAUDE.md):
//   1. Erster Absatz: die Antwort in Alltagssprache, ohne Voraussetzung,
//      ohne Formel, ohne weiteren Fachbegriff.
//   2. Danach die Tiefe.
//   3. beispiel: eine konkrete Zahl.
//   4. mehr: die Begriffe, über die man stolpern könnte — und die
//      Grundlagen eine Ebene tiefer.
//
// Bei Mathe ist Punkt 4 besonders wichtig: Die mehr-Links sind faktisch
// schon der Lernpfad-Graph. Wer bei "Kettenregel" hängt, soll über die
// Links bei "Potenzgesetze" landen können.

export const THEMEN = {
  // -----------------------------------------------------------------
  // Was man in das Feld tippen kann
  // -----------------------------------------------------------------

  term: {
    titel: 'Was ist ein Term?',
    text: [
      'Ein Term ist ein Rechenausdruck ohne Gleichheitszeichen — etwas, das man ausrechnen könnte, wenn man alle Zahlen kennt. „3 + 4" ist ein Term, „2x + 5" auch.',
      'Ein Term hat einen Wert. Stehen Buchstaben darin, hängt der Wert davon ab, welche Zahl man für den Buchstaben einsetzt: 2x + 5 ist bei x = 1 gleich 7 und bei x = 10 gleich 25.',
      'Der Unterschied zur Gleichung ist genau das Gleichheitszeichen. Eine Gleichung behauptet, dass zwei Terme denselben Wert haben — und dann kann man fragen, für welche Zahlen das stimmt. Bei einem Term gibt es nichts zu lösen, nur etwas zu vereinfachen.',
    ],
    beispiel: 'Term: 3x + 5.   Gleichung: 3x + 5 = 14.   Nur die zweite hat eine Lösung (x = 3).',
    mehr: ['gleichung', 'variable', 'termUmformen'],
  },

  gleichung: {
    titel: 'Was ist eine Gleichung?',
    text: [
      'Eine Gleichung behauptet, dass links und rechts vom Gleichheitszeichen dasselbe herauskommt. Sie ist eine Frage: Für welche Zahlen stimmt das?',
      'Diese Zahlen heißen Lösungen. Manche Gleichungen haben genau eine (3x + 5 = 14 nur x = 3), manche keine (x + 1 = x + 2 ist für keine Zahl wahr), manche alle (x + x = 2x stimmt immer).',
      'Beim Lösen tut man auf beiden Seiten immer dasselbe. Das ist der ganze Trick: Eine Waage bleibt im Gleichgewicht, solange man links und rechts gleich viel wegnimmt oder dazulegt. Deshalb steht an jedem Schritt „beide Seiten …".',
    ],
    beispiel: '3x + 5 = 14  |  beide Seiten − 5  →  3x = 9  |  beide Seiten : 3  →  x = 3',
    mehr: ['term', 'beideSeiten', 'loesungsmenge', 'probe'],
  },

  variable: {
    titel: 'Variable',
    text: [
      'Eine Variable ist ein Buchstabe, der für eine Zahl steht, die man noch nicht kennt oder die sich ändern kann. Meistens ist es x.',
      'Wichtig ist: Der Buchstabe ist kein Ding, sondern ein Platzhalter. Wo x steht, darf man jede Zahl einsetzen — und dann rechnet man ganz normal weiter. Genau das macht die Probe.',
      'Verschiedene Buchstaben stehen für verschiedene Zahlen, gleiche Buchstaben im selben Term immer für dieselbe. In 2x + x steht x zweimal, aber es ist beide Male dieselbe Zahl — deshalb darf man zu 3x zusammenfassen.',
    ],
    beispiel: 'In der Physik heißt die Variable oft anders: In v = s : t steht s für den Weg und t für die Zeit. Gerechnet wird genauso.',
    mehr: ['term', 'gleichartigeGlieder'],
  },

  // -----------------------------------------------------------------
  // Was mit dem Term passiert
  // -----------------------------------------------------------------

  termUmformen: {
    titel: 'Einen Term umformen',
    text: [
      'Umformen heißt: den Term anders hinschreiben, ohne seinen Wert zu ändern. Aus 3x + 5 + 2x wird 5x + 5 — das sieht anders aus, ist aber für jede Zahl x dasselbe.',
      'Das ist die eiserne Regel hinter jedem Schritt in dieser App: Egal welche Zahl man einsetzt, vorher und nachher muss dasselbe herauskommen. Wenn nicht, war die Umformung falsch — auch wenn sie plausibel aussah.',
      'Deshalb hat hier jeder Schritt einen Namen. „= 5x + 5" allein hilft niemandem; „gleichartige Glieder zusammenfassen" sagt, was passiert ist, und lässt sich beim nächsten Mal selbst anwenden.',
    ],
    beispiel: '3x + 5 + 2x wird zu 5x + 5. Bei x = 2: vorher 6 + 5 + 4 = 15, nachher 10 + 5 = 15.',
    mehr: ['gleichartigeGlieder', 'ausmultiplizieren', 'ausklammern', 'term'],
  },

  gleichartigeGlieder: {
    titel: 'Gleichartige Glieder zusammenfassen',
    text: [
      'Zusammenfassen darf man nur, was denselben Buchstabenteil hat. 3x und 2x sind gleichartig und ergeben 5x. 3x und 3x² sind es nicht — die muss man stehen lassen.',
      'Der Grund ist einfach: 3x heißt „dreimal x". Drei Äpfel plus zwei Äpfel sind fünf Äpfel, aber drei Äpfel plus zwei Birnen sind eben nicht fünf Irgendwas.',
      'Zusammengefasst werden nur die Zahlen davor, der Buchstabenteil bleibt wie er ist. Aus 3x + 2x wird 5x, nicht 5x².',
    ],
    beispiel: '3x + 5 + 2x = 5x + 5.   Aber: 3x + 2x² bleibt 3x + 2x².',
    mehr: ['variable', 'potenz', 'termUmformen'],
  },

  ausmultiplizieren: {
    titel: 'Klammer ausmultiplizieren',
    text: [
      'Eine Klammer ausmultiplizieren heißt: jeden Summanden in der Klammer einzeln mit dem Faktor davor malnehmen. Aus 2 · (x + 3) wird 2x + 6.',
      'Stehen zwei Klammern nebeneinander, wird jedes Glied der einen mit jedem Glied der anderen malgenommen. Bei (x + 3) · (x + 3) sind das vier Produkte: x · x, x · 3, 3 · x und 3 · 3.',
      'Genau daraus entstehen die binomischen Formeln. Man muss sie nicht auswendig können — sie sind nichts anderes als ausmultiplizieren und zusammenfassen.',
    ],
    formel: '(a + b)² = a² + 2ab + b²',
    beispiel: '(x + 3)² = x · x + 3x + 3x + 9 = x² + 6x + 9',
    mehr: ['ausklammern', 'gleichartigeGlieder', 'potenz', 'termUmformen'],
  },

  ausklammern: {
    titel: 'Gemeinsamen Faktor ausklammern',
    text: [
      'Ausklammern ist das Gegenteil vom Ausmultiplizieren: Man sucht, was in allen Summanden steckt, und zieht es vor die Klammer. Aus 6x + 9 wird 3 · (2x + 3).',
      'Gesucht wird der größte gemeinsame Teiler der Zahlen und die kleinste Potenz, die in allen Gliedern vorkommt. In x² + x steckt in beiden ein x, also wird daraus x · (x + 1).',
      'Wozu das gut ist: Ein Produkt ist genau dann null, wenn einer der Faktoren null ist. Deshalb ist Ausklammern der erste Schritt beim Lösen vieler Gleichungen — und beim Kürzen von Brüchen.',
    ],
    beispiel: '6x + 9 = 3 · (2x + 3).   Probe durch Ausmultiplizieren: 3 · 2x + 3 · 3 = 6x + 9. ✓',
    mehr: ['ausmultiplizieren', 'termUmformen'],
  },

  // -----------------------------------------------------------------
  // Zahlen und Rechenzeichen
  // -----------------------------------------------------------------

  bruch: {
    titel: 'Brüche',
    text: [
      'Ein Bruch ist eine Zahl, die man als Teilung schreibt: 3/4 heißt „drei Viertel", also 3 geteilt durch 4.',
      'Diese App rechnet immer mit Brüchen und nie mit Kommazahlen, und das hat einen handfesten Grund: 1/3 lässt sich als Kommazahl gar nicht genau hinschreiben. Rechnet man 1/3 + 1/3 + 1/3 mit Kommazahlen, kommt 0,9999999999999998 heraus statt 1. Mit Brüchen kommt genau 1 heraus.',
      'Deshalb steht in den Ergebnissen 2/3 und nicht 0,667. Das ist nicht Sturheit, sondern der exakte Wert — 0,667 wäre schon gerundet.',
    ],
    beispiel: '1/2 + 1/3 = 5/6. Mit Kommazahlen: 0,5 + 0,333… — und schon muss man runden.',
    mehr: ['prozent', 'term'],
  },

  prozent: {
    titel: 'Prozentrechnung',
    text: [
      'Prozent heißt „von hundert". 19 % sind 19 von 100 Teilen — also der Bruch 19/100.',
      'Immer sind drei Größen im Spiel, und man muss wissen, welche gesucht ist. Der Grundwert G ist das Ganze, also die 100 %. Der Prozentsatz p sagt, wie viel Prozent. Der Prozentwert W ist der Teil davon.',
      'Wer die drei auseinanderhält, hat das Wesentliche. Die Formel folgt dann von selbst — und man kann sie nach jeder der drei Größen umstellen, genau wie jede andere Formel auch.',
    ],
    formel: 'W = G · p/100',
    beispiel: '19 % von 250 €: W = 250 · 19/100 = 47,50 €.',
    mehr: ['prozentFalle', 'bruch', 'termUmformen'],
  },

  prozentFalle: {
    titel: 'Die Prozentfalle',
    text: [
      'Ein Pullover kostet nach 19 % Aufschlag 119 €. Was war der Preis vorher? Die naheliegende Rechnung „119 minus 19 %" ergibt 96,39 € — und ist falsch. Richtig sind 100 €.',
      'Der Grund: Die 19 % beziehen sich auf den ALTEN Preis, nicht auf den neuen. Der alte Preis ist 100 %, der neue also 119 %. Man muss deshalb durch 119 teilen und mit 100 malnehmen, nicht 19 % vom neuen Wert abziehen.',
      'Dieselbe Falle steckt hinter der Frage, warum ein Preis nach „+10 % und dann −10 %" nicht wieder derselbe ist: 100 → 110 → 99. Die zweiten 10 % sind mehr wert als die ersten, weil sie sich auf eine größere Zahl beziehen.',
    ],
    beispiel: '119 € nach +19 %:  119 · 100/119 = 100 €.   Nicht 119 − 19 % = 96,39 €.',
    mehr: ['prozent', 'termUmformen'],
  },

  potenz: {
    titel: 'Potenzen',
    text: [
      'Eine Potenz ist eine abkürzende Schreibweise für „mehrmals dasselbe malnehmen". x³ heißt x · x · x.',
      'Die Zahl oben heißt Exponent und sagt, wie oft. Daraus folgt fast alles Weitere von selbst: x² · x³ ist (x · x) · (x · x · x), also x⁵ — man addiert die Exponenten. Und x⁵ : x² ist x³ — man subtrahiert sie.',
      'Ein negativer Exponent bedeutet kein negatives Ergebnis, sondern einen Kehrwert: x⁻² ist 1 : x². Das ist die Stelle, an der später die halbe Oberstufe hängen bleibt — wer x⁻² für „minus x²" hält, versteht die Ableitung nicht, obwohl das Problem gar nicht bei der Ableitung liegt.',
    ],
    formel: 'xᵃ · xᵇ = xᵃ⁺ᵇ    xᵃ : xᵇ = xᵃ⁻ᵇ    x⁻ᵃ = 1 : xᵃ',
    beispiel: '2⁻³ = 1 : 2³ = 1/8 = 0,125.   Nicht −8.',
    mehr: ['wurzel', 'gleichartigeGlieder', 'bruch'],
  },

  wurzel: {
    titel: 'Wurzeln',
    text: [
      'Die Wurzel fragt rückwärts: √9 ist die Zahl, die mit sich selbst malgenommen 9 ergibt — also 3.',
      'Aus einer negativen Zahl lässt sich keine Quadratwurzel ziehen, denn kein Quadrat ist negativ. Bei der dritten Wurzel geht es dagegen: ∛(−8) ist −2, weil (−2) · (−2) · (−2) = −8.',
      'Nicht jede Wurzel ist eine schöne Zahl. √2 lässt sich nicht als Bruch schreiben — man kann es nur ungefähr angeben (1,414…). Diese App lässt √2 deshalb stehen, statt zu runden. Was sich teilweise ziehen lässt, wird gezogen: √50 ist 5√2, weil in 50 die 25 steckt.',
    ],
    beispiel: '√50 = √(25 · 2) = 5√2.   Und √2 bleibt √2 — jede Kommazahl dafür wäre gerundet.',
    mehr: ['wurzelAusQuadrat', 'potenz', 'betrag'],
  },

  wurzelAusQuadrat: {
    titel: 'Warum √(x²) nicht x ist',
    text: [
      'Es sieht so aus, als müssten sich Wurzel und Quadrat gegenseitig aufheben. Für negative Zahlen stimmt das aber nicht: Setzt man x = −3 ein, ist x² = 9 und √9 = 3 — und 3 ist nicht −3.',
      'Richtig ist √(x²) = |x|, also der Betrag von x. Der macht aus jeder Zahl ihren Abstand zur Null und ist deshalb nie negativ — genau wie eine Quadratwurzel.',
      'Bei ungeraden Wurzeln besteht das Problem nicht: ∛(x³) ist wirklich x, auch für negative x, weil die dritte Potenz das Vorzeichen behält.',
      'Umgekehrt geht es übrigens auch nicht glatt: (√x)² darf man nicht einfach zu x kürzen. √x gibt es nur für x ≥ 0, x selbst aber für alle Zahlen — beim Kürzen käme also plötzlich mehr heraus, als vorher erlaubt war.',
    ],
    beispiel: 'x = −3:   √((−3)²) = √9 = 3 = |−3|.   Nicht −3.',
    mehr: ['betrag', 'wurzel', 'definitionsbereich'],
  },

  betrag: {
    titel: 'Betrag',
    text: [
      'Der Betrag einer Zahl ist ihr Abstand zur Null, ohne Vorzeichen. |−5| ist 5, und |5| ist auch 5.',
      'Man erkennt ihn an den zwei senkrechten Strichen. Ein Betrag ist nie negativ — das ist seine ganze Aufgabe.',
      'Gebraucht wird er überall dort, wo es auf die Größe ankommt und nicht auf die Richtung: bei Abständen, bei Fehlerangaben, und beim Wurzelziehen aus einem Quadrat.',
    ],
    beispiel: '|−5| = 5.   Auf dem Zahlenstrahl sind −5 und 5 beide fünf Schritte von der Null entfernt.',
    mehr: ['wurzelAusQuadrat', 'wurzel'],
  },

  // -----------------------------------------------------------------
  // Funktionen
  // -----------------------------------------------------------------

  funktion: {
    titel: 'Was ist eine Funktion?',
    text: [
      'Eine Funktion ist eine Zuordnung: Zu jeder Zahl, die man hineinsteckt, gehört genau eine Zahl, die herauskommt. Man schreibt f(x) und meint damit „das, was bei x herauskommt".',
      'Der Graph macht das sichtbar. Jeder Punkt darauf hat zwei Angaben: waagerecht das x, senkrecht das dazugehörige f(x). Die Kurve ist nichts anderes als alle diese Punkte zusammen.',
      'Deshalb kann man einen Graphen auch selbst zeichnen: Wertetabelle anlegen, Punkte eintragen, verbinden. Die App tut genau das, nur mit sehr vielen Punkten.',
    ],
    beispiel: 'f(x) = 2x + 3 ordnet der 4 die Zahl 11 zu, denn 2 · 4 + 3 = 11.',
    mehr: ['wertetabelle', 'steigung', 'nullstelle', 'term'],
  },

  wertetabelle: {
    titel: 'Die Wertetabelle',
    text: [
      'In einer Wertetabelle stehen ein paar x-Werte und darunter, was die Funktion daraus macht. Sie ist der Zwischenschritt zwischen Formel und Bild.',
      'Man wählt sich x-Werte, setzt sie ein und rechnet aus. Bei einer Geraden reichen zwei Punkte, bei einer Parabel sollten es fünf bis sieben sein — sonst übersieht man den Scheitel.',
      'Steht in der Tabelle ein Strich statt einer Zahl, ist die Funktion dort nicht definiert. Bei 1 : x ist das an der Stelle 0 so: Durch null lässt sich nicht teilen, also gibt es dort keinen Punkt.',
    ],
    beispiel: 'f(x) = x²:   x = −2 → 4,   x = −1 → 1,   x = 0 → 0,   x = 1 → 1,   x = 2 → 4.',
    mehr: ['funktion', 'definitionsbereich'],
  },

  steigung: {
    titel: 'Die Steigung',
    text: [
      'Die Steigung sagt, wie stark eine Gerade ansteigt: Sie ist die Höhe, die man gewinnt, wenn man einen Schritt nach rechts geht.',
      'Bei f(x) = 2x + 3 ist die Steigung 2 — ein Schritt nach rechts, zwei nach oben. Ist die Steigung negativ, geht es abwärts. Ist sie null, verläuft die Gerade waagerecht.',
      'In der Physik ist die Steigung fast immer eine Geschwindigkeit oder eine Rate. Im Weg-Zeit-Diagramm gibt sie an, wie viele Meter pro Sekunde zurückgelegt werden — eine steilere Gerade heißt: schneller.',
    ],
    formel: 'm = (y₂ − y₁) / (x₂ − x₁)',
    beispiel: 's = 20t: Die Steigung 20 bedeutet 20 Meter pro Sekunde.',
    mehr: ['funktion', 'nullstelle', 'variable'],
  },

  nullstelle: {
    titel: 'Nullstellen',
    text: [
      'Eine Nullstelle ist eine Stelle, an der der Graph die x-Achse schneidet — also ein x, für das f(x) = 0 herauskommt.',
      'Damit ist die Suche nach Nullstellen nichts Neues: Man setzt die Funktion gleich null und löst die Gleichung. Bei einer Geraden gibt es höchstens eine, bei einer Parabel zwei, eine oder keine.',
      'Keine Nullstelle zu haben ist kein Fehler. Die Parabel von x² + 1 liegt vollständig oberhalb der x-Achse — sie berührt sie nirgends, und deshalb hat die Gleichung x² + 1 = 0 keine Lösung.',
    ],
    beispiel: 'f(x) = x² − 6x + 8 wird null bei x = 2 und x = 4. Der Graph schneidet die x-Achse an diesen beiden Stellen.',
    mehr: ['funktion', 'gleichung', 'pqFormel', 'scheitelpunkt'],
  },

  scheitelpunkt: {
    titel: 'Der Scheitelpunkt',
    text: [
      'Der Scheitelpunkt ist der höchste oder tiefste Punkt einer Parabel — die Stelle, an der sie umkehrt.',
      'Ist die Parabel nach oben geöffnet, ist der Scheitel ihr tiefster Punkt; nach unten geöffnet, ihr höchster. Ob sie nach oben oder unten geht, entscheidet allein das Vorzeichen vor dem x².',
      'Die Parabel ist symmetrisch zur Senkrechten durch ihren Scheitel. Deshalb liegt der Scheitel immer genau in der Mitte zwischen den beiden Nullstellen — und zwar auch dann, wenn es gar keine gibt.',
    ],
    formel: 'x_S = −b / (2a)   bei f(x) = ax² + bx + c',
    beispiel: 'f(x) = x² − 6x + 8 hat die Nullstellen 2 und 4. In der Mitte liegt x = 3, und dort ist der Scheitel (3 | −1).',
    mehr: ['nullstelle', 'quadratischeGleichung', 'funktion'],
  },

  // -----------------------------------------------------------------
  // Gleichungen lösen
  // -----------------------------------------------------------------

  beideSeiten: {
    titel: 'Warum immer „beide Seiten"?',
    text: [
      'Eine Gleichung ist wie eine Waage im Gleichgewicht. Nimmt man links etwas weg, muss man rechts genauso viel wegnehmen — sonst kippt sie, und die Gleichung stimmt nicht mehr.',
      'Erlaubt ist deshalb alles, was man auf beiden Seiten gleichzeitig tut: dieselbe Zahl addieren oder subtrahieren, mit derselben Zahl malnehmen oder durch dieselbe Zahl teilen. Das Ziel ist immer dasselbe — x allein auf eine Seite bekommen.',
      'Eine Ausnahme gibt es: Durch null darf man nie teilen. Und mit etwas malzunehmen, das null sein könnte, ist genauso gefährlich — dann stimmt zwar jede einzelne Zeile, aber am Ende steht eine Lösung da, die keine ist.',
    ],
    beispiel: '3x + 5 = 14  |  beide Seiten − 5.   Links bleibt 3x, rechts wird aus 14 die 9.',
    mehr: ['gleichung', 'probe', 'loesungsmenge'],
  },

  pqFormel: {
    titel: 'Die pq-Formel',
    text: [
      'Die pq-Formel löst quadratische Gleichungen — also solche, in denen x² vorkommt. Sie liefert beide Lösungen auf einmal.',
      'Sie gilt nur für die Normalform x² + px + q = 0. Steht vor dem x² noch eine Zahl, muss man zuerst durch sie teilen. Das zu vergessen ist der häufigste Fehler überhaupt: Aus 2x² + 8x + 6 = 0 wird erst x² + 4x + 3 = 0, und erst dann sind p = 4 und q = 3.',
      'Entscheidend ist, was unter der Wurzel steht: (p/2)² − q. Ist das positiv, gibt es zwei Lösungen; ist es null, fallen beide zusammen; ist es negativ, gibt es keine — dann schneidet die Parabel die x-Achse nicht.',
      'Auswendig können muss man sie nicht. Sie entsteht durch quadratische Ergänzung, also durch das Vervollständigen zu einem Binom — und wer das einmal nachvollzogen hat, kann sie jederzeit wieder herleiten.',
    ],
    formel: 'x² + px + q = 0   →   x = −p/2 ± √((p/2)² − q)',
    beispiel:
      'x² + 4x + 3 = 0:   p = 4, q = 3.   Unter der Wurzel: 2² − 3 = 1.   x = −2 ± 1, also −1 und −3.',
    mehr: ['quadratischeGleichung', 'wurzel', 'loesungsmenge', 'probe'],
  },

  quadratischeGleichung: {
    titel: 'Quadratische Gleichungen',
    text: [
      'Eine Gleichung heißt quadratisch, wenn die höchste Potenz der Variablen x² ist. Anders als bei einer linearen Gleichung gibt es dann meistens zwei Lösungen — nicht eine.',
      'Der Grund ist anschaulich: Der Graph von x² + px + q ist eine Parabel. Gesucht sind die Stellen, an denen sie die x-Achse schneidet — und eine Parabel kann sie zweimal schneiden, einmal berühren oder ganz verfehlen.',
      'Zwei Wege führen zum Ziel. Steht die Gleichung als Produkt da, etwa (x + 1)(x − 3) = 0, reicht der Satz vom Nullprodukt: Ein Produkt ist null, wenn ein Faktor null ist — also x = −1 oder x = 3. Sonst nimmt man die pq-Formel.',
    ],
    beispiel: 'x² = 4 hat zwei Lösungen: 2 und −2. Beide ergeben quadriert 4.',
    mehr: ['pqFormel', 'ausklammern', 'potenz', 'loesungsmenge'],
  },

  loesungsmenge: {
    titel: 'Die Lösungsmenge L',
    text: [
      'Die Lösungsmenge sammelt alle Zahlen, die die Gleichung erfüllen. Man schreibt sie in geschweifte Klammern: L = { 3 } heißt „die einzige Lösung ist 3".',
      'Es gibt drei Möglichkeiten. Meistens genau eine Lösung. Manchmal keine — dann ist L = { }, die leere Menge; das passiert, wenn die Variable herausfällt und etwas Falsches übrig bleibt wie 0 = 1. Und manchmal jede Zahl — dann schreibt man L = G, die ganze Grundmenge.',
      'Die Grundmenge G sagt, welche Zahlen überhaupt zugelassen sind. In der Mittelstufe sind das oft die Bruchzahlen, in der Oberstufe die reellen Zahlen. Sie steht in der Aufgabe, nicht in der Gleichung.',
    ],
    beispiel: 'x + 1 = x + 2 führt auf 0 = 1 — das stimmt nie, also L = { }.',
    mehr: ['gleichung', 'beideSeiten', 'quadratischeGleichung'],
  },

  probe: {
    titel: 'Die Probe',
    text: [
      'Die Probe prüft nach: Man setzt die gefundene Lösung in die ursprüngliche Gleichung ein und rechnet beide Seiten getrennt aus. Kommt zweimal dasselbe heraus, stimmt die Lösung.',
      'Entscheidend ist das Wort „ursprünglich". Geprüft wird gegen die Gleichung, mit der man angefangen hat — nicht gegen eine umgeformte Zeile. Sonst würde ein Fehler mitten im Rechenweg unentdeckt bleiben, weil alle Zeilen danach sauber daraus folgen.',
      'Deshalb lohnt sich die Probe auch dann, wenn man sich sicher ist. Sie kostet dreißig Sekunden und findet genau die Fehler, die man selbst nicht sieht.',
    ],
    beispiel: 'x = 3 in 3x + 5 = 14:   links 3 · 3 + 5 = 14, rechts 14. ✓',
    mehr: ['gleichung', 'beideSeiten', 'loesungsmenge'],
  },

  definitionsbereich: {
    titel: 'Definitionsbereich',
    text: [
      'Der Definitionsbereich sagt, welche Zahlen man einsetzen darf, ohne dass die Rechnung sinnlos wird.',
      'Zwei Dinge sind verboten: durch null teilen und die Quadratwurzel aus einer negativen Zahl ziehen. Bei 1 : x darf x deshalb nicht null sein, bei √x muss x mindestens null sein.',
      'Beim Umformen muss der Definitionsbereich gleich bleiben. Das ist der Grund, warum diese App manches nicht vereinfacht, obwohl es ginge: x⁰ ist für jedes x gleich 1 — außer für x = 0, denn 0⁰ ist nicht definiert. Wer x⁰ einfach zu 1 macht, hat stillschweigend eine Zahl erlaubt, die vorher verboten war.',
    ],
    beispiel: 'Bei 1 : (x − 2) ist alles erlaubt außer x = 2. Dort stünde 1 : 0.',
    mehr: ['wurzelAusQuadrat', 'wurzel', 'bruch'],
  },
};

// Ein Thema nachschlagen. Unbekannte ID gibt undefined zurück, damit ein
// Info-Knopf ins Leere lieber gar nichts anzeigt, als abzustürzen —
// dass es keinen solchen Knopf gibt, prüft tests/wissen.mjs.
export function holeThema(id) {
  return THEMEN[id];
}
