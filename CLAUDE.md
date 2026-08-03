@AGENTS.md

# Projekt: Mathe begreifen

## Ziel
Mobile App für Google Play (Android), die die Grundlagen von **Algebra,
Geometrie und Stochastik** vermittelt — dazu gezielt die **Mathematik, die man
in der Physik braucht**. Nicht durch Auswendiglernen von Verfahren, sondern
indem jeder Rechenschritt hergeleitet, benannt und nachvollziehbar gemacht
wird.

Zielgruppe: Gymnasiastinnen und Gymnasiasten von Klasse 5 bis zum Abitur.
**Ausdrücklich mitgedacht sind die, die in den ersten Gymnasialjahren nicht
durchgehend aufgepasst haben** und nun am Stoff der höheren Klassen scheitern.

Aufgebaut analog zum Schwesterprojekt `Chemie begreifen` (gleicher Tech-Stack,
gleiche Ordnerstruktur, gleiches Info-Button-Konzept, gleicher Prüfrahmen).

### Der entscheidende Unterschied zu Chemie
Chemie ist ein Netz: Man kann fast überall einsteigen. **Mathematik ist eine
Kette.** Wer die Potenzgesetze nicht sicher beherrscht, scheitert an der
Kettenregel und weiß nicht, warum. Er glaubt, er verstehe Ableitungen nicht —
in Wahrheit versteht er `x⁻²` nicht.

Daraus folgt der ganze Aufbau dieser App.

### Der Lückenfinder
Das wichtigste Feature, und es hat noch niemand ordentlich gebaut:

> Zehn bis fünfzehn Aufgaben, quer durch die Stoffhierarchie gestreut,
> adaptiv: Geht eine schief, geht die App **eine Ebene tiefer** statt weiter.
> Am Ende steht nicht „6 von 15 richtig", sondern:
>
> *„Dein Problem ist nicht die Ableitung. Dein Problem sind die
> Potenzgesetze — hier ist der Weg von dort nach oben."*

Deshalb werden die Themen von Anfang an als **Graph mit Voraussetzungen**
modelliert (`utils/lernpfad.js`), nicht als flache Liste. Jedes Thema kennt
seine Vorbedingungen; der Lückenfinder läuft den Graphen nach unten, bis er
festen Boden findet. Diese Struktur nachträglich einzuziehen wäre teuer.

#### Zwei Regeln, die den Lückenfinder ehrlich halten
1. **Fester Boden heißt: abgefragt und gesessen.** Eine ungefragte
   Voraussetzung zählt NICHT als fester Boden — nicht gefragt heißt nicht in
   Ordnung, es heißt unbekannt. Dieser Unterschied ist beim Bauen
   schiefgegangen: Der Lückenfinder meldete „binomische Formeln" als Lücke,
   obwohl darunter ein ungefragtes Thema lag, in dem der eigentliche Fehler
   steckte. Gefunden von der Prüfung, die für jedes Thema einen Schüler
   simuliert.
2. **Vermutung und Wissen bleiben getrennt.** Aus „kann die pq-Formel" folgt
   nicht streng, dass jemand Wurzeln ziehen kann. Die Annahme steuert
   deshalb nur, WAS ALS NÄCHSTES GEFRAGT wird; im Bericht steht
   ausschließlich, was tatsächlich abgefragt wurde. Was nicht drankam, wird
   ausdrücklich als „darüber ist nichts bekannt" ausgewiesen.

### Die eiserne Regel
Im Chemie-Projekt gilt: *Die App darf niemals ein Reaktionsprodukt erfinden.*
Das mathematische Äquivalent lautet:

> **Jeder Rechenschritt wird hergeleitet, nie nachgeschlagen — und jeder
> Schritt hat einen Namen.**

Also nicht „Ergebnis: x = 3", sondern:

```
3x + 5 = 14
         | beide Seiten − 5
3x = 9
         | beide Seiten : 3
x = 3
```

Das ist die technische Hauptarbeit: ein Termumform-System in `utils/`, das
exakt mit Brüchen rechnet und Schritte ausgibt, die man vorlesen kann.
Umgesetzt in `utils/term.js` und `utils/gleichung.js`; `tests/gleichung.mjs`
prüft genau dieses Beispiel Zeile für Zeile.

> Geteilt wird mit `:`, nicht mit `÷`. Der Doppelpunkt ist die Schreibweise
> des deutschen Unterrichts, und `term.js` schreibt Bruchterme ohnehin so.
> (Der ursprüngliche Entwurf hatte hier `÷` stehen — geändert, damit Code
> und Doku dasselbe sagen.)

### Getroffene Entscheidungen
Diese drei Fragen standen zu Projektbeginn offen und sind beantwortet:

| Frage | Entscheidung |
|---|---|
| Wie weit reicht die App? | **Bis Abitur** — Klasse 5–13, inkl. Ableitung, Integral, Vektorgeometrie, Binomialverteilung, Hypothesentest |
| Aufgaben stellen? | **Ja: Rechner + Aufgabengenerator.** Bei Mathe ist eigenes Rechnen der Lerneffekt, und der Lückenfinder braucht Aufgaben ohnehin |
| Name? | **„Mathe begreifen"** — erkennbares Geschwisterpaar zu „Chemie begreifen" |

### Zum Namen
„Mathe begreifen" ist doppeldeutig gemeint: verstehen und anfassen. Das ist
gleichzeitig die Messlatte für jedes Feature — wenn man einen Wert nur ablesen,
aber nicht verändern und nicht nachvollziehen kann, fehlt etwas. Technische
Bezeichner weichen ab, weil sie kein Leerzeichen vertragen:

