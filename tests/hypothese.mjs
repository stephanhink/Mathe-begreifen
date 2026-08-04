// Prüfungen für den Hypothesentest.
//
// Die tragende Aussage ist die, die den Test überhaupt definiert:
//
//   Die Wahrscheinlichkeit, H₀ zu verwerfen, obwohl sie stimmt, ist
//   HÖCHSTENS α — und der Ablehnungsbereich ist der größte, für den das
//   noch gilt.
//
// Beide Hälften werden geprüft, und die zweite ist die schwierigere:
// Ein Test, der einfach nie verwirft, hielte die erste Bedingung mühelos
// ein und wäre trotzdem wertlos. Deshalb wird zusätzlich verlangt, dass
// EIN k MEHR das Niveau überschreiten würde.
//
// Dazu die Kontrolle, die die numerische Rechnung rechtfertigt: Für
// kleine n wird gegen die EXAKTE Binomialverteilung aus zufall.js
// verglichen. Dort geht beides, und wenn die Näherung dort stimmt, darf
// man ihr auch bei n = 100 glauben — wo exakt gar nichts mehr geht,
// weil "100 über 50" die Bruchrechnung um dreizehn Größenordnungen
// sprengt.

import { pruefung, wahr, gleich as gleichText, wirft } from './pruefer.mjs';
import { wuerfel, startwertFuer } from './wuerfel.mjs';
import { bruch, alsZahl } from '../utils/bruch.js';
import { binomialVerteilung } from '../utils/zufall.js';
import {
  verteilung,
  kumuliert,
  test,
  entscheide,
  imAblehnungsbereich,
  fehlerZweiterArt,
  alsRechenweg,
  prozent,
  ARTEN,
} from '../utils/hypothese.js';

const ARTENLISTE = Object.keys(ARTEN);

// ---------------------------------------------------------------------

pruefung('Die Verteilung summiert sich zu 1', () => {
  // Dieselbe Probe wie in zufall.js: Irgendeine Trefferzahl kommt
  // heraus. Sie prüft die ganze Rekursion auf einen Schlag.
  for (const n of [1, 5, 20, 100, 500, 1000]) {
    for (const p of [0.01, 0.2, 0.5, 0.75, 0.999]) {
      const summe = verteilung(n, p).reduce((s, w) => s + w, 0);
      wahr(`n = ${n}, p = ${p}: Summe ist 1`, Math.abs(summe - 1) < 1e-9, String(summe));
    }
  }

  // Die Randfälle: p = 0 und p = 1 sind keine Verteilung mit Streuung,
  // sondern Gewissheit.
  gleichText('p = 0 trifft nie', verteilung(10, 0)[0], 1);
  gleichText('p = 1 trifft immer', verteilung(10, 1)[10], 1);
});

pruefung('Die numerische Rechnung stimmt mit der exakten überein', () => {
  // Der Grund, warum man der Näherung bei n = 100 trauen darf: Wo
  // beides geht, kommt dasselbe heraus.
  let groesserAbstand = 0;
  for (const n of [1, 3, 8, 15, 20]) {
    // zufall.js rechnet exakt und nimmt deshalb einen BRUCH, keine
    // Kommazahl — eine Kommazahl wäre dort schon der erste Fehler.
    for (const [zaehler, nenner] of [[1, 4], [1, 2], [3, 4]]) {
      const p = zaehler / nenner;
      const genau = binomialVerteilung(n, bruch(zaehler, nenner)).map((eintrag) =>
        alsZahl(eintrag.wahrscheinlichkeit)
      );
      const numerisch = verteilung(n, p);
      for (let k = 0; k <= n; k++) {
        groesserAbstand = Math.max(groesserAbstand, Math.abs(genau[k] - numerisch[k]));
      }
    }
  }
  wahr(
    'der größte Abstand ist winzig',
    groesserAbstand < 1e-12,
    `größter Abstand ${groesserAbstand}`
  );
});

