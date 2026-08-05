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

  formelUmstellen: {
    titel: 'Eine Formel umstellen',
    text: [
      'Eine Formel umstellen heißt: sie nach einer anderen Größe auflösen. Aus v = s : t wird t = s : v — dieselbe Aussage, nur anders herum aufgeschrieben.',
      'Das Verfahren ist immer dasselbe: Man sieht sich an, was ZULETZT mit der gesuchten Größe gemacht wurde, und macht es rückgängig — auf beiden Seiten. Steht t im Nenner, nimmt man beide Seiten mal t. Steht danach ein v davor, teilt man durch v.',
      'Warum das wichtig ist: Ohne Umstellen kann man eine Formelsammlung nur in einer Richtung benutzen. Mit v = s : t lässt sich die Geschwindigkeit ausrechnen — aber die Frage „Wie lange brauche ich?" beantwortet erst die umgestellte Form.',
      'Achtung bei den Vorbehalten. Mit t malzunehmen ist nur erlaubt, wenn t nicht null ist; durch v zu teilen nur, wenn v nicht null ist. In der Physik stimmt das meistens von selbst — eine Zeit von null Sekunden kommt selten vor. Sagen sollte man es trotzdem.',
    ],
    formel: 'v = s : t   →   t = s : v',
    beispiel: 'Ein Auto fährt 120 km mit 60 km/h. t = s : v = 120 : 60 = 2 Stunden.',
    mehr: ['beideSeiten', 'variable', 'definitionsbereich'],
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

  zinseszins: {
    titel: 'Zinseszins — wo die Exponentialfunktion herkommt',
    text: [
      'Wer Geld anlegt, bekommt Zinsen. Im zweiten Jahr bekommt er auch Zinsen auf die Zinsen — das ist der Zinseszins, und er ist der Grund, warum aus wenig über lange Zeit viel wird.',
      'Rechnerisch passiert etwas sehr Einfaches: Bei 3 % wird das Kapital jedes Jahr mit 1,03 malgenommen. Nach einem Jahr K · 1,03. Nach zwei Jahren K · 1,03 · 1,03. Nach drei Jahren K · 1,03 · 1,03 · 1,03.',
      'Und genau hier steht sie: DERSELBE FAKTOR WIEDERHOLT SICH. Wiederholtes Malnehmen ist eine Potenz, also K · 1,03ⁿ. Die Exponentialfunktion ist nichts Fremdes, das jemand erfunden hat — sie entsteht von selbst, sobald etwas immer wieder mit demselben Faktor wächst.',
      'Der Unterschied zu einfachen Zinsen wird mit der Zeit gewaltig. 1000 € zu 3 % ergeben nach 30 Jahren mit Zinseszins etwa 2427 €, ohne ihn nur 1900 €. Über 500 € allein dadurch, dass die Zinsen mitverzinst werden.',
      'Eine Eigenschaft überrascht fast alle: Die Verdopplungszeit hängt NICHT vom Startkapital ab. Ob 100 € oder eine Million — bei 3 % dauert es beide Male 24 Jahre. Das ist das Kennzeichen exponentiellen Wachstums.',
      'Was das Modell nicht weiß: Es kennt keine Inflation, keine Steuern, keine Gebühren, und es nimmt an, dass der Zinssatz sich nie ändert. Die Rechnung zeigt die Wirkung des Zinseszinses — nicht den Kontostand.',
    ],
    formel: 'K(n) = K₀ · (1 + p/100)ⁿ',
    beispiel: '1000 € zu 3 % über 30 Jahre: 1000 · 1,03³⁰ ≈ 2427 €.',
    mehr: ['wachstum', 'potenz', 'prozent'],
  },

  wachstum: {
    titel: 'Exponentielles Wachstum — und warum man es zu spät bemerkt',
    text: [
      'Exponentiell wächst etwas, wenn es sich in gleichen Zeitabständen immer wieder um denselben FAKTOR vermehrt — nicht um denselben Betrag. Verdoppeln ist der bekannteste Fall.',
      'Die Zahlen sprengen dabei jede Anschauung. Ein Cent, dreißigmal verdoppelt, sind über zehn Millionen Euro. Das glaubt niemand, bevor er es nachrechnet.',
      'Der eigentliche Punkt liegt woanders: Nach der HÄLFTE der Zeit sind aus dem Cent erst rund 328 € geworden. Fast alles passiert ganz am Schluss. Genau deshalb wird exponentielles Wachstum immer zu spät bemerkt — solange es klein ist, sieht es harmlos aus.',
      'Rückwärts ist es dasselbe Gesetz: Beim ZERFALL bleibt nach jeder Halbwertszeit die Hälfte übrig, also (1/2)ⁿ. Kohlenstoff-14 hat eine Halbwertszeit von 5730 Jahren; nach 11 460 Jahren ist ein Viertel übrig. Wachstum und Zerfall sind eine Formel, einmal mit einem Faktor über 1 und einmal darunter.',
      'Was das Modell nicht weiß: In der Wirklichkeit hört jedes Wachstum irgendwann auf. Der Platz wird knapp, das Futter, das Geld. Kein Bakterium füllt das Weltall. Die Rechnung sagt, was geschähe, WENN sich der Verlauf fortsetzt — nicht, dass er es tut.',
    ],
    formel: 'N(t) = N₀ · aᵗ     Zerfall: N(t) = N₀ · (1/2)^(t/T)',
    beispiel: 'Ein Cent, 30-mal verdoppelt: 0,01 · 2³⁰ = 10 737 418,24 €.',
    mehr: ['zinseszins', 'potenz', 'optionspreis'],
  },

  optionspreis: {
    titel: 'Optionspreise — wenn der Erwartungswert lügt',
    text: [
      'Eine Option ist das Recht, eine Aktie später zu einem heute festgelegten Preis zu kaufen. Was ist dieses Recht wert?',
      'Die Aktie steht bei 100 €. In einem Jahr steht sie bei 125 € oder bei 80 €. Man darf für 100 € kaufen. Naheliegend wäre: halbe-halbe, also die Hälfte von 25 €, macht 12,50 €. DAS IST FALSCH. Der Preis ist 100/9, also 11,11 €.',
      'Warum? Weil man die Option NACHBAUEN kann. Mit 5/9 Aktien und 400/9 € Schulden hat man in BEIDEN Fällen genau so viel wie mit der Option — und das kostet heute 100/9 €. Wer die Option teurer verkauft, baut sie billiger nach und hat den Unterschied sicher in der Tasche, egal was passiert. Der Preis ist also kein Schätzwert, sondern ein Zwang.',
      'Und jetzt das Erstaunliche: Rechnet man rückwärts, welche Wahrscheinlichkeit diesen Preis als Erwartungswert liefert, kommt 4/9 heraus — nicht 1/2. Diese Zahl behauptet nicht, die Aktie steige mit 44,4 %. Sie ist ein Rechenwerkzeug: die einzige Gewichtung, unter der sich mit dem Nachbau nichts verdienen ließe.',
      'Setzt man dieses q als p in die Binomialverteilung ein, bekommt man den Preis für beliebig viele Zwischenschritte. Je feiner man unterteilt, desto näher kommt man der Black-Scholes-Formel, für die es 1997 den Wirtschaftsnobelpreis gab.',
      'Der Satz zum Mitnehmen: Der Erwartungswert wird mit der FALSCHEN Wahrscheinlichkeit gerechnet — und gerade deshalb stimmt er.',
      'Was das Modell nicht weiß: Es nimmt an, dass es nur zwei mögliche Kurse gibt, dass man beliebig teilbare Aktien handeln kann, dass keine Gebühren anfallen und dass sich mit dem Nachbau nichts verdienen lässt. Keine dieser Annahmen trifft genau zu.',
    ],
    formel: 'Δ = (C↑ − C↓) : (S↑ − S↓)     Preis = Δ · S + B',
    beispiel: 'Aktie 100 €, in einem Jahr 125 € oder 80 €, Kaufrecht für 100 €: Δ = 5/9, B = −400/9, Preis = 100/9 ≈ 11,11 €.',
    mehr: ['binomialverteilung', 'wachstum', 'laplace'],
  },

  ableitung: {
    titel: 'Die Ableitung',
    text: [
      'Die Ableitung sagt, wie STEIL eine Kurve an einer bestimmten Stelle ist. Bei einer Geraden ist die Steigung überall gleich — bei einer Kurve ändert sie sich, und f′(x) ist die Formel, die zu jeder Stelle die passende Steigung liefert.',
      'Woher kommt sie? Zwischen zwei Punkten kann man die Steigung ausrechnen: Höhenunterschied durch Abstand. Rückt man die beiden Punkte immer dichter zusammen, nähert sich diese Zahl der Steigung an einem einzigen Punkt. Das ist die Ableitung — nichts anderes.',
      'Die wichtigste Regel ist die POTENZREGEL: Der Exponent kommt als Faktor nach vorn, und der Exponent wird um eins kleiner. Aus x³ wird 3x². Dazu die Summenregel (jeden Summanden einzeln) und die Faktorregel (eine Zahl davor bleibt stehen).',
      'Es gibt KEINE eigene Wurzelregel und keine Kehrwertregel — man braucht sie nicht. √x ist dasselbe wie x hoch ein Halb, und 1 : x ist dasselbe wie x hoch minus eins. Sobald das dasteht, greift die Potenzregel wie überall sonst. Wer hier hängt, hat kein Problem mit dem Ableiten, sondern mit den Potenzgesetzen.',
      'Wozu das gut ist: Überall dort, wo etwas sich ändert. Die Geschwindigkeit ist die Ableitung des Weges nach der Zeit, die Beschleunigung die Ableitung der Geschwindigkeit. Und wo f′(x) null ist, ist die Kurve waagerecht — dort liegen Hoch- und Tiefpunkte.',
    ],
    formel: '(xⁿ)′ = n · xⁿ⁻¹',
    beispiel: 'f(x) = x³ − 6x² + 8x  →  f′(x) = 3x² − 12x + 8. Bei x = 1 ist die Steigung 3 − 12 + 8 = −1, die Kurve fällt dort also leicht.',
    mehr: ['tangente', 'kettenregel', 'potenz', 'steigung'],
  },

  kettenregel: {
    titel: 'Die Kettenregel',
    text: [
      'Steckt eine Funktion IN einer anderen, leitet man beide ab und multipliziert: äußere Ableitung mal innere Ableitung. Bei (2x + 1)³ ist die äußere Funktion „hoch drei" und die innere „2x + 1".',
      'Die innere Ableitung ist der Teil, der vergessen wird — und dann ist das Ergebnis um genau diesen Faktor daneben. Bei (2x + 1)³ wäre es die Hälfte, weil die innere Ableitung 2 ist.',
      'Woran erkennt man, dass man sie braucht? Daran, dass in der Klammer nicht einfach x steht. Bei x³ steht x da, also braucht man nichts weiter. Bei (2x + 1)³ steht dort etwas, das sich selbst mit x ändert — und das muss man mitzählen.',
      'Die Probe geht immer: Setze eine Zahl ein und vergleiche mit dem Anstieg, den die Kurve dort tatsächlich hat. Genau so prüft die App ihre eigenen Ableitungen nach.',
    ],
    formel: 'f(g(x))′ = f′(g(x)) · g′(x)',
    beispiel: '((2x + 1)³)′ = 3 · (2x + 1)² · 2 = 6 · (2x + 1)². Ohne die 2 käme die Hälfte heraus.',
    mehr: ['ableitung', 'potenz', 'ausmultiplizieren'],
  },

  tangente: {
    titel: 'Die Tangente',
    text: [
      'Die Tangente ist die Gerade, die sich an einer Stelle an die Kurve anschmiegt. Sie berührt die Kurve dort und läuft in genau dieselbe Richtung.',
      'Damit wird die Ableitung sichtbar. „f′(2) = 4" ist eine Zahl, mit der man wenig anfangen kann. Eine Gerade, die die Kurve berührt und dabei um 4 nach oben geht, wenn man um 1 nach rechts geht, sieht man sofort.',
      'Zwei Bedingungen machen sie aus, und beide braucht man: Sie muss durch den Punkt der Kurve gehen, UND sie muss dort dieselbe Steigung haben. Eine Gerade, die nur den Punkt trifft, ist eine Sekante — der Unterschied ist genau die Ableitung.',
    ],
    formel: 'y = f′(x₀) · (x − x₀) + f(x₀)',
    beispiel: 'f(x) = x² bei x₀ = 2: f(2) = 4 und f′(2) = 4, also y = 4 · (x − 2) + 4 = 4x − 4.',
    mehr: ['ableitung', 'steigung', 'funktion'],
  },

  integral: {
    titel: 'Das Integral',
    text: [
      'Integrieren ist Ableiten rückwärts. Gesucht ist eine Funktion, deren Ableitung die gegebene ist — sie heißt Stammfunktion und wird groß geschrieben: F.',
      'Die Regel dafür ist die Potenzregel rückwärts: Der Exponent wird um eins GRÖSSER, und durch den neuen Exponenten wird geteilt. Aus x² wird x³ : 3. Die Probe geht immer: Leite dein Ergebnis ab, dann muss die Ausgangsfunktion herauskommen.',
      'Das + C ist kein Schmuck. Beim Ableiten fällt jede Konstante weg — aus x³ + 5 und aus x³ + 100 wird beide Male 3x². Rückwärts kann man deshalb nicht wissen, welche Konstante es war. Es gibt nicht DIE Stammfunktion, sondern unendlich viele, die alle gleich aussehen und nur verschieden hoch liegen.',
      'Eine Lücke hat die Regel: Bei x hoch minus eins wäre der neue Exponent null, und man müsste durch null teilen. Für 1 : x gilt die Regel also nicht — dort ist die Stammfunktion der natürliche Logarithmus. Das ist keine Schlamperei der Formel, sondern ein echter Sonderfall.',
      'Beim BESTIMMTEN Integral setzt man zwei Grenzen ein und zieht ab: F(b) − F(a). Dabei fällt das C weg, weil es in beiden Klammern steht. Deshalb ist der Wert eindeutig, obwohl die Stammfunktion es nicht ist — das ist der Hauptsatz in einem Satz.',
    ],
    formel: '∫ xⁿ dx = xⁿ⁺¹ : (n + 1) + C,   n ≠ −1',
    beispiel: '∫ von 0 bis 3 über x²: F(x) = x³ : 3, also F(3) − F(0) = 9 − 0 = 9.',
    mehr: ['ableitung', 'flaeche', 'potenz'],
  },

  flaeche: {
    titel: 'Fläche und Integral',
    text: [
      'Das bestimmte Integral misst die Fläche zwischen Kurve und x-Achse — aber MIT VORZEICHEN. Wo die Kurve unter der Achse verläuft, zählt es negativ.',
      'Deshalb sind Fläche und Integral nicht dasselbe, und das ist der Fehler, den fast jeder einmal macht. Von −1 bis 1 über x³ kommt null heraus. Dort liegt aber sehr wohl Fläche — die eine Hälfte unter der Achse hebt die andere darüber genau auf.',
      'Will man den Flächeninhalt, muss man an den Nullstellen trennen, jedes Stück einzeln ausrechnen und die BETRÄGE addieren. Will man die Bilanz — etwa den zurückgelegten Weg mit Hin und Zurück —, ist das Integral genau das Richtige.',
      'Welches von beiden gemeint ist, steht nicht in der Formel, sondern in der Frage. Das ist der Grund, warum diese App beide Zahlen zeigt und sagt, wenn sie auseinandergehen.',
    ],
    beispiel: '∫ von −1 bis 1 über x³ ist 0. Der Flächeninhalt dagegen ist 1/4 + 1/4 = 1/2.',
    mehr: ['integral', 'nullstelle', 'ableitung'],
  },

  vektor: {
    titel: 'Was ist ein Vektor?',
    text: [
      'Ein Vektor ist eine Verschiebung: so weit nach rechts, so weit nach oben. Er sagt nicht WO etwas ist, sondern WIE man von einem Ort zum nächsten kommt.',
      'Das ist der Unterschied zum Punkt, und er ist der häufigste Stolperstein des ganzen Gebiets. (3 | 4) als Punkt ist ein Ort im Koordinatensystem. (3 | 4) als Vektor ist „drei nach rechts, vier nach oben" — und das darf überall stehen. Derselbe Vektor kann an tausend Stellen gezeichnet werden; es ist immer derselbe.',
      'Zwei Vektoren addiert man, indem man sie aneinanderhängt: erst der eine, dann der andere. Rechnerisch heißt das, jede Komponente einzeln zu addieren. Malnehmen mit einer Zahl macht den Pfeil länger oder kürzer — bei einer negativen Zahl dreht er sich zusätzlich um.',
      'Der Verbindungsvektor von A nach B ist B − A. Die Reihenfolge ist genau andersherum, als man sie spricht, und genau deshalb vertut man sich dabei. Merkhilfe: „Spitze minus Fuß".',
      'Die Länge eines Vektors heißt Betrag und kommt aus dem Satz des Pythagoras. Bei (3 | 4) ist sie 5, bei (1 | 1) ist sie √2 — und √2 bleibt √2.',
    ],
    formel: '|a| = √(a₁² + a₂² + a₃²)',
    beispiel: 'Von A(1 | 1) nach B(4 | 5): der Vektor ist (3 | 4), seine Länge 5.',
    mehr: ['skalarprodukt', 'gerade', 'pythagoras'],
  },

  skalarprodukt: {
    titel: 'Skalarprodukt und Kreuzprodukt',
    text: [
      'Es gibt zwei Arten, Vektoren zu multiplizieren, und sie liefern völlig Verschiedenes: Das Skalarprodukt ergibt eine ZAHL, das Kreuzprodukt einen VEKTOR.',
      'Das SKALARPRODUKT rechnet man, indem man die Komponenten paarweise malnimmt und alles addiert. Seine wichtigste Eigenschaft: Es ist genau dann null, wenn die beiden Vektoren senkrecht aufeinander stehen. Das ist der meistgebrauchte Satz der ganzen Vektorgeometrie — und er ist exakt, nicht gerundet.',
      'Daraus kommt auch der Winkel: a · b = |a| · |b| · cos φ. Nach cos φ umgestellt, liefert das jeden Winkel zwischen zwei Vektoren.',
      'Das KREUZPRODUKT gibt es nur im Raum, und es liefert einen Vektor, der auf beiden Ausgangsvektoren senkrecht steht. Genau dafür braucht man es: als Normalenvektor einer Ebene. In der Ebene gibt es kein Kreuzprodukt — dort steht auf zwei Vektoren nichts mehr senkrecht, ohne die Ebene zu verlassen.',
      'Beim Kreuzprodukt kommt es auf die Reihenfolge an: a × b zeigt genau entgegengesetzt zu b × a. Beim Skalarprodukt ist die Reihenfolge dagegen egal.',
    ],
    formel: 'a · b = a₁b₁ + a₂b₂ + a₃b₃     a · b = 0  ⟺  a ⊥ b',
    beispiel: '(3 | 4) · (−4 | 3) = −12 + 12 = 0 — die beiden stehen senkrecht aufeinander.',
    mehr: ['vektor', 'trigonometrie', 'gerade'],
  },

  gerade: {
    titel: 'Geraden im Raum',
    text: [
      'Eine Gerade wird durch zwei Angaben festgelegt: einen Punkt, an dem man einsteigt, und eine Richtung, in die es geht. Aufgeschrieben als x = p + t · u.',
      'p heißt Stützvektor — er zeigt, WO man einsteigt. u heißt Richtungsvektor — er zeigt, WOHIN es geht. t ist der Parameter: Für jedes t bekommt man einen anderen Punkt der Geraden, und alle zusammen ergeben die ganze Gerade.',
      'Ob ein Punkt auf der Geraden liegt, prüft man, indem man ein passendes t sucht. Wichtig ist: Es muss EIN EINZIGES t für ALLE Zeilen geben. Eine Zeile allein reicht nicht — genau dort vertut man sich.',
      'Zwei Geraden können vier Lagen zueinander haben. IDENTISCH heißt: dieselbe Gerade, nur anders aufgeschrieben. PARALLEL: gleiche Richtung, aber versetzt — sie treffen sich nie. SCHNEIDEND: genau ein gemeinsamer Punkt. Und WINDSCHIEF: weder parallel noch schneidend.',
      'Windschief gibt es nur im Raum, und deshalb erwartet man es nicht. Zwei Geraden können aneinander vorbeilaufen, ohne parallel zu sein — von oben betrachtet sähe man einen Schnittpunkt, aber sie liegen in verschiedenen Höhen. In der Ebene ist das unmöglich: Dort müssen sich zwei Geraden mit verschiedenen Richtungen schneiden.',
    ],
    formel: 'g: x = p + t · u',
    beispiel: 'g: x = (1 | 0 | 0) + t · (1 | 1 | 0). Bei t = 2 ist man am Punkt (3 | 2 | 0).',
    mehr: ['vektor', 'skalarprodukt', 'gleichungssystem'],
  },

  // -----------------------------------------------------------------
  // Zufall
  // -----------------------------------------------------------------

  laplace: {
    titel: 'Wahrscheinlichkeit nach Laplace',
    text: [
      'Wenn alle Ergebnisse gleich wahrscheinlich sind, zählt man einfach ab: Wie viele Fälle sind günstig, wie viele überhaupt möglich? Der Bruch daraus ist die Wahrscheinlichkeit.',
      'Beim Würfel gibt es sechs mögliche Ergebnisse, und eines davon ist die Sechs. Also ist die Wahrscheinlichkeit 1/6. Diese App schreibt genau das hin und nicht 0,1667 — an dem Bruch sieht man, worum es geht, an der Kommazahl nicht.',
      'Eine Wahrscheinlichkeit liegt immer zwischen 0 und 1. Null heißt: kommt nie vor. Eins heißt: kommt sicher vor. Mehr als eins gibt es nicht — wer so etwas ausrechnet, hat sich verzählt.',
      'Die Gegenwahrscheinlichkeit ergänzt zu 1. Statt „mindestens eine Sechs bei drei Würfen" auszurechnen, ist es oft leichter, „gar keine Sechs" zu nehmen und von 1 abzuziehen.',
    ],
    formel: 'P = günstige Fälle : mögliche Fälle',
    beispiel: 'Eine gerade Zahl beim Würfel: 3 von 6, also 1/2 oder 50 %.',
    mehr: ['pfadregeln', 'bruch', 'prozent'],
  },

  pfadregeln: {
    titel: 'Die Pfadregeln',
    text: [
      'Wenn ein Zufallsversuch mehrere Stufen hat, zeichnet man ein Baumdiagramm: Jede Stufe ist eine Verzweigung, jeder Weg von oben nach unten ein Pfad.',
      'Dann gelten zwei Regeln. Entlang eines Pfades wird MULTIPLIZIERT — beide Dinge müssen nacheinander eintreten. Über mehrere Pfade wird ADDIERT — es reicht, wenn einer davon eintritt.',
      'Die Probe steckt im Bild: Alle Pfade zusammen müssen 1 ergeben. Irgendein Weg wird schließlich genommen. Kommt etwas anderes heraus, fehlt ein Zweig oder eine Zahl stimmt nicht.',
      'Der Unterschied zwischen „mit" und „ohne Zurücklegen" sitzt in der zweiten Stufe. Legt man zurück, ändert sich nichts. Legt man nicht zurück, fehlt genau die Kugel, die man gerade gezogen hat — und der Nenner wird um eins kleiner.',
    ],
    beispiel: '3 rote, 2 blaue Kugeln, ohne Zurücklegen: P(rot, rot) = 3/5 · 2/4 = 3/10.',
    mehr: ['laplace', 'kombinatorik', 'bruch'],
  },

  kombinatorik: {
    titel: 'Wie viele Möglichkeiten?',
    text: [
      'Bevor man Wahrscheinlichkeiten ausrechnet, muss man abzählen können. Dabei entscheiden zwei Fragen alles: Kommt es auf die REIHENFOLGE an, und darf dasselbe MEHRFACH vorkommen?',
      'Aus den beiden Fragen ergeben sich vier Fälle. Beim Zahlenschloss zählt die Reihenfolge und Ziffern dürfen sich wiederholen. Beim Lotto zählt die Reihenfolge nicht und keine Zahl kommt zweimal. Dazwischen liegen die beiden anderen Fälle.',
      'Der Binomialkoeffizient „n über k" beantwortet den Lottofall: Wie viele Möglichkeiten gibt es, aus n Dingen k auszuwählen, wenn die Reihenfolge egal ist? Bei 6 aus 49 sind es 13 983 816 — deshalb gewinnt man so selten.',
    ],
    formel: 'n über k = n! : (k! · (n−k)!)',
    beispiel: 'Drei aus acht aufs Treppchen, mit Reihenfolge: 8 · 7 · 6 = 336.',
    mehr: ['binomialverteilung', 'laplace', 'potenz'],
  },

  hypothesentest: {
    titel: 'Der Hypothesentest',
    text: [
      'Ein Test fragt: Passt das, was ich beobachtet habe, noch zu meiner Annahme — oder ist es dafür zu unwahrscheinlich? Ist es zu unwahrscheinlich, wird die Annahme verworfen.',
      'Die Annahme heißt Nullhypothese H₀, etwa „die Münze ist fair, p = 0,5". Vorher legt man fest, wie viel Irrtum man zulässt: das Signifikanzniveau α, meist 5 % oder 1 %. Daraus ergibt sich der Ablehnungsbereich — die Trefferzahlen, bei denen man H₀ fallen lässt.',
      'Und jetzt der Satz, den fast jeder falsch lernt: EIN TEST BEWEIST NICHTS. Wird H₀ nicht verworfen, heißt das nicht, dass H₀ stimmt. Es heißt nur, dass das Beobachtete mit H₀ verträglich ist — mit anderen Annahmen vielleicht genauso gut. Ein Gericht, das freispricht, erklärt niemanden für unschuldig; es stellt fest, dass es nicht gereicht hat.',
      'Zwei Arten von Irrtum gibt es. FEHLER 1. ART: H₀ verwerfen, obwohl sie stimmt — seine Wahrscheinlichkeit ist höchstens α. FEHLER 2. ART: H₀ beibehalten, obwohl sie falsch ist. Der zweite lässt sich nur ausrechnen, wenn man sagt, was stattdessen gelten soll — „irgendetwas anderes" ist keine Verteilung.',
      'Ein Detail, das man leicht übersieht: Das tatsächliche Niveau ist fast immer KLEINER als α. Die Binomialverteilung springt in Stufen; bei n = 20 gibt es keinen Bereich mit genau 5 %, sondern nur einen mit 2,1 % und den nächsten mit 5,8 %. Genommen wird der größte, der noch darunter bleibt.',
      'Und manchmal ist der Ablehnungsbereich leer. Dann ist die Stichprobe zu klein: Selbst das äußerste Ergebnis wäre unter H₀ noch wahrscheinlicher als α. Ein solcher Versuch kann gar nichts zeigen — auch das ist eine Antwort.',
    ],
    formel: 'P(Fehler 1. Art) ≤ α',
    beispiel: 'n = 100 Münzwürfe, H₀: p = 0,5, einseitig, α = 5 %. Ablehnung ab 59 Treffern; das tatsächliche Niveau ist 4,43 %, nicht 5 %.',
    mehr: ['binomialverteilung', 'laplace', 'kombinatorik'],
  },

  binomialverteilung: {
    titel: 'Die Binomialverteilung',
    text: [
      'Man macht n-mal denselben Versuch, und jedes Mal ist die Trefferwahrscheinlichkeit dieselbe p. Die Frage lautet: Wie wahrscheinlich sind genau k Treffer?',
      'Die Formel besteht aus drei Teilen, und jeder hat einen Grund. p hoch k ist die Wahrscheinlichkeit für k Treffer, (1−p) hoch (n−k) die für die übrigen Nieten — das ist ein Pfad im Baumdiagramm. Und „n über k" zählt, wie viele solche Pfade es gibt.',
      'Der Erwartungswert ist n · p. Bei zehn Würfen mit einem Würfel erwartet man 10 · 1/6, also etwa 1,7 Sechsen. Das ist keine eigene Formel zum Auswendiglernen, sondern folgt direkt daraus, dass jeder einzelne Versuch im Schnitt p Treffer bringt.',
      'Wozu das über Würfel hinaus gut ist, sieht man an der Börse. Eine Option ist das Recht, eine Aktie später zu einem heute festgelegten Preis zu kaufen. Die Aktie steht bei 100 €, in einem Jahr steht sie bei 125 € oder bei 80 €, und man darf für 100 € kaufen. Naheliegend wäre: halbe-halbe, also die Hälfte von 25 €, macht 12,50 €. Das ist falsch.',
      'Denn man kann die Option nachbauen: Mit 5/9 Aktien und 400/9 € Schulden hat man in BEIDEN Fällen genau so viel wie mit der Option — und das kostet heute 100/9 €, also 11,11 €. Wer mehr verlangt, dem baut man sie billiger nach. Der Preis ist damit keine Schätzung, sondern erzwungen.',
      'Rechnet man rückwärts, welche Wahrscheinlichkeit diesen Preis als Erwartungswert liefert, kommt 4/9 heraus — nicht 1/2. Setzt man dieses q als p in die Binomialverteilung ein, bekommt man den Preis für beliebig viele Zwischenschritte; je feiner man unterteilt, desto näher kommt man der Black-Scholes-Formel, für die es 1997 den Wirtschaftsnobelpreis gab. Das Merkwürdige daran: Der Erwartungswert wird mit der falschen Wahrscheinlichkeit gerechnet, und gerade deshalb stimmt er.',
    ],
    formel: 'P(X = k) = (n über k) · p^k · (1−p)^(n−k)',
    beispiel: 'Vier Münzwürfe, genau zweimal Kopf: (4 über 2) · (1/2)⁴ = 6/16 = 3/8.',
    mehr: ['kombinatorik', 'pfadregeln', 'potenz'],
  },

  // -----------------------------------------------------------------
  // Geometrie
  // -----------------------------------------------------------------

  pythagoras: {
    titel: 'Der Satz des Pythagoras',
    text: [
      'In einem rechtwinkligen Dreieck gilt: Die beiden kurzen Seiten, im Quadrat genommen und addiert, ergeben zusammen das Quadrat der langen Seite. Kurz: a² + b² = c².',
      'Die lange Seite heißt Hypotenuse und liegt immer dem rechten Winkel gegenüber. Die beiden anderen heißen Katheten. Das ist keine Namenskunde, sondern der Grund, warum die Formel nur so herum funktioniert: c ist immer die längste Seite.',
      'Deshalb lässt sich der Satz auch rückwärts benutzen. Kennt man die Hypotenuse und eine Kathete, bekommt man die andere über a = √(c² − b²). Ist dabei die Kathete länger als die Hypotenuse, gibt es dieses Dreieck nicht — dann steht unter der Wurzel eine negative Zahl.',
    ],
    formel: 'a² + b² = c²',
    beispiel: 'a = 3, b = 4:   c = √(9 + 16) = √25 = 5.   Bei a = 2 und b = 3 kommt √13 heraus — eine Zahl, die sich nicht schöner schreiben lässt.',
    mehr: ['trigonometrie', 'wurzel', 'potenz'],
  },

  trigonometrie: {
    titel: 'Sinus, Kosinus, Tangens',
    text: [
      'In einem rechtwinkligen Dreieck hängen die Seitenverhältnisse nur vom Winkel ab — nicht von der Größe. Ein Dreieck mit 30° hat immer dieselben Verhältnisse, ob es zwei Zentimeter oder zwei Kilometer groß ist. Genau das machen Sinus, Kosinus und Tangens nutzbar.',
      'Vom Winkel α aus gesehen heißt die gegenüberliegende Seite Gegenkathete, die anliegende Ankathete. Dann gilt: sin α = Gegenkathete : Hypotenuse, cos α = Ankathete : Hypotenuse, tan α = Gegenkathete : Ankathete.',
      'Mit den Umkehrfunktionen sin⁻¹, cos⁻¹ und tan⁻¹ geht es rückwärts: Aus dem Seitenverhältnis bekommt man den Winkel. So findet man aus zwei Seiten alle Winkel.',
      'Anders als beim Pythagoras kommen dabei fast nie glatte Zahlen heraus. sin 30° ist genau 1/2, sin 37° dagegen lässt sich nicht hinschreiben — dort wird gerundet.',
    ],
    formel: 'sin α = Gegenkathete : Hypotenuse',
    beispiel: 'Eine Leiter von 5 m lehnt in 70° an der Wand. Höhe = 5 · sin 70° ≈ 4,70 m.',
    mehr: ['pythagoras', 'winkelsumme', 'wurzel'],
  },

  winkelsumme: {
    titel: 'Die Winkelsumme im Dreieck',
    text: [
      'In jedem Dreieck ergeben die drei Winkel zusammen 180°. Immer — ob spitz, stumpf oder rechtwinklig.',
      'Daraus folgt sofort etwas Nützliches: Kennt man zwei Winkel, hat man den dritten geschenkt. Im rechtwinkligen Dreieck ist einer schon 90°, für die beiden anderen bleiben zusammen 90° — jeder einzelne muss also kleiner sein.',
      'Anschaulich sieht man es so: Schneidet man die drei Ecken eines Papierdreiecks ab und legt sie mit den Spitzen aneinander, ergeben sie eine gerade Linie. Und eine gerade Linie ist 180°.',
    ],
    formel: 'α + β + γ = 180°',
    beispiel: 'Rechtwinklig mit α = 30°:   β = 180° − 90° − 30° = 60°.',
    mehr: ['trigonometrie', 'pythagoras'],
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

  nullprodukt: {
    titel: 'Der Satz vom Nullprodukt',
    text: [
      'Wenn ein Produkt null ist, muss einer der Faktoren null sein. Aus (x + 1) · (x − 3) = 0 folgt also: x + 1 = 0 ODER x − 3 = 0 — und damit x = −1 oder x = 3. Man liest die Lösungen ab, ohne zu rechnen.',
      'Aufgepasst: Das ist NICHT die Aussage „null mal irgendwas ist null". Die ist trivial und hilft niemandem. Gemeint ist die Umkehrung — dass ein Produkt gar nicht anders null werden KANN.',
      'Und die ist nicht selbstverständlich. Beim Rechnen mit Restklassen modulo 12 gilt 3 · 4 = 12 = 0, und weder die 3 noch die 4 ist null. Dort stimmt der Satz also nicht. Dass er bei den gewöhnlichen Zahlen gilt, ist eine Eigenschaft DIESER Zahlen — deshalb heißt er Satz und nicht Bemerkung.',
      'Der Satz gilt nur gegen NULL. Bei (x + 1) · (x − 3) = 5 darf man nicht „x + 1 = 5 oder x − 3 = 5" schreiben — das ist der klassische Fehler. Fünf lässt sich auf unendlich viele Arten in ein Produkt zerlegen, null nur so, dass ein Faktor null ist. Steht rechts nicht null, muss man ausmultiplizieren.',
      'Ein Zahlenfaktor kann nie null werden und fällt weg: Bei 3 · (x − 2) = 0 bleibt nur x − 2 = 0 übrig, denn die 3 ist nun einmal nicht null.',
      'Praktisch bringt der Satz zweierlei: Man spart den Umweg über die pq-Formel — und man löst damit auch Gleichungen höheren Grades. (x + 1)(x − 3)(x + 5) = 0 hat drei Lösungen, und man sieht sie sofort.',
    ],
    formel: 'a · b = 0  ⟺  a = 0  oder  b = 0',
    beispiel: '(x + 1)(x − 3) = 0 → x = −1 oder x = 3. Ausmultipliziert wäre es x² − 2x − 3 = 0 und man bräuchte die pq-Formel für dasselbe Ergebnis.',
    mehr: ['ausklammern', 'pqFormel', 'loesungsmenge'],
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

  ungleichung: {
    titel: 'Ungleichungen',
    text: [
      'Eine Ungleichung sagt nicht, WELCHE Zahl es ist, sondern in welchem Bereich sie liegt. Statt „x = 3" steht da „x < 3" — und das erfüllen unendlich viele Zahlen auf einmal.',
      'Umgeformt wird fast wie bei einer Gleichung: Was man tut, tut man auf beiden Seiten. Addieren und subtrahieren ändern nichts am Vergleich, und mit einer positiven Zahl darf man auch malnehmen und teilen.',
      'Eine Sache ist anders, und sie ist der ganze Unterschied: MULTIPLIZIERT ODER DIVIDIERT MAN MIT EINER NEGATIVEN ZAHL, DREHT SICH DAS VERGLEICHSZEICHEN UM. Aus < wird >, aus ≤ wird ≥.',
      'Warum? 2 < 3 stimmt. Nimmt man beide Seiten mal (−1), stünde da −2 < −3 — und das ist falsch, denn −2 liegt rechts von −3. Richtig ist −2 > −3. Das Malnehmen mit einer negativen Zahl klappt die Zahlengerade um, und damit kehrt sich auch jedes „links davon" in ein „rechts davon".',
      'Der Unterschied zwischen < und ≤ ist keine Feinheit: Bei < gehört die Grenze nicht dazu, bei ≤ schon. Auf dem Zahlenstrahl zeigt das ein offener beziehungsweise ein gefüllter Kreis.',
    ],
    formel: 'a < b  ⟹  a · (−1) > b · (−1)',
    beispiel: '−3x + 5 < 14 | beide Seiten − 5 → −3x < 9 | beide Seiten : (−3) → x > −3. Probe mit x = 0: −3 · 0 + 5 = 5, und 5 < 14 stimmt.',
    mehr: ['gleichung', 'beideSeiten', 'loesungsmenge'],
  },

  gleichungssystem: {
    titel: 'Gleichungssysteme',
    text: [
      'Bei einem Gleichungssystem müssen ZWEI Gleichungen gleichzeitig stimmen — und gesucht ist nicht eine Zahl, sondern ein Zahlenpaar. Zwei Unbekannte, zwei Bedingungen.',
      'Der Grund, warum man zwei Gleichungen braucht: Mit einer allein gibt es unendlich viele Paare, die passen. x + y = 5 erfüllen (1|4), (2|3), (0|5) und beliebig viele andere. Erst die zweite Bedingung engt es auf ein einziges Paar ein.',
      'Am besten sieht man das als Bild: Jede der beiden Gleichungen beschreibt eine Gerade. Die Lösung ist ihr Schnittpunkt. Daraus folgen sofort die beiden Sonderfälle — sind die Geraden parallel, gibt es keinen Schnittpunkt und keine Lösung; sind es dieselben Geraden, schneiden sie sich überall und es gibt unendlich viele.',
      'Drei Verfahren führen zum Ziel, und alle drei liefern dasselbe Ergebnis. Beim EINSETZUNGSVERFAHREN löst man eine Zeile nach einer Unbekannten auf und setzt den Ausdruck in die andere ein. Beim GLEICHSETZUNGSVERFAHREN löst man beide nach derselben Unbekannten auf; dann müssen die rechten Seiten übereinstimmen. Beim ADDITIONSVERFAHREN erweitert man so, dass bei einer Unbekannten entgegengesetzt gleiche Zahlen stehen, und addiert beide Zeilen — dabei fällt sie heraus.',
      'Welches man nimmt, ist eine Frage der Bequemlichkeit, nicht der Richtigkeit. Steht eine Zeile schon als y = … da, ist Einsetzen am kürzesten. Stehen die Unbekannten in beiden Zeilen ordentlich untereinander, ist Addieren am kürzesten.',
      'Die Probe muss BEIDE Zeilen prüfen. Ein Paar, das nur die erste erfüllt, ist keine Lösung des Systems — das ist der Unterschied zu einer einzelnen Gleichung.',
    ],
    formel: 'I  a₁x + b₁y = c₁    II  a₂x + b₂y = c₂',
    beispiel: 'I 3x + 2y = 7, II x − y = 1. Aus II folgt x = y + 1; eingesetzt in I: 3(y+1) + 2y = 7, also 5y = 4 und y = 4/5, damit x = 9/5.',
    mehr: ['gleichung', 'beideSeiten', 'loesungsmenge', 'steigung'],
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

  bruchterm: {
    titel: 'Bruchterme kürzen',
    text: [
      'Ein Bruchterm hat eine Variable im Nenner — und damit gibt es Stellen, an denen er gar nicht existiert. Überall dort, wo der Nenner null wird, ist er nicht definiert. Das nennt man Definitionslücke, und es ist die ERSTE Frage bei jedem Bruchterm, nicht die letzte.',
      'Gekürzt wird wie bei Zahlenbrüchen: Zähler und Nenner in Faktoren zerlegen, gemeinsame Faktoren streichen. Aus (x² − 1) : (x − 1) wird (x − 1)(x + 1) : (x − 1), und der Faktor x − 1 steht oben wie unten — also weg damit. Übrig bleibt x + 1.',
      'Und jetzt kommt der Punkt, der alles entscheidet: DIE LÜCKE BLEIBT. Setzt man x = 1 in den ursprünglichen Term ein, steht dort 0 : 0 — das gibt es nicht. In x + 1 eingesetzt kommt dagegen 2 heraus. Die beiden Terme sind also nicht überall gleich; sie sind es nur dort, wo BEIDE definiert sind.',
      'Deshalb schreibt man dazu: (x² − 1) : (x − 1) = x + 1 für x ≠ 1. Ohne diesen Zusatz behauptet man, der Bruchterm hätte bei x = 1 den Wert 2 — und das ist schlicht falsch. Der Wert wurde erfunden.',
      'Das Tückische daran: Nach dem Kürzen SIEHT man die Lücke nicht mehr. Der Faktor, der dort null wurde, ist ja weggekürzt. Genau deshalb muss man den Definitionsbereich bestimmen, BEVOR man kürzt — danach ist die Information aus dem Term verschwunden.',
      'Kürzen darf man nur FAKTOREN, nie einzelne Summanden. Aus (x + 3) : (x + 5) wird nicht 3 : 5 — dort steht ein Plus, kein Mal. Das ist der zweithäufigste Fehler nach dem vergessenen Definitionsbereich.',
    ],
    formel: '(x² − 1) : (x − 1) = x + 1     für x ≠ 1',
    beispiel: 'Bei x = 1: links 0 : 0 — nicht definiert. Rechts 1 + 1 = 2. Deshalb der Zusatz.',
    mehr: ['definitionsbereich', 'ausklammern', 'bruch'],
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
