import { useState } from 'react';

const MEDAL_COUNT = 39;
const GOLD_COUNT = 19;

function MedalSquare({ index }: { index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const n = String(index).padStart(2, '0');
  const isGold = index <= GOLD_COUNT;

  return (
    <div className={`medal-cell ${isGold ? 'gold' : ''}`}>
      {!failed && (
        <img
          src={`/honors/medals/medal-${n}.jpg`}
          alt={`Olympiad medal ${index}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={loaded ? undefined : { display: 'none' }}
        />
      )}
      {!loaded && (
        <div className="medal-ph">
          <span>🏅</span>
          <small>#{n}</small>
        </div>
      )}
    </div>
  );
}

function Honors() {
  return (
    <div className="honors-section" id="honors">
      <h1 className="heading" data-color-inverted="true" data-fun="The Fridge Magnet Collection">
        The Medal Wall.
      </h1>
      <div className="medal-gallery" data-fun-zone="true">
        <p className="medal-sub" data-fun="Each one cost several all-nighters. Worth it.">
          39 medals across 49 olympiads (19 gold) — math, physics, chemistry,
          astronomy, and more. One square per medal.
        </p>
        <div className="medal-grid">
          {Array.from({ length: MEDAL_COUNT }, (_, i) => (
            <MedalSquare key={i} index={i + 1} />
          ))}
        </div>
        <p className="medal-note">
          Drop the photos in <code>/honors/medals/</code> (medal-01.jpg …
          medal-39.jpg) and each square fills itself in.
        </p>
      </div>
    </div>
  );
}

export default Honors;
