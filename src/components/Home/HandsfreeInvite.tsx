// The robot's callout in the hero. Off: says what hands-free mode does and turns it on.
// On: lists the gestures the robot answers and marks the one it has just seen.
import type { IconType } from 'react-icons';
import { FiArrowRight } from 'react-icons/fi';
import { PiHandFist, PiHandPalm, PiHandPeace, PiHandWaving, PiThumbsUp } from 'react-icons/pi';
import { toggleHandsfree, useHandsfreeStore } from '../../store/handsfreeStore';
import { useInputSourceStore, type RobotMove } from '../../store/inputSourceStore';

const supportsCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

// What the visitor does (the icons, with a name for screen readers) and what the robot does back.
export const TRICKS: { move: RobotMove; icons: IconType[]; sign: string; does: string }[] = [
  { move: 'wave', icons: [PiHandWaving], sign: 'Wave', does: 'waves back' },
  { move: 'spin', icons: [PiHandPeace], sign: 'Peace sign', does: 'spins' },
  { move: 'jump', icons: [PiHandFist, PiHandPalm], sign: 'Fist, then open hand', does: 'jumps' },
  { move: 'nod', icons: [PiThumbsUp], sign: 'Thumbs up', does: 'nods' },
  // Two open palms; the first is mirrored in CSS so they read as a left and a right hand.
  { move: 'cheer', icons: [PiHandPalm, PiHandPalm], sign: 'Both hands up', does: 'parties' },
];

export default function HandsfreeInvite() {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const tracking = useInputSourceStore((s) => s.inputSource === 'camera');
  const last = useInputSourceStore((s) => s.robotMove);
  if (!supportsCamera) return null;

  if (!isEnabled || !tracking) {
    return (
      <button type="button" className="hero-invite" onClick={toggleHandsfree}>
        <span className="hero-invite__label">Hands-free</span>
        <em>Wave at me.</em>
        <span className="hero-invite__text">Turn on your camera and I copy your face and hands.</span>
        <span className="hero-invite__cta">
          Try it <FiArrowRight aria-hidden="true" />
        </span>
      </button>
    );
  }

  const hit = TRICKS.find((t) => t.move === last?.kind);
  return (
    <div className="hero-invite is-on">
      <span className="hero-invite__label hero-invite__label--live">Camera on</span>
      <em>I copy you.</em>
      <span className="hero-invite__label">Blink · smile · yawn</span>
      <ul>
        {TRICKS.map((t) => (
          // The key changes with every new trick, so the highlight replays each time.
          <li
            key={t === hit ? `${t.move}-${last!.at}` : t.move}
            className={t === hit ? 'is-hit' : undefined}
            data-move={t.move}
            role="img"
            aria-label={`${t.sign}: the robot ${t.does}`}
            title={`${t.sign}: the robot ${t.does}`}
          >
            {t.icons.map((Icon, i) => (
              <Icon key={i} aria-hidden="true" />
            ))}
          </li>
        ))}
      </ul>
      {/* Says what the robot has just done; until then, what to do. */}
      <span className="hero-invite__label hero-invite__label--said" aria-live="polite">
        {hit ? `${hit.sign} · ${hit.does}` : 'Now try a gesture'}
      </span>
    </div>
  );
}
