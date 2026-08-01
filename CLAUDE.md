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
         | beide Seiten ÷ 3
x = 3
```

Das ist die technische Hauptarbeit: ein Termumform-System in `utils/`, das
exakt mit Brüchen rechnet und Schritte ausgibt, die man vorlesen kann.

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

Bei Mathe ist Punkt 4 noch wichtiger als bei Chemie: **Die `mehr`-Links sind
faktisch schon der Lernpfad-Graph.** Beim Bauen von `lernpfad.js` prüfen, ob
`wissen.js` und `lernpfad.js` dieselbe Datenquelle sein sollten.

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

### Die eine Prüfung, die alles trägt
Für das Termumform-System gilt:

> **Jede Umformung muss den Term wertgleich lassen.** Term vor und nach dem
> Schritt an 200 zufälligen Stellen numerisch auswerten und vergleichen (mit
> Toleranz, Definitionslücken übersprungen). Schlägt das fehl, ist die
> Umformungsregel falsch — egal wie plausibel sie aussah.

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
- Builds über `.github/workflows/eas-build.yml` (manuell auslösbar, braucht
  `EXPO_TOKEN` als Repository-Secret)

### Keine Lizenzdatei
Das Repository hat bewusst **keine** `LICENSE`. Damit gilt das normale
Urheberrecht: Der Code ist einsehbar, darf aber nicht ohne Zustimmung
weiterverwendet werden — passend für eine App, die veröffentlicht wird.

Die von `create-expo-app` mitgelieferte MIT-Lizenz (© 650 Industries, Inc. —
die Firma hinter Expo) wurde beim Aufsetzen entfernt: Sie hätte fälschlich
Expo als Rechteinhaber ausgewiesen und jedem erlaubt, die App zu kopieren und
zu verkaufen. Falls ein neues Scaffolding sie wieder anlegt: wieder löschen.

## Veröffentlichung

`appVersionSource: "remote"` in `eas.json` zählt den versionCode zentral hoch.
In `app.json` steht deshalb bewusst KEIN `versionCode` — beides zugleich
würde auseinanderlaufen.

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
python3 -c "import zipfile,re;d=zipfile.ZipFile('build-XXXX.aab').read('base/manifest/AndroidManifest.xml');print(sorted(set(x.decode() for x in re.findall(rb'android\.permission\.[A-Z_]+',d))))"
```

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
- `utils/bruch.js` — exakte Bruchrechnung mit 128 Prüfungen
- Prüfrahmen, GitHub-Actions-Workflows, `eas.json`, `.gitignore` aus Chemie
  übernommen

## Offene Punkte
- `utils/term.js` — Termdarstellung und Umformungen mit benannten Schritten
- `utils/lernpfad.js` — Themengraph mit Voraussetzungen; Prüfung: keine
  Zyklen, jedes Thema erreichbar
- `utils/wissen.js` — Prüfung: kein Info-Knopf zeigt ins Leere, kein
  `mehr`-Link geht auf eine unbekannte ID
- `utils/aufgaben.js` — Aufgabengenerator (Grundlage des Lückenfinders)
- Alle sieben Screens
- App-Icon/Branding noch nicht gestaltet (Standard-Expo-Icons als Platzhalter,
  Leitfarbe Indigo `#4338CA` steht in `utils/konstanten.js` und `app.json`)
- `docs/` ist noch leer: `datenschutz.html` und `play-store-listing.md` fehlen
  (Vorlagen liegen im Chemie-Projekt)
- EAS-Projekt noch nicht mit expo.dev verknüpft (passiert beim ersten
  `eas build`, trägt dann `extra.eas.projectId` in `app.json` ein)
- GitHub Pages für die Datenschutzerklärung noch nicht aktiviert
  (Repo-Settings → Pages → Branch `main`, Ordner `/docs`). Die URL lautet
  danach `https://stephanhink.github.io/Mathe-begreifen/datenschutz.html`
  und wird im Play-Store-Listing verlangt.
- `EXPO_TOKEN` als Repository-Secret für `.github/workflows/eas-build.yml`
  noch nicht hinterlegt
- Google-Play-Konto/Erstveröffentlichung noch nicht eingerichtet
