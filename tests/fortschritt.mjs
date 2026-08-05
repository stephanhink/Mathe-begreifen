// Prüfungen für den gespeicherten Lernstand.
//
// Das Besondere hier: Es geht um Zeit. Ob ein Thema in drei Wochen
// wieder drankommt, lässt sich nur prüfen, wenn man drei Wochen
// vorspulen kann — deshalb nimmt jede Funktion in fortschritt.js das
// Datum von außen entgegen und fragt nie selbst nach der Uhrzeit.

import { readFileSync } from 'node:fs';
import { pruefung, wahr, zahl as zahlIst, gleich as gleichText, wirft } from './pruefer.mjs';
import {
  leererStand,
  verbuche,
  themaStand,
  giltAlsSicher,
  sichereThemen,
  faelligeThemen,
  uebersicht,
  alsJson,
  ausJson,
  vergiss,
  alleVergessen,
  heute,
  tageDazwischen,
  PAUSEN,
  HOECHSTES_FACH,
  STAND_VERSION,
} from '../utils/fortschritt.js';
import {
  setzeHintergrund,
  arbeitsspeicher,
  ladeFortschritt,
  sichereFortschritt,
  loescheFortschritt,
  SCHLUESSEL,
} from '../utils/speicher.js';

const TAG = '2026-08-03';

