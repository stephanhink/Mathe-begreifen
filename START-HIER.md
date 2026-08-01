# Start hier — Übergabe aus dem Chemie-Projekt

Stand: 1. August 2026. Dieses Dokument ist die Brücke aus der
Planungssitzung zum Chemie-Projekt (`~/Documents/GitHub/Chemie`) in dieses
noch leere Verzeichnis. Es enthält alles, was nötig ist, um hier ohne
Rückgriff auf das andere Fenster weiterzuarbeiten.

Es ist zugleich für einen Menschen und für eine frische Claude-Code-Sitzung
geschrieben. Wenn das Projekt steht, wird aus Teil 1 und Teil 5 die
`CLAUDE.md`, und diese Datei kann gelöscht werden.

---

## 0. Zuerst: drei offene Entscheidungen

Diese drei Fragen wurden gestellt, aber noch nicht beantwortet. Sie
entscheiden über den halben Umfang — **vor dem ersten `npx create-expo-app`
sollten mindestens Frage 1 und 3 geklärt sein**, weil Slug und Package-ID
sich nach der ersten Play-Store-Veröffentlichung nie wieder ändern lassen.

### Frage 1 — Wie weit soll die App nach oben reichen?

| Option | Bedeutung |
|---|---|
| **Bis Abitur** | Klasse 5–13, inkl. Ableitung, Integral, Vektorgeometrie, Binomialverteilung, Hypothesentest. Trifft die Zielgruppe dort, wo sie gerade sitzt — aber der obere Teil ist etwa die Hälfte der Arbeit. |
| **Bis Klasse 10** | Endet bei quadratischen Funktionen, Trigonometrie am Dreieck, Laplace. Deutlich kleiner, sehr solide — aber ein Q-Phasen-Schüler findet sein aktuelles Thema nicht und legt die App weg. |
| **Erst bis 10, Oberstufe als Update** | Version 1.0 schneller im Store, Struktur von Anfang an auf Erweiterung angelegt. |

### Frage 2 — Aufgaben stellen, oder nur rechnen und erklären?

| Option | Bedeutung |
|---|---|
| **Beides: Rechner + Aufgabengenerator** | Wie Chemie interaktiv rechnen, zusätzlich generierte Übungsaufgaben mit Schritt-für-Schritt-Kontrolle. Bei Mathe ist eigenes Rechnen der eigentliche Lerneffekt — und der Lückenfinder (siehe Teil 1) braucht Aufgaben ohnehin. |
| **Nur rechnen & erklären** | Konsistent mit Chemie, viel weniger Arbeit. Ohne Aufgaben gibt es aber keinen Lückenfinder — und damit fehlt das stärkste Alleinstellungsmerkmal. |
| **Aufgaben aus fester Sammlung** | Kuratiert statt generiert. Weniger Technik, dafür endlicher Vorrat; man kann dieselbe Aufgabe zweimal bekommen. |

### Frage 3 — Wie soll die App heißen?

| Option | Bedeutung |
|---|---|
| **„Mathe begreifen"** | Direkte Schwester zu „Chemie begreifen", gleiche Handschrift, erkennbares Paar im Store. Nachteil wie dort: „begreifen" sucht niemand. |
| **Suchbarer Name** | Etwas mit Mathe, Abitur, Oberstufe, Üben im Namen — bessere Auffindbarkeit, dafür kein sichtbares Geschwisterpaar. |
| **Später** | Geht nur begrenzt: Slug und Package-ID müssen vor dem ersten Build feststehen. |

> **Erfahrung aus Chemie:** „Chemie begreifen" ist ein schöner Name, aber
> die Auffindbarkeit muss komplett die Kurzbeschreibung tragen
> (Periodensystem, pH, Stöchiometrie, Abitur). Bei Mathe wäre derselbe
> Kompromiss zu erwarten — Stichwörter also: Bruchrechnen, Gleichungen,
> Ableitung, Abitur, Oberstufe, Grundlagen.

---

## 1. Was das werden soll — das Konzept

### Der Ausgangspunkt

