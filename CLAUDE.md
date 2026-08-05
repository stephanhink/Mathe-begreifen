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

## Der Lernstand — und warum es keine Anmeldung gibt

Der Fortschritt wird auf dem Gerät gespeichert (`AsyncStorage`, ein
JSON-Blob). **Kein Konto, kein Server, keine Anmeldung** — und das ist eine
Entscheidung, keine Bequemlichkeit:

Die Zielgruppe sind Minderjährige. Nach DSGVO Art. 8 bräuchte man in
Deutschland für Kinder unter 16 die Einwilligung der Eltern; dazu kämen
Altersabfrage, Löschanträge, Play-Store-Familienrichtlinien und die Haftung
für Lerndaten auf einem Server. Lernstände sind heikel, weil sie Schwächen
dokumentieren.

Der Gegenwert: Im Play Store lässt sich unter *Data Safety* wahrheitsgemäß
**„keine Daten erhoben"** angeben. Was nie erhoben wird, kann nicht
abfließen.

Gespeichert wird nur, was nötig ist — kein Name, kein Gerät, keine Uhrzeit:

```json
{ "version": 1, "themen": { "bruchKuerzen":
  { "versuche": 3, "richtig": 2, "fach": 2, "zuletzt": "2026-08-03", "faellig": "2026-08-10" } } }
```

### Die eingebauten Proben der Stochastik
`utils/zufall.js` hat zwei Invarianten, die alles auf einmal prüfen — und
beide sind zugleich das, was man im Unterricht als Kontrolle lernt:

> **Die Summe aller Pfade eines Baumdiagramms ist 1.** Irgendein Weg wird
> schließlich genommen. Geprüft für alle Urnen bis 6/6 Kugeln, mit und
> ohne Zurücklegen — ein falscher Zweig fällt sofort auf, egal welcher.

> **Die ganze Binomialverteilung addiert sich zu 1.** Irgendeine
> Trefferzahl kommt heraus.

Dazu die Regel aus dem Konzept: **eine Wahrscheinlichkeit > 1 gibt es
nicht.** 7 von 6 günstigen Fällen wäre 1,17 — eine Zahl, die aussieht wie
ein Ergebnis und keines ist.

> Beim Binomialkoeffizienten wird über das Produkt `(n−k+i)/i` gerechnet,
> nicht über drei Fakultäten: 50! hat 65 Stellen und sprengt die exakte
> Rechnung, obwohl „50 über 2" nur 1225 ist. Genau daran ist die erste
> Fassung der Prüfung gescheitert — dort hatte ich Brüche von Hand
> addiert statt `plus()` zu benutzen, und die Nenner wuchsen über 2^53.

### Formeln umstellen ist etwas anderes als Gleichungen lösen
`gleichung.js` lehnt mehrere Variablen ab, und das zu Recht: Es **sucht
eine Zahl**. `utils/umstellen.js` hat ein anderes Ziel — die Formel soll
nach einer Größe aufgelöst werden, alle anderen Buchstaben bleiben
stehen. Aus „eine Lösung finden" wird „anders hinschreiben".

Das Verfahren ist Schälen: Man sieht sich an, was ZULETZT mit der
gesuchten Größe gemacht wurde, und macht es auf beiden Seiten rückgängig.

> Geschält wird die Seite, auf der die Größe steht — egal welche. Zuerst
> holte ich sie immer nach links; bei `v = s : t` ergab das **vier**
> Schritte mit zwei Seitentauschen, wo man von Hand zwei schreibt. Das
> Tauschen ist kein Rechenschritt, sondern eine Leserichtung, und gehört
> nicht in den Weg, wenn es nichts bewirkt.

**Die Vorbehalte werden mitgeführt, nicht verschwiegen.** Mit `t` zu
multiplizieren ist nur erlaubt für `t ≠ 0`, durch `v` zu teilen nur für
`v ≠ 0`, und beim Wurzelziehen gäbe es auch die negative Lösung. Eine
Formelsammlung schreibt das nicht dazu, weil dort nur positive Größen
vorkommen — eine App, die rechnen lehrt, sollte es sagen, sonst lernt man
eine Regel mit einem stillschweigenden Loch.

Geprüft wird mit einer **Gegenprobe in Zahlen**: Für jede Formel und jede
Größe wird umgestellt, die Zielgröße aus der umgestellten Form berechnet
und in die ursprüngliche eingesetzt. Beide Seiten müssen übereinstimmen.
Gegengeprüft mit einem absichtlich falschen Schritt (mal statt geteilt) —
wird gefunden, mit konkreten Zahlen.

### Wo exakt gerechnet wird und wo nicht
`utils/geometrie.js` musste diese Frage zum ersten Mal für drei
verschiedene Fälle im selben Modul beantworten:

| | |
|---|---|
| **Pythagoras** | exakt. `c = √(2² + 3²)` ist `√13`, nicht 3,606 — `term.js` kann Wurzeln, also werden sie benutzt |
| **Kreis** | exakt bis auf π. Die Fläche bei r = 3 ist `9π`; die Kommazahl steht daneben, nicht anstelle |
| **Winkel** | numerisch. `sin 30°` ist 1/2, `sin 37°` ist keine Zahl, die sich hinschreiben lässt — dort wird gerundet, und die App sagt es |

Die Trennung ist keine Pedanterie: Wer 3,606 sieht, weiß nicht, ob das
exakt ist. Wer √13 sieht, weiß es.

### Zeichnen: die Geometrie gehört in `utils/`, nicht in die Komponente
`components/Funktionsgraph.js` rechnet nichts aus. Wo die Kurve verläuft,
wo das Gitter sitzt und wo eine Linie **unterbrochen** werden muss, steht
in `utils/graph.js` — die Komponente übersetzt es nur in SVG. Damit ist
der heikle Teil mit blankem node geprüft.

Drei Tücken stecken darin, und jede hat eine eigene Prüfung:

1. **Definitionslücken.** Der Graph wird in ABSCHNITTE zerlegt, nicht in
   eine Linie. Bei `1 : x` eine Linie von −1000 nach +1000 durch die Null
   zu ziehen sieht plausibel aus und behauptet, dort läge etwas. Die
   Prüfung verlangt: `1 : x` zerfällt in genau zwei Äste, einer links,
   einer rechts der Null.
2. **Lesbare Achsen.** Ein Gitter im Abstand 0,7143 ist korrekt und
   unbrauchbar. Erlaubt sind nur 1, 2, 5 und Zehnerpotenzen davon — nur
   dort kann man Zwischenwerte im Kopf ablesen.
3. **Die umgedrehte y-Achse.** In der Mathematik zeigt sie nach oben, auf
   dem Bildschirm nach unten. Diese Umkehrung steckt an genau einer
   Stelle (`skala({ umgedreht: true })`) und nicht in jeder Zeichenzeile.

> Zwei Funde beim Bauen: Am Gitter stand „0.6000000000000001" — gerundet
> werden muss das ERGEBNIS, nicht der Faktor, denn schon 3 · 0,2 ergibt
> in Gleitkommazahlen diesen Staub. Und ein festes Fenster von −6 bis 6
> ließ bei `x² − 6x + 8` die Parabel am Rand auf 80 steigen, sodass
> Scheitel und Nullstellen zu einem Strich am unteren Rand wurden. Das
> Fenster richtet sich jetzt nach den **besonderen Stellen**.

### Fehlerbilder: sagen, WAS gedacht wurde
„Der Wert stimmt nicht" ist ehrlich und nutzlos. Wer `1/2 + 1/3` als `2/5`
beantwortet, hat nicht irgendwie danebengelegen — er hat Zähler und Nenner
einzeln addiert. Das ist eine bestimmte Vorstellung davon, wie Brüche
funktionieren, und man kann sie benennen.

Jeder Generator in `aufgaben.js` liefert deshalb neben der Lösung die
typischen **falschen** Antworten mit ihrer Ursache:

| Aufgabe | Antwort | Diagnose |
|---|---|---|
| `1/2 + 1/3` | `2/5` | Zähler und Nenner einzeln addiert |
| `5⁴` | `20` | Basis und Exponent malgenommen |
| `2⁻³` | `−8` | negativer Exponent als negatives Ergebnis gelesen |
| `(x − 6)²` | `x² + 36` | das mittlere Glied fehlt |
| `x² − 6x + 8 = 0` | `−2; −4` | beide Vorzeichen vertauscht (−p/2, nicht +p/2) |

> **Ein Fehlerbild darf nie die richtige Lösung treffen.** Bei bestimmten
> Zufallszahlen fällt der typische Fehler mit dem Richtigen zusammen: `√4`
> halbiert ist 2, und das stimmt; `x² · x²` mit malgenommenen Exponenten
> ergibt ebenfalls x⁴. Bliebe so ein Bild stehen, würde eine richtige
> Antwort als typischer Fehler abgewiesen — das Schlimmste, was eine
> Übungsapp tun kann. `erzeugeAufgabe` filtert solche Bilder deshalb
> zentral heraus, und `tests/aufgaben.mjs` prüft das für jede erzeugte
> Aufgabe.