| Wo                  | Wert                                            |
|---------------------|-------------------------------------------------|
| Store-/App-Name     | `Mathe begreifen` (in `app.json`)               |
| GitHub-Repository   | `stephanhink/Mathe-begreifen`                   |
| Lokaler Ordner      | `~/Documents/GitHub/Mathematik`                 |
| Expo-Slug           | `mathe`                                         |
| Package-ID          | `com.hink.mathe`                                |

Der lokale Ordner heißt `Mathematik` (so wurde er angelegt), das Repository
`Mathe-begreifen` — genau wie bei Chemie. Das stört Git nicht, der Remote ist
korrekt verknüpft.

Die Package-ID ist endgültig: Nach der ersten Play-Store-Veröffentlichung
lässt sie sich nie wieder ändern.

„Begreifen" ist kein Suchbegriff. Die Auffindbarkeit im Play Store muss
deshalb die Kurzbeschreibung tragen: Bruchrechnen, Gleichungen, Ableitung,
Abitur, Oberstufe, Grundlagen.

## Tech-Stack
- Expo / React Native, SDK 57
- Sprache: JavaScript (kein TypeScript, bewusst — niedrigere Einstiegshürde)
- Keine Navigations-Bibliothek: die Tab-Leiste ist in `App.js` von Hand gebaut
- `react-native-svg` für Funktionsgraphen, Dreiecke und Baumdiagramme

### Expo Go: ggf. APK statt Play Store
Das Expo Go aus dem Play Store hinkt den SDK-Versionen hinterher. Lehnt es das
Projekt mit „Project is incompatible with this version of Expo Go" ab:
Store-Expo-Go deinstallieren und die passende APK von
`expo.dev/go?platform=android&device=true&sdkVersion=57` installieren. Danach
läuft der QR-Code-Workflow wie gewohnt.

> Achtung: Die sideloadete APK bekommt keine Play-Store-Updates mehr.

## Architektur

```
App.js                  Tab-Leiste + Auswahl des aktiven Screens
screens/                Ein Screen pro Themengebiet (= ein Tab)
components/             Wiederverwendbare UI-Bausteine
utils/                  Fachlogik und Daten, komplett ohne UI
tests/                  Prüfungen, laufen mit blankem node
docs/                   Play-Store-Material + Datenschutzerklärung
                        (wird über GitHub Pages ausgeliefert)
```

Wichtigste Regel: **In `utils/` steht kein React.** Die Fachlogik
(Bruchrechnung, Termumformung, Lernpfad, Aufgabengenerator) ist reines
JavaScript und dadurch einzeln nachvollziehbar und testbar. Die Screens rufen
sie nur auf und stellen das Ergebnis dar. Diese eine Regel ist der Grund,
warum die Prüfungen ohne jede Bibliothek laufen.

Reihenfolge beim Bauen, aus Chemie bewährt: **erst `utils/` mit Prüfung, dann
der Screen.** Die Fachlogik ist ohne UI schneller richtig zu bekommen, und der
Screen wird kurz, wenn er nur noch darstellen muss.

### `utils/bruch.js` ist das Fundament
Terme, Gleichungen und Wahrscheinlichkeiten rechnen alle über die exakte
Bruchrechnung. Der Grund: Mit Kommazahlen käme bei 1/3 + 1/3 + 1/3 nicht 1
heraus, sondern 0,9999999999999998. In einer App, die Schritt für Schritt
vorrechnet, wäre das tödlich — der Schüler sieht eine krumme Zahl und glaubt,
er habe sich verrechnet.

Ein Bruch ist ein eingefrorenes `{ z, n }`, immer gekürzt, Nenner immer
positiv. **Kein Zahlenpaar `[z, n]`** — in einer Mathe-App ist ein Zahlenpaar
viel zu leicht ein Punkt oder ein Vektor.

Herkunft: `utils/gleichung.js` aus dem Chemie-Projekt, wo dieselbe Rechnerei
privat für den Ausgleich von Reaktionsgleichungen steckte.

### Tabs
Jeder Tab ist ein Eintrag im Array `TABS` in `App.js`: Schlüssel, Label und
Screen-Komponente. Ein neues Themengebiet bedeutet: neue Screen-Datei bauen
und hier einen Eintrag ergänzen — mehr nicht.

| Tab           | Inhalt                                                          |
|---------------|-----------------------------------------------------------------|
| Lücken        | Der Lückenfinder — adaptiver Einstieg, prominent ganz links      |
| Zahlen        | Brüche, Prozent, Potenzen, Wurzeln, Logarithmus, Zehnerpotenzen  |
| Terme         | Klammern, Binome, Faktorisieren, Bruchterme, Formeln umstellen   |
| Gleichungen   | linear, quadratisch (pq & abc), Systeme, Ungleichungen           |
| Funktionen    | linear, quadratisch, exponentiell, trigonometrisch → Ableitung, Integral |
| Geometrie     | Pythagoras, Trigonometrie, Flächen/Körper, Vektoren              |
| Zufall        | Laplace, Baumdiagramm, Kombinatorik, Binomialverteilung, Erwartungswert |

Sieben Tabs sind auf einem Handy eng (Chemie hat sechs). Falls es zu eng wird:
Lückenfinder als Startbildschirm vor die Tabs ziehen statt als siebten Tab.

