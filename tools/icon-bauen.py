# -*- coding: utf-8 -*-
"""Baut alle Icon-Dateien aus einer einzigen Beschreibung.

    python3 tools/icon-bauen.py

Ein Motiv, mehrere Zuschnitte. Wer das Zeichen aendern will, aendert es
hier einmal - nicht in acht PNG-Dateien, die dann auseinanderlaufen.

Gebraucht werden Google Chrome (zeichnet das SVG) und ImageMagick (misst
die Sicherheitszone nach). Beides nur zum Bauen der Icons; die App selbst
braucht nichts davon, und die Pruefungen unter tests/ auch nicht. Deshalb
haengt dieses Skript NICHT in npm test - es erzeugt Dateien, die im Repo
liegen, statt etwas zu pruefen, das sich aendert.

Das Zeichen ist x hoch 2, hinterlegt mit dem Graphen von x hoch 2. Das
Geschriebene und das Gezeichnete sagen dasselbe - genau darum geht es in
dieser App. Aufbau uebernommen von "Chemie begreifen": grosses weisses
Zeichen, angedeutetes Motiv dahinter, kleines Zeichen oben rechts. Dort
ist es das Elementsymbol mit der Ordnungszahl, hier die Variable mit dem
Exponenten.
"""
import os, subprocess, sys

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.dirname(HIER)
ZWISCHEN = os.path.join(HIER, '.zwischenstand')      # die HTML-Vorlagen
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

HELL, DUNKEL = '#5B52E5', '#362FA1'      # um #4338CA herum
SCHRIFT = "Georgia, 'Times New Roman', serif"

# Android beschneidet das adaptive Icon auf die mittleren 66 % - je nach
# Hersteller rund, quadratisch oder als Kleeblatt. Was ausserhalb liegt,
# kann abgeschnitten werden. ZONE und HOCH sind so gewaehlt, dass alles
# hineinpasst; geprueft wird das unten, nicht geglaubt.
ZONE, HOCH = 0.64, 12
SICHER = 1024 * 0.66 / 2      # 337.9 px Radius um die Mitte

def verlauf(id_):
    return (f'<linearGradient id="{id_}" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="{HELL}"/>'
            f'<stop offset="1" stop-color="{DUNKEL}"/></linearGradient>')

def motiv(deckkraft=0.20, strich=16):
    """Parabel mit x-Achse. Die Parabel IST der Graph von x hoch 2 --
    das Zeichen davor und das Bild dahinter sagen dasselbe."""
    return f'''
  <g stroke="#FFFFFF" stroke-opacity="{deckkraft}" fill="none"
     stroke-width="{strich}" stroke-linecap="round">
    <path d="M140,205 Q512,1330 884,205"/>
    <line x1="118" y1="770" x2="906" y2="770"/>
    <line x1="300" y1="742" x2="300" y2="798"/>
    <line x1="724" y1="742" x2="724" y2="798"/>
  </g>'''

def zeichen(farbe='#FFFFFF', dx=0, dy=0, skala=1.0):
    """x hoch 2. Das x kursiv, die 2 aufrecht -- so setzt man Mathematik:
    Variablen kursiv, Zahlen aufrecht. Ein Detail, das kaum auffaellt und
    ohne das es falsch waere."""
    return f'''
  <g transform="translate({dx},{dy}) scale({skala}) " fill="{farbe}"
     font-family="{SCHRIFT}" text-anchor="middle">
    <text x="440" y="748" font-size="650" font-style="italic"
          font-weight="700">x</text>
    <text x="714" y="452" font-size="248" font-weight="700">2</text>
  </g>'''

def svg(inhalt, breite=1024, hoehe=1024, aus=None):
    """aus = Ausgabegroesse in Pixeln. Die viewBox bleibt immer bei der
    Entwurfsgroesse, damit alle Koordinaten oben unveraendert gelten."""
    ab, ah = aus if aus else (breite, hoehe)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{ab}" '
            f'height="{ah}" viewBox="0 0 {breite} {hoehe}">{inhalt}</svg>')

# ---------------------------------------------------------------- Varianten
def voll(aus=1024):
    # Der Eckradius waechst mit: 22 % der Kantenlaenge, wie bei Chemie.
    return svg(f'<defs>{verlauf("v")}</defs>'
               f'<rect width="1024" height="1024" rx="228" fill="url(#v)"/>'
               + motiv() + zeichen(), aus=(aus, aus))

def hintergrund():
    return svg(f'<defs>{verlauf("v")}</defs>'
               '<rect width="1024" height="1024" fill="url(#v)"/>')

def vordergrund():
    # Android beschneidet auf die mittleren ~66 %. Alles muss hinein.
    inneres = motiv(0.24, 20) + zeichen()
    return svg(f'<g transform="translate(512,{512 - HOCH}) scale({ZONE}) '
               f'translate(-512,-512)">{inneres}</g>')

def einfarbig():
    return svg(f'<g transform="translate(512,{512 - HOCH}) scale({ZONE}) '
               f'translate(-512,-512)">' + zeichen('#FFFFFF') + '</g>')

