# gor-ikoner.py
# Ritar MärkR-ikonerna deterministiskt: mässingsbokmärke på sot.
# Kör: python3 gor-ikoner.py   (kräver Pillow: pip install pillow)
# Skriver ikon-192.png och ikon-512.png i aktuell katalog.

from PIL import Image, ImageDraw

SOT = (11, 11, 13)
MASSING = (197, 160, 89)
MASSING_LJ = (220, 192, 138)


def rita(storlek):
    im = Image.new('P', (storlek, storlek))
    im.putpalette(list(SOT) + list(MASSING) + list(MASSING_LJ) + [0] * 759)
    dr = ImageDraw.Draw(im)
    dr.rectangle([0, 0, storlek, storlek], fill=0)
    s = storlek
    # Bokmärkesband: rektangel med kil urskuren i nederkant
    v = int(s * 0.36)
    h = int(s * 0.64)
    t = int(s * 0.16)
    b = int(s * 0.84)
    mitt = s // 2
    kil = int(s * 0.10)
    dr.polygon([(v, t), (h, t), (h, b), (mitt, b - kil), (v, b)], fill=1)
    # Ljusare kant på vänstersidan som fångar ljuset
    kant = max(2, int(s * 0.03))
    dr.polygon([(v, t), (v + kant, t), (v + kant, b - int(kil * kant / (mitt - v))), (v, b)], fill=2)
    return im


for storlek, namn in [(192, 'ikon-192.png'), (512, 'ikon-512.png')]:
    rita(storlek).save(namn, optimize=True)
    print(namn, 'skriven')