### Physik-Mathematik: kein eigener Tab
Die Physik-Anwendungen gehören **nicht** in einen eigenen Bereich, sondern
sind das durchgehende Beispielmaterial — genau das `beispiel`-Feld aus
`wissen.js`:

- `v = s/t` nach `t` umstellen → bei „Formeln umstellen"
- Kräftezerlegung an der schiefen Ebene → bei Trigonometrie
- Halbwertszeit → bei Exponentialfunktionen
- Dezibel und pH → beim Logarithmus (Brücke zur Chemie-App)
- Lichtjahre, Atomdurchmesser → bei Zehnerpotenzen
- Weg-Zeit-Diagramm → bei linearen Funktionen, Steigung = Geschwindigkeit
- Beschleunigung als Ableitung der Geschwindigkeit → bei Ableitung

So lernt man nicht „Mathe für Physik" separat, sondern sieht bei jedem
Werkzeug sofort, wofür es gut ist.

### Das Info-Button-Konzept
Neben jedem Fachbegriff sitzt ein kleiner runder `i`-Knopf
(`components/InfoButton.js`), der eine Erklärung als Modal öffnet. Alle
Erklärungstexte stehen zentral in `utils/wissen.js` — nicht in den Screens.

Aufbau eines Eintrags: `titel`, `text` (Array von Absätzen), optional `formel`,
`beispiel` (konkrete Zahl zum Anfassen), `mehr` (IDs verwandter Themen,
erscheinen als Links).

#### Wo der Knopf sitzt
Überall dort, wo ein Fachbegriff sichtbar wird — an Überschriften, Legenden,
Spaltenköpfen, Achsenbeschriftungen, nicht nur an Eingabefeldern. `InfoButton`
ist von `FeldLabel` unabhängig.

Faustregel: **Steht ein Wort auf dem Bildschirm, das man im Unterricht gelernt
haben müsste, gehört ein `i` daneben.** Lieber einer zu viel als einer zu
wenig — ein ungenutzter Knopf kostet nichts, ein fehlender kostet den
Anschluss.

#### Wie die Texte geschrieben sind
1. **Erster Absatz: die Antwort in Alltagssprache** — ohne Voraussetzungen,
   ohne Formel, ohne weiteren Fachbegriff. Wer nur diesen Absatz liest, muss
   die Frage beantwortet haben.
2. **Danach die Tiefe:** das Warum, der Zusammenhang, die Formel.
3. **`beispiel`:** eine konkrete Zahl. Abstraktes bleibt abstrakt, bis man es
   einmal an echten Werten gesehen hat.
4. **`mehr`:** die Begriffe, über die man in diesem Text stolpern könnte — und
   die Grundlagen eine Ebene tiefer. So wird aus einem Stolperer ein Pfad nach
   unten statt einer Sackgasse.

Erscheint im Text ein Fachbegriff, der nicht im ersten Absatz erklärt und
nicht unter `mehr` verlinkt ist, ist der Eintrag unfertig.

Bei Mathe ist Punkt 4 noch wichtiger als bei Chemie: Die `mehr`-Links sind
faktisch schon ein Teil des Lernpfad-Graphen.

#### `wissen.js` und `lernpfad.js` bleiben getrennt — mit Verbindung
Das Konzept ließ offen, ob beide eine Datenquelle sein sollten. Beim Bauen
wurde klar: besser nicht.

