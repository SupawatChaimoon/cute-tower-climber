"""Convert the source art in asset/ into web-sized WebP files in public/assets/.
Run: python scripts/optimize_assets.py  (needs Pillow)"""
import glob, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'asset')
OUT = os.path.join(ROOT, 'public', 'assets')

def slug(name):
    name = os.path.splitext(name)[0]
    name = re.sub(r'\(\d+\)', '', name).replace('_', ' ').strip()
    name = re.sub(r'([a-z])([A-Z])', r'\1-\2', name)
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def save(src, dst, max_side, quality=82):
    im = Image.open(src)
    im = im.convert('RGBA') if 'A' in im.mode else im.convert('RGB')
    if im.mode == 'RGBA':  # trim transparent margins so sprites align to their real edges
        box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        if box:
            im = im.crop(box)
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'WEBP', quality=quality, method=4)

for f in glob.glob(os.path.join(SRC, 'hero', '*.png')):
    save(f, os.path.join(OUT, 'hero', slug(os.path.basename(f)) + '.webp'), 640)
for f in glob.glob(os.path.join(SRC, 'mon', '*.png')):
    if 'money' in f:
        continue
    save(f, os.path.join(OUT, 'mon', slug(os.path.basename(f)) + '.webp'), 560)
for f in glob.glob(os.path.join(SRC, 'skill', '*.png')):
    save(f, os.path.join(OUT, 'skill', slug(os.path.basename(f)) + '.webp'), 192, 85)

other = {
    'ChatGPT Image 22 ก.ย. 2569 16_04_29.png': ('logo', 900),
    'ChatGPT Image 23 ก.ย. 2569 23_26_22.png': ('tower-floor', 420),
    'bg_meadow.jpg': ('bg-meadow', 1600),
    'bgintower.png': ('bg-battle', 1600),
    'sky.png': ('bg-sky', 1600),
    'cloud.png': ('cloud', 600),
    '9742884.png': ('attack', 256),
    'ui_namebar.png': ('ui-namebar', 400),
    'ui_panel_medium.png': ('ui-panel-medium', 680),
    'ui_panel_small.png': ('ui-panel-small', 460),
    'ui_panel_tall.png': ('ui-panel-tall', 900),
    'ui_platform.png': ('ui-platform', 480),
    'ui_skillbar.png': ('ui-skillbar', 560),
}
for name, (out, size) in other.items():
    save(os.path.join(SRC, 'other', name), os.path.join(OUT, 'ui', out + '.webp'), size, 85)
save(os.path.join(SRC, 'mon', 'money.png'), os.path.join(OUT, 'ui', 'coin.webp'), 128, 85)
print('done')
