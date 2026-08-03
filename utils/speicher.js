// Den Fortschritt ablegen und wiederholen.
//
// Ein dünner Adapter, mehr nicht. Die Fachlogik steht in
// utils/fortschritt.js und weiß von Speichern nichts — nur deshalb
// lässt sie sich mit blankem node prüfen.
//
// Der Hintergrund ist austauschbar: In der App ist es AsyncStorage, in
// den Prüfungen ein Ablegen im Arbeitsspeicher. Ohne diese Trennung
// bräuchten die Prüfungen React Native, und der ganze Prüfrahmen dieses
// Projekts fiele in sich zusammen.
//
// ---------------------------------------------------------------------
// Was hier NICHT passiert
// ---------------------------------------------------------------------
//
// Nichts verlässt das Gerät. Kein Konto, kein Server, keine Anmeldung.
// Für eine App, die Minderjährige benutzen, ist das nicht Bequemlichkeit
// sondern die einfachste richtige Antwort: Was nie erhoben wird, kann
// nicht abfließen, nicht gelöscht werden müssen und braucht keine
// Einwilligung der Eltern nach DSGVO Art. 8. Im Play Store lässt sich
// unter "Data Safety" wahrheitsgemäß "keine Daten erhoben" angeben.

import { alsJson, ausJson, leererStand } from './fortschritt.js';

const SCHLUESSEL = 'mathe.fortschritt.v1';

let hintergrund = arbeitsspeicher();

// Der Hintergrund braucht genau zwei Funktionen. Mehr verlangt diese
// Datei nicht, damit man sie leicht austauschen kann.
export function setzeHintergrund(neuer) {
  if (!neuer || typeof neuer.getItem !== 'function' || typeof neuer.setItem !== 'function') {
    throw new Error('speicher: der Hintergrund braucht getItem und setItem');
  }
  hintergrund = neuer;
}

// Ein Hintergrund im Arbeitsspeicher — für die Prüfungen und als
// Rückfall, solange die App noch keinen echten gesetzt hat.
export function arbeitsspeicher(anfang = {}) {
  const inhalt = { ...anfang };
  return {
    async getItem(schluessel) {
      return schluessel in inhalt ? inhalt[schluessel] : null;
    },
    async setItem(schluessel, wert) {
      inhalt[schluessel] = String(wert);
    },
    async removeItem(schluessel) {
      delete inhalt[schluessel];
    },
  };
}

// Laden schlägt nie fehl. Ein defekter Speicher darf die App nicht am
// Starten hindern — wer beim Öffnen einen Absturz bekommt, kommt nicht
// wieder. Im Zweifel wird mit leerem Stand angefangen.
export async function ladeFortschritt() {
  try {
    return ausJson(await hintergrund.getItem(SCHLUESSEL));
  } catch {
    return leererStand();
  }
}

// Sichern meldet dagegen, ob es geklappt hat: Wer denkt, sein Stand sei
// gespeichert, und es ist nicht so, ärgert sich mehr als jemand, dem
// man es gleich sagt.
export async function sichereFortschritt(stand) {
  try {
    await hintergrund.setItem(SCHLUESSEL, alsJson(stand));
    return true;
  } catch {
    return false;
  }
}

export async function loescheFortschritt() {
  try {
    if (typeof hintergrund.removeItem === 'function') {
      await hintergrund.removeItem(SCHLUESSEL);
    } else {
      await hintergrund.setItem(SCHLUESSEL, alsJson(leererStand()));
    }
    return true;
  } catch {
    return false;
  }
}

export { SCHLUESSEL };