Die Diagnose sagt, WAS gedacht wurde, nicht was fehlt — nicht „du hast
falsch gerechnet", sondern „du hast Zähler und Nenner einzeln addiert".

### Der Lernkartenkasten
Jedes Thema hat ein Fach (1–5) und ein Fälligkeitsdatum, nach dem Prinzip
von Sebastian Leitner: richtig → ein Fach weiter, längere Pause; falsch →
zurück auf Fach 1 und sofort wieder dran. Die Pausen: **3, 7, 21, 60, 180
Tage**.

> Die erste Zahl war zuerst **1 Tag** — und damit war die zweite Sitzung
> genauso lang wie die erste, denn am Tag darauf war schon wieder alles
> fällig. Der Denkfehler: Ein Tag ist die Pause für eine *falsch*
> beantwortete Karte. Aufgefallen ist das erst beim Durchspielen mehrerer
> Tage hintereinander — keine Prüfung hätte es gefunden, weil jede einzelne
> für sich stimmte.

Dieselbe Pause trägt zwei Aussagen: wann geübt wird **und** wie lange die
App jemandem glaubt, dass er es kann.

### Drei Kategorien, streng getrennt
Die Regel aus `luecken.js` gilt über Sitzungen hinweg weiter:

| | Bedeutung |
|---|---|
| `sicher` | in DIESER Sitzung abgefragt und gesessen |
| `uebersprungen` | früher abgefragt, saß, Pause läuft noch |
| `nichtGefragt` | darüber ist nichts bekannt |

Angenommene Voraussetzungen landen **nie** im gespeicherten Stand. Sonst
behauptete die App beim nächsten Start Dinge, die sie nie geprüft hat.

### Kein React, kein Speicher, keine Uhr in `fortschritt.js`
Die Datei liest und schreibt nichts und fragt nie nach der Uhrzeit — das
Datum kommt von außen herein. Nur deshalb lässt sich prüfen, was in einem
halben Jahr passiert, ohne ein halbes Jahr zu warten. Das Ablegen erledigt
`speicher.js` mit austauschbarem Hintergrund, damit die Prüfungen ohne
React Native laufen.

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

### Der Prüfrahmen ist synchron
`pruefung()` nimmt keine `async`-Funktion. Vorher liefen deren Prüfungen
erst, wenn der Rahmen längst aufgeräumt hatte — der Block meldete
stillschweigend „0 Prüfungen" und sah grün aus. Jetzt bricht er mit klarer
Meldung ab. Wer etwas Asynchrones prüfen will, wartet **vor** dem
`pruefung()` darauf (top-level `await`) und prüft danach die Ergebnisse;
`tests/fortschritt.mjs` macht es so.

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

### Der Store-Text darf nur versprechen, was die App kann
Die Regel hat sich einmal bewährt und ist deshalb festgehalten: Bis zum
2026-08-04 verzichtete `docs/play-store-listing.md` bewusst auf die
stärksten Suchbegriffe — **„Ableitung" und „Abitur" standen NICHT in der
Kurzbeschreibung**, weil der Lernpfad bei Klasse 9 endete. Stattdessen
lag dort eine vorbereitete Zeile mit dem Vermerk „erst dann".

Seit Analysis, Vektorgeometrie und Hypothesentest stehen, ist sie
eingetauscht. **Vor der nächsten Erweiterung wieder gegen `utils/`
prüfen, nicht gegen `CLAUDE.md`** — dieser Text hier hinkt dem Code
naturgemäß hinterher.

Beim Schreiben fielen drei weitere Überversprechen auf, die aus dem
Konzept statt aus dem Code stammten: „Flächen und Körper" (es gibt nur
Flächen), „Potenzen, Wurzeln, Zehnerpotenzen" im Zahlen-Tab (dort stehen
nur Brüche und Prozent) und „Beschleunigung als Ableitung" als
Physik-Beispiel. **Vor jeder Store-Aktualisierung gegen `utils/` prüfen,
nicht gegen `CLAUDE.md`.**

### Zielgruppe im Play Store: hier NICHT von Chemie abschreiben
Chemie richtet sich an die Oberstufe, dort sind „16–17" und „18 und
älter" richtig. Mathe beginnt bei **Klasse 5**, also bei Zehnjährigen.
Anzugeben sind deshalb alle Gruppen ab „9–12" — damit gilt die App als
*Mixed Audience* und fällt unter Googles Families-Richtlinie.

Das kostet hier nichts: keine Werbung, keine In-App-Käufe, keine
Anmeldung, keine Kommunikation, keine Datenerhebung. Die Entscheidung
gegen Nutzerkonten zahlt sich an dieser Stelle ein zweites Mal aus.

### Der Lernstand gehört in die Datenschutzerklärung — trotz „keine Daten"
Bei *Data Safety* bleibt „keine Daten erhoben" richtig: Googles Frage
zielt auf Daten, die das Gerät verlassen, und der Lernstand tut das nie.
In `docs/datenschutz.html` steht er trotzdem ausdrücklich, mit dem
vollständigen JSON-Beispiel. Was gespeichert wird, gehört dorthin — auch
wenn es das Gerät nie verlässt. Die Chemie-Vorlage trug dafür sogar schon
einen Warnkasten: „Falls die App später doch Lernfortschritte speichert …"

### Das Icon: ein Motiv, acht Zuschnitte
`tools/icon-bauen.py` erzeugt alle Icon-Dateien aus einer einzigen
Beschreibung — die sechs unter `assets/` und die zwei Store-Grafiken unter
`docs/store-assets/`. Wer das Zeichen ändern will, ändert es dort einmal,
nicht in acht PNG-Dateien, die dann auseinanderlaufen.

Das Zeichen ist **x²**, hinterlegt mit dem **Graphen von x²**. Das
Geschriebene und das Gezeichnete sagen dasselbe — genau darum geht es in
dieser App. Der Aufbau ist von „Chemie begreifen" übernommen: großes
weißes Zeichen, angedeutetes Motiv dahinter, kleines Zeichen oben rechts.
Dort ist es das Elementsymbol mit der Ordnungszahl, hier die Variable mit
dem Exponenten.

> Das `x` ist kursiv, die `2` aufrecht. So setzt man Mathematik:
> Variablen kursiv, Zahlen aufrecht. Ein Detail, das kaum jemandem
> auffällt — und ohne das es falsch wäre.

Gebraucht werden Chrome (zeichnet das SVG) und ImageMagick (misst nach).
Das Skript hängt bewusst **nicht** in `npm test`: Es erzeugt Dateien, die
im Repo liegen, statt etwas zu prüfen, das sich ändert. Und die Prüfungen
sollen ohne Chrome laufen.

#### Die Sicherheitszone wird gemessen, nicht geschätzt
Android beschneidet das adaptive Icon auf die mittleren 66 % — je nach
Hersteller rund, quadratisch oder als Kleeblatt. Was außerhalb liegt, ist
weg. Nach Augenmaß sieht das immer richtig aus, deshalb rechnet das Skript
es nach: Jedes sichtbare Pixel muss innerhalb von 337,9 px um die Mitte
liegen, sonst bricht es ab und nennt die Koordinate. Aktuell: 323,0 px.

Gegengeprüft — mit `ZONE = 0.80` statt `0.64` meldet es die herausragende
Stelle. Der erste Anlauf des Prüfers war allerdings selbst falsch:
`magick -alpha extract` liefert ein **sRGB-Bild**, durchsichtig steht dort
als `#000000` und nicht als `gray(0)`. Der Filter traf nie, und gemeldet
wurde die Bildecke. Aufgefallen ist es nur, weil die Zahl (721 px)
offensichtlich unmöglich war.

### Screenshots: aus dem echten Build, NICHT aus Expo Go
Der erste Satz Screenshots war unbrauchbar, und es fiel erst beim
Gegenlesen der Familienrichtlinie auf: Auf allen acht Bildern saß oben
rechts ein grauer Zahnrad-Knopf. **Der gehört nicht zur App** — es ist der
„Tools"-Knopf von Expo Go. Die App hat gar keine Kopfzeile mit
Bedienelement; `App.js` rendert nur Inhalt und Tab-Leiste.

Ein Store-Eintrag hätte damit etwas gezeigt, das kein Nutzer je sieht.
Deshalb: **Screenshots immer aus einem installierten Build**, nie aus
Expo Go. Der Weg dahin:

```
eas build --local --platform android --profile preview   # ergibt ein APK
adb install -r build-*.apk
adb shell monkey -p com.hink.mathe -c android.intent.category.LAUNCHER 1
```

