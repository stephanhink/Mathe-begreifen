// Prüfungen für den Themengraphen.
//
// Ein Graph mit Voraussetzungen kann auf Arten kaputtgehen, die man
// beim Lesen nicht sieht: ein Zyklus, ein Verweis ins Leere, ein Thema,
// das niemand erreicht. Jede davon würde den Lückenfinder lahmlegen —
// im Zweifel als Endlosschleife auf einem Handy, ohne Fehlermeldung.

import { pruefung, wahr, zahl as zahlIst, gleich as gleichText } from './pruefer.mjs';
import {
  THEMEN,
  alleThemen,
  holeThema,
  voraussetzungenVon,
  alleVoraussetzungen,
  baut_auf,
  spitzen,
  wurzeln,
  wegNachOben,
  findeZyklus,
} from '../utils/lernpfad.js';
import { THEMEN as WISSEN } from '../utils/wissen.js';

pruefung('Der Themengraph ist heil', () => {
  const ids = new Set(alleThemen());
  wahr('es gibt Themen', ids.size >= 20, `${ids.size}`);

  for (const [id, t] of Object.entries(THEMEN)) {
    wahr(`${id}: hat einen Titel`, Boolean(t.titel));
    wahr(`${id}: hat eine Klassenstufe`, Number.isInteger(t.klasse) && t.klasse >= 5);
    wahr(`${id}: Voraussetzungen sind eine Liste`, Array.isArray(t.voraussetzungen));

    for (const v of t.voraussetzungen) {
      wahr(`${id}: Voraussetzung "${v}" existiert`, ids.has(v));
      wahr(`${id}: setzt sich nicht selbst voraus`, v !== id);
    }

    // Der Verweis auf den Erklärtext darf fehlen, aber nicht ins Leere
    // zeigen. Ein Lückenfinder, der auf einen nicht vorhandenen Text
    // verweist, lässt genau den im Regen stehen, dem er helfen soll.
    if (t.wissen !== null) {
      wahr(`${id}: Wissenstext "${t.wissen}" existiert`, t.wissen in WISSEN);
    }
  }
});

pruefung('Keine Zyklen', () => {
  // Ein Zyklus wäre ein Thema, das sich mittelbar selbst voraussetzt.
  // Der Lückenfinder liefe darin endlos nach unten.
  const zyklus = findeZyklus();
  wahr('der Graph ist zyklenfrei', zyklus === null, zyklus ? zyklus.join(' → ') : undefined);

  // Und keine Selbstbezüge über Umwege.
  for (const id of alleThemen()) {
    wahr(`${id}: kommt in den eigenen Voraussetzungen nicht vor`, !alleVoraussetzungen(id).includes(id));
  }
});

pruefung('Die Klassenstufen passen zur Reihenfolge', () => {
  // Ein Thema kann nicht früher drankommen als das, was es voraussetzt.
  // Diese Prüfung fängt Flüchtigkeitsfehler beim Einordnen — und sie
  // fängt vor allem eine falsch herum eingetragene Voraussetzung.
  for (const id of alleThemen()) {
    for (const v of voraussetzungenVon(id)) {
      wahr(
        `${id} (Klasse ${THEMEN[id].klasse}) kommt nicht vor ${v} (Klasse ${THEMEN[v].klasse})`,
        THEMEN[id].klasse >= THEMEN[v].klasse
      );
    }
  }
});

pruefung('Jedes Thema hängt am Graphen', () => {
  // Ein Thema ohne jede Verbindung wäre für den Lückenfinder unsichtbar:
  // Er käme von oben nie dorthin und von unten nie weg.
  for (const id of alleThemen()) {
    const verbunden = voraussetzungenVon(id).length > 0 || baut_auf(id).length > 0;
    wahr(`${id}: ist mit mindestens einem anderen Thema verbunden`, verbunden);
  }

  wahr('es gibt einen festen Boden', wurzeln().length >= 1, wurzeln().join(', '));
  wahr('und mindestens eine Spitze', spitzen().length >= 1, spitzen().join(', '));

  // Von jeder Spitze aus muss man nach unten irgendwo ankommen.
  for (const spitze of spitzen()) {
    wahr(`${spitze}: führt nach unten zu einer Wurzel`, alleVoraussetzungen(spitze).some((v) => voraussetzungenVon(v).length === 0));
  }
});

pruefung('Der Weg nach oben', () => {
  // Das ist die Funktion hinter dem Satz "hier ist der Weg von dort
  // nach oben".
  const weg = wegNachOben('potenzDefinition', 'quadratischeGleichung');
  wahr('von der Potenz zur quadratischen Gleichung gibt es einen Weg', weg.length > 0);
  gleichText('er beginnt unten', weg[0], 'potenzDefinition');
  gleichText('und endet oben', weg[weg.length - 1], 'quadratischeGleichung');

  // Jeder Schritt auf dem Weg muss eine echte Kante sein.
  for (let i = 1; i < weg.length; i++) {
    wahr(
      `${weg[i]} setzt ${weg[i - 1]} voraus`,
      voraussetzungenVon(weg[i]).includes(weg[i - 1])
    );
  }

  gleichText('ein Thema zu sich selbst', wegNachOben('bruchKuerzen', 'bruchKuerzen').join(''), 'bruchKuerzen');
  zahlIst('nach unten gibt es keinen Weg', wegNachOben('quadratischeGleichung', 'potenzDefinition').length, 0);
});

pruefung('Die Kette, um die es geht', () => {
  // Der Fall aus dem Konzept: Wer an der quadratischen Gleichung
  // scheitert, hat womöglich ein Problem mit den Potenzgesetzen. Dieser
  // Weg muss im Graphen wirklich existieren, sonst kann der
  // Lückenfinder ihn nie finden.
  const weg = wegNachOben('potenzgesetzMal', 'quadratischeGleichung');
  wahr('von den Potenzgesetzen zur pq-Formel führt ein Weg', weg.length >= 3, weg.join(' → '));

  wahr(
    'die quadratische Gleichung setzt mittelbar die Potenzdefinition voraus',
    alleVoraussetzungen('quadratischeGleichung').includes('potenzDefinition')
  );
  wahr(
    'und mittelbar das Rechnen mit negativen Zahlen',
    alleVoraussetzungen('quadratischeGleichung').includes('ganzeZahlenAddieren')
  );
});