`wissen.js` beschreibt **Begriffe** („Was ist ein Bruch?"), `lernpfad.js`
beschreibt **Fertigkeiten** („einen Bruch kürzen können"). Zu einem Begriff
gehören mehrere Fertigkeiten — Brüche kürzen, addieren, multiplizieren sind
drei Dinge, die man einzeln können oder nicht können kann, aber sie teilen
sich einen Erklärtext. Presste man beides in eine Struktur, müsste eines von
beiden sich verbiegen: entweder Erklärtexte, die dreimal fast dasselbe sagen,
oder Fertigkeiten, die man nicht einzeln prüfen kann.

Verbunden sind sie über das Feld `wissen` in `lernpfad.js`. Dass diese
Verweise nicht ins Leere gehen, prüft `tests/lernpfad.mjs`.

## Fachliche Leitlinien
- **Korrektheit vor Vereinfachung.** Wo eine Näherung üblich ist, zusätzlich
  exakt rechnen und den Unterschied zeigen — genau daran versteht man die
  Voraussetzung der Näherung.
- **Einheiten immer mitführen** und im Ergebnis anzeigen (bei den
  Physik-Beispielen zentral).
- **Ans deutsche Curriculum halten:** Bezeichnungen, Symbole und Schreibweisen
  wie in der Oberstufe und im Abitur.
- **Erklären, nicht nur ausgeben:** Zwischenschritte sichtbar machen, damit
  man die Rechnung nachvollziehen und selbst wiederholen kann.
- **Gradmaß oder Bogenmaß immer dazusagen.** Bis Klasse 10 wird in Grad
  gerechnet, ab der Oberstufe im Bogenmaß — an dieser Stelle geht viel
  verloren.
- Konstanten stehen einmal zentral in `utils/konstanten.js`.

## Prüfungen

Die Fachlogik ist maschinell geprüft, nicht nur durchgelesen. Kein Jest, kein
Vitest — `tests/pruefer.mjs` ist ein eigener Prüfrahmen von ~130 Zeilen ohne
jede Abhängigkeit und exportiert `pruefung`, `wahr`, `zahl`, `gleich`,
`wirft`.

```
npm test                 # jederzeit, Sekunden
npm run build:android    # prüft ZUERST, baut nur bei grün
```

Die Klemme sitzt im `&&` des Build-Skripts: Schlägt `npm test` fehl, wird
`eas build` gar nicht erst aufgerufen. Weil lokal gebaut wird, ist das der
eigentliche Torwächter vor dem Play Store — ein GitHub-Actions-Lauf könnte
einen lokalen Build nicht aufhalten. `.github/workflows/tests.yml` läuft
trotzdem bei jedem Push, aber mit anderem Zweck: als Rückmeldung, damit ein
Fehler nicht erst Tage später auffällt.

**Eine Änderung an `utils/` ohne bestandene Prüfung gehört nicht ins Repo.**
Neue Fachlogik bekommt eine neue Prüfung mit.

### Was die Prüfungen ablehnen müssen
Genauso wichtig wie das, was die Prüfungen bestätigen, ist das, was sie
**ablehnen**. Stillschweigend etwas Falsches zu liefern ist gefährlicher, als
sich zu weigern.

Für Mathe heißt das: Division durch null, Wurzel aus negativer Zahl im
Reellen, `log` von null, 0⁰, eine quadratische Gleichung ohne reelle Lösung,
ein Dreieck mit Winkelsumme ≠ 180°, eine Wahrscheinlichkeit > 1. Jedes davon
muss einen Fehler werfen oder ausdrücklich „gibt es nicht" sagen — nie eine
Zahl raten.

**Ablehnen heißt aber nicht abstürzen.** Ein Term wie `5 : 0` lässt sich
hinschreiben; er hat nur keinen Wert. Umformen muss ihn deshalb stehen lassen,
und erst das Auswerten darf werfen. Andernfalls brächte ein Tippfehler im
Eingabefeld die App zu Fall, noch bevor gerechnet wird. Genau dieser Fehler
steckte in `term.js` und wurde von der Zufallsprüfung gefunden.

### Drei Sorten Fehler, die man auseinanderhalten muss
Sie sehen gleich aus und bedeuten Verschiedenes. Die Fehlerobjekte tragen
deshalb Kennzeichen:

| Kennzeichen | Bedeutung | Beispiel |
|---|---|---|
| `undefiniert` | Das gibt es nicht | `1 : 0`, `√(−4)`, `0⁰` |
| `irrational` | Das ist kein Bruch — aber es gibt es | `√2` |
| `zuGross` | Das kann ich nicht ausrechnen | jenseits von 2^53 |

Wer sie gleich behandelt, antwortet auf eine offene Frage mit einem sachlichen
Nein. `istErfuellt` in `gleichung.js` tat das anfangs bei `zuGross` — behoben.

### Die eine Prüfung, die alles trägt
Für das Termumform-System gilt:

> **Jede Umformung muss den Term wertgleich lassen.** Term vor und nach dem
> Schritt an 200 zufälligen Stellen auswerten und vergleichen. Schlägt das
> fehl, ist die Umformungsregel falsch — egal wie plausibel sie aussah.

Umgesetzt in `tests/term.mjs`. Drei Dinge sind daran wichtig und sollten so
bleiben:

1. **Verglichen wird exakt, wo es exakt geht.** Ohne Wurzeln ist jeder Wert
   an einer rationalen Stelle wieder rational — dann prüft man auf
   Gleichheit statt auf Ähnlichkeit, und das ist strenger als der
   ursprünglich vorgesehene numerische Vergleich. Sobald eine Wurzel im
   Spiel ist, geht das nicht mehr: √2 hat keine Bruchdarstellung. Dort
   wird numerisch mit relativer Toleranz verglichen — also doch der Weg
   aus dem Entwurf, aber nur da, wo er nötig ist. `auswerteExakt`
   unterscheidet die Fälle über gekennzeichnete Fehler (`irrational`,
   `undefiniert`, `zuGross`).
2. **Jeder Zwischenschritt wird geprüft, nicht nur Anfang und Ende.** Ein
   Fehler, der sich in der Mitte selbst wieder aufhebt, wäre sonst
   unsichtbar.
3. **Verglichen wird nur, wo beide Terme definiert sind.** Sonst könnte die
   App nichts mehr zusammenfassen: `1/x − 1/x` ist überall 0, wo es
   definiert ist, aber bei x = 0 ist die linke Seite undefiniert und die
   rechte nicht. Die Fälle, in denen der Definitionsbereich wirklich nicht
   wandern darf, stehen als eigene Prüfungen daneben (`x⁰`, `0⁻¹`) — dort
   kann man sie gezielt treffen, statt auf den Zufall zu hoffen.

Stand 2026-08-01 werden dabei rund 15.800 Stellen tatsächlich verglichen.
Die Prüfung ist gegengeprüft: Eine absichtlich falsch gebaute Regel wird
erkannt, und die Meldung nennt Regel, Term vorher/nachher und die Stelle.

### Warum `bruchrechnung.js` neben `term.js` steht
`term.js` kann `1/2 + 1/3` längst ausrechnen — aber in einem einzigen
Schritt („Zahlen zusammenrechnen"). Genau das hilft niemandem: Wer Brüche
nicht addieren kann, scheitert am **Gleichnamigmachen**, und dieser
Schritt ist dort unsichtbar.

`bruchrechnung.js` rechnet deshalb bewusst NICHT mit `bruch.js`-Werten,
sondern mit ungekürzten Paaren `{ z, n }`: `bruch()` kürzt sofort, und der
Zwischenstand `3/6 + 2/6` würde beim Bauen zu `1/2 + 1/3` zurückgekürzt
und wäre nicht mehr zu sehen. Geprüft wird trotzdem gegen `bruch.js` —
jeder Zwischenschritt muss denselben Wert haben wie das Ergebnis.

> Diese Prüfung hat sofort einen Fehler gefunden: Bei „durch einen Bruch
> teilen heißt mit dem Kehrwert malnehmen" hatte ich den Wert der linken
> Seite notiert statt den der ganzen Rechnung. Nach dem Schritt steht
> `2/3 · 5/4` da, und das ist 5/6 — nicht 2/3.

### Dieselben Invarianten prüfen auch den Schüler
`utils/rechenweg.js` dreht die beiden tragenden Invarianten um: Statt die
eigenen Umformungen zu prüfen, prüft es die des Menschen. Wer seinen
Rechenweg Zeile für Zeile eintippt, bekommt gesagt, **ab welcher Zeile** es
nicht mehr stimmt — nicht bloß „falsch".

Das ist derselbe Code-Gedanke wie in `tests/`, nur zur Laufzeit: Bei Termen
muss jede Zeile denselben Wert haben wie die vorige, bei Gleichungen
dieselbe Lösungsmenge.

> **Bei Gleichungen reichen feste Prüfstellen NICHT.** Zwei Gleichungen mit
> verschiedenen Lösungen sind an einer beliebigen Stelle fast immer beide
> *unerfüllt* — die Stichprobe sähe überall dasselbe und meldete nichts.
> Geprüft wird deshalb an den **Lösungen** beider Zeilen (über `loese`).
> Wer aus `3x = 9` ein `3x = 5` macht, ändert nichts an dem, was bei x = 7
> passiert — aber alles an dem, was bei x = 3 passiert.

Diese Prüfung ist ehrlich über ihre Grenze: Ein Gegenbeispiel ist sicher,
eine Übereinstimmung nur sehr wahrscheinlich. Sie kann nicht bestätigen,
dass eine Umformung für alle Zahlen gilt — und behauptet das nirgends.

#### Das Gleichheitszeichen bedeutet zweierlei
Und zwar je nach Aufgabe. Das ist beim ersten Ausprobieren durch einen
Nutzer aufgefallen:

| Aufgabe | Was `=` bedeutet | Beispiel |
|---|---|---|
| ein **Term** | ein **Kettenglied** | `√20 = √(4 · 5) = 2√5` — eine Zeile, drei Glieder, alle wertgleich |
| eine **Gleichung** | die **Gleichung** | `3x = 9` — eine Zeile, genau ein `=` |

Entschieden wird das am Ausgangspunkt der Aufgabe (`aufgabe.start`),
nicht am Inhalt der Zeile. Vorher wurde jede Zeile mit `=` als Gleichung
gelesen — und ein völlig richtiger Weg wie oben galt als falsch, weil die
nächste Zeile dann ein Term war und „nicht dazu passte".

### Die zweite tragende Prüfung: die Lösungsmenge
Für `gleichung.js` gilt die entsprechende, aber **andere** Aussage:

> **Jede Umformung muss die Lösungsmenge unverändert lassen.** An 200
> zufälligen Stellen feststellen, ob die Gleichung vor und nach dem Schritt
> dort erfüllt ist. Die beiden Antworten müssen übereinstimmen.

Wertgleichheit und gleiche Lösungsmenge sind zwei verschiedene Dinge, und
das eine folgt nicht aus dem anderen — deshalb sind es zwei Dateien und
zwei Prüfungen. Diese hier fängt den klassischen Fehler: mit etwas
multiplizieren, das null sein kann. Dabei bleibt jede einzelne Zeile
„richtig", und trotzdem kommt eine Lösung dazu, die keine ist.

Auch gegengeprüft. Wird das Teilen durch den Koeffizienten absichtlich
durch „mal x" ersetzt, meldet sie:

```
Schritt "beide Seiten : −3": "−3x = −3" → "−3x² = −3x"
bei x = 0: nicht erfüllt wird zu erfüllt
```

Rund 40.200 verglichene Stellen, dazu 160 zufällige Gleichungen, deren
Lösung gegen die **ursprüngliche** Gleichung geprüft wird — das ist die
Probe aus dem Unterricht, und sie fängt einen Fehler auch dann, wenn alle
folgenden Schritte sauber waren.

### Die Rundreise: Schreibweise und Parser prüfen sich gegenseitig
`tests/parser.mjs` verlangt für Zufallsterme:

> Was `alsText()` schreibt, muss `parseTerm()` wieder einlesen — und
> dabei denselben Term ergeben, nicht nur denselben Wert.

Das prüft beide Seiten auf einmal und fängt jede **mehrdeutige
Schreibweise**. Beim Einbau hat sie gleich fünf gefunden, die von Hand
nie aufgefallen wären:

| geschrieben | wurde gelesen als | jetzt |
|---|---|---|
| `3 · 4` | — | der Renderer rechnete heimlich „12" |
| `−4²` | −(4²) = −16 | `(−4)²` |
| `x⁰²` | x² | `(x⁰)²` |
| `3 · x : y` | (3 · x) : y | `3 · (x : y)` |
| `− 1/5 · x` | (−1) · 1/5 · x | Minus wandert in den Koeffizienten |

Der erste war der schlimmste: `alsText` fasste Zahlfaktoren zusammen und
schrieb für `3 · 4` gleich „12". Damit sah der Term vor und nach dem
Schritt „Zahlen zusammenrechnen" gleich aus — und der Schritt verschwand
**stillschweigend aus dem Rechenweg**, weil der Antrieb ihn für einen
Leerlauf hielt. In einer App, deren ganzer Zweck der Rechenweg ist.

Merksatz daraus: **Der Renderer rechnet nicht.** Er schreibt auf, was
dasteht.

### Zufallsproben müssen den geprüften Code auch erreichen
Beim Einbau der Wurzeln fiel eine Lücke auf, die als Warnung taugt: Ein
absichtlich falsch gebautes `√(x²) → x` wurde von der gezielten Prüfung
erkannt, von der Zufallsprüfung aber **nicht**. Der Generator hatte die
Regel schlicht nie ausgelöst — er baute Wurzeln über zufälligen
Radikanden, und die Form `√(t²)` kam dabei praktisch nie vor.

Ein Zufallstest, der den geprüften Code nicht trifft, gibt falsche
Sicherheit. Der Generator in `tests/term.mjs` baut deshalb gezielt auch
Formen, auf die eine bestimmte Regel wartet. Wer eine Regel ergänzt,
ergänzt den Generator mit.

### Zufallsproben brauchen den Gegenfall
Wo an Zufallszahlen geprüft wird, muss die Fehlermeldung die konkreten Werte
nennen, mit denen es schiefging (siehe `regel()` in `tests/bruch.mjs`).
„199 von 200 bestanden" ist eine rote Lampe ohne Schalter; „verletzt bei
a = −3/4, b = 5/6" kann man nachrechnen.

Der Zufall ist außerdem ein gesteuerter: Der Generator startet immer mit
demselben Wert. Eine Prüfung, die mal durchgeht und mal nicht, ist keine
Prüfung.

### Zwei technische Bedingungen
1. **Node ≥ 22.7.** Ab dieser Version erkennt Node die Modul-Syntax von
   `.js`-Dateien selbst. Darauf stützen sich die Prüfungen: Sie importieren
   `utils/*.js` unmittelbar — kein Transpiler, keine Testbibliothek, und die
   `package.json` muss nicht auf `"type": "module"` umgestellt werden (das
   könnte Metro stören). In `engines` vermerkt, im Actions-Workflow gepinnt.
2. **Interne Importe in `utils/` tragen die Endung `.js`**
   (`from './bruch.js'`, nicht `from './bruch'`). Metro käme auch ohne
   zurecht, Node nicht. Bitte nicht „aufräumen" — sonst laufen die Prüfungen
   nicht mehr. In `screens/` und `components/` ist die Endung nicht nötig,
   weil diese Dateien nur durch Metro gehen.

### Bewusst kein eas-build-pre-install-Hook
Naheliegend wäre, `npm test` zusätzlich in den EAS-Lifecycle-Hook zu hängen,
damit die Prüfung auch bei einem direkt eingetippten `eas build` greift. Das
ist hier NICHT eingerichtet: Die Build-Umgebung von EAS bringt möglicherweise
eine ältere Node-Version mit, und dann schlüge der Hook fehl, obwohl der Code
in Ordnung ist — ein blockierter Release wegen eines Umgebungsdetails.

## Workflow
- Code wird per Prompt hier in Claude Code geschrieben, nicht von Hand getippt
- Live-Test über Expo Go auf dem eigenen Handy (QR-Code scannen), nicht über
  Simulator
- Commits/Push über GitHub Desktop
- Xcode nur für den finalen iOS-Build/App-Store-Upload
- **Gebaut wird lokal** über `npm run build:android` — siehe Veröffentlichung

### `.github/workflows/eas-build.yml` liegt brach — mit Absicht
Der Workflow ist aus Chemie mitgekommen und wurde dort nie benutzt: kein
`EXPO_TOKEN` gesetzt, kein einziger Lauf. Die veröffentlichte Chemie-App ist
vollständig über lokale Builds in den Play Store gekommen. Hier ist es
genauso gehalten.

Wer ihn dennoch auslösen will, muss zwei Dinge wissen:

1. **Er baut in der Cloud**, nicht lokal (`eas build` ohne `--local`). Das
   läuft auf Expos Servern und zählt gegen das EAS-Kontingent.
2. **Er läuft an der Klemme vorbei.** Es gibt keinen `npm test`-Schritt — er
   kann also ein Artefakt erzeugen, das keine Prüfung gesehen hat. Genau das
   ist der Grund, warum hier überhaupt lokal gebaut wird. Außerdem ist dort
   Node 20 gepinnt, während das Projekt 22.7 verlangt.

Wer ihn scharf schalten will, ergänzt vorher `npm test` als Schritt und hebt
die Node-Version — und hinterlegt `EXPO_TOKEN` als Repository-Secret. Dann
aber besser als *Robot user* mit projektbezogener Rolle: Ein persönlicher
Access Token gilt fürs ganze Expo-Konto, also auch für Chemie samt Keystore.

### Keine Lizenzdatei
Das Repository hat bewusst **keine** `LICENSE`. Damit gilt das normale
Urheberrecht: Der Code ist einsehbar, darf aber nicht ohne Zustimmung
weiterverwendet werden — passend für eine App, die veröffentlicht wird.

Die von `create-expo-app` mitgelieferte MIT-Lizenz (© 650 Industries, Inc. —
die Firma hinter Expo) wurde beim Aufsetzen entfernt: Sie hätte fälschlich
Expo als Rechteinhaber ausgewiesen und jedem erlaubt, die App zu kopieren und
zu verkaufen. Falls ein neues Scaffolding sie wieder anlegt: wieder löschen.

## Veröffentlichung

Das Projekt ist als `@heilpraktikerdk/mathe` mit expo.dev verknüpft
(`extra.eas.projectId` in `app.json`, Projekt-ID
`5914b977-07b4-4d70-b19b-31bb7fc8a7be`).

### Lokal bauen, Keystore und Version bei Expo
Das ist bewusst genau die Aufteilung, die im Chemie-Projekt gut funktioniert
hat:

| Was | Wo | Warum |
|---|---|---|
| Der Build selbst | **lokal** (`eas build --local`) | `npm test` klemmt davor im `&&`. Ein Cloud-Build ließe sich davon nicht aufhalten |
| Keystore | **bei Expo** (`credentialsSource: "remote"`) | Ein verlorener Keystore bedeutet: nie wieder ein Update für diese App. Bei Expo liegt er sicher und rechnerunabhängig |
| versionCode | **bei Expo** (`appVersionSource: "remote"`, `autoIncrement: true`) | Zählt zentral hoch, auch wenn von mehreren Rechnern gebaut wird |

```
npm run build:android    # prüft, dann eas build --local
```

In `app.json` steht deshalb bewusst KEIN `versionCode` — Expo und `app.json`
zugleich würden auseinanderlaufen. Abfragen lässt er sich mit
`eas build:version:get -p android`.

Der Keystore (Build Credentials `htsRaCwSyn`) wurde am 2026-08-01 bei Expo
angelegt. Neu erzeugen muss man ihn nie wieder — und darf es auch nicht: Nach
der ersten Play-Store-Veröffentlichung akzeptiert Google nur noch Updates, die
mit demselben Schlüssel signiert sind.

**Lokale Builds tauchen NICHT in `eas build:list` auf.** Die Liste bleibt leer,
obwohl gebaut wurde — das ist kein Fehler. Bei Expo liegen nur Keystore und
Versionszähler, nicht die Artefakte.

Den Keystore herunterladen kann man bei Bedarf mit `eas credentials`. Achtung:
Der Befehl legt `credentials.json` (Passwort und Alias im KLARTEXT) und
`credentials/` im Projektordner ab. Beide stehen in `.gitignore` — das Repo
ist öffentlich, und wer diese Dateien bekommt, kann Updates signieren, die
der Play Store als echt akzeptiert.

### Voraussetzungen auf dem Rechner
Für `--local` müssen JDK und Android SDK da sein (Stand 2026-08-01 auf diesem
Rechner vorhanden: OpenJDK 17.0.17 via Homebrew,
`ANDROID_HOME=~/Library/Android/sdk`).

### Berechtigungen sind ausdrücklich blockiert
React Native bringt für sein Entwickler-Menü Berechtigungen mit, die im
Release-Build sonst mitkämen: DUMP, SYSTEM_ALERT_WINDOW, VIBRATE und die
beiden Storage-Berechtigungen. Die App benutzt keine davon. Für eine Schul-App
ist besonders SYSTEM_ALERT_WINDOW („Über anderen Apps einblenden") heikel —
der Play Store zeigt sie prominent an. Deshalb stehen sie unter
`android.blockedPermissions` in `app.json`.

INTERNET bleibt bewusst drin: Die App nutzt es nicht, aber ohne diese
Berechtigung wäre ein späteres OTA-Update über `expo-updates` unmöglich.

**Nach jeder Änderung an den Berechtigungen prüfen**, was tatsächlich im AAB
steht:

```
python3 -c "import zipfile,re;d=zipfile.ZipFile('build-XXXX.aab').read('base/manifest/AndroidManifest.xml');print(sorted(set(m.group(1).decode() for m in re.finditer(rb'uses-permission.{0,200}?(android\.permission\.[A-Z_]+)',d,re.S))))"
```

Erwartete Ausgabe: `['android.permission.INTERNET']` — sonst nichts.

#### Warum dieser Einzeiler anders aussieht als der im Chemie-Projekt
Der dortige sucht schlicht nach jedem `android.permission.…` im Manifest und
meldet dadurch **DUMP mit, obwohl die App sie gar nicht anfordert.** Geprüft am
2026-08-01 an beiden AABs: In Chemie wie in Mathe steht DUMP nicht in einem
`uses-permission`-Element, sondern als `android:permission`-*Attribut* am
`androidx.profileinstaller.ProfileInstallReceiver`. Das ist die Umkehrung —
es legt fest, dass ein *Anrufer* DUMP besitzen muss, um diesen Receiver
ansprechen zu dürfen. Angefordert wird damit nichts.

Die Fassung oben verlangt deshalb ein vorangehendes `uses-permission`. Ein
Fehlalarm wäre hier teuer: Wer ihm glaubt, sucht nach einem Problem, das es
nicht gibt — oder gewöhnt sich an, die Meldung zu ignorieren, und übersieht
beim nächsten Mal eine echte Berechtigung.

## Bekannte Stolperfallen
- `SafeAreaView` muss aus `react-native-safe-area-context` kommen, **nicht**
  aus `react-native` — die eingebaute Variante ist auf Android wirkungslos und
  seit RN 0.86 abgekündigt. Seit SDK 55 zeichnet Android verpflichtend
  edge-to-edge; ohne echte Insets rutscht die Tab-Leiste unter die
  Gestenleiste.
- Tunnel-Modus (`--tunnel`) der Expo-CLI kann fehlerhaft sein, im Zweifel ohne
  starten
- Handy nicht gleichzeitig als Hotspot UND Testgerät nutzen
- Bei Versions-Warnungen: `npx expo install --fix`

## Status

Stand 2026-08-01: **Gerüst steht, erste Fachlogik fertig.**

Was steht:
- Expo-Projekt SDK 57, Tab-Leiste, Ordnerstruktur
- **Der Lückenfinder läuft** (Tab „Lücken", ganz links): `utils/lernpfad.js`
  (Themengraph, 22 Themen), `utils/aufgaben.js` (ein Generator je Thema),
  `utils/luecken.js` (die adaptive Suche), `screens/LueckenScreen.js`
- **Der Zahlen-Bildschirm läuft** (Tab „Zahlen"): `utils/bruchrechnung.js`
  (Bruchrechnen mit sichtbarem Gleichnamigmachen) und `utils/prozent.js`
  (die drei Grundaufgaben, Zu-/Abnahme und die Rückwärtsrechnung)
- **Der Rechner läuft**: `screens/RechnerScreen.js` (Tab „Gleich.").
  Eingabefeld für Term oder Gleichung, Rechenweg mit benannten Schritten,
  Lösungsmenge, Probe, Info-Knöpfe. Der Screen rechnet nichts — er ruft
  `utils/` auf und stellt dar
- `utils/parser.js` — getippten Text einlesen („3x + 5 = 14")
- `utils/wissen.js` — 16 Erklärtexte für die Info-Knöpfe
- `utils/bruch.js` — exakte Bruchrechnung
- `utils/term.js` — Terme darstellen, exakt auswerten, umformen mit
  benannten Schritten. Regeln: neutrale Elemente, Zahlen zusammenrechnen,
  Kehrwert statt Teilen, Wurzel ziehen, teilweise Wurzel ziehen, Wurzel
  aus einer Potenz, Potenzgesetz, gleichartige Glieder, ausmultiplizieren,
  ausklammern. Kennt Wurzeln beliebigen Grades und den Betrag
- `utils/gleichung.js` — Gleichungen ersten und zweiten Grades lösen,
  Schritt für Schritt („| beide Seiten − 5"), samt pq-Formel und Probe.
  Erkennt „keine Lösung" und „jede Zahl"; alles andere sagt ausdrücklich,
  dass es nicht geht
- `utils/rechenweg.js` — den SELBST gerechneten Weg prüfen, Zeile für
  Zeile, mit Angabe der ersten fehlerhaften Zeile
- `components/MatheTastatur.js` — die Zeichen, die auf der Handytastatur
  fehlen (√ ² ³ · : ^)
- Zusammen **1334 Prüfungen**
- Prüfrahmen, GitHub-Actions-Workflows, `eas.json`, `.gitignore` aus Chemie
  übernommen
- **Die Veröffentlichungskette ist einmal komplett durchgelaufen:** verknüpft
  mit `@heilpraktikerdk/mathe`, Keystore bei Expo, `npm run build:android`
  erfolgreich (versionCode 2, signiertes AAB, 51 MB, ~4 Minuten
  Gradle-Laufzeit). Im AAB steht als einzige angeforderte Berechtigung
  INTERNET. Damit ist bewiesen, dass die Kette trägt — bevor sie unter
  Zeitdruck das erste Mal gebraucht wird.

## Offene Punkte
- `gleichung.js` kann Gleichungen ersten und zweiten Grades mit einer
  Variablen. Noch offen: Gleichungssysteme, Ungleichungen (dort dreht
  sich beim Multiplizieren mit einer negativen Zahl das Zeichen um —
  eine eigene, prüfbare Regel), Gleichungen dritten Grades
- Der Satz vom Nullprodukt wird noch nicht als eigener Weg gezeigt:
  (x + 1)(x − 3) = 0 wird ausmultipliziert und dann über pq gelöst,
  obwohl man die Lösungen direkt ablesen könnte
- Bruchterme kürzen. Dieselbe Definitionsbereichs-Frage wie bei den
  Wurzeln, nur schärfer: (x²−1)/(x−1) ist x+1, aber nur für x ≠ 1
- Vier der sieben Screens (Lückenfinder, Zahlen und Rechner stehen).
  `BaustelleScreen.js` ist der Platzhalter dafür und verschwindet, wenn der
  letzte steht
- Der Lernpfad endet bei Klasse 9. Für „bis Abitur" fehlen Funktionen,
  Geometrie, Stochastik und die ganze Oberstufe — jedes neue Thema braucht
  einen Eintrag in `lernpfad.js` UND einen Generator in `aufgaben.js`,
  sonst schlägt die Prüfung fehl
- App-Icon/Branding noch nicht gestaltet (Standard-Expo-Icons als Platzhalter,
  Leitfarbe Indigo `#4338CA` steht in `utils/konstanten.js` und `app.json`)
- `docs/` ist noch leer: `datenschutz.html` und `play-store-listing.md` fehlen
  (Vorlagen liegen im Chemie-Projekt)
- GitHub Pages für die Datenschutzerklärung noch nicht aktiviert
  (Repo-Settings → Pages → Branch `main`, Ordner `/docs`). Die URL lautet
  danach `https://stephanhink.github.io/Mathe-begreifen/datenschutz.html`
  und wird im Play-Store-Listing verlangt.
- Google-Play-Konto/Erstveröffentlichung noch nicht eingerichtet

`EXPO_TOKEN` steht hier bewusst NICHT mehr — der Cloud-Build-Workflow bleibt
ungenutzt, siehe Workflow-Abschnitt. Das ist eine Entscheidung, kein
Versäumnis.