Danach steht im Fokus `com.hink.mathe/com.hink.mathe.MainActivity` statt
`host.exp.exponent` — das ist die Probe, dass man die richtige App
fotografiert.

Aufgenommen mit `adb exec-out screencap` auf dem AVD
`Medium_Phone_API_36.1` (1080×2400). Durchgeklickt wurde mit
`adb shell input tap`; die Koordinaten liefert **`uiautomator dump`**, denn
aus einem verkleinerten Bildschirmfoto abgeschätzte Werte treffen den
Info-Knopf um über hundert Pixel daneben.

Drei Fallen, alle drei zuerst hineingetappt:

1. **Der Emulator schiebt ein „Try out your stylus"-Fenster über die
   Tastatur.** Solange es steht, kommt keine Eingabe an.
2. **`adb shell input text` läuft in der GERÄTE-Shell.** `3*sqrt(7)` bricht
   dort an der Klammer ab. Der Text muss dort einfach gequotet ankommen.
3. **Eine verlorene Eingabe fällt nicht auf.** Ein `input text`, das nicht
   ankommt, führt zu einer leeren Antwort — die App meldet
   folgerichtig „Da steht noch nichts", und die Aufgabe zählt als falsch,
   ohne dass jemand etwas falsch gemacht hätte. Im Bericht des
   Lückenfinders stand danach eine Lücke, die es nicht gibt. Seitdem prüft
   das Tippen selbst nach, ob der Text im Feld steht, und wiederholt sich
   sonst.

Gegengeprüft wird der Zuschnitt an der Stelle, an der der Expo-Go-Knopf
saß: Ist das Pixel dort weiß, ist kein Rest davon im Bild.

Das Ergebnis muss auf **1:2** gebracht werden: Der Emulator liefert
1:2,22, Google lässt höchstens 1:2 zu. Gestaucht litte die Schrift, also
werden Statusleiste und Gestenbalken abgeschnitten und die Bilder seitlich
auf 1122×2244 aufgefüllt. Nebenwirkung, die man sonst übersieht: Die
Emulator-Uhr stand auf jedem Bild anders — mit der Statusleiste ist auch
das weg.

### Ungleichungen: eine Regel, die alles andere umkehrt
`utils/ungleichung.js` steht neben `gleichung.js` und nicht darin — aus
demselben Grund, aus dem `gleichung.js` neben `term.js` steht: Es gilt
eine andere Regel.

> Multipliziert oder dividiert man beide Seiten mit einer **negativen**
> Zahl, dreht sich das Vergleichszeichen um.

Der Dreh steht im Rechenweg ausdrücklich dabei und ist am Schritt als
Feld `dreht` markiert, nicht nur im Text — der Bildschirm hebt ihn
farblich hervor. Genau dort geht es schief, also gehört dorthin die
Aufmerksamkeit.

Geprüft wird wie bei den Gleichungen über die Lösungsmenge, und die
Zufallsprüfung ist gegengeprüft: Lässt man den Dreh im Code weg, meldet
sie Schritt, Zeile und Stelle.

#### Die Grenze ist der ganze Punkt
Bei Ungleichungen entscheidet sich alles an der Grenze — `<` oder `≤`.
Zwei Funde beim Bauen, beide dort:

1. Die erste Fassung der Prüfung maß die Zugehörigkeit an einer
   **Fließkommazahl** und die Wahrheit an einer gerundeten Bruchzahl.
   Bei der Grenze −2 − √2/2 gingen die beiden auseinander, und sie
   meldete einen Fehler, den es nicht gab.
2. `inLoesung` nahm anfangs nur Kommazahlen. Bei der Grenze **−4/3** —
   einer ganz gewöhnlichen Bruchzahl — konnte es deshalb nicht sagen,
   ob die Grenze dazugehört. Jetzt wird exakt verglichen, wo es exakt
   geht, und nur bei Wurzelgrenzen numerisch.

Deshalb vergleicht auch `aufgaben.js` die Lösungsmengen **strukturell**
und nicht über Stichproben: `x < 3` und `x ≤ 3` sähen an zufälligen
Stellen fast immer gleich aus.

#### Beim Parser zählt die Reihenfolge
`x <= 3` **enthält** ein Gleichheitszeichen. Wer zuerst auf `=` prüft,
liest eine Gleichung und scheitert dann am eigenen `<`. Deshalb wird
zuerst nach einem Vergleichszeichen gesucht — und aus demselben Grund
stehen die zweizeichigen Formen (`<=`, `>=`) in der Erkennungsliste VOR
den einzeichigen.

Ketten wie `1 < x < 5` werden abgelehnt, aber mit Ansage. Sie
stillschweigend als `x < 5` zu lesen wäre die schlimmste aller
Antworten.

#### „−3 < x" ist aufgelöst
Beim Prüfen der Schülerantwort hatte ich zuerst gefragt, ob `loese()`
noch Schritte macht — und damit `−3 < x` abgewiesen, weil die App die
Variable erst nach links holt. Das Umdrehen ist aber kein
Rechenschritt, sondern eine Leserichtung. **Derselbe Fehler wie damals
bei `umstellen.js`.** Gefragt wird jetzt, ob die Variable allein auf
einer Seite steht — auf welcher, ist egal.

#### Im Lückenfinder stehen zwei Themen, nicht eines
`ungleichungEinfach` hat einen POSITIVEN Vorfaktor und verlangt keinen
Dreh. Das ist Absicht: Erst stellt die App fest, ob das Umformen an
sich sitzt, und erst darüber verlangt `ungleichungMitDreh` die Regel.
Wer beim einfachen scheitert, hat kein Problem mit dem Dreh, sondern
mit dem Lösen — und diese Unterscheidung ist der ganze Zweck des
Lückenfinders.

Unter `ungleichungMitDreh` steht als Voraussetzung nicht nur die
Ungleichung darüber, sondern `ganzeZahlenMultiplizieren`. Wer nicht
sicher weiß, dass −2 größer ist als −3, kann den Dreh nicht verstehen,
sondern nur auswendig lernen.

### Gleichungssysteme: die Invariante gilt fürs System, nicht für die Zeile
`utils/system.js` steht aus demselben Grund neben `gleichung.js` wie
`ungleichung.js`: Die tragende Aussage ist wieder eine andere.

| Datei | Was jeder Schritt gleich lassen muss |
|---|---|
| `term.js` | den **Wert** |
| `gleichung.js` | die **Lösungsmenge** |
| `ungleichung.js` | dieselbe, aber ein Zeichen darf sich drehen |
| `system.js` | die Lösungsmenge des **Systems** — und die besteht aus **Paaren** |

Der Unterschied ist nicht akademisch: Eine einzelne Zeile **darf** sich
ändern. Aus II wird I + II, und das ist eine ganz andere Gleichung.
Erlaubt ist es, weil das Paar, das beide Zeilen zugleich löst, dasselbe
bleibt. Wer hier die einzelne Zeile prüfte, hielte jeden richtigen
Schritt für falsch.

Damit das prüfbar bleibt, ist **jeder Zwischenstand wieder ein System**,
nie eine einzelne Gleichung — auch „y = 3" steht als zweite Zeile eines
Systems da. Das kostet nichts und macht den ganzen Weg mit einer
einzigen Invariante prüfbar.

#### Zufällige Punkte taugen hier GAR nicht
Bei `gleichung.js` war die Stichprobe schon schwach (zwei Gleichungen
sind an einer beliebigen Stelle fast immer beide unerfüllt). Bei einem
System ist sie wertlos: Ein beliebiges Paar (x | y) löst so gut wie nie
ein System — vorher nicht und nachher auch nicht. Die Prüfung sähe
überall „nicht erfüllt" und meldete nie etwas.

Geprüft wird deshalb **an den Lösungen**, und in beide Richtungen:
1. Die Lösung des ursprünglichen Systems muss auch das umgeformte lösen.
2. Was das umgeformte System löst, muss auch das ursprüngliche lösen.

#### Der gefährliche Schritt ist nicht der, den man vermutet
Beim Schreiben der Gegenprobe kam ein Fund heraus, der auch fachlich
lehrreich ist. Naheliegend als „typischer Fehler" wäre: statt `II + I`
wird `II − I` gerechnet. **Das ist gar kein Fehler.** Jede *umkehrbare*
Zeilenkombination erhält die Lösungsmenge — das Lösungspaar erfüllt
beide Zeilen und damit auch jede Summe und jede Differenz von ihnen.

Gefährlich ist der Schritt, der sich NICHT rückgängig machen lässt: eine
Zeile mit **null** multiplizieren oder durch eine Kopie der anderen
ersetzen. Dabei geht Information verloren, und es kommen Lösungen DAZU,
die keine sind. Genau dagegen prüft die zweite Richtung oben.

