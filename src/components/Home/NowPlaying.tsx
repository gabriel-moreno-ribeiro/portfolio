// A small "listening now" card under the contact channels: three bars moving
// to no beat in particular, the track, and a link to it on YouTube Music.
import { FiMusic } from "react-icons/fi";
import { nowPlaying } from "../../content/nowPlaying";
import "../../styles/components/home/nowPlaying.scss";

export default function NowPlaying() {
  return (
    <a
      className="now-playing"
      href={nowPlaying.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Listening now: ${nowPlaying.title} by ${nowPlaying.artist} (opens YouTube Music in a new tab)`}
    >
      <span className="now-playing__cover" aria-hidden="true"><FiMusic /></span>
      <span className="now-playing__text">
        <span className="now-playing__label">
          <span className="now-playing__bars" aria-hidden="true"><i /><i /><i /></span>
          Listening now
        </span>
        <span className="now-playing__track">
          <span className="now-playing__title">{nowPlaying.title}</span>
          <span className="now-playing__artist">{nowPlaying.artist}</span>
        </span>
      </span>
    </a>
  );
}
