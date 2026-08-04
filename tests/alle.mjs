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
import './parser.mjs';
import './wissen.mjs';

// Der Lückenfinder und was er braucht. Erst der Graph, dann die
// Aufgaben, dann die Suche — in dieser Reihenfolge bauen sie
// aufeinander auf.
import './lernpfad.mjs';
import './ableitung.mjs';
import './integral.mjs';
import './vektor.mjs';
import './aufgaben.mjs';
import './luecken.mjs';
import './rechenweg.mjs';
import './zahlen.mjs';
import './fortschritt.mjs';
import './funktion.mjs';
import './geometrie.mjs';
import './umstellen.mjs';
import './system.mjs';
import './ungleichung.mjs';
import './zufall.mjs';
