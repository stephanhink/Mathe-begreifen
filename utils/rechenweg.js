// Einen selbst gerechneten Rechenweg prüfen — Zeile für Zeile.
//
// Das ist die Umkehrung von term.js und gleichung.js: Dort rechnet die
// App vor, hier rechnet der Mensch und die App sieht zu. Geprüft wird
// dasselbe wie in tests/:
//
//   Bei Termen      muss jede Zeile denselben WERT haben wie die vorige.
//   Bei Gleichungen muss jede Zeile dieselbe LÖSUNGSMENGE haben.
//
// Der Nutzen liegt nicht im Urteil "falsch", sondern in der Stelle: Wer
// in Zeile 3 einen Vorzeichenfehler macht, rechnet danach sauber weiter
// und findet ihn allein fast nie. Eine App, die sagt "ab Zeile 3 stimmt
// es nicht mehr, denn bei x = 2 steht links 15 und rechts 12", spart
// eine halbe Stunde Suchen.
//
// ---------------------------------------------------------------------
// Was diese Prüfung kann und was nicht
// ---------------------------------------------------------------------
//
// Sie setzt an Stichproben an, nicht an einem Beweis: Zwei Terme werden
// an festen Stellen verglichen. Stimmen sie dort überein, gelten sie
// als gleich. Ein Gegenbeispiel ist damit sicher, eine Übereinstimmung
// nur sehr wahrscheinlich.
//
// Für den Zweck reicht das bei Weitem: Ein echter Rechenfehler
// verschiebt den Wert an fast jeder Stelle. Was die Prüfung NICHT
// leisten kann, ist der umgekehrte Nachweis — sie kann nicht bestätigen,
// dass eine Umformung für alle Zahlen gilt. Deshalb sagt sie das auch
// nirgends.

import { bruch, gleich as bruchGleich, alsText as bruchAlsText } from './bruch.js';
import {
  variablen,
  auswerteExakt,
  auswerte,
  alsText as termAlsText,
  vereinfache,
} from './term.js';
import { istGleichung, alsText as gleichungAlsText, loese } from './gleichung.js';
import { parseEingabe } from './parser.js';

// Die Stellen, an denen verglichen wird. Bewusst fest und nicht
// gewürfelt: Bei derselben Eingabe soll immer dieselbe Meldung
// erscheinen — sonst zeigt die App beim zweiten Hinsehen eine andere
// Zahl, und niemand traut ihr mehr.
//
// Krumme Werte sind Absicht. Bei x = 0, 1 und 2 gehen erstaunlich viele
// Fehler durch: 2x und x² stimmen dort in zwei von drei Fällen überein.
const STELLEN = [
  bruch(2),
  bruch(-3),
  bruch(1, 2),
  bruch(-5, 3),
  bruch(7),
  bruch(0),
  bruch(1),
  bruch(-1),
  bruch(10, 3),
  bruch(-7, 2),
];

// ---------------------------------------------------------------------
// Zwei Terme vergleichen
// ---------------------------------------------------------------------

// Gibt null zurück, wenn die beiden übereinstimmen — sonst die Stelle,
// an der sie es nicht tun, samt beiden Werten.
export function findeAbweichung(a, b) {
  const namen = [...new Set([...variablen(a), ...variablen(b)])];

  if (namen.length > 1) {
    return { grund: 'Mit mehreren Variablen kann ich das nicht vergleichen.' };
  }

  let verglichen = 0;

  for (const stelle of STELLEN) {
    const belegung = namen.length === 0 ? {} : { [namen[0]]: stelle };
    const werte = beideWerte(a, b, belegung);

    if (werte === null) {
      continue;
    }
    verglichen++;

    if (!werte.gleich) {
      return {
        stelle: namen.length === 0 ? null : stelle,
        name: namen[0] ?? null,
        links: werte.textA,
        rechts: werte.textB,
      };
    }
    if (namen.length === 0) {
      break;
    }
  }

  if (verglichen === 0) {
    return { grund: 'Diese Zeile lässt sich nirgends auswerten.' };
  }
  return null;
}