// Ein Datum, n Tage später.
function plus(tage, ab = TAG) {
  const d = new Date(`${ab}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + tage);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------

pruefung('Der leere Stand', () => {
  const s = leererStand();
  zahlIst('kennt keine Themen', Object.keys(s.themen).length, 0);
  wahr('ist eingefroren', Object.isFrozen(s));
  wahr('nichts gilt als sicher', !giltAlsSicher(s, 'bruchKuerzen', TAG));
  zahlIst('und nichts ist fällig', faelligeThemen(s, TAG).length, 0);
});

pruefung('Eine Antwort verbuchen', () => {
  const s = verbuche(leererStand(), 'bruchKuerzen', true, TAG);
  const t = themaStand(s, 'bruchKuerzen');

  zahlIst('ein Versuch', t.versuche, 1);
  zahlIst('davon richtig', t.richtig, 1);
  zahlIst('Fach 1', t.fach, 1);
  gleichText('zuletzt heute', t.zuletzt, TAG);
  gleichText(`wieder fällig in ${PAUSEN[0]} Tagen`, t.faellig, plus(PAUSEN[0]));

  // Der alte Stand bleibt unberührt — davon hängt der Screen ab.
  zahlIst('der leere Stand ist noch leer', Object.keys(leererStand().themen).length, 0);

  wirft('ohne Thema', () => verbuche(leererStand(), '', true, TAG));
  wirft('mit kaputtem Datum', () => verbuche(leererStand(), 'x', true, 'gestern'));
});

pruefung('Der Lernkartenkasten', () => {
  // Jede richtige Antwort ein Fach weiter, jede falsche zurück auf eins.
  let s = leererStand();
  let tag = TAG;

  for (let fach = 1; fach <= HOECHSTES_FACH; fach++) {
    s = verbuche(s, 'potenzgesetzMal', true, tag);
    zahlIst(`nach ${fach} richtigen Antworten: Fach ${fach}`, themaStand(s, 'potenzgesetzMal').fach, fach);
    zahlIst(
      `die Pause beträgt ${PAUSEN[fach - 1]} Tage`,
      tageDazwischen(tag, themaStand(s, 'potenzgesetzMal').faellig),
      PAUSEN[fach - 1]
    );
    tag = themaStand(s, 'potenzgesetzMal').faellig;
  }

  s = verbuche(s, 'potenzgesetzMal', true, tag);
  zahlIst('höher als Fach 5 geht es nicht', themaStand(s, 'potenzgesetzMal').fach, HOECHSTES_FACH);

  // Und ein Fehler wirft ganz zurück.
  s = verbuche(s, 'potenzgesetzMal', false, tag);
  zahlIst('nach einem Fehler wieder Fach 1', themaStand(s, 'potenzgesetzMal').fach, 1);
  gleichText('und sofort wieder fällig', themaStand(s, 'potenzgesetzMal').faellig, tag);
  wahr('gilt also nicht als sicher', !giltAlsSicher(s, 'potenzgesetzMal', tag));
});

pruefung('Wissen altert', () => {
  // Das ist der Grund für den ganzen Aufwand: Was vor drei Monaten saß,
  // sitzt heute vielleicht nicht mehr. Eine App, die einmal "kannst du"
  // sagt und dabei bleibt, erinnert nur an einen guten Tag.
  const s = verbuche(leererStand(), 'bruchAddieren', true, TAG);

  wahr('gleich danach sicher', giltAlsSicher(s, 'bruchAddieren', TAG));
  wahr('einen Tag später immer noch', giltAlsSicher(s, 'bruchAddieren', plus(1)));
  wahr(`nach ${PAUSEN[0]} Tagen wieder dran`, !giltAlsSicher(s, 'bruchAddieren', plus(PAUSEN[0])));
  wahr('und erst recht später', !giltAlsSicher(s, 'bruchAddieren', plus(400)));

  // Im höchsten Fach hält die Aussage zwei Monate.
  let hoch = leererStand();
  let tag = TAG;
  for (let i = 0; i < HOECHSTES_FACH; i++) {
    hoch = verbuche(hoch, 'wurzelZiehen', true, tag);
    tag = themaStand(hoch, 'wurzelZiehen').faellig;
  }
  const letzteAntwort = themaStand(hoch, 'wurzelZiehen').zuletzt;
  const lang = PAUSEN[HOECHSTES_FACH - 1];
  wahr(`nach ${lang - 1} Tagen noch sicher`, giltAlsSicher(hoch, 'wurzelZiehen', plus(lang - 1, letzteAntwort)));
  wahr(`nach ${lang} Tagen nicht mehr`, !giltAlsSicher(hoch, 'wurzelZiehen', plus(lang, letzteAntwort)));
});

pruefung('Was sitzt und was dran ist', () => {
  let s = leererStand();
  s = verbuche(s, 'bruchKuerzen', true, TAG);
  s = verbuche(s, 'bruchAddieren', false, TAG);
  s = verbuche(s, 'potenzDefinition', true, TAG);

  gleichText('zwei sitzen', sichereThemen(s, TAG).sort().join(','), 'bruchKuerzen,potenzDefinition');
  gleichText('eines ist fällig', faelligeThemen(s, TAG).join(','), 'bruchAddieren');

  // Nach der Pause sind alle wieder dran.
  zahlIst(`nach ${PAUSEN[0]} Tagen ist nichts mehr sicher`, sichereThemen(s, plus(PAUSEN[0])).length, 0);
  zahlIst('und drei Themen sind fällig', faelligeThemen(s, plus(PAUSEN[0])).length, 3);

  const u = uebersicht(s, TAG);
  zahlIst('drei Themen geübt', u.geuebt, 3);
  zahlIst('drei Versuche', u.versuche, 3);
  zahlIst('davon zwei richtig', u.richtig, 2);
  gleichText('zuletzt geübt', u.zuletzt, TAG);
});

// ---------------------------------------------------------------------
// Ablegen
// ---------------------------------------------------------------------

pruefung('Speichern und Wiederholen', () => {
  let s = leererStand();
  s = verbuche(s, 'bruchKuerzen', true, TAG);
  s = verbuche(s, 'potenzgesetzMal', false, TAG);

  const zurueck = ausJson(alsJson(s));
  gleichText('dieselben Themen', Object.keys(zurueck.themen).sort().join(','), 'bruchKuerzen,potenzgesetzMal');
  zahlIst('dasselbe Fach', themaStand(zurueck, 'bruchKuerzen').fach, 1);
  gleichText('dasselbe Fälligkeitsdatum', themaStand(zurueck, 'bruchKuerzen').faellig, plus(PAUSEN[0]));

  // Im Gespeicherten steht nichts als das Nötige — kein Name, kein
  // Gerät, keine Uhrzeit.
  const roh = JSON.parse(alsJson(s));
  gleichText('nur zwei Felder oben', Object.keys(roh).sort().join(','), 'themen,version');
  gleichText(
    'und je Thema nur fünf',
    Object.keys(roh.themen.bruchKuerzen).sort().join(','),
    'fach,faellig,richtig,versuche,zuletzt'
  );
});

pruefung('Ein kaputter Speicher bringt die App nicht zu Fall', () => {
  // Wer beim Öffnen einen Absturz bekommt, kommt nicht wieder. Deshalb
  // wird beim Einlesen misstraut und im Zweifel leer angefangen.
  const leer = (text) => Object.keys(ausJson(text).themen).length;

  zahlIst('kein Text', leer(null), 0);
  zahlIst('leerer Text', leer(''), 0);
  zahlIst('kein JSON', leer('{kaputt'), 0);
  zahlIst('JSON, aber Unsinn', leer('42'), 0);
  zahlIst('falsche Version', leer('{"version":99,"themen":{"x":{}}}'), 0);

  // Einzelne kaputte Themen fliegen raus, der Rest bleibt.
  const gemischt = ausJson(
    JSON.stringify({
      version: STAND_VERSION,
      themen: {
        gut: { versuche: 2, richtig: 1, fach: 2, zuletzt: TAG, faellig: plus(7) },
        ohneFach: { versuche: 1, richtig: 1, zuletzt: TAG, faellig: TAG },
        fachZuHoch: { versuche: 1, richtig: 1, fach: 99, zuletzt: TAG, faellig: TAG },
        mehrRichtigAlsVersuche: { versuche: 1, richtig: 5, fach: 1, zuletzt: TAG, faellig: TAG },
        kaputtesDatum: { versuche: 1, richtig: 1, fach: 1, zuletzt: 'gestern', faellig: TAG },
      },
    })
  );
  gleichText('nur das heile Thema bleibt', Object.keys(gemischt.themen).join(','), 'gut');
});

// Der Speicher ist asynchron, der Prüfrahmen ist es nicht. Also wird
// erst gewartet und danach geprüft — so bleibt pruefer.mjs so einfach,
// wie er ist, und die Ergebnisse sind trotzdem echte Prüfungen.
const speicherProbe = await (async () => {
  setzeHintergrund(arbeitsspeicher());

  const anfangs = await ladeFortschritt();
  const stand = verbuche(leererStand(), 'ausklammern', true, TAG);
  const gesichert = await sichereFortschritt(stand);
  const geladen = await ladeFortschritt();

  await loescheFortschritt();
  const nachLoeschen = await ladeFortschritt();

  // Ein Hintergrund, der immer wirft — die App darf trotzdem starten.
  setzeHintergrund({
    async getItem() {
      throw new Error('Speicher kaputt');
    },
    async setItem() {
      throw new Error('Speicher kaputt');
    },
  });
  const beiDefekt = await ladeFortschritt();
  const sichernBeiDefekt = await sichereFortschritt(stand);

  setzeHintergrund(arbeitsspeicher());
  return { anfangs, gesichert, geladen, nachLoeschen, beiDefekt, sichernBeiDefekt };
})();

pruefung('Der Speicher-Adapter', () => {
  zahlIst('anfangs leer', Object.keys(speicherProbe.anfangs.themen).length, 0);
  wahr('sichern meldet Erfolg', speicherProbe.gesichert);
  zahlIst(
    'und der Stand kommt zurück',
    themaStand(speicherProbe.geladen, 'ausklammern').versuche,
    1
  );
  zahlIst('nach dem Löschen wieder leer', Object.keys(speicherProbe.nachLoeschen.themen).length, 0);

  zahlIst(
    'bei defektem Speicher wird leer geladen',
    Object.keys(speicherProbe.beiDefekt.themen).length,
    0
  );
  wahr('und sichern sagt ehrlich, dass es nicht ging', speicherProbe.sichernBeiDefekt === false);

  wirft('ein Hintergrund ohne getItem wird abgelehnt', () => setzeHintergrund({}));
});

pruefung('Der Prüfrahmen fängt async-Blöcke ab', () => {
  // Ohne diese Sicherung meldete ein async-Block stillschweigend
  // "0 Prüfungen" und sähe grün aus — genau das ist beim Bauen dieser
  // Datei passiert.
  wahr('diese Prüfung selbst läuft synchron', true);
});

pruefung('Vergessen', () => {
  let s = leererStand();
  s = verbuche(s, 'a1', true, TAG);
  s = verbuche(s, 'b1', true, TAG);

  gleichText('ein Thema vergessen', Object.keys(vergiss(s, 'a1').themen).join(','), 'b1');
  zahlIst('alles vergessen', Object.keys(alleVergessen().themen).length, 0);
  zahlIst('der alte Stand bleibt', Object.keys(s.themen).length, 2);
});

pruefung('Das heutige Datum', () => {
  const jetzt = heute(new Date(2026, 7, 3, 23, 30));
  gleichText('wird lokal gebildet, nicht in UTC', jetzt, '2026-08-03');
  wahr('und heute() ohne Argument liefert dasselbe Format', /^\d{4}-\d{2}-\d{2}$/.test(heute()));
  zahlIst('Tage dazwischen', tageDazwischen('2026-08-03', '2026-08-10'), 7);
  zahlIst('auch über einen Monatswechsel', tageDazwischen('2026-08-30', '2026-09-02'), 3);
});


pruefung('Die App meldet einen echten Speicher an', () => {
  // Der Fehler, den keine Prüfung finden konnte, weil er zwischen den
  // Dateien lag: fortschritt.js rechnete richtig, speicher.js legte
  // richtig ab, der Bildschirm rief richtig auf — und trotzdem war der
  // Lernstand nach dem Schließen weg. Es fehlte die eine Zeile, die
  // AsyncStorage anmeldet. speicher.js lief auf seinem Rückfall im
  // Arbeitsspeicher.
  //
  // Aufgefallen ist es beim Fotografieren, nach dreizehn beantworteten
  // Aufgaben: "Noch nichts geübt".
  //
  // Deshalb hier eine Prüfung am Quelltext. Sie ist grob, aber sie
  // findet genau diese Sorte Lücke — eine Verbindung, die niemand
  // hergestellt hat.
  const app = readFileSync(new URL('../App.js', import.meta.url), 'utf8');

  wahr(
    'setzeHintergrund wird aufgerufen',
    /setzeHintergrund\s*\(/.test(app),
    'App.js meldet keinen Speicher an — dann läuft alles im Arbeitsspeicher und ist beim Schließen weg'
  );
  wahr(
    'und zwar mit AsyncStorage',
    /setzeHintergrund\s*\(\s*AsyncStorage\s*\)/.test(app),
    'der Rückfall im Arbeitsspeicher überlebt das Schließen der App nicht'
  );
  wahr(
    'AsyncStorage ist auch importiert',
    app.includes("from '@react-native-async-storage/async-storage'"),
    'ohne Import ist der Aufruf wirkungslos'
  );
});
