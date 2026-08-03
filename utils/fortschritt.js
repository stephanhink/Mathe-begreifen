// Was jemand schon kann — und wann es wieder drankommen sollte.
//
// Ohne diese Datei fängt der Lückenfinder bei jedem Start wieder bei
// null an. Mit ihr wird aus einem Test ein Lernbegleiter: Was sitzt,
// wird übersprungen; was zu verblassen droht, kommt von selbst wieder.
//
// ---------------------------------------------------------------------
// Zwei Regeln, die aus utils/luecken.js mitkommen
// ---------------------------------------------------------------------
//
// 1. **Vermutungen werden nicht gespeichert.** Der Lückenfinder nimmt
//    an, dass die Voraussetzungen sitzen, wenn das darüberliegende Thema
//    sitzt — das steuert nur, was als Nächstes gefragt wird. Hier landet
//    ausschließlich, was tatsächlich abgefragt wurde. Sonst behauptete
//    die App beim nächsten Start Dinge, die sie nie geprüft hat.
//
// 2. **Wissen altert.** Was vor drei Monaten saß, sitzt heute vielleicht
//    nicht mehr. Deshalb hat jedes Thema ein Fach und ein Fälligkeits-
//    datum — nach dem Prinzip des Lernkartenkastens von Sebastian
//    Leitner: richtig beantwortet heißt längere Pause, falsch heißt
//    zurück auf Anfang.
//
// ---------------------------------------------------------------------
// Kein React, kein Speicher, keine Uhr
// ---------------------------------------------------------------------
//
// Diese Datei liest und schreibt nichts und fragt nie nach der Uhrzeit —
// das Datum kommt immer von außen herein. Nur deshalb lässt sich hier
// prüfen, was in einem halben Jahr passiert, ohne ein halbes Jahr zu
// warten. Das Ablegen erledigt utils/speicher.js.

// Die Pausen der fünf Fächer, in Tagen. Ein Thema wandert bei jeder
// richtigen Antwort ein Fach weiter und bei jeder falschen zurück auf
// eins.
//
// Die erste Zahl ist die wichtigste, und sie war zuerst falsch: Mit
// einer Pause von einem Tag war am Tag darauf wieder alles fällig — die
// zweite Sitzung fragte genau so viel ab wie die erste, und der ganze
// gespeicherte Stand brachte nichts. Aufgefallen ist das erst beim
// Durchspielen mehrerer Tage.
//
// Der Denkfehler dahinter: Ein Tag ist die Pause für eine FALSCH
// beantwortete Karte. Wer etwas auf Anhieb kann, hat mehr verdient als
// „morgen noch mal".
//
// Diese Zahlen tragen zugleich die Aussage „das kann er": Solange die
// Pause läuft, überspringt der Lückenfinder das Thema. Fach 5 trägt sie
// ein halbes Jahr — wer das ändert, ändert damit auch, wie lange die
// App jemandem etwas glaubt.
const PAUSEN = [3, 7, 21, 60, 180];
const HOECHSTES_FACH = PAUSEN.length;

export const STAND_VERSION = 1;

// ---------------------------------------------------------------------
// Tage
// ---------------------------------------------------------------------
//
// Gerechnet wird in ganzen Tagen, gespeichert als "2026-08-03". Kein
// Zeitstempel: Ob jemand morgens oder abends übt, ändert nichts, und
// eine Uhrzeit im Speicher wäre nur eine Angabe mehr, die man schützen
// müsste.

export function heute(zeitpunkt = new Date()) {
  const zwei = (n) => String(n).padStart(2, '0');
  return `${zeitpunkt.getFullYear()}-${zwei(zeitpunkt.getMonth() + 1)}-${zwei(zeitpunkt.getDate())}`;
}

function tagNummer(datum) {
  const teile = String(datum).split('-').map(Number);
  if (teile.length !== 3 || teile.some((t) => !Number.isInteger(t))) {
    throw new Error(`fortschritt: "${datum}" ist kein Datum im Format 2026-08-03`);
  }
  return Math.floor(Date.UTC(teile[0], teile[1] - 1, teile[2]) / 86400000);
}

function tagText(nummer) {
  return new Date(nummer * 86400000).toISOString().slice(0, 10);
}

export function tageDazwischen(von, bis) {
  return tagNummer(bis) - tagNummer(von);
}

function spaeter(datum, tage) {
  return tagText(tagNummer(datum) + tage);
}

// ---------------------------------------------------------------------
// Der Stand
// ---------------------------------------------------------------------

export function leererStand() {
  return Object.freeze({ version: STAND_VERSION, themen: Object.freeze({}) });
}

