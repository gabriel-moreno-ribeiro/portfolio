// The clothes Gabriel grew up in, on a rail, oldest first (Story and Home).
// The Spider-Man tee is a cut-out of the real one. The photos of the other four show them
// being worn, so those are drawn from the photos, hook and all, on the rail's 200 x 310
// canvas. Assets: qa/surreal/wardrobe/make.mjs.
import ClothingRailHero, { type RailGarment } from '../ui/product-rail-gallery';
import '../../styles/components/shared/wardrobe.scss';

// Every drawing ends above 246 of the canvas's 310; the stage stops there.
const HEM = 246;

const WARDROBE: RailGarment[] = [
  {
    id: 'spider-man',
    name: 'Spider-Man T-shirt',
    image: '/wardrobe/spider-man.webp',
    backImage: '/wardrobe/spider-man-back.webp',
    hem: HEM,
    tag: 'up to 10',
    description: 'Until I was about 10.',
  },
  {
    id: 'colegio-militar',
    name: 'Colégio Militar tunic',
    image: '/wardrobe/colegio-militar.webp',
    backImage: '/wardrobe/colegio-militar-back.webp',
    hem: HEM,
    tag: '10 to 16',
    description: 'Colégio Militar de Salvador, from 10 to 16.',
  },
  {
    id: 'ari-de-sa',
    name: 'Ari de Sá shirt',
    image: '/wardrobe/ari-de-sa.webp',
    backImage: '/wardrobe/ari-de-sa-back.webp',
    hem: HEM,
    tag: '17 to 18',
    description: 'Colégio Ari de Sá, Fortaleza: my last year of school.',
  },
  {
    id: 'hibeex',
    name: 'HIBEEX quarter-zip',
    image: '/wardrobe/hibeex.webp',
    backImage: '/wardrobe/hibeex-back.webp',
    hem: HEM,
    tag: '18 to now',
    description: 'Since I moved to São Paulo to build HIBEEX.',
  },
  {
    id: 'taqtile',
    name: 'Taqtile jacket',
    image: '/wardrobe/taqtile.webp',
    backImage: '/wardrobe/taqtile-back.webp',
    hem: HEM,
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
      hanger="none"
      eyebrow="Wardrobe · oldest on the left"
      heading="What I wore, growing up."
      caption="Brush along the rail, or pick a piece up to turn it around."
    />
  );
}