#### Drei Verfahren als Quervergleich
Einsetzen, Gleichsetzen und Addieren sind im Unterricht drei Wege zum
selben Ziel — und in den Prüfungen ein zusätzliches Sicherheitsnetz:
Rechnet eines von ihnen falsch, weichen die Antworten voneinander ab,
auch wenn jede für sich plausibel aussieht. Im Rechner kann man
zwischen ihnen umschalten und dieselbe Aufgabe dreimal ansehen. Im
Unterricht heißt es „nimm das Additionsverfahren", und niemand sagt
warum.

### Die Ableitung: geprüft gegen ihre eigene Definition
Für `utils/ableitung.js` gilt eine Prüfung, die keine einzige Regel
kennt und trotzdem alle prüft:

> **f′(x) ≈ (f(x + h) − f(x − h)) / (2h)**

Wäre die Potenzregel falsch abgeschrieben, ein Vorzeichen verdreht oder
die innere Ableitung vergessen — der Differenzenquotient fiele sofort
auf, weil er nichts von Regeln weiß. Dreifach gegengeprüft, jedes Mal
mit konkreten Zahlen.

> Benutzt wird der **symmetrische** Differenzenquotient, nicht der
> einseitige aus dem Schulbuch. Sein Fehler ist von der Ordnung h²
> statt h; bei h = 1e-5 sind das etwa zehn genaue Stellen statt fünf.
> Mit dem einseitigen wäre die Toleranz so weit, dass echte Fehler
> durchrutschten.

#### Es gibt keine Wurzelregel und keine Kehrwertregel
√x IST x^(1/2), und 1:x IST x⁻¹. Das Umschreiben ist ein **eigener,
sichtbarer Schritt** und keine stille Vorbereitung — genau daran hängt
der ganze Lernpfad. Wer es sieht, versteht, warum in der Ableitung von
√x ein Bruch im Exponenten steht. Wer es nicht sieht, lernt eine Formel,
die vom Himmel fällt.

Ebenso: Durch eine **Zahl** zu teilen ist die Faktorregel, nicht die
Quotientenregel — der häufigste unnötige Rechenweg im Unterricht.

#### Die kürzere Schreibweise gewinnt
Beim Aufräumen gibt es zwei Wege, und keiner gewinnt immer:

| | ausmultipliziert | nur zusammengefasst |
|---|---|---|
| `(2x+1)³` | 24x² + 24x + 6 | **6(2x + 1)²** |
| `x²·(x+1)` | **3x² + 2x** | 2x · (x + 1) + x² |

Bei der Kettenregel ist die Klammerform die, die man im Heft stehen
lässt; beim Produkt die ausmultiplizierte. Da beide wertgleich sind —
dafür sorgt die tragende Prüfung in `term.js` —, ändert die Wahl nichts
am Ergebnis, nur an der Lesbarkeit. Also entscheidet die Länge.

#### Zwei Funde, die älteren Code betrafen
Die neuen Bruchexponenten haben zwei Stellen aufgedeckt, die vorher nie
erreicht wurden:

1. **`term.js` warf bei einem gebrochenen Exponenten einen Fehler OHNE
   Kennzeichen.** Nach der eigenen Regel des Projekts ist das
   `irrational` — „das ist kein Bruch, aber es gibt es", dieselbe Sorte
   wie bei √2. Ohne Kennzeichen musste jeder Aufrufer den Fall wie
   einen echten Rechenfehler behandeln.
2. Daran gescheitert ist `wertgleich()` in `aufgaben.js`: Es wies die
   **richtige** Antwort `2x^(−1/2)` als falsch ab. Zusätzlich verglich
   es an Stellen, wo beide Seiten `NaN` sind — und `NaN ≠ NaN` las es
   als „verschieden" statt als „hier nicht vergleichbar".

Beides ist derselbe Fehlertyp: **eine offene Frage mit einem sachlichen
Nein zu beantworten.** Steht als Warnung schon in CLAUDE.md, war aber an
diesen zwei Stellen noch nicht umgesetzt.

### Das Integral: die Prüfung schreibt sich von selbst
Integrieren ist die Umkehrung des Ableitens, also lautet die tragende
Prüfung:

> **Leitet man die Stammfunktion wieder ab, muss die Ausgangsfunktion
> herauskommen.**

Das ist keine bequeme Abkürzung, sondern der stärkste Prüfstein im
Projekt — `ableitung.js` ist seinerseits gegen den
Differenzenquotienten geprüft. Damit hängt alles an derselben Kette:

```
Integral → Ableitung → Differenzenquotient → Definition
```

Dazu eine zweite, davon **unabhängige** Kontrolle: Das bestimmte
Integral wird gegen numerische Integration nach Simpson verglichen. Sie
weiß nichts von Stammfunktionen. Wären beide Wege über dieselbe
Stammfunktion gelaufen, prüfte der Vergleich nichts — sie machten
denselben Fehler.

#### Das + C ist kein Schmuck
Beim Ableiten fällt jede Konstante weg; rückwärts weiß man deshalb
nicht, welche es war. Es gibt nicht DIE Stammfunktion, sondern
unendlich viele. Beim bestimmten Integral hebt sich das C auf, weil es
in beiden Klammern steht — **deshalb ist die Fläche eindeutig, obwohl
die Stammfunktion es nicht ist.** Das ist der Hauptsatz in einem Satz.

#### Die Potenzregel hat eine Lücke, und der Nachbar darf nicht mitleiden
`xⁿ⁺¹/(n+1)` versagt bei n = −1: Der Nenner wäre null. Die App sagt
das und nennt `ln|x|` als richtige Antwort, statt zu raten.

Beim Bauen ging genau der Nachbarfall schief: **`1 : x²` wurde
fälschlich mit derselben Begründung abgelehnt.** Der Grund war, dass
`c : g` zu `c · g⁻¹` umgeschrieben wird — aus `1 : x²` wurde `(x²)⁻¹`,
und der Exponent −1 sah aus wie der Sonderfall. Er gehört aber zu `x²`,
nicht zu `x`. Erst das Zusammenziehen der Potenzen (`(x²)⁻¹ = x⁻²`)
macht den Unterschied sichtbar — dasselbe Potenzgesetz, das der
Lernpfad zwei Ebenen tiefer abfragt.

#### Fläche ist nicht dasselbe wie Integral
Von −1 bis 1 über x³ kommt **null** heraus, obwohl dort Fläche liegt —
die Hälften heben sich auf. Die App trennt an den Nullstellen, addiert
die Beträge und warnt ausdrücklich, wenn beide Zahlen auseinandergehen.
Welches von beiden gemeint ist, steht nicht in der Formel, sondern in
der Frage.

#### Es gibt keine Produktregel fürs Integrieren
Wo Ausmultiplizieren hilft — `x · (x + 1)` —, wird es als benannter
Schritt getan. Wo nicht, wird die partielle Integration genannt und die
Aufgabe abgelehnt. Das ist die Stelle, an der Integrieren tatsächlich
schwerer ist als Ableiten, und das darf man nicht verstecken.

### Vektorgeometrie: hier lässt sich EXAKT prüfen
Anders als bei den Funktionen brauchen die tragenden Sätze hier keine
Toleranz und keine Zufallsstellen — Skalar- und Kreuzprodukt sind reine
Bruchrechnung. Drei Sätze tragen alles, und jeder ist zugleich das, was
man im Unterricht als Kontrolle lernt:

1. **Das Kreuzprodukt steht auf beiden senkrecht.** Genau null, nicht
   „ungefähr null" — dafür gibt es das Kreuzprodukt überhaupt.
2. **Die Identität von Lagrange:** `|a × b|² + (a · b)² = |a|² · |b|²`.
   Sie verbindet beide Produkte und fällt auseinander, sobald in einem
   von beiden ein Vorzeichen falsch steht.
3. **Die Dreiecksungleichung** `|a + b| ≤ |a| + |b|` — der Umweg ist
   nie kürzer. Dazu Cauchy-Schwarz, der Grund, warum der Kosinus im
   Winkel nie über 1 kommt.

Die Genauigkeitsfrage ist wie in `geometrie.js` beantwortet: Produkte
exakt, der Betrag exakt bis auf die Wurzel (`|(1|1)|` ist √2, nicht
1,414), der Winkel numerisch — **und dann sagt die Datei es dazu, samt
Einheit.** Ein rechter Winkel bleibt trotzdem exakt, weil das
Skalarprodukt dort genau null ist; dafür gibt es ein eigenes Feld
`rechterWinkel`.

Kollinearität wird **strukturell** über die Verhältnisse geprüft, nicht
über den Winkel: „179,9999°" ist keine Antwort auf eine Ja-Nein-Frage.

#### Windschief gibt es nur im Raum
Von den vier Lagen zweier Geraden ist windschief die, die man nicht
erwartet, weil sie in der Ebene unmöglich ist: Zwei Geraden können
aneinander vorbeilaufen, ohne parallel zu sein. Von oben betrachtet
sähe man einen Schnittpunkt — sie liegen aber in verschiedenen Höhen.

