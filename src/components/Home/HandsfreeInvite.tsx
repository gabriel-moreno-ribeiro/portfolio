// The robot's speech bubble in the hero. Off: says what hands-free mode does and turns it
// on. On: lists the gestures the robot answers and marks the one it has just seen.
import { FiVideo } from 'react-icons/fi';
import { toggleHandsfree, useHandsfreeStore } from '../../store/handsfreeStore';
import { useInputSourceStore, type RobotMove } from '../../store/inputSourceStore';

const supportsCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

const TRICKS: { move: RobotMove; sign: string; does: string }[] = [
  { move: 'wave', sign: '👋', does: 'waves back' },
  { move: 'spin', sign: '✌️', does: 'spins' },
  { move: 'jump', sign: '✊ → ✋', does: 'jumps' },
  { move: 'nod', sign: '👍', does: 'nods' },
  { move: 'cheer', sign: '🙌', does: 'parties' },
];

export default function HandsfreeInvite() {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const tracking = useInputSourceStore((s) => s.inputSource === 'camera');
  const last = useInputSourceStore((s) => s.robotMove);
  if (!supportsCamera) return null;

  if (!isEnabled || !tracking) {
    return (
      <button type="button" className="hero-invite" onClick={toggleHandsfree}>
        <strong>Wave at me 👋</strong>
        <span>Turn on your camera and I copy your moves.</span>
        <span className="hero-invite__cta">
          <FiVideo aria-hidden="true" /> Try hands-free
        </span>
      </button>
    );
  }

  return (
    <div className="hero-invite is-on">
      <strong>I copy your head. Now try:</strong>
      <ul>
        {TRICKS.map((t) => (
          // The key changes with every new trick, so the highlight replays each time.
          <li key={t.move === last?.kind ? `${t.move}-${last.at}` : t.move} className={t.move === last?.kind ? 'is-hit' : undefined}>
            <span aria-hidden="true">{t.sign}</span> {t.does}
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {last ? `The robot ${TRICKS.find((t) => t.move === last.kind)?.does}` : ''}
      </p>
    </div>
  );
}
