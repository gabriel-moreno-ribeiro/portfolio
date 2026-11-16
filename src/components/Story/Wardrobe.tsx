// The clothes Gabriel grew up in, on a rail, oldest first (Story and Home).
// The Spider-Man tee is a cut-out of the real one. The rest are the rail's own drawn
// garments in the real colours, with their badges as a `print`; the photos of those
// show them being worn, so there is nothing to cut out. Assets: qa/surreal/wardrobe/make.mjs.
import ClothingRailHero, { type RailGarment } from '../ui/product-rail-gallery';
import '../../styles/components/shared/wardrobe.scss';

const WARDROBE: RailGarment[] = [
  {
    id: 'spider-man',
    name: 'Spider-Man T-shirt',
    image: '/wardrobe/spider-man.webp',
    tag: 'up to 10',
    description: 'Until I was about 10.',
  },
  {
    id: 'colegio-militar',
    name: 'Colégio Militar tunic',
    kind: 'shirt',
    color: '#f4f3ef',
    trim: '#c8a12e',
    print: '/wardrobe/colegio-militar-print.webp',
    tag: '10 to 16',
    description: 'Colégio Militar de Salvador, from 10 to 16.',
  },
  {
    id: 'ari-de-sa',
    name: 'Ari de Sá shirt',
    kind: 'tee',
    color: '#1b2742',
    print: '/wardrobe/ari-de-sa-print.webp',
    tag: '17 to 18',
    description: 'Colégio Ari de Sá, Fortaleza: my last year of school.',
  },
  {
    id: 'hibeex',
    name: 'HIBEEX quarter-zip',
    kind: 'knit',
    color: '#f2f1ed',
    trim: '#e4e2dc',
    print: '/wardrobe/hibeex-print.webp',
    tag: '18 to now',
    description: 'Since I moved to São Paulo to build HIBEEX.',
  },
  {
    id: 'taqtile',
    name: 'Taqtile jacket',
    kind: 'hoodie',
    color: '#161618',
    trim: '#2b2b2e',
    print: '/wardrobe/taqtile-print.webp',
    tag: '18 to now',
    description: 'Since I was 18.',
  },
];

export function Wardrobe({ id }: { id?: string }) {
  return (
    <ClothingRailHero
      id={id}
      className="wardrobe-rail"
      items={WARDROBE}
      hanger="wood"
      eyebrow="Wardrobe · oldest on the left"
      heading="What I wore, growing up."
      caption="Brush along the rail, or pick a piece up to turn it around."
    />
  );
}