Eine eigene Prüfung stellt deshalb an 200 Zufallsgeraden sicher, dass in
der **Ebene** nie „windschief" herauskommt. Das wäre ein Fehler, den man
beim Rechnen im Raum nicht bemerkt.

#### Der Lernpfad kannte keine Geometrie
Aufgefallen beim Eintragen: `vektorBetrag` braucht den Satz des
Pythagoras als Voraussetzung — und den gab es im Graphen gar nicht,
obwohl der Geometrie-Bildschirm ihn längst kann. Der Graph war bis dahin
reine Algebra. Jetzt steht `pythagorasSatz` drin, mit Generator aus
pythagoreischen Tripeln, damit die Hypotenuse ganzzahlig bleibt und die
Aufgabe den Satz prüft statt das Wurzelziehen aus 61.

Die Vektorthemen hängen bewusst **neben** der Analysis, nicht darunter:
Sie setzen das Rechnen mit negativen Zahlen und den Pythagoras voraus,
nicht die Ableitung. Wer bei Vektoren scheitert, soll nicht zu den
Potenzgesetzen geschickt werden.

### Der Hypothesentest: ein Satz, den fast jeder falsch lernt
`utils/hypothese.js` rechnet nicht nur, es SAGT auch:

> **Ein Test beweist nichts.** „H₀ wird nicht verworfen" heißt nicht
> „H₀ ist wahr". Es heißt nur: Was beobachtet wurde, ist mit H₀
> verträglich — mit anderen Annahmen vielleicht genauso gut. Ein
> Gericht, das freispricht, erklärt niemanden für unschuldig; es stellt
> fest, dass es nicht gereicht hat.

Deshalb liefert jede Entscheidung einen **Vorbehalt** mit, und der
Bildschirm zeigt ihn immer — nicht als Kleingedrucktes. Eine App, die
bloß „H₀ beibehalten" ausgibt, züchtet den Denkfehler, statt ihn
abzuräumen.

Die tragende Prüfung ist die, die den Test definiert: **Die
Wahrscheinlichkeit, H₀ fälschlich zu verwerfen, ist höchstens α — und
der Ablehnungsbereich ist der größte, für den das noch gilt.** Beide
Hälften werden geprüft, und die zweite ist die wichtigere: Ein Test, der
nie verwirft, hielte die erste mühelos ein und wäre wertlos.

#### Hier wird numerisch gerechnet, und das ist begründet
Eine Abweichung von der sonstigen Linie. Ein realistischer Test hat
n = 100; „100 über 50" ist etwa 1 · 10²⁹ und sprengt die exakte
Bruchrechnung um dreizehn Größenordnungen — `zufall.js` bricht dort zu
Recht ab.

Gerechnet wird deshalb über die Rekursion
`P(X = k+1) = P(X = k) · (n−k)/(k+1) · p/(1−p)`, die ohne einen einzigen
Binomialkoeffizienten auskommt. **Gerechtfertigt wird das durch eine
eigene Prüfung:** Für kleine n wird gegen die exakte Rechnung aus
`zufall.js` verglichen. Wo beides geht, kommt dasselbe heraus — dann
darf man der Näherung auch dort glauben, wo exakt gar nichts mehr geht.

#### Zwei Dinge, die man leicht übersieht
1. **Das tatsächliche Niveau ist fast immer kleiner als α.** Die
   Binomialverteilung springt in Stufen; bei n = 100 und α = 5 % liegt
   es bei 4,43 %. α zu behaupten wäre falsch, also nennt die Datei die
   echte Zahl.
2. **Der Ablehnungsbereich kann leer sein.** Dann ist die Stichprobe zu
   klein: Selbst das äußerste Ergebnis wäre unter H₀ noch
   wahrscheinlicher als α. Das ist eine Antwort, keine Panne — und sie
   zu verschweigen und irgendeinen Bereich zu melden wäre das
   Schlimmste.

#### Der Fehler 2. Art braucht eine konkrete Annahme
Er lässt sich nur ausrechnen, wenn man sagt, was statt H₀ gelten soll.
„Irgendetwas anderes als 0,5" ist keine Verteilung. Das übersieht man,
weil α ja auch ohne Zusatzangabe dasteht — deshalb steht der Hinweis
bei jeder Ausgabe dabei.

### Der Satz vom Nullprodukt — und was er NICHT ist
Nicht „null mal irgendwas ist null" (trivial), sondern die Umkehrung:

> **Ist `a · b = 0`, dann ist `a = 0` oder `b = 0`.**

Ein Produkt kann nur null werden, wenn schon ein Faktor null ist. Das
klingt selbstverständlich und ist es nicht: In den Restklassen modulo 12
gilt `3 · 4 = 12 = 0`, und weder 3 noch 4 ist null. Dass der Satz bei
den gewöhnlichen Zahlen gilt, ist eine Eigenschaft DIESER Zahlen — kein
logischer Selbstläufer. Deshalb steht das Beispiel auch im Erklärtext.

#### Die Reihenfolge im Code ist entscheidend
Die Prüfung auf ein Nullprodukt steht in `loese()` **vor** dem
Aufräumen. Stünde sie danach, hätte `multipliziereAus()` die Faktoren
längst weggerechnet — und genau das war vorher der Mangel:
`(x + 1)(x − 3) = 0` wurde ausmultipliziert und dann über die pq-Formel
zurückgeholt, obwohl die Antwort schon dastand.