def vorstellung():
    chips = ['Lückenfinder', 'Bruchrechnen', 'Gleichungen',
             'Funktionen', 'Geometrie', 'Zufall']
    stueck, x, y, aus = 0, 470, 352, []
    for c in chips:
        w = 22 + len(c) * 10.4
        if x + w > 1006:
            x, y = 470, y + 46
        aus.append(f'<rect x="{x}" y="{y}" width="{w:.0f}" height="38" rx="19" '
                   f'fill="none" stroke="#FFFFFF" stroke-opacity="0.55"/>'
                   f'<text x="{x + w/2:.0f}" y="{y+25}" font-size="17" fill="#FFFFFF" '
                   f'text-anchor="middle" font-family="Helvetica, Arial, sans-serif">{c}</text>')
        x += w + 10
        stueck += 1
    sans = "Helvetica, Arial, sans-serif"
    return svg(
        f'<defs>{verlauf("v")}</defs><rect width="1024" height="500" fill="url(#v)"/>'
        f'<g transform="translate(22,30) scale(0.40)">'
        f'{motiv(0.26, 20)}{zeichen()}</g>'
        f'<text x="470" y="128" font-size="76" font-weight="700" fill="#FFFFFF" '
        f'font-family="{sans}">Mathe</text>'
        f'<text x="470" y="212" font-size="76" font-weight="700" fill="#FFFFFF" '
        f'font-family="{sans}">begreifen</text>'
        f'<text x="470" y="272" font-size="25" fill="#FFFFFF" fill-opacity="0.92" '
        f'font-family="{sans}">Jeder Rechenschritt hergeleitet —</text>'
        f'<text x="470" y="308" font-size="25" fill="#FFFFFF" fill-opacity="0.92" '
        f'font-family="{sans}">und jeder hat einen Namen.</text>'
        + ''.join(aus), 1024, 500)

A, D = 'assets', os.path.join('docs', 'store-assets')
ZIELE = [
    (A, 'icon.png',                    voll(),        1024, 1024, True),
    (A, 'android-icon-background.png', hintergrund(), 1024, 1024, False),
    (A, 'android-icon-foreground.png', vordergrund(), 1024, 1024, True),
    (A, 'android-icon-monochrome.png', einfarbig(),   1024, 1024, True),
    (A, 'splash-icon.png',             vordergrund(), 1024, 1024, True),
    (A, 'favicon.png',                 voll(48),        48,   48, True),
    (D, 'app-icon-512.png',            voll(512),      512,  512, True),
    (D, 'feature-graphic.png',         vorstellung(), 1024,  500, False),
]

os.makedirs(ZWISCHEN, exist_ok=True)
for ordner, name, inhalt, b, h, transparent in ZIELE:
    html = os.path.join(ZWISCHEN, name.replace('.png', '.html'))
    with open(html, 'w') as f:
        f.write('<!doctype html><meta charset="utf-8">'
                '<style>html,body{margin:0;padding:0;overflow:hidden}</style>'
                + inhalt)
    ziel = os.path.join(WURZEL, ordner, name)
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    subprocess.run([CHROME, '--headless', '--disable-gpu', '--hide-scrollbars',
                    '--force-device-scale-factor=1',
                    f'--default-background-color={"00000000" if transparent else "FFFFFFFF"}',
                    f'--window-size={b},{h}', f'--screenshot={ziel}',
                    'file://' + html],
                   capture_output=True, timeout=90)
    print(f'{ordner}/{name:32} {os.path.getsize(ziel):>8} Byte'
          if os.path.exists(ziel) else f'{ordner}/{name:32} FEHLT')


# ------------------------------------------------------- Die Sicherheitszone
# Nach Augenmass sieht das immer richtig aus. Also nachmessen: Jedes
# sichtbare Pixel muss innerhalb des Radius liegen, sonst schneidet ein
# rundes Launcher-Icon davon etwas ab.
def weiteste_stelle(datei, raster=256):
    roh = subprocess.run(['magick', datei, '-alpha', 'extract',
                          '-resize', f'{raster}x{raster}!', 'txt:-'],
                         capture_output=True, text=True).stdout
    # "-alpha extract" liefert ein sRGB-Bild: durchsichtig steht dort als
    # #000000, NICHT als gray(0). Der erste Anlauf suchte nach gray(0),
    # traf nie und meldete deshalb die Bildecke als weiteste Stelle.
    mitte, weit, wo = raster / 2, 0.0, None
    for zeile in roh.splitlines()[1:]:
        kopf, rest = zeile.split(':', 1)
        x, y = (int(v) for v in kopf.split(','))
        hexwert = rest.split('#')[1][:6]
        if int(hexwert[:2], 16) < 8:      # unter 8/255: Kantenglaettung
            continue
        r = ((x + 0.5 - mitte) ** 2 + (y + 0.5 - mitte) ** 2) ** 0.5
        if r > weit:
            weit, wo = r, (x, y)
    return weit * 1024 / raster, wo


print()
alles_gut = True
for datei in ('android-icon-foreground.png', 'android-icon-monochrome.png'):
    r, wo = weiteste_stelle(os.path.join(WURZEL, 'assets', datei))
    gut = r <= SICHER
    alles_gut &= gut
    print(f'{datei:32} weiteste Stelle {r:6.1f} px  '
          f'(erlaubt {SICHER:.1f})  {"ok" if gut else "RAGT HERAUS bei " + str(wo)}')
if not alles_gut:
    sys.exit(1)