Viele Jugendliche haben in den ersten Gymnasialjahren nicht durchgehend
aufgepasst und scheitern nun am Stoff der höheren Klassen. Die App soll die
Grundlagen von **Algebra, Geometrie und Stochastik** vermitteln — dazu
gezielt die **Mathematik, die man in der Physik braucht**. Also durchweg
Dinge, die auch im späteren Leben tragen.

### Der entscheidende Unterschied zu Chemie

Chemie ist ein Netz: Man kann fast überall einsteigen. **Mathematik ist eine
Kette.** Wer die Potenzgesetze nicht sicher beherrscht, scheitert an der
Kettenregel und weiß nicht, warum. Er glaubt, er verstehe Ableitungen
nicht — in Wahrheit versteht er `x⁻²` nicht.

Daraus folgt das wichtigste Feature, und es hat noch niemand ordentlich
gebaut:

> ### Der Lückenfinder
>
> Zehn bis fünfzehn Aufgaben, quer durch die Stoffhierarchie gestreut,
> adaptiv: Geht eine schief, geht die App **eine Ebene tiefer** statt
> weiter. Am Ende steht nicht „6 von 15 richtig", sondern:
>
> *„Dein Problem ist nicht die Ableitung. Dein Problem sind die
> Potenzgesetze — hier ist der Weg von dort nach oben."*

Deshalb: Die Themen von Anfang an als **Graph mit Voraussetzungen**
modellieren (`utils/lernpfad.js`), nicht als flache Liste. Jedes Thema kennt
seine Vorbedingungen; der Lückenfinder läuft den Graphen nach unten, bis er
festen Boden findet. Diese Struktur nachträglich einzuziehen wäre teuer.

### Die Chemie-Regel, übersetzt

Im Chemie-Projekt galt: *Die App darf niemals ein Reaktionsprodukt
erfinden.* Das mathematische Äquivalent lautet:

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

Das ist die technische Hauptarbeit: ein kleines Termumform-System in
`utils/`, das exakt mit Brüchen rechnet und Schritte ausgibt, die man
vorlesen kann. Es ist zugleich **hervorragend prüfbar** — jede Umformung
muss den Term wertgleich lassen, und das testet man, indem man vor und nach
der Umformung an 200 zufälligen Stellen einsetzt und vergleicht. Die 4332
Prüfungen aus Chemie bekommen leicht Gesellschaft.

### Tab-Vorschlag

| Tab | Inhalt |
|---|---|
| **Zahlen** | Brüche, Prozent, Potenzen, Wurzeln, Logarithmus, Zehnerpotenzen & Größenordnungen |
| **Terme** | Klammern, Binome, Faktorisieren, Bruchterme, **Formeln umstellen** |
| **Gleichungen** | linear, quadratisch (pq & abc), Systeme, Ungleichungen |
| **Funktionen** | linear, quadratisch, exponentiell, trigonometrisch → Ableitung, Integral |
| **Geometrie** | Pythagoras, Trigonometrie, Flächen/Körper, Vektoren |
| **Zufall** | Laplace, Baumdiagramm, Kombinatorik, Binomialverteilung, Erwartungswert |

Dazu der **Lückenfinder** als eigener, prominenter Einstieg — vermutlich als
Tab ganz links. Das wären sieben; auf einem Handy ist das eng, aber machbar
(Chemie hat sechs). Alternative: Lückenfinder als Startbildschirm vor den
Tabs.

### Physik-Mathematik: kein eigener Tab

Die Physik-Anwendungen gehören **nicht** in einen eigenen Bereich, sondern
sind das durchgehende Beispielmaterial — genau das `beispiel`-Feld aus
`wissen.js`:

- `v = s/t` nach `t` umstellen → bei „Formeln umstellen"
- Kräftezerlegung an der schiefen Ebene → bei Trigonometrie
- Halbwertszeit → bei Exponentialfunktionen
- Dezibel und pH → beim Logarithmus (schöne Brücke zur Chemie-App)
- Lichtjahre, Atomdurchmesser → bei Zehnerpotenzen
- Weg-Zeit-Diagramm → bei linearen Funktionen, Steigung = Geschwindigkeit
- Beschleunigung als Ableitung der Geschwindigkeit → bei Ableitung

