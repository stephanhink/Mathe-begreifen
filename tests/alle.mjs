// Führt alle Prüfungen aus. Das ist der Einstiegspunkt von `npm test`.
//
// Die Reihenfolge folgt der Abhängigkeit: erst die Grundlagen, dann was
// darauf aufbaut. Bei Mathematik ist das besonders wichtig, weil hier
// wirklich alles auf der exakten Bruchrechnung steht — schlägt bruch.mjs
// fehl, sieht man das zuerst und muss nicht raten, woher die
// Folgefehler kommen.
import './bruch.mjs';
import './term.mjs';
import './gleichung.mjs';
