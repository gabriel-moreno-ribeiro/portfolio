// After the essay: the clothes Gabriel grew up in, on a rail, oldest first.
// No photos yet, so each piece is the rail's own drawn garment in roughly the
// right colour; swap in `image` / `backImage` / `sideImage` cut-outs (200 × 310)
// when there are photos of the real ones.
import ClothingRailHero, { type RailGarment } from '../ui/product-rail-gallery';

const WARDROBE: RailGarment[] = [
  {
    id: 'spider-man',
    name: 'Spider-Man costume',
    kind: 'tee',
    color: '#c62828',
    trim: '#1e3f8f',
    tag: 'up to 10',
    description: 'Until I was about 10.',
  },
  {
    id: 'colegio-militar',
    name: 'Colégio Militar uniform',
    kind: 'shirt',
    color: '#f3f2ee',
    trim: '#2f4f8f',
    tag: '10 to 16',
    description: 'Colégio Militar de Salvador, from 10 to 16.',
  },
  {
    id: 'ari-de-sa',
    name: 'Ari de Sá shirt',
    kind: 'tee',
    color: '#1f3a6e',
    tag: '17 to 18',
    description: 'Colégio Ari de Sá, Fortaleza: my last year of school.',
  },
  {
    id: 'hibeex',
    name: 'HIBEEX quarter-zip',
    kind: 'knit',
    color: '#26262a',
    tag: '18 to now',
    description: 'Since I moved to São Paulo to build HIBEEX.',
  },
  {
    id: 'taqtile',
    name: 'Taqtile jacket',
    kind: 'jacket',
    color: '#3a3f47',
    tag: '18 to now',
    description: 'Since I was 18.',
  },
];

export function Wardrobe() {
  return (
    <ClothingRailHero
      className="story__wardrobe"
      items={WARDROBE}
      hanger="wood"
      eyebrow="Wardrobe · oldest on the left"
      heading="What I wore, growing up."
      caption="Brush along the rail, or pick a piece up to turn it around."
    />
  );
}
