import sys, glob
from PIL import Image
prefix, per, cols, scale = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4])
files = sorted(glob.glob(f'qa/surreal/bughunt/shots/{prefix}-[0-9][0-9].png'))
for k in range(0, len(files), per):
    ims = [Image.open(f) for f in files[k:k+per]]
    w, h = ims[0].size; w2, h2 = int(w*scale), int(h*scale)
    rows = (len(ims)+cols-1)//cols
    sheet = Image.new('RGB', (cols*w2 + (cols-1)*6, rows*h2 + (rows-1)*6), 'red')
    for i, im in enumerate(ims):
        sheet.paste(im.resize((w2, h2)), ((i%cols)*(w2+6), (i//cols)*(h2+6)))
    out = f'qa/surreal/bughunt/shots/sheet-{prefix}-{k//per}.png'; sheet.save(out); print(out)