// Beide Terme an einer Stelle auswerten. null heißt "hier geht es
// nicht" (Definitionslücke auf einer der beiden Seiten).
function beideWerte(a, b, belegung) {
  // Eine Kommazahl in der Belegung heißt: Die Stelle selbst ist schon
  // gerundet (eine irrationale Lösung). Dann hat der exakte Weg keinen
  // Sinn mehr.
  const exaktMoeglich = Object.values(belegung).every((w) => typeof w === 'object');

  if (exaktMoeglich) {
    try {
      const wa = auswerteExakt(a, belegung);
      const wb = auswerteExakt(b, belegung);
      return {
        gleich: bruchGleich(wa, wb),
        textA: bruchAlsText(wa),
        textB: bruchAlsText(wb),
      };
    } catch (fehler) {
      if (!fehler.irrational) {
        return null;
      }
    }
  }

  // Sobald eine Wurzel im Spiel ist, gibt es keinen Bruch mehr — dann
  // numerisch, mit Toleranz.
  try {
    const wa = auswerte(a, belegung);
    const wb = auswerte(b, belegung);
    const schranke = 1e-9 * Math.max(1, Math.abs(wa), Math.abs(wb));
    return {
      gleich: Math.abs(wa - wb) <= schranke,
      textA: gerundet(wa),
      textB: gerundet(wb),
    };
  } catch {
    return null;
  }
}

function gerundet(wert) {
  return String(Math.round(wert * 1e6) / 1e6);
}

// ---------------------------------------------------------------------
// Zwei Gleichungen vergleichen
// ---------------------------------------------------------------------

// Bei Gleichungen zählt nicht der Wert, sondern die Lösungsmenge. Eine
// Zeile ist genau dann noch richtig, wenn an jeder Stelle dieselbe
// Antwort auf die Frage "ist sie hier erfüllt?" herauskommt.
//
// Das fängt den klassischen Fehler: mit etwas multiplizieren, das null
// sein kann. Jede einzelne Zeile sieht dann richtig aus, und trotzdem
// steht am Ende eine Lösung da, die keine ist.
export function findeAbweichungGleichung(a, b) {
  const namen = [
    ...new Set([
      ...variablen(a.links),
      ...variablen(a.rechts),
      ...variablen(b.links),
      ...variablen(b.rechts),
    ]),
  ];

  if (namen.length > 1) {
    return { grund: 'Mit mehreren Variablen kann ich das nicht vergleichen.' };
  }

  for (const kandidat of kandidatenStellen(a, b, namen[0])) {
    const belegung = namen.length === 0 ? {} : { [namen[0]]: kandidat.wert };
    const erfuelltA = erfuellt(a, belegung);
    const erfuelltB = erfuellt(b, belegung);

    if (erfuelltA === null || erfuelltB === null) {
      continue;
    }
    if (erfuelltA !== erfuelltB) {
      return {
        stelle: namen.length === 0 ? null : kandidat.wert,
        name: namen[0] ?? null,
        vorher: erfuelltA,
        nachher: erfuelltB,
      };
    }
    if (namen.length === 0) {
      break;
    }
  }
  return null;
}

// An welchen Stellen wird verglichen?
//
// Die festen Stellen allein reichen bei Gleichungen NICHT — und das war
// beim Bauen der erste Fehlschlag: Zwei Gleichungen mit verschiedenen
// Lösungen sind an einer beliebigen Stelle fast immer beide UNerfüllt.
// Die Stichprobe sähe überall dasselbe und meldete nichts.
//
// Entscheidend sind deshalb die Lösungen selbst. Wer aus "3x = 9" ein
// "3x = 5" macht, ändert nichts an dem, was bei x = 7 passiert — aber
// alles an dem, was bei x = 3 passiert. Also wird genau dort geprüft.
function kandidatenStellen(a, b, name) {
  const stellen = STELLEN.map((wert) => ({ wert }));
  if (!name) {
    return stellen;
  }

  const ausLoesungen = [];
  for (const g of [a, b]) {
    let ergebnis;
    try {
      ergebnis = loese(g);
    } catch {
      continue; // Nicht lösbar — dann eben nur die festen Stellen.
    }
    for (const l of ergebnis.loesungen ?? []) {
      try {
        ausLoesungen.push({ wert: auswerteExakt(l) });
      } catch (fehler) {
        // Irrational, etwa √2. Als Kommazahl taugt sie trotzdem als
        // Prüfstelle — verglichen wird dann numerisch mit Toleranz.
        if (fehler.irrational) {
          try {
            ausLoesungen.push({ wert: auswerte(l) });
          } catch {
            /* dann eben nicht */
          }
        }
      }
    }
  }

  // Die Lösungen zuerst: Dort entscheidet es sich, und dort wird die
  // Meldung am verständlichsten.
  return [...ausLoesungen, ...stellen];
}