pruefung('Das Schulbuchbeispiel', () => {
  // n = 100, p₀ = 0,5, einseitig, α = 5 %: Ablehnung ab k = 59, und
  // das tatsächliche Niveau liegt bei etwa 4,4 % — nicht bei 5 %.
  const t = test({ n: 100, p0: 0.5, art: 'rechtsseitig', alpha: 0.05 });
  gleichText('Ablehnungsbereich', t.beschreibung, '59 ≤ k ≤ 100');
  wahr('Niveau unter 5 %', t.niveau < 0.05);
  wahr('aber nicht viel darunter', t.niveau > 0.04, String(t.niveau));

  wahr('58 verwirft nicht', !imAblehnungsbereich(t, 58));
  wahr('59 verwirft', imAblehnungsbereich(t, 59));

  // Zweiseitig bei n = 10: {0,1} und {9,10}, Niveau 2,15 %.
  const zwei = test({ n: 10, p0: 0.5, art: 'zweiseitig', alpha: 0.05 });
  gleichText('zweiseitig', zwei.beschreibung, '0 ≤ k ≤ 1  oder  9 ≤ k ≤ 10');
  wahr('Niveau etwa 2,1 %', Math.abs(zwei.niveau - 22 / 1024) < 1e-9, String(zwei.niveau));
});

pruefung('Ein zu kleiner Versuch kann gar nichts zeigen', () => {
  // Bei n = 5 und α = 1 % ist selbst das äußerste Ergebnis noch zu
  // wahrscheinlich. Dann gibt es keinen Ablehnungsbereich — und das ist
  // eine Antwort, keine Panne. Sie zu verschweigen und irgendeinen
  // Bereich zu melden wäre das Schlimmste.
  const t = test({ n: 5, p0: 0.5, art: 'zweiseitig', alpha: 0.01 });
  wahr('der Bereich ist leer', t.leer);
  gleichText('Niveau ist null', t.niveau, 0);

  const weg = alsRechenweg(t).join('\n');
  wahr('und der Weg sagt warum', weg.includes('zu klein'), weg);

  // Egal welche Trefferzahl — verworfen wird nie.
  for (let k = 0; k <= 5; k++) {
    wahr(`k = ${k} verwirft nicht`, !entscheide(t, k).verwirft);
  }
});

pruefung('Der Satz, auf den es ankommt', () => {
  // "H₀ nicht verworfen" heißt NICHT "H₀ ist wahr". Diese App darf das
  // nicht bloß richtig rechnen, sie muss es auch sagen.
  const t = test({ n: 100, p0: 0.5, art: 'rechtsseitig', alpha: 0.05 });

  const behalten = entscheide(t, 50);
  wahr('H₀ wird nicht verworfen', !behalten.verwirft);
  wahr(
    'und der Vorbehalt sagt, dass das kein Beweis ist',
    behalten.vorbehalt.includes('NICHT, dass H₀ stimmt'),
    behalten.vorbehalt
  );
  wahr('mit dem Bild vom Freispruch', behalten.vorbehalt.includes('freispricht'));

  // Auch beim Verwerfen gehört ein Vorbehalt dazu: der Fehler 1. Art.
  const verworfen = entscheide(t, 70);
  wahr('H₀ wird verworfen', verworfen.verwirft);
  wahr(
    'aber auch das kann daneben liegen',
    verworfen.vorbehalt.includes('Fehler 1. Art'),
    verworfen.vorbehalt
  );

  wirft('mehr Treffer als Versuche', () => entscheide(t, 101));
  wirft('negative Trefferzahl', () => entscheide(t, -1));
});

pruefung('Der Fehler 2. Art braucht eine konkrete Annahme', () => {
  const t = test({ n: 100, p0: 0.5, art: 'rechtsseitig', alpha: 0.05 });
  const b = fehlerZweiterArt(t, 0.6);

  wahr('β liegt zwischen 0 und 1', b.beta > 0 && b.beta < 1);
  wahr('β + Güte = 1', Math.abs(b.beta + b.guete - 1) < 1e-12);
  wahr('und der Hinweis nennt die Bedingung', b.hinweis.includes('konkretes p'), b.hinweis);

  // Je weiter das wahre p von p₀ entfernt liegt, desto besser erkennt
  // der Test den Unterschied — die Güte muss steigen.
  const nah = fehlerZweiterArt(t, 0.55);
  const fern = fehlerZweiterArt(t, 0.8);
  wahr('weiter weg wird besser erkannt', fern.guete > nah.guete, `${nah.guete} → ${fern.guete}`);

  // Bei p = p₀ ist der "Fehler 2. Art" gerade die Gegenwahrscheinlichkeit
  // zum Niveau — dort gibt es gar keinen Unterschied zu erkennen.
  const beiP0 = fehlerZweiterArt(t, 0.5);
  wahr('bei p = p₀ ist die Güte das Niveau', Math.abs(beiP0.guete - t.niveau) < 1e-9);
});

