// The "currently playing" card in the corner of the hero: the Uiverse card by
// Praashoo7, with the tracks read from content/nowPlaying.ts (fixed for now, the
// YouTube Music account feeds it later).
import { SiSpotify } from "react-icons/si";
import { nowPlaying } from "../../content/nowPlaying";
import "../../styles/components/home/spotifyCard.scss";

export default function SpotifyCard() {
  return (
    <aside className="spotify-card" aria-label="Currently playing">
      <div className="spotify-card__head">
        <SiSpotify className="spotify-card__logo" aria-hidden="true" />
        <p className="spotify-card__heading">Currently playing</p>
        <span className="spotify-card__bars" aria-hidden="true"><i /><i /><i /></span>
      </div>
      <ul className="spotify-card__list">
        {nowPlaying.map((t) => (
          <li key={t.title}>
            <a className="spotify-card__track" href={t.url} target="_blank" rel="noopener noreferrer">
              {t.cover ? (
                <img className="spotify-card__cover" src={t.cover} alt="" width={40} height={40} loading="lazy" />
              ) : (
                <span className="spotify-card__cover" aria-hidden="true" />
              )}
              <span className="spotify-card__song">
                {t.title}
                <span className="spotify-card__artist">{t.artist}</span>
              </span>
              <span className="spotify-card__play" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