So lernt man nicht „Mathe für Physik" separat, sondern sieht bei jedem
Werkzeug sofort, wofür es gut ist.

---

## 2. Was aus dem Chemie-Projekt übernommen wird

Quelle: `~/Documents/GitHub/Chemie`

### 2a) Unverändert kopieren

| Datei | Warum |
|---|---|
| `components/InfoButton.js` | Das Info-Knopf-Konzept, 269 Zeilen, fertig und erprobt. Öffnet ein Modal, folgt `mehr`-Links im selben Fenster. |
| `components/FeldLabel.js` | Beschriftung + Info-Knopf über einem Eingabefeld. |
| `components/ScreenGeruest.js` | Gemeinsamer Rahmen: Überschrift, Scroll, Tastatur-Ausweichen. |
| `tests/pruefer.mjs` | Der eigene Mini-Prüfrahmen, ~130 Zeilen, keine Abhängigkeiten. Exportiert `pruefung`, `wahr`, `zahl`, `gleich`, `wirft`. |
| `.github/workflows/tests.yml` | Prüfungen bei jedem Push, Node 22. |
| `.github/workflows/eas-build.yml` | Manuell auslösbarer Build, braucht `EXPO_TOKEN` als Repo-Secret. |
| `.gitignore` | Enthält die wichtigen Einträge: `build-*.aab`, `credentials.json`, `credentials/`, `.claude/settings.local.json`. |
| `eas.json` | Unverändert übernehmbar (siehe unten, `appVersionSource: "remote"`). |
| `.claude/settings.json` | Aktiviert das Expo-Plugin. |

```bash
C=~/Documents/GitHub/Chemie
M=~/Documents/GitHub/Mathematik

cp "$C"/components/{InfoButton,FeldLabel,ScreenGeruest}.js "$M"/components/
cp "$C"/tests/pruefer.mjs                                   "$M"/tests/
cp "$C"/.github/workflows/{tests,eas-build}.yml             "$M"/.github/workflows/
cp "$C"/.gitignore "$C"/eas.json                            "$M"/
cp "$C"/.claude/settings.json                               "$M"/.claude/
```

### 2b) Als Vorlage lesen, Inhalt neu schreiben

| Datei | Was daran wiederverwendbar ist |
|---|---|
| `App.js` | Die handgebaute Tab-Leiste. Nur das `TABS`-Array austauschen. Keine Navigations-Bibliothek — bewusst. |
| `utils/konstanten.js` | Aufbau (Konstanten + `farben`-Objekt). **Neue Leitfarbe wählen:** finanz-kids = Blau, Chemie = Grün (`#1a7f5a`). Für Mathe böte sich ein Violett/Indigo an. Die Farbe taucht auch in `app.json` als `adaptiveIcon.backgroundColor` auf. |
| `utils/wissen.js` | **Das wichtigste Vorbild.** Struktur eines Eintrags: `titel`, `text` (Array von Absätzen), optional `formel`, `beispiel`, `mehr` (IDs verwandter Themen → werden zu Links). Aufbau und Tonfall der Texte übernehmen, Inhalt komplett neu. |
| `package.json` | Die `scripts` unverändert übernehmen, besonders `test` und `build:android` (siehe Teil 4). Ebenso `"engines": { "node": ">=22.7" }`. |
| `tests/alle.mjs` | Der Sammel-Einstiegspunkt. Reihenfolge folgt der Abhängigkeit: Grundlagen zuerst, damit Folgefehler zuzuordnen sind. |
| `docs/datenschutz.html` | Text anpassen (App-Name), Aufbau behalten. Wird über GitHub Pages ausgeliefert und vom Play Store verlangt. |
| `docs/play-store-listing.md` | Vorlage für Titel, Kurz- und Langbeschreibung. |

### 2c) Fachlich besonders wertvoll: `utils/gleichung.js`

Diese Datei rechnet lineare Gleichungssysteme **exakt in Brüchen** (für den
Ausgleich chemischer Gleichungen). Enthalten sind:

- `ggT(a, b)` und `kgV(a, b)`
- `bruch(zaehler, nenner)` — immer gekürzt, Nenner immer positiv
- `minus`, `mal`, `geteilt`, `istNull` als Bruch-Operationen
- `loeseNullraum(matrix, spalten)` — Gauß-Elimination über Brüchen

Für die Mathe-App ist das **die Grundlage jeder Termumformung**, die nicht
in Rundungsfehlern enden soll. Im Chemie-Projekt liegen diese Funktionen
privat innerhalb von `gleichung.js`; hier gehören sie in ein eigenes,
exportiertes `utils/bruch.js` mit eigener Prüfdatei — und werden dann von
Termen, Gleichungen und Wahrscheinlichkeiten gleichermaßen genutzt.

`~/Documents/GitHub/Chemie/utils/gleichung.js`, Zeilen 24–53 und 157–230.

### 2d) Auf keinen Fall übernehmen

| Was | Warum |
|---|---|
| `extra.eas.projectId` aus `app.json` | Zeigt auf das Chemie-Projekt bei expo.dev. Wird beim ersten `eas build` **neu** eingetragen. Kopieren würde Builds in die falsche App schieben. |
| `slug`, `name`, `package`, `bundleIdentifier` | Müssen neu und eindeutig sein. |
| `assets/*` (Icons) | Chemie-Branding. Neue Icons nötig. |
| Alle fachlichen `utils/*.js` und `screens/*.js` | Chemie-Inhalt. |
| `build-*.aab` | Build-Artefakt. |
| `LICENSE` | Existiert in Chemie bewusst nicht — siehe Teil 5. |

**`owner: "heilpraktikerdk"`** dagegen bleibt: derselbe Expo-Account.

---

## 3. Einrichtung Schritt für Schritt

### Schritt 1 — Expo-SDK-Version klären

Chemie läuft auf **SDK 57**. Zum Zeitpunkt dieser Übergabe ist zu prüfen,
was aktuell ist:

```bash
npx create-expo-app@latest --help     # oder
npm view expo version
```

Danach in `AGENTS.md` die Doku-URL auf die tatsächliche Version setzen
(`https://docs.expo.dev/versions/vXX.0.0/`). Bei einem neueren SDK gilt
dieselbe Falle wie bei Chemie: **Expo Go aus dem Play Store hinkt hinterher.**
Lehnt es das Projekt mit „Project is incompatible with this version of Expo
Go" ab, Store-Version deinstallieren und die passende APK von
`expo.dev/go?platform=android&device=true&sdkVersion=XX` installieren.

### Schritt 2 — Projekt anlegen

```bash
cd ~/Documents/GitHub
npx create-expo-app@latest Mathematik --template blank
```

Der Ordner ist bereits vorhanden und enthält nur diese Datei — ggf. muss
`create-expo-app` in einem Unterordner laufen und der Inhalt hochgezogen
werden, oder diese Datei kurz beiseitegelegt werden.

**Sofort danach: `LICENSE` löschen**, falls das Scaffolding eine anlegt.
Begründung in Teil 5.

### Schritt 3 — Abhängigkeiten

Chemie braucht über das Grundgerüst hinaus nur:

```bash
npx expo install react-native-safe-area-context react-native-svg
```

`react-native-svg` wird für Diagramme gebraucht (in Chemie: Titrationskurve,
Strukturformeln — hier: Funktionsgraphen, Dreiecke, Baumdiagramme). Bei
Versionswarnungen später: `npx expo install --fix`.

### Schritt 4 — `package.json` ergänzen

```json
{
  "scripts": {
    "test": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/alle.mjs",
    "build:android": "npm test && eas build --local --platform android --profile production",
    "build:ios": "npm test && eas build --local --platform ios --profile production"
  },
  "engines": {
    "node": ">=22.7"
  }
}
```

Das `&&` im Build-Skript ist die eigentliche Klemme vor dem Play Store:
Schlägt `npm test` fehl, wird `eas build` gar nicht erst aufgerufen. Weil
lokal gebaut wird, könnte ein GitHub-Actions-Lauf einen Build nicht
aufhalten — dieser eine Operator schon.