pruefung('Was nicht geht, wird abgelehnt', () => {
  wirft('n = 0', () => test({ n: 0, p0: 0.5 }));
  wirft('p über 1', () => test({ n: 10, p0: 1.5 }));
  wirft('negative Wahrscheinlichkeit', () => test({ n: 10, p0: -0.1 }));
  wirft('α = 0', () => test({ n: 10, p0: 0.5, alpha: 0 }));
  wirft('α = 1', () => test({ n: 10, p0: 0.5, alpha: 1 }));
  wirft('unbekannte Testart', () => test({ n: 10, p0: 0.5, art: 'schräg' }));
});

// ---------------------------------------------------------------------
// Die tragende Prüfung
// ---------------------------------------------------------------------

pruefung('Der Fehler 1. Art bleibt unter α — und der Bereich ist maximal', () => {
  // Beide Hälften. Die erste allein wäre wertlos: Ein Test, der nie
  // verwirft, hielte sie mühelos ein. Deshalb wird zusätzlich verlangt,
  // dass ein k MEHR das Niveau überschreiten würde.
  const naechste = wuerfel(startwertFuer('hypothese-niveau'));
  let geprueft = 0;
  let fehler = null;

  for (let i = 0; i < 240 && fehler === null; i++) {
    const n = naechste(120) + 5;
    const p0 = (naechste(89) + 5) / 100;
    const alpha = [0.01, 0.02, 0.05, 0.1][naechste(4)];
    const art = ARTENLISTE[naechste(ARTENLISTE.length)];

    const t = test({ n, p0, art, alpha });
    const v = t.verteilung;
    geprueft++;

    // 1. Das tatsächliche Niveau überschreitet α nicht.
    if (t.niveau > alpha + 1e-12) {
      fehler = `n = ${n}, p₀ = ${p0}, ${art}, α = ${alpha}: Niveau ${t.niveau} > α`;
      break;
    }

    if (t.leer) {
      // Leer ist nur dann richtig, wenn schon das ÄUSSERSTE Ergebnis
      // auf der erlaubten Seite zu wahrscheinlich ist.
      //
      // Beim ersten Anlauf schaute diese Prüfung auf beide Ränder — und
      // meldete einen Fehler bei einem LINKSSEITIGEN Test, weil rechts
      // noch Platz gewesen wäre. Den darf ein linksseitiger Test aber
      // gar nicht benutzen: Er fragt, ob der Anteil KLEINER ist, und
      // viele Treffer sind darauf keine Antwort.
      const einseitig = art === 'zweiseitig' ? alpha / 2 : alpha;
      const erlaubt = [];
      if (art !== 'rechtsseitig') {
        erlaubt.push(v[0]);
      }
      if (art !== 'linksseitig') {
        erlaubt.push(v[n]);
      }
      if (erlaubt.some((rand) => rand <= einseitig + 1e-12)) {
        fehler = `n = ${n}, p₀ = ${p0}, ${art}, α = ${alpha}: Bereich leer, obwohl einer möglich wäre`;
      }
      continue;
    }

    // 2. Maximalität: Ein k mehr würde α überschreiten.
    const schranke = art === 'zweiseitig' ? alpha / 2 : alpha;
    for (const b of t.ablehnung) {
      if (b.seite === 'rechts' && b.von > 0) {
        let mehr = 0;
        for (let k = b.von - 1; k <= n; k++) {
          mehr += v[k];
        }
        if (mehr <= schranke + 1e-12) {
          fehler = `n = ${n}, p₀ = ${p0}, ${art}, α = ${alpha}: rechts ginge noch ein k mehr (${mehr} ≤ ${schranke})`;
        }
      }
      if (b.seite === 'links' && b.bis < n) {
        let mehr = 0;
        for (let k = 0; k <= b.bis + 1; k++) {
          mehr += v[k];
        }
        if (mehr <= schranke + 1e-12) {
          fehler = `n = ${n}, p₀ = ${p0}, ${art}, α = ${alpha}: links ginge noch ein k mehr (${mehr} ≤ ${schranke})`;
        }
      }
    }
  }

  wahr('das Niveau wird eingehalten und ausgereizt', fehler === null, fehler ?? undefined);
  wahr('und zwar oft genug', geprueft >= 200, `nur ${geprueft}`);
});