function erfuellt(g, belegung) {
  const werte = beideWerte(g.links, g.rechts, belegung);
  return werte === null ? null : werte.gleich;
}

// ---------------------------------------------------------------------
// Einen ganzen Rechenweg prüfen
// ---------------------------------------------------------------------

// `zeilen` sind die getippten Zeilen, `start` ist optional der Term oder
// die Gleichung, mit dem alles anfängt (die Aufgabe). Ist er gesetzt,
// wird auch die erste getippte Zeile gegen ihn geprüft — sonst könnte
// man mit einer falschen Zeile beginnen und danach sauber weiterrechnen.
export function pruefeRechenweg(zeilen, start = null) {
  const roh = zeilen.map((z) => String(z).trim()).filter((z) => z !== '');

  if (roh.length === 0) {
    return { zeilen: [], ersterFehler: null, leer: true };
  }

  const geprueft = [];
  let vorige = start;
  let vorigeNummer = 0;

  for (let i = 0; i < roh.length; i++) {
    const text = roh[i];
    let gelesen;
    try {
      gelesen = parseEingabe(text);
    } catch (fehler) {
      geprueft.push({ nummer: i + 1, text, ok: false, grund: fehler.message });
      return { zeilen: geprueft, ersterFehler: i };
    }

    // Term und Gleichung dürfen nicht gemischt werden. Wer mittendrin
    // ein Gleichheitszeichen weglässt, hat sonst plötzlich einen Term,
    // der zufällig zur Lösung passt.
    if (vorige !== null && istGleichung(vorige) !== istGleichung(gelesen)) {
      geprueft.push({
        nummer: i + 1,
        text,
        ok: false,
        grund: istGleichung(vorige)
          ? 'Hier fehlt das Gleichheitszeichen — die Zeile darüber war eine Gleichung.'
          : 'Hier steht plötzlich ein Gleichheitszeichen, darüber war es ein Term.',
      });
      return { zeilen: geprueft, ersterFehler: i };
    }

    if (vorige === null) {
      geprueft.push({ nummer: i + 1, text, ok: true, term: gelesen });
      vorige = gelesen;
      vorigeNummer = i + 1;
      continue;
    }

    const abweichung = istGleichung(gelesen)
      ? findeAbweichungGleichung(vorige, gelesen)
      : findeAbweichung(vorige, gelesen);

    if (abweichung !== null) {
      geprueft.push({
        nummer: i + 1,
        text,
        ok: false,
        term: gelesen,
        grund: abweichungsText(abweichung, vorigeNummer, istGleichung(gelesen)),
        abweichung,
      });
      return { zeilen: geprueft, ersterFehler: i };
    }

    geprueft.push({ nummer: i + 1, text, ok: true, term: gelesen });
    vorige = gelesen;
    vorigeNummer = i + 1;
  }

  return { zeilen: geprueft, ersterFehler: null, ergebnis: vorige };
}

function abweichungsText(abweichung, vorigeNummer, alsGleichung) {
  if (abweichung.grund) {
    return abweichung.grund;
  }

  const wo =
    abweichung.stelle === null
      ? ''
      : ` bei ${abweichung.name} = ${bruchAlsText(abweichung.stelle)}`;
  const davor = vorigeNummer === 0 ? 'die Aufgabe' : `Zeile ${vorigeNummer}`;

  if (alsGleichung) {
    return (
      `Hier ändert sich die Lösungsmenge:${wo} ist ${davor} ` +
      `${abweichung.vorher ? 'erfüllt' : 'nicht erfüllt'}, diese Zeile ` +
      `${abweichung.nachher ? 'aber schon' : 'aber nicht'}.`
    );
  }

  return (
    `Hier ändert sich der Wert:${wo} ergibt ${davor} ${abweichung.links}, ` +
    `diese Zeile ${abweichung.rechts}.`
  );
}

// Steht am Ende wirklich ein Ergebnis? Bei einer Gleichung heißt das:
// die Variable allein auf einer Seite. Bei einem Term: nichts mehr zu
// vereinfachen.
export function istFertig(wert) {
  if (istGleichung(wert)) {
    return wert.links.art === 'variable' && variablen(wert.rechts).length === 0;
  }
  return vereinfache(wert).schritte.length === 0;
}

// Der Rechenweg als Text, für Meldungen und Prüfungen.
export function alsText(wert) {
  return istGleichung(wert) ? gleichungAlsText(wert) : termAlsText(wert);
}