#### Der Schritt formt nicht um, er liest anders
Der Nullprodukt-Schritt lässt die Gleichung **unverändert** stehen. Das
ist kein Versehen: Der Satz ist eine Lesart, keine Umformung. Damit
bleibt die tragende Invariante („jeder Schritt erhält die Lösungsmenge")
an dieser Stelle trivial erfüllt, statt an einem Schritt zu scheitern,
der aus einer Gleichung mehrere macht.

#### Was er zusätzlich kann
Nicht nur der kürzere Weg — auch ein größerer Umfang:
`(x + 1)(x − 3)(x + 5) = 0` ist vom **Grad 3** und wurde vorher
abgelehnt. Jetzt fällt es in einer Zeile. Vier Fälle sind eigens
bedacht:

| | |
|---|---|
| Zahlenfaktor | `3(x − 2) = 0` — die 3 kann nie null werden und fällt weg, mit Ansage |
| doppelte Lösung | `(x − 2)(x − 2) = 0` hat EINE Lösung. Die Lösungsmenge ist eine Menge |
| Faktor ohne reelle Nullstelle | `(x² + 1)(x − 3) = 0` ergibt nur 3 — der Bildschirm zeigt trotzdem, dass der andere Faktor geprüft wurde |
| rechts steht nicht null | `(x + 1)(x − 3) = 5` — dann gilt der Satz NICHT, und es wird ausmultipliziert. Der klassische Fehler wäre „x + 1 = 5 oder x − 3 = 5" |

> Beim Anpassen der alten Prüfung ist mir ein eigener Fehler
> unterlaufen: Ich habe die Lösungen als **Text** sortiert. Das
> typografische Minus „−" steht im Zeichensatz hinter der Ziffer 3, also
> ergab die Sortierung „3; −1". Sortiert wird jetzt numerisch über
> `auswerte`.

### Bruchterme: beim Kürzen WÄCHST der Definitionsbereich
Die schärfste Definitionsbereichs-Frage im Projekt — schärfer als bei
den Wurzeln.

```
x² − 1
──────  =  x + 1        aber nur für x ≠ 1
x − 1
```

Bei x = 1 steht links `0 : 0`, das gibt es nicht. Rechts steht 2. Die
beiden Terme sind also **nicht überall gleich**. Und die Richtung ist
die gefährliche: Der gekürzte Term ist an einer Stelle definiert, an der
der ursprüngliche es nicht ist. Ohne Vorbehalt lieferte die App für
x = 1 eine Antwort — **für eine Stelle, die es nie gab.** Sie hätte
einen Wert erfunden.

Das Tückische: **Nach dem Kürzen sieht man die Lücke nicht mehr**, denn
der Faktor, der dort null wurde, ist ja weggekürzt. Deshalb steht der
Definitionsbereich im Bildschirm ÜBER dem Ergebnis, nicht darunter — er
ist die erste Frage bei einem Bruchterm, nicht die Fußnote.

#### Die tragende Prüfung hat zwei Hälften
Wertgleichheit allein genügt hier nicht. Geprüft wird zusätzlich:

> **Die ausgeschlossenen Stellen sind GENAU die, an denen der
> ursprüngliche Term nicht definiert ist** — nicht mehr und nicht
> weniger.

Kein Vorbehalt zu viel (sonst schränkt die App grundlos ein), kein
Vorbehalt zu wenig (sonst antwortet sie, wo es keine Antwort gibt).
Über 3000 Stellen je Lauf.

#### Ein Fund im alten Code: `1 : 0` war nicht gekennzeichnet
`bruch.geteilt` warf „Division durch null" **ohne das Kennzeichen
`undefiniert`** — obwohl CLAUDE.md `1 : 0` als ERSTES Beispiel dafür
nennt. Aufgefallen ist es erst hier, weil man beim Kürzen die Frage
„ist der Term an dieser Stelle definiert?" beantworten können muss, und
ohne Kennzeichen lässt sich eine Definitionslücke nicht von einem
Rechenfehler unterscheiden.

**Das ist bereits der dritte Fund dieser Sorte** (nach dem gebrochenen
Exponenten in `term.js` und dem NaN-Vergleich in `aufgaben.js`). Die
drei Kennzeichen stehen seit Langem im Dokument, aber nicht überall im
Code. Wer eine neue Fehlerstelle baut: **Kennzeichen setzen, sonst
antwortet die App irgendwann auf eine offene Frage mit einem sachlichen
Nein.**

### Was aus dem Fenster läuft, wird ABGESCHNITTEN — nicht geklemmt
`abtasten` zerlegt die Kurve dort, wo die Funktion nicht definiert ist.
Was lange offenblieb: Stellen, an denen sie sehr wohl definiert ist,
aber aus dem Fenster läuft. Die wurden auf den Rand **geklemmt** — und
dann lief die Kurve am Rand entlang, als hätte sie dort diesen Wert.

Bei einer Parabel fällt das kaum auf. Bei einer **Tangente** sofort:
Eine Gerade wird nicht plötzlich waagerecht. Genau daran ist es
aufgefallen — beim Anschauen eines Screenshots, nicht durch eine
Prüfung.

Es ist derselbe Fehler wie der, den `graph.js` seit jeher vermeidet, nur
senkrecht statt waagerecht: *Eine durchgezogene Linie behauptet, dort
läge etwas.* `beschneideSenkrecht` beendet den Abschnitt jetzt **genau
am Rand**, mit Zwischenwert, und fängt einen neuen an, wenn die Kurve
zurückkommt.

### Ein totes Bauteil zeigt auch keinen Info-Knopf
Die Erreichbarkeitsprüfung liest den **Quelltext**. Ein Bauteil, das
niemand einbindet, enthält seine `thema="…"`-Knöpfe trotzdem — und
besteht sie mühelos, obwohl auf dem Bildschirm nie etwas davon
erscheint.

Genau das ist passiert: `WozuZinseszins` stand fertig im
Zahlen-Bildschirm und wurde **nie gerendert**, weil meine Änderung auf
eine Zeile zielte, die es dort nicht gab (`bereich === 'prozent'` statt
`bereich === 'brueche' ? … : …`). Die Ersetzung lief ins Leere, die
Prüfung blieb grün, und aufgefallen ist es erst beim Fotografieren.

Dagegen steht jetzt eine billige, aber wirksame Gegenprobe: **Jede lokal
definierte Komponente muss im selben Bauteil auch verwendet werden.**

> Beim Bauen dieser Prüfung selbst hineingetappt: Mein Muster verlangte
> ein Leerzeichen hinter dem Namen (`<Ableitung `). Komponenten mit
> mehreren Eigenschaften stehen aber mehrzeilig da, und neun richtige
> Bauteile galten als unbenutzt. Jetzt akzeptiert das Muster jedes
> Weißzeichen.
>
> Gegengeprüft an einer **Wegwerf-Kopie** des Projekts, nicht an den
> echten Dateien — eine Prüfung zu belegen ist kein Grund, den
> Arbeitsstand anzufassen.

### Der Lernstand wurde nie gespeichert
Der schwerste Fund dieser Sitzung, und er lag **zwischen** den Dateien:
`fortschritt.js` rechnete richtig, `speicher.js` legte richtig ab, der
Bildschirm rief richtig auf — und trotzdem war der Lernstand nach dem
Schließen der App weg. Es fehlte die eine Zeile, die AsyncStorage
anmeldet:

```js
setzeHintergrund(AsyncStorage);
```

`speicher.js` lief auf seinem Rückfall im Arbeitsspeicher. Jede Prüfung
war grün, weil die Prüfungen genau diesen Rückfall benutzen — dafür ist
er gebaut.

**Aufgefallen ist es beim Fotografieren**, nach dreizehn beantworteten
Aufgaben: „Noch nichts geübt." Seit der ersten Veröffentlichung war das
so; die Datenschutzerklärung beschreibt den gespeicherten Eintrag, den
es nie gab.

Dagegen steht jetzt eine Prüfung am Quelltext von `App.js`
(`tests/fortschritt.mjs`). Sie ist grob — aber sie findet genau diese
Sorte Lücke: **eine Verbindung, die niemand hergestellt hat.**

> Beim Nachprüfen habe ich mich selbst getäuscht: Ich beantwortete eine
> Aufgabe und drückte „Abbrechen" — der Stand blieb leer, und ich hielt
> den Fix für wirkungslos. `verbucheAntwort` läuft aber erst beim
> **Weiter**, nicht beim Prüfen. Die Kontrolle war falsch, nicht der Fix.

### Screenshots: was `adb shell input text` NICHT kann
Beim Durchspielen des Lückenfinders per `adb` sind drei Grenzen
aufgefallen, die jedes Mal wieder Zeit kosten:

| | |
|---|---|
| **Hochzahlen** | `12x² − 1` lässt sich nicht tippen — `input text` wirft eine NullPointerException. Antworten in `^`-Schreibweise umwandeln |
| **ESC schließt nicht nur die Tastatur** | Ist keine offen, wirkt `keyevent 111` wie „Zurück" und **beendet die App**. Vorher `dumpsys input_method` auf `mInputShown=true` prüfen |
| **Mehrzeilige Fragen** | Beim Gleichungssystem sitzt das Eingabefeld tiefer als bei einzeiligen Aufgaben; ein fester Abstand zur Zeile darüber trifft daneben |

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

Stand 2026-08-04: **Version 1.0.0 ist beim Play Store eingereicht.**
Alle sieben Bildschirme stehen, 2126 Prüfungen, versionCode 3.

Was steht:
- Expo-Projekt SDK 57, Tab-Leiste, Ordnerstruktur
- **Der Lückenfinder läuft** (Tab „Lücken", ganz links): `utils/lernpfad.js`
  (Themengraph, 22 Themen), `utils/aufgaben.js` (ein Generator je Thema),
  `utils/luecken.js` (die adaptive Suche), `screens/LueckenScreen.js`
- **Der Lernstand bleibt erhalten**: `utils/fortschritt.js` (Lernkartenkasten)
  und `utils/speicher.js` (Adapter auf AsyncStorage)
- **Alle sieben Bildschirme stehen.** Der letzte ist Zufall:
  `utils/zufall.js` (Laplace, Kombinatorik, Baumdiagramm,
  Binomialverteilung, Erwartungswert), `components/Baumdiagramm.js`
- **Der Terme-Bildschirm läuft** (Tab „Terme"): `utils/umstellen.js`
  (Formeln nach einer Größe auflösen, mit Vorbehalten)
- **Der Geometrie-Bildschirm läuft** (Tab „Geom."): `utils/geometrie.js`
  (Pythagoras, rechtwinklige Dreiecke, Flächen), `components/Dreieck.js`
- **Der Funktionen-Bildschirm läuft** (Tab „Funkt."): `utils/funktion.js`
  (Nullstellen, Scheitelpunkt, Steigung), `utils/graph.js` (Geometrie),
  `components/Funktionsgraph.js` (SVG)
- **Der Zahlen-Bildschirm läuft** (Tab „Zahlen"): `utils/bruchrechnung.js`
  (Bruchrechnen mit sichtbarem Gleichnamigmachen) und `utils/prozent.js`
  (die drei Grundaufgaben, Zu-/Abnahme und die Rückwärtsrechnung)
- **Der Rechner läuft**: `screens/RechnerScreen.js` (Tab „Gleich.").
  Eingabefeld für Term oder Gleichung, Rechenweg mit benannten Schritten,
  Lösungsmenge, Probe, Info-Knöpfe. Der Screen rechnet nichts — er ruft
  `utils/` auf und stellt dar
- `utils/parser.js` — getippten Text einlesen („3x + 5 = 14")
- `utils/wissen.js` — 33 Erklärtexte für die Info-Knöpfe
- `utils/bruch.js` — exakte Bruchrechnung
- `utils/term.js` — Terme darstellen, exakt auswerten, umformen mit
  benannten Schritten. Regeln: neutrale Elemente, Zahlen zusammenrechnen,
  Kehrwert statt Teilen, Wurzel ziehen, teilweise Wurzel ziehen, Wurzel
  aus einer Potenz, Potenzgesetz, gleichartige Glieder, ausmultiplizieren,
  ausklammern. Kennt Wurzeln beliebigen Grades und den Betrag
- `utils/bruchterm.js` — Bruchterme kürzen und dabei den
  Definitionsbereich mitführen
- `utils/anwendung.js` — „Wozu braucht man das?": Zinseszins,
  exponentielles Wachstum, Zerfall und der Optionspreis.
  `components/Wozu.js` zeigt sie als aufklappbaren Streifen
- `utils/hypothese.js` — Signifikanztests: Ablehnungsbereich, beide
  Fehlerarten und der Satz, den fast jeder falsch lernt
- `utils/vektor.js` — Vektoren in Ebene und Raum, Skalar- und
  Kreuzprodukt, Geraden und ihre vier Lagen zueinander
- `utils/integral.js` — Stammfunktionen, das bestimmte Integral und der
  Unterschied zwischen Integral und Flächeninhalt
- `utils/ableitung.js` — ableiten mit dem Namen jeder Regel, höhere
  Ableitungen und die Tangente. Damit beginnt die Oberstufe
- `utils/system.js` — lineare Gleichungssysteme mit zwei Unbekannten,
  in allen drei Verfahren des Unterrichts: Einsetzen, Gleichsetzen,
  Addieren
- `utils/ungleichung.js` — Ungleichungen ersten und zweiten Grades,
  samt der einen Regel, die alles umkehrt: Beim Multiplizieren mit
  einer negativen Zahl dreht sich das Vergleichszeichen um.
  `components/Zahlenstrahl.js` zeigt die Lösungsmenge als Bild
- `utils/gleichung.js` — Gleichungen ersten und zweiten Grades lösen,
  Schritt für Schritt („| beide Seiten − 5"), samt pq-Formel und Probe.
  Erkennt „keine Lösung" und „jede Zahl"; alles andere sagt ausdrücklich,
  dass es nicht geht
- `utils/rechenweg.js` — den SELBST gerechneten Weg prüfen, Zeile für
  Zeile, mit Angabe der ersten fehlerhaften Zeile
- `components/MatheTastatur.js` — die Zeichen, die auf der Handytastatur
  fehlen (√ ² ³ · : ^)
- Zusammen **3389 Prüfungen**
- Prüfrahmen, GitHub-Actions-Workflows, `eas.json`, `.gitignore` aus Chemie
  übernommen
- **Eingereicht.** `docs/` enthält Datenschutzerklärung, Play-Store-Text
  (deutsch und englisch), App-Icon, Feature Graphic und acht Screenshots;
  GitHub Pages liefert die Datenschutzerklärung aus. Das eingereichte
  Artefakt ist `build-1785814748548.aab`: versionCode 3, versionName
  1.0.0, signiert mit dem Keystore bei Expo, als einzige angeforderte
  Berechtigung INTERNET — alles am Artefakt selbst nachgeprüft, nicht am
  Build-Log geglaubt.

### Was in der Play Console anders steht als bei Chemie
Drei Angaben, die man beim Abschreiben falsch macht:

| | Chemie | Mathe |
|---|---|---|
| Zielaltersgruppe | 16–17 und älter | **9–12 aufwärts** — die App beginnt bei Klasse 5 |
| Familienrichtlinie | greift nicht | **greift**, Hinweis im Datensicherheits-Abschnitt bejaht |
| Prüfung durch Pädagogen | — | **bejaht** |

Die Verpflichtung auf die Familienrichtlinie ist keine freiwillige Zusage:
Sie gilt, sobald Kinder als Zielgruppe angegeben sind. Die Frage in der
Console entscheidet nur, ob die Zeile den Nutzern angezeigt wird. Sie
kostet hier nichts — im Code steht kein `fetch`, kein `Linking`, keine
WebView, keine Werbe- oder Analyse-Bibliothek; die sieben Abhängigkeiten
sind alle rein technisch.

### Eine App bis zum Abitur, keine zweite
Am 2026-08-04 entschieden, nachdem die Frage aufkam, ob der
Oberstufenstoff in eine „Mathe begreifen 2" gehört (Klasse 5–9 und
10–13 getrennt). **Nein — eine App.**

Der Grund ist nicht Bequemlichkeit, sondern dass ein Schnitt genau das
Feature zerstörte, für das das Projekt existiert: Der Lückenfinder läuft
den Graphen NACH UNTEN. Läge die Kettenregel in App 2 und lägen die
Potenzgesetze in App 1, wäre der Kernbefund dieser App — „dein Problem
ist nicht die Ableitung, dein Problem sind die Potenzgesetze" — nicht
mehr formulierbar. App 2 müsste sagen: „Deine Lücke liegt vermutlich in
der anderen App." Das ist keine Diagnose.

Dazu kommt: Die ausdrücklich mitgedachte Zielgruppe — wer in den ersten
Jahren nicht aufgepasst hat und jetzt am höheren Stoff scheitert — ist
per Definition in beiden Hälften gleichzeitig.

Größe ist kein Gegenargument. Lernpfad, Erklärtexte und
Aufgabengeneratoren sind zusammen **76 KB**, die gesamte Fachlogik samt
Oberfläche 468 KB. Das AAB ist 49 MB, praktisch alles
React-Native-Laufzeit. Der Inhalt könnte sich verzehnfachen und die App
wüchse um unter ein Prozent.

Die berechtigte Sorge — ein Fünftklässler wird vom Oberstufenstoff
erschlagen — wird IN der App gelöst, nicht durch Teilen: Die sieben Tabs
bleiben, neuer Stoff erweitert vorhandene Bereiche (Funktionen bekommen
Ableitung und Integral, Geometrie die Vektoren, Zufall den
Hypothesentest), und innerhalb eines Bereichs wird nach Stufe gruppiert.
Der Lückenfinder braucht ohnehin keine Klassenangabe.

Was tatsächlich zu groß wird, sind `wissen.js` und `lernpfad.js`. Das ist
eine interne Aufteilung in Unterdateien, keine Produktaufteilung.

## „Wozu braucht man das?" — gebaut am 2026-08-04

Der Entwurf stand vorher fest, und er hat getragen. Was hier steht, ist
deshalb keine Planung mehr, sondern die Begründung des Gebauten.

Der Anlass ist die Frage, an der Mathematik in der Schule am häufigsten
scheitert, und sie kam vom Nutzer selbst: *„Ich habe mich in der Schule
immer gefragt, wozu man die Mathematik eigentlich braucht. Es fehlte am
praktischen Nutzen."* Genannt: Optionspreise, Zinseszins, exponentielles
Wachstum.

### Die Regel, die das Ganze trägt
> **Eine Anwendung wendet die Formel nicht an — sie bringt sie hervor.**

Das ist der Unterschied zwischen einer Textaufgabe und einer Einsicht.
Zinseszins ist kein Beispiel FÜR die Exponentialfunktion; Zinseszins IST
der Ort, an dem sie entsteht: nach einem Jahr K · 1,03, nach zwei Jahren
K · 1,03², nach n Jahren K · 1,03ⁿ. Wer das einmal selbst hingeschrieben
hat, braucht die Exponentialfunktion nicht mehr erklärt zu bekommen.

Wird es andersherum gebaut — erst die Formel, dann ein hübsches Beispiel
—, entsteht genau das, woran Schulmathematik krankt: der Bauer mit den
37 Melonen. Eine erfundene Verpackung um eine Rechnung, die man auch ohne
sie gemacht hätte.

### Die zweite Regel: sagen, was das Modell NICHT weiß
Dieselbe Ehrlichkeit wie überall sonst. `umstellen.js` führt die
Vorbehalte mit (`t ≠ 0`), `geometrie.js` sagt, wo gerundet wird — eine
Anwendung muss sagen, was sie verschweigt:

- Zinseszins mit festem Satz kennt keine Inflation und keine Steuer
- Exponentielles Wachstum hört in der Wirklichkeit irgendwann auf; kein
  Bakterium füllt das Weltall
- Das Optionsmodell setzt voraus, dass sich mit dem Nachbau kein Geld
  verdienen lässt

Eine App, die „sie rät nicht" verspricht und dann ein Modell für die
Wirklichkeit ausgibt, hätte ihr eigenes Versprechen gebrochen. Und
gerade dieser Absatz ist das Wertvollste daran: Zu verstehen, wo ein
Modell aufhört zu gelten, ist mehr wert als die Formel selbst.

### Wo es hingehört: NICHT in einen eigenen Tab
Der achte Tab wäre der bequeme Weg und der falsche. Er trennte das
Wozu vom Stoff — und damit müsste man danach suchen, statt darüber zu
stolpern. Es ist dasselbe Argument wie beim Info-Knopf: *Die Erklärung
steht dort, wo der Begriff auftaucht.*

Vorgesehen ist deshalb:

1. **Ein Feld `anwendung` in `wissen.js`**, neben `beispiel`. Kurz, ein
   Absatz, mit dem Satz „dafür braucht man das" statt einer Rechnung.
   Kostet nichts und wirkt sofort — 34 Erklärtexte sind schon da.
2. **Für die, die einen Rechner verdienen: `utils/anwendung.js`.** Reine
   Fachlogik ohne React, prüfbar wie alles andere. Sie liefert den
   Rechenweg mit benannten Schritten — sonst verstieße ausgerechnet der
   Anwendungsteil gegen die eiserne Regel der App.
3. **Ein sichtbarer Haken im Screen**, kein zweiter Info-Knopf. Ein
   schmaler Streifen „Wozu braucht man das?" unter dem Ergebnis, der
   sich aufklappt. Sichtbar, ohne zu drängeln.

### Was daraus geworden ist
`utils/anwendung.js` liefert vier Anwendungen, `components/Wozu.js`
zeigt sie als **aufklappbaren Streifen** unter dem Ergebnis — kein
achter Tab, wie festgelegt. Zugeklappt ist er eine Zeile und drängelt
nicht.

Jede Anwendung sitzt dort, wo ihre Mathematik steht: Zinseszins und
Verdopplung beim **Prozentrechnen**, der Optionspreis bei der
**Binomialverteilung**. Eine eigene Prüfung verlangt, dass jede von
ihnen sowohl eine `einsicht` als auch einen `vorbehalt` hat — ohne den
Vorbehalt wäre die Anwendung eine Behauptung über die Wirklichkeit.

Die tragenden Prüfungen sind für jede Anwendung die Aussage, die sie zur
Anwendung macht:

| | |
|---|---|
| Zinseszins | Die Potenz muss dasselbe liefern wie Jahr für Jahr multiplizieren |
| Verdopplungszeit | Sie hängt **nicht** vom Startkapital ab — direkt geprüft, von 1 € bis zur Million |
| Zerfall | Dieselbe Formel wie Zinseszins, nur mit Faktor unter 1 — beide Wege müssen übereinstimmen |
| Optionspreis | **Der Nachbau muss in BEIDEN Fällen dasselbe liefern** wie die Option. Exakt prüfbar, weil in Brüchen gerechnet wird |

Die letzte ist die schönste: Aus ihr folgt der Preis, und sie zeigt
zugleich, warum er kein Schätzwert ist, sondern ein Zwang.

#### Ein Fund: die Erreichbarkeitsprüfung ließ sich täuschen
`tests/wissen.mjs` verlangte bisher nur, dass ein Erklärtext
*irgendwo erwähnt* wird — von einem Info-Knopf oder von einem anderen
Text unter `mehr`. Die drei neuen Texte verlinkten **einander** und
bestanden die Prüfung mühelos, obwohl kein Knopf auf einen von ihnen
zeigte und kein Nutzer je hingekommen wäre.

Eine geschlossene Insel ist nicht erreichbar, sie ist nur in sich
verbunden. Gesucht wird jetzt **vorwärts von den Info-Knöpfen aus**,
transitiv über die `mehr`-Links — und die drei Texte fielen sofort
durch, bis der Streifen sie anband.

### Womit anfangen — nach Wirkung sortiert
| Anwendung | Bringt hervor | Braucht | Wert |
|---|---|---|---|
| **Zinseszins** | die Exponentialfunktion | nur Potenzen | am höchsten: geht ab Klasse 9 UND ist die nützlichste Mathematik, die ein Mensch privat je braucht |
| **Exponentielles Wachstum** | Wachstumsfaktor, Halbwertszeit | Potenzen, später Logarithmus | der Schock-Effekt: ein Cent, 30 Tage verdoppelt, sind über 5 Millionen € |
| **Optionspreis** | Binomialverteilung mit Sinn | Stochastik, Oberstufe | die Krone — der Erwartungswert wird mit der FALSCHEN Wahrscheinlichkeit gerechnet, und gerade deshalb stimmt er |

Die ersten beiden hängen nur an den Potenzen und könnten schon vor der
Oberstufe kommen. Der Optionspreis steht in Teilen bereits im Eintrag
`binomialverteilung` — dort ist die Machart schon einmal vorgeführt und
kann als Muster dienen.

Weitere Kandidaten, wenn das Muster trägt: Kredit und Tilgung
(Gleichungssysteme), Dreisatz und Skalierung (Prozent), Fehlerfortpflanzung
beim Messen (Physik), Wahlprognosen und Stichprobenfehler (Binomial),
Kompression und Bits (Logarithmus).

### Warum es die App tragen würde
Der Lückenfinder beantwortet „woran hakt es". Die Anwendungen beantworten
„warum sollte mich das kümmern". Das sind die beiden Fragen, an denen
Mathematikunterricht scheitert, und keine Lern-App beantwortet bisher
beide. Deshalb steht das hier notiert und nicht in einer Ideenliste.

## Offene Punkte
- `gleichung.js` kann Gleichungen ersten und zweiten Grades mit einer
  Variablen; Ungleichungen und Gleichungssysteme stehen daneben in
  eigenen Dateien. Noch offen: Gleichungen dritten Grades
- **Der Lernpfad reicht jetzt von Klasse 5 bis 13.** Der Weg dorthin,
  jeder Block auf dem vorigen:
  1. ~~Ungleichungen~~ **stehen** (2026-08-04), mit zwei Themen im
     Lernpfad und zwei Aufgabengeneratoren.

     ~~Gleichungssysteme~~ **stehen ebenfalls** (2026-08-04). Damit ist
     dieser Block abgeschlossen.

     ~~Ableitung~~ **steht** (2026-08-04): Potenz-, Faktor-, Summen-,
     Produkt-, Quotienten- und Kettenregel, höhere Ableitungen,
     Tangente, drei Themen im Lernpfad.

     ~~Integral~~ **steht** (2026-08-04): Stammfunktion, bestimmtes
     Integral, Fläche, zwei Themen im Lernpfad.

     ~~Vektorgeometrie~~ **steht** (2026-08-04): Vektoren, Skalar- und
     Kreuzprodukt, Geraden, vier Themen im Lernpfad. Dabei fiel auf,
     dass der Graph bis dahin GAR KEINE Geometrie kannte — der Satz des
     Pythagoras ist jetzt auch drin.

     ~~Hypothesentest~~ **steht** (2026-08-04). **Damit ist „bis
     Abitur" eingelöst** — der Lernpfad reicht von Klasse 5 bis 13.

     **HIER GEHT ES WEITER:** das Kapitel „Wozu braucht man das?" weiter
     oben — Zinseszins, exponentielles Wachstum, Optionspreise
  2. **Integral**
  4. **Vektorgeometrie und Hypothesentest**

  Jedes neue Thema braucht einen Eintrag in `lernpfad.js` UND einen
  Generator in `aufgaben.js`, sonst schlägt die Prüfung fehl. Genau dieses
  Geländer hält den Graphen beim Wachsen ehrlich.
- **Version 1.1.0 ist gebaut und liegt bereit** (2026-08-05):
  `build-1785910798394.aab`, versionCode 4, signiert, als einzige
  Berechtigung INTERNET — am Artefakt geprüft. Dazu die getauschte
  Store-Beschreibung und `docs/neuerungen.md` mit den
  Versionshinweisen (483 bzw. 500 von 500 Zeichen).

  **Eingereicht wird erst nach der laufenden Prüfung von 1.0.0.** Das
  ist die Entscheidung des Betreibers, nicht eine technische Not.
- Zwei Prüfungen laufen bei Google getrennt, und sie blockieren
  einander nicht:
  - Die **Freigabeprüfung** entscheidet, ob eine Version veröffentlicht
    wird. Sie dauert üblicherweise Tage.
  - **„Von Lehrkräften empfohlen"** ist ein eigenes Programm. Es läuft
    nach der Veröffentlichung, hat einen eigenen Zeitplan und hält
    weder die App noch spätere Updates auf. Bleibt es aus, fehlt nur
    das Abzeichen — es gibt keine Ablehnung und keine Folge.

  Wer beides für dasselbe hält, wartet unnötig lange mit dem nächsten
  Update. Im Zweifel den Status in der Play Console nachsehen; Googles
  Abläufe ändern sich.
- Nach der Veröffentlichung: Bewertungen und Abstürze im Auge behalten,
  und die erste Rückmeldung echter Schüler abwarten, bevor größere
  Umbauten anfangen.
- Kür, keine Pflicht: Die Screenshots zeigen den Stand von 1.0.0. Alles
  darauf gibt es weiterhin genau so, sie sind also nicht falsch — aber
  die Oberstufe ist darauf nicht zu sehen. Neue aufnehmen ginge mit dem
  Weg aus dem Abschnitt „Screenshots" weiter oben.

`EXPO_TOKEN` steht hier bewusst NICHT mehr — der Cloud-Build-Workflow bleibt
ungenutzt, siehe Workflow-Abschnitt. Das ist eine Entscheidung, kein
Versäumnis.
