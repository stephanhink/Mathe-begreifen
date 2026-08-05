// Prüft, dass kein Info-Knopf ins Leere zeigt.
//
// Diese Prüfung liest den Quelltext der Screens und Komponenten, statt
// sie auszuführen — dafür bräuchte es React, und in tests/ läuft
// blankes Node. Gesucht wird nach thema="..." im Quelltext.
//
// Der Nutzen ist konkret: Ein Info-Knopf mit vertipptem Namen zeigt in
// der App gar nichts an. Ohne diese Prüfung fiele das erst auf, wenn
// jemand draufdrückt — und der Knopf sitzt ja gerade da, wo jemand
// nicht weiterweiß.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pruefung, wahr, zahl } from './pruefer.mjs';
import { THEMEN, holeThema } from '../utils/wissen.js';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');

function quelltexte() {
  const texte = [];
  for (const ordner of ['screens', 'components']) {
    const pfad = join(wurzel, ordner);
    for (const datei of readdirSync(pfad)) {
      if (datei.endsWith('.js')) {
        texte.push({ datei: `${ordner}/${datei}`, inhalt: readFileSync(join(pfad, datei), 'utf8') });
      }
    }
  }
  return texte;
}

pruefung('Wissenstexte', () => {
  const ids = new Set(Object.keys(THEMEN));
  wahr('es gibt überhaupt Themen', ids.size > 0);

  for (const [id, t] of Object.entries(THEMEN)) {
    wahr(`${id}: hat einen Titel`, Boolean(t.titel));
    wahr(`${id}: hat Text`, Array.isArray(t.text) && t.text.length > 0);

    // Der erste Absatz ist die Antwort in Alltagssprache. Wird er zu
    // lang, ist er keine Antwort mehr, sondern ein Aufsatz — und wer
    // eine Lücke hat, liest ihn nicht zu Ende.
    wahr(`${id}: erster Absatz ist kurz genug`, t.text[0].length <= 400, `${t.text[0].length} Zeichen`);

    for (const ziel of t.mehr || []) {
      wahr(`${id}: Querverweis "${ziel}" existiert`, ids.has(ziel));
      wahr(`${id}: Querverweis "${ziel}" zeigt nicht auf sich selbst`, ziel !== id);
    }
  }

  wahr('holeThema findet ein bekanntes Thema', Boolean(holeThema('term')));
  wahr('und gibt bei unbekanntem nichts zurück', holeThema('gibtEsNicht') === undefined);
});

pruefung('Info-Knöpfe in den Screens', () => {
  const benutzt = new Set();
  const ids = new Set(Object.keys(THEMEN));

  for (const { datei, inhalt } of quelltexte()) {
    for (const treffer of inhalt.matchAll(/thema="([^"]+)"/g)) {
      const id = treffer[1];
      benutzt.add(id);
      wahr(`${datei}: Info-Knopf "${id}" hat einen Text`, ids.has(id));
    }
  }

  wahr('es gibt überhaupt Info-Knöpfe', benutzt.size > 0, `${benutzt.size} gefunden`);
});

pruefung('Kein Bauteil bleibt unbenutzt liegen', () => {
  // Die Erreichbarkeitsprüfung unten liest den QUELLTEXT. Ein Bauteil,
  // das niemand einbindet, enthält seine Info-Knöpfe trotzdem — und
  // besteht sie mühelos, obwohl auf dem Bildschirm nie etwas davon
  // erscheint.
  //
  // Genau das ist passiert: `WozuZinseszins` stand fertig im
  // Zahlen-Bildschirm und wurde nie gerendert, weil meine Änderung auf
  // eine Zeile zielte, die es dort gar nicht gab. Aufgefallen ist es
  // erst beim Fotografieren.
  //
  // Deshalb hier die billige, aber wirksame Gegenprobe: Jede lokal
  // definierte Komponente muss im selben Bauteil auch verwendet werden.
  for (const { datei, inhalt } of quelltexte()) {
    for (const treffer of inhalt.matchAll(/^function ([A-Z]\w+)\s*\(/gm)) {
      const name = treffer[1];
      // Nach dem Namen darf ALLES Weiße folgen — Komponenten mit
      // mehreren Eigenschaften stehen mehrzeilig da:
      //   <Ableitung
      //     analysis={analysis}
      // Ein Muster, das ein Leerzeichen verlangt, meldet die alle
      // fälschlich als unbenutzt. Genau das war mein erster Anlauf.
      const benutzt = new RegExp(`<${name}[\\s/>]`);
      const wirdBenutzt =
        benutzt.test(inhalt) ||
        inhalt.includes(`export default ${name}`) ||
        inhalt.includes(`export function ${name}`);
      wahr(
        `${datei}: ${name} wird auch eingebunden`,
        wirdBenutzt,
        'definiert, aber nirgends verwendet — auf dem Bildschirm erscheint davon nichts'
      );
    }
  }
});

pruefung('Jedes Thema ist vom Bildschirm aus erreichbar', () => {
  // Ein Text, den niemand öffnen kann, ist verlorene Arbeit.
  //
  // Erreichbar heißt: Man kommt von einem INFO-KNOPF aus hin — direkt
  // oder über die "mehr"-Links. Gesucht wird deshalb vorwärts von den
  // Knöpfen aus, nicht bloß nach Erwähnungen.
  //
  // Die erste Fassung fragte nur "wird irgendwo erwähnt". Das ließ sich
  // täuschen: Drei neue Texte, die einander unter "mehr" verlinkten,
  // bestanden die Prüfung mühelos — obwohl kein Knopf auf einen von
  // ihnen zeigte und kein Nutzer je hingekommen wäre. Eine geschlossene
  // Insel ist nicht erreichbar, sie ist nur in sich verbunden.
  const start = new Set();
  for (const { inhalt } of quelltexte()) {
    for (const treffer of inhalt.matchAll(/thema="([^"]+)"/g)) {
      start.add(treffer[1]);
    }
  }

  const erreichbar = new Set();
  const offen = [...start];
  while (offen.length > 0) {
    const id = offen.pop();
    if (erreichbar.has(id)) {
      continue;
    }
    erreichbar.add(id);
    for (const ziel of THEMEN[id]?.mehr || []) {
      offen.push(ziel);
    }
  }

  for (const id of Object.keys(THEMEN)) {
    wahr(
      `${id}: von einem Info-Knopf aus erreichbar`,
      erreichbar.has(id),
      'kein Knopf zeigt darauf, und über die mehr-Links kommt man auch nicht hin'
    );
  }
});