// Eine Antwort verbuchen. Gibt einen NEUEN Stand zurück — wie überall in
// diesem Projekt wird nichts verändert, sondern ersetzt.
export function verbuche(stand, themaId, richtig, datum = heute()) {
  if (typeof themaId !== 'string' || themaId === '') {
    throw new Error('fortschritt: verbuche braucht ein Thema');
  }
  tagNummer(datum); // wirft, wenn das Datum nicht stimmt

  const alt = stand.themen[themaId] ?? { versuche: 0, richtig: 0, fach: 0 };
  const fach = richtig ? Math.min(alt.fach + 1, HOECHSTES_FACH) : 1;

  const neu = {
    versuche: alt.versuche + 1,
    richtig: alt.richtig + (richtig ? 1 : 0),
    fach,
    zuletzt: datum,
    // Nach einer falschen Antwort ist das Thema sofort wieder dran.
    faellig: richtig ? spaeter(datum, PAUSEN[fach - 1]) : datum,
  };

  return Object.freeze({
    ...stand,
    themen: Object.freeze({ ...stand.themen, [themaId]: Object.freeze(neu) }),
  });
}

export function themaStand(stand, themaId) {
  return stand.themen[themaId] ?? null;
}

// Sitzt das Thema — geprüft, richtig, und noch nicht wieder fällig?
//
// Das ist bewusst streng: Ein Thema, das einmal richtig war, aber schon
// wieder fällig ist, gilt NICHT als sicher. Sonst wäre die Aussage "das
// kannst du" irgendwann nur noch eine Erinnerung an einen guten Tag.
export function giltAlsSicher(stand, themaId, datum = heute()) {
  const t = stand.themen[themaId];
  if (!t || t.fach < 1) {
    return false;
  }
  return tageDazwischen(datum, t.faellig) > 0;
}

export function sichereThemen(stand, datum = heute()) {
  return Object.keys(stand.themen).filter((id) => giltAlsSicher(stand, id, datum));
}

// Was heute drankommen sollte: schon einmal geübt, aber die Pause ist um.
export function faelligeThemen(stand, datum = heute()) {
  return Object.keys(stand.themen)
    .filter((id) => !giltAlsSicher(stand, id, datum))
    .sort((a, b) => tagNummer(stand.themen[a].faellig) - tagNummer(stand.themen[b].faellig));
}

// Für die Übersicht auf dem Startbildschirm.
export function uebersicht(stand, datum = heute()) {
  const ids = Object.keys(stand.themen);
  const sicher = sichereThemen(stand, datum);
  const faellig = faelligeThemen(stand, datum);

  const versuche = ids.reduce((s, id) => s + stand.themen[id].versuche, 0);
  const richtig = ids.reduce((s, id) => s + stand.themen[id].richtig, 0);

  const zuletzt = ids
    .map((id) => stand.themen[id].zuletzt)
    .sort()
    .pop();

  return { geuebt: ids.length, sicher, faellig, versuche, richtig, zuletzt: zuletzt ?? null };
}

// ---------------------------------------------------------------------
// Ablegen und wiederholen
// ---------------------------------------------------------------------

// Was gespeichert wird, ist schlichtes JSON. Kein Name, kein Gerät,
// keine Uhrzeit — nur welches Thema wann wie oft saß.
export function alsJson(stand) {
  return JSON.stringify({ version: STAND_VERSION, themen: stand.themen });
}

// Beim Einlesen wird misstraut. Eine kaputte oder veraltete Datei darf
// die App nicht zu Fall bringen: Wer die App öffnet und einen Absturz
// bekommt, kommt nicht wieder. Im Zweifel wird mit leerem Stand
// angefangen.
export function ausJson(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return leererStand();
  }

  let roh;
  try {
    roh = JSON.parse(text);
  } catch {
    return leererStand();
  }

  if (!roh || typeof roh !== 'object' || roh.version !== STAND_VERSION) {
    // Später kommt hier die Umstellung alter Fassungen hin. Solange es
    // nur eine gibt, ist Verwerfen ehrlicher als Raten.
    return leererStand();
  }

  const themen = {};
  for (const [id, t] of Object.entries(roh.themen ?? {})) {
    if (istHeil(t)) {
      themen[id] = Object.freeze({
        versuche: t.versuche,
        richtig: t.richtig,
        fach: t.fach,
        zuletzt: t.zuletzt,
        faellig: t.faellig,
      });
    }
  }

  return Object.freeze({ version: STAND_VERSION, themen: Object.freeze(themen) });
}

function istHeil(t) {
  if (!t || typeof t !== 'object') {
    return false;
  }
  if (!Number.isInteger(t.versuche) || t.versuche < 0) {
    return false;
  }
  if (!Number.isInteger(t.richtig) || t.richtig < 0 || t.richtig > t.versuche) {
    return false;
  }
  if (!Number.isInteger(t.fach) || t.fach < 1 || t.fach > HOECHSTES_FACH) {
    return false;
  }
  try {
    tagNummer(t.zuletzt);
    tagNummer(t.faellig);
  } catch {
    return false;
  }
  return true;
}

// Alles vergessen. Gehört in die App, nicht nur in die Prüfungen: Wer
// seinen Stand nicht löschen kann, ist ihm ausgeliefert.
export function alleVergessen() {
  return leererStand();
}

export function vergiss(stand, themaId) {
  const themen = { ...stand.themen };
  delete themen[themaId];
  return Object.freeze({ ...stand, themen: Object.freeze(themen) });
}

export { PAUSEN, HOECHSTES_FACH };