### Schritt 5 — `app.json`

Als Vorlage die Chemie-Fassung, mit diesen Änderungen:

```json
{
  "expo": {
    "name": "<Name aus Frage 3>",
    "slug": "mathe",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.hink.mathe",
      "infoPlist": { "ITSAppUsesNonExemptEncryption": false }
    },
    "android": {
      "package": "com.hink.mathe",
      "blockedPermissions": [
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.DUMP",
        "android.permission.VIBRATE"
      ]
    },
    "owner": "heilpraktikerdk"
  }
}
```

Drei Punkte, die aus Chemie teuer gelernt sind:

1. **Kein `versionCode` in `app.json`.** `eas.json` zählt ihn über
   `appVersionSource: "remote"` zentral hoch. Beides zugleich läuft
   auseinander.
2. **`blockedPermissions` von Anfang an.** React Native bringt für sein
   Entwickler-Menü Berechtigungen mit, die sonst im Release-Build landen.
   Besonders `SYSTEM_ALERT_WINDOW` („Über anderen Apps einblenden") zeigt
   der Play Store prominent an — für eine Schul-App heikel. `INTERNET`
   bleibt bewusst drin: wird nicht genutzt, stört niemanden, aber ohne sie
   wäre ein späteres OTA-Update über `expo-updates` unmöglich.
3. **`package` ist endgültig.** Nach der ersten Play-Store-Veröffentlichung
   nie wieder änderbar.

### Schritt 6 — Grundgerüst bauen

```
App.js                  Tab-Leiste + Auswahl des aktiven Screens
screens/                Ein Screen pro Themengebiet (= ein Tab)
components/             Wiederverwendbare UI-Bausteine
utils/                  Fachlogik und Daten, komplett ohne UI
tests/                  Prüfungen, laufen mit blankem node
docs/                   Play-Store-Material + Datenschutzerklärung
```

Reihenfolge, die sich in Chemie bewährt hat: **erst `utils/` mit Prüfung,
dann der Screen.** Die Fachlogik ist ohne UI schneller richtig zu bekommen,
und der Screen wird kurz, wenn er nur noch darstellen muss.

Konkret für den Anfang:

1. `utils/bruch.js` + `tests/bruch.mjs` — exakte Bruchrechnung (aus
   `gleichung.js` extrahieren und erweitern)
2. `utils/term.js` + `tests/term.mjs` — Termdarstellung und Umformungen mit
   benannten Schritten
3. `utils/lernpfad.js` + `tests/lernpfad.mjs` — der Themengraph mit
   Voraussetzungen; Prüfung: keine Zyklen, jedes Thema erreichbar
4. `utils/wissen.js` + `tests/wissen.mjs` — Prüfung: kein Info-Knopf zeigt
   ins Leere, kein `mehr`-Link geht auf eine unbekannte ID

### Schritt 7 — Veröffentlichung (erst am Ende)

```bash
npm run build:android
```

Beim ersten Lauf verknüpft EAS das Projekt mit expo.dev und trägt
`extra.eas.projectId` selbst in `app.json` ein. Keystore und Versionszähler
liegen dann dort.

**Nach jeder Änderung an den Berechtigungen prüfen, was wirklich im AAB steht:**

```bash
python3 -c "import zipfile,re;d=zipfile.ZipFile('build-XXXX.aab').read('base/manifest/AndroidManifest.xml');print(sorted(set(x.decode() for x in re.findall(rb'android\.permission\.[A-Z_]+',d))))"
```

GitHub Pages für die Datenschutzerklärung: Repo-Settings → Pages → Branch
`main`, Ordner `/docs`. Die URL wird im Play-Store-Listing verlangt.

---

## 4. Die Prüfungen — das Herzstück

In Chemie: **4332 Prüfungen**, Laufzeit zwei Sekunden, keine
Testbibliothek. Das funktioniert nur unter zwei technischen Bedingungen —
beide bitte übernehmen und nicht „aufräumen":

1. **Node ≥ 22.7.** Ab dieser Version erkennt Node die Modul-Syntax von
   `.js`-Dateien selbst. Darauf stützen sich die Prüfungen: Sie importieren
   `utils/*.js` unmittelbar — kein Transpiler, keine Testbibliothek, und
   `package.json` muss nicht auf `"type": "module"` umgestellt werden (das
   könnte Metro stören). In `engines` vermerkt, im Actions-Workflow gepinnt.

2. **Interne Importe in `utils/` tragen die Endung `.js`**
   (`from './bruch.js'`, nicht `from './bruch'`). Metro käme auch ohne
   zurecht, Node nicht. In `screens/` und `components/` ist die Endung nicht
   nötig, weil diese Dateien nur durch Metro gehen.

### Was die Prüfungen ablehnen müssen

Aus Chemie mitzunehmen ist vor allem diese Haltung: Genauso wichtig wie das,
was die Prüfungen bestätigen, ist das, was sie **ablehnen** — erfundene
Elemente, unbalancierbare Gleichungen, Ketone mit zwei Kohlenstoffatomen.
Stillschweigend etwas Falsches zu liefern ist gefährlicher, als sich zu
weigern.

Für Mathe heißt das zum Beispiel: Division durch null, Wurzel aus negativer
Zahl im Reellen, `log` von null, eine quadratische Gleichung ohne reelle
Lösung, ein Dreieck mit Winkelsumme ≠ 180°, eine Wahrscheinlichkeit > 1.
Jedes davon muss einen Fehler werfen oder ausdrücklich „gibt es nicht"
sagen — nie eine Zahl raten.

### Die eine Prüfung, die alles trägt

Für das Termumform-System gibt es einen Test, der fast alles abdeckt:

> **Jede Umformung muss den Term wertgleich lassen.** Also: Term vor und
> nach dem Schritt an 200 zufälligen Stellen numerisch auswerten und
> vergleichen (mit Toleranz, und Definitionslücken übersprungen). Schlägt
> das fehl, ist die Umformungsregel falsch — egal wie plausibel sie aussah.

**Eine Änderung an `utils/` ohne bestandene Prüfung gehört nicht ins Repo.
Neue Fachlogik bekommt eine neue Prüfung mit.**

### Bewusst kein `eas-build-pre-install`-Hook

Naheliegend wäre, `npm test` zusätzlich in den EAS-Lifecycle-Hook zu hängen,
damit die Prüfung auch bei einem direkt eingetippten `eas build` greift. In
Chemie ist das **nicht** eingerichtet: Die EAS-Build-Umgebung bringt
möglicherweise eine ältere Node-Version mit, und dann schlüge der Hook fehl,
obwohl der Code in Ordnung ist — ein blockierter Release wegen eines
Umgebungsdetails.

---

## 5. Konventionen, die mitkommen

### In `utils/` steht kein React

Die Fachlogik ist reines JavaScript und dadurch einzeln nachvollziehbar und
testbar. Die Screens rufen sie nur auf und stellen das Ergebnis dar. Diese
eine Regel ist der Grund, warum die Prüfungen ohne jede Bibliothek laufen.

### Das Info-Button-Konzept

Neben jedem Fachbegriff sitzt ein kleiner runder `i`-Knopf
(`components/InfoButton.js`), der eine Erklärung als Modal öffnet. Alle
Texte stehen zentral in `utils/wissen.js`, nicht in den Screens.

**Wo der Knopf sitzt:** überall dort, wo ein Fachbegriff sichtbar wird — an
Überschriften, Legenden, Spaltenköpfen, Achsenbeschriftungen, nicht nur an
Eingabefeldern. `InfoButton` ist von `FeldLabel` unabhängig.

> Faustregel: **Steht ein Wort auf dem Bildschirm, das man im Unterricht
> gelernt haben müsste, gehört ein `i` daneben.** Lieber einer zu viel als
> einer zu wenig — ein ungenutzter Knopf kostet nichts, ein fehlender
> kostet den Anschluss.

**Wie die Texte geschrieben sind:**

1. **Erster Absatz: die Antwort in Alltagssprache** — ohne Voraussetzungen,
   ohne Formel, ohne weiteren Fachbegriff. Wer nur diesen Absatz liest, muss
   die Frage beantwortet haben.
2. **Danach die Tiefe:** das Warum, der Zusammenhang, die Formel.
3. **`beispiel`:** eine konkrete Zahl. Abstraktes bleibt abstrakt, bis man
   es einmal an echten Werten gesehen hat.
4. **`mehr`:** die Begriffe, über die man in diesem Text stolpern könnte —
   und die Grundlagen eine Ebene tiefer. So wird aus einem Stolperer ein
   Pfad nach unten statt einer Sackgasse.

Erscheint im Text ein Fachbegriff, der nicht im ersten Absatz erklärt und
nicht unter `mehr` verlinkt ist, ist der Eintrag unfertig.

Bei Mathe ist Punkt 4 noch wichtiger als bei Chemie: Die `mehr`-Links sind
faktisch schon der Lernpfad-Graph. Es lohnt zu prüfen, ob `wissen.js` und
`lernpfad.js` dieselbe Datenquelle sein sollten.

### Fachliche Leitlinien

- **Korrektheit vor Vereinfachung.** Wo eine Näherung üblich ist, zusätzlich
  exakt rechnen und den Unterschied zeigen — genau daran versteht man die
  Voraussetzung der Näherung.
- **Einheiten immer mitführen** und im Ergebnis anzeigen (bei den
  Physik-Beispielen zentral).
- **Ans deutsche Curriculum halten:** Bezeichnungen, Symbole und
  Schreibweisen wie in der Oberstufe und im Abitur.
- **Erklären, nicht nur ausgeben:** Zwischenschritte sichtbar machen, damit
  man die Rechnung nachvollziehen und selbst wiederholen kann.
- Konstanten stehen einmal zentral in `utils/konstanten.js`.

### Keine Lizenzdatei

Das Chemie-Repository hat bewusst **keine** `LICENSE`. Damit gilt das
normale Urheberrecht: Der Code ist einsehbar, darf aber nicht ohne
Zustimmung weiterverwendet werden — passend für eine App, die
veröffentlicht wird.

Die von `create-expo-app` mitgelieferte MIT-Lizenz (© 650 Industries, Inc. —
die Firma hinter Expo) muss entfernt werden: Sie wiese fälschlich Expo als
Rechteinhaber aus und erlaubte jedem, die App zu kopieren und zu verkaufen.

### Bekannte Stolperfallen

- `SafeAreaView` muss aus `react-native-safe-area-context` kommen, **nicht**
  aus `react-native` — die eingebaute Variante ist auf Android wirkungslos
  und seit RN 0.86 abgekündigt. Seit SDK 55 zeichnet Android verpflichtend
  edge-to-edge; ohne echte Insets rutscht die Tab-Leiste unter die
  Gestenleiste.
- Tunnel-Modus (`--tunnel`) der Expo-CLI kann fehlerhaft sein, im Zweifel
  ohne starten.
- Handy nicht gleichzeitig als Hotspot **und** Testgerät nutzen.
- Bei Versionswarnungen: `npx expo install --fix`.

### Workflow

- Code per Prompt in Claude Code, nicht von Hand getippt
- Live-Test über Expo Go auf dem eigenen Handy (QR-Code), nicht über
  Simulator
- Commits/Push über GitHub Desktop
- Xcode nur für den finalen iOS-Build

---

## 6. Erste Schritte in diesem Ordner

1. Fragen 1–3 aus Teil 0 beantworten
2. `git init`, GitHub-Repo anlegen (Name analog: `Mathe-begreifen` o. ä.)
3. `AGENTS.md` anlegen — Inhalt aus Chemie, SDK-Version prüfen und anpassen
4. `CLAUDE.md` anlegen — Teil 1 und Teil 5 dieses Dokuments als Grundlage
5. Projekt nach Teil 3 aufsetzen
6. `utils/bruch.js` mit Prüfung als erste echte Datei
7. Diese Datei löschen, wenn `CLAUDE.md` steht

Die Chemie-App ist seit dem 1. August 2026 live im Play Store. Was dort
funktioniert hat, steht oben; was dort weh getan hat, steht auch oben.
