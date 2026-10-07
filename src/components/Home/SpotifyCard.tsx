// The "currently playing" card in the corner of the hero: the Uiverse card by
// Praashoo7, with the track read from content/nowPlaying.ts (fixed for now, the
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
      <a className="spotify-card__track" href={nowPlaying.url} target="_blank" rel="noopener noreferrer">
        {nowPlaying.cover ? (
          <img className="spotify-card__cover" src={nowPlaying.cover} alt="" width={40} height={40} />
        ) : (
          <span className="spotify-card__cover" aria-hidden="true" />
        )}
        <span className="spotify-card__song">
          {nowPlaying.title}
          <span className="spotify-card__artist">{nowPlaying.artist}</span>
        </span>
        <span className="spotify-card__play" aria-hidden="true" />
      </a>
    </aside>
  );
}