pruefung('Ablehnung und Annahme teilen die Trefferzahlen vollständig auf', () => {
  // Jede mögliche Trefferzahl liegt in genau einem der beiden Bereiche.
  // Eine Lücke oder eine Überschneidung wäre ein Test, der bei manchen
  // Ergebnissen keine Antwort gibt.
  const naechste = wuerfel(startwertFuer('hypothese-bereiche'));
  let fehler = null;

  for (let i = 0; i < 120 && fehler === null; i++) {
    const n = naechste(60) + 5;
    const t = test({
      n,
      p0: (naechste(80) + 10) / 100,
      art: ARTENLISTE[naechste(ARTENLISTE.length)],
      alpha: [0.01, 0.05, 0.1][naechste(3)],
    });

    let imBereich = 0;
    for (let k = 0; k <= n; k++) {
      const treffer = t.ablehnung.filter((b) => k >= b.von && k <= b.bis).length;
      if (treffer > 1) {
        fehler = `k = ${k} liegt in ${treffer} Ablehnungsbereichen gleichzeitig`;
        break;
      }
      imBereich += treffer;
    }

    // Der Ablehnungsbereich darf nie ALLE Trefferzahlen umfassen —
    // sonst würde H₀ immer verworfen, egal was passiert.
    if (imBereich > n) {
      fehler = `n = ${n}: der Ablehnungsbereich umfasst alle Trefferzahlen`;
    }
  }

  wahr('die Aufteilung ist sauber', fehler === null, fehler ?? undefined);
});

pruefung('Ein größeres α macht den Ablehnungsbereich größer', () => {
  // Wer mehr Irrtum zulässt, verwirft leichter. Das klingt
  // selbstverständlich und ist die Probe darauf, dass die Grenze
  // wirklich an α hängt und nicht an etwas anderem.
  const naechste = wuerfel(startwertFuer('hypothese-monotonie'));
  let fehler = null;

  for (let i = 0; i < 120 && fehler === null; i++) {
    const n = naechste(80) + 10;
    const p0 = (naechste(70) + 15) / 100;
    const art = ARTENLISTE[naechste(ARTENLISTE.length)];

    const eng = test({ n, p0, art, alpha: 0.01 });
    const weit = test({ n, p0, art, alpha: 0.1 });

    for (let k = 0; k <= n; k++) {
      if (imAblehnungsbereich(eng, k) && !imAblehnungsbereich(weit, k)) {
        fehler = `n = ${n}, p₀ = ${p0}, ${art}: k = ${k} wird bei α = 1 % verworfen, bei α = 10 % aber nicht`;
        break;
      }
    }
  }

  wahr('der engere Bereich liegt im weiteren', fehler === null, fehler ?? undefined);
});

pruefung('Ein zu großzügiger Test würde auffallen', () => {
  // Die Gegenprobe: ein Ablehnungsbereich, der ein k zu weit reicht.
  // Genau diesen Fehler macht man beim Ablesen aus der Tabelle, wenn
  // man die Zeile verwechselt.
  const t = test({ n: 100, p0: 0.5, art: 'rechtsseitig', alpha: 0.05 });
  const v = t.verteilung;

  let richtig = 0;
  for (let k = 59; k <= 100; k++) {
    richtig += v[k];
  }
  let zuWeit = richtig + v[58];

  wahr('der richtige Bereich bleibt unter 5 %', richtig <= 0.05, String(richtig));
  wahr(
    'einer mehr würde darüber liegen',
    zuWeit > 0.05,
    `die Gegenprobe greift nicht — dann prüft die Maximalität oben nichts (${zuWeit})`
  );
});
