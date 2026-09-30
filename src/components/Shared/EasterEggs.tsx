// The site's easter eggs, all in the voice of /story. Mounted once in App.
// - Type a word anywhere (not in a field): porca, fuse, d20, merlita, jarvana,
//   adalberto, "hey guys", or the Konami code.
// - Leave the tab: the title asks you back.
// - Open the console: a note for whoever looks under the hood.
// Everything else on the site talks through sayEgg() (utils/eggs.ts).
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/motion';
import { EGG_EVENT, sayEgg, type EggDetail } from '../../utils/eggs';
import PigSvg from './PigSvg';
import '../../styles/components/shared/easterEggs.scss';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

// Typed words. Longest first so "merlita" wins over anything it contains.
const WORDS: [string, () => void][] = [
  ['adalberto', () => sayEgg('Left school at 8. Never had the right tools. Built a 29.52 m² garage anyway. Still the best engineer I have ever met.')],
  ['merlita', () => sayEgg("merlita-escape-detector: status ESCAPED. Count: 2. Last seen heading for the garden. Grandpa asked for a porca; I'm still not sure which one he meant.", 'pig')],
  ['jarvana', () => sayEgg('J.A.R.V.A.N.A. (Jarvis + Silvana): "my tooth kind of hurts but only when I eat beans" → That sounds like sensitivity, not an emergency. First slot tomorrow? Please don\'t sue me, Marvel.')],
  ['hey guys', () => sayEgg('हे दोस्तों! (hey guys). 198:18:37 hours of tutorials, and that is the one line I can say with confidence.')],
  ['porca', () => sayEgg('You went to the garden and came back with the pig. In Portuguese the nut and the sow share a name. Grandpa laughed about this for years.', 'pig')],
  ['fuse', () => sayEgg('Battery. Alternator. Fuel filter. Three afternoons and money we did not have. It was a burned fuse, worth less than the coffee. It is always the fuse.')],
  ['d20', () => sayEgg('#9. A red Chevrolet D-20 he bought to move animals around, Merlita included. It starts now.', 'truck')],
];
const LONGEST = Math.max(...WORDS.map(([w]) => w.length));

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable || !!el.closest('.xterm');
}

function EasterEggs() {
  const [line, setLine] = useState<string | null>(null);
  const [show, setShow] = useState<{ kind: NonNullable<EggDetail['show']>; key: number } | null>(null);
  const hideRef = useRef(0);
  const reduced = useReducedMotion();

  // The corner line and the runners
  useEffect(() => {
    const onEgg = (e: Event) => {
      const { text, show: kind } = (e as CustomEvent<EggDetail>).detail;
      setLine(text);
      window.clearTimeout(hideRef.current);
      hideRef.current = window.setTimeout(() => setLine(null), Math.min(12000, 3500 + text.length * 45));
      if (kind && !reduced) setShow({ kind, key: Date.now() });
    };
    window.addEventListener(EGG_EVENT, onEgg);
    return () => window.removeEventListener(EGG_EVENT, onEgg);
  }, [reduced]);

  // Typed words and the Konami code
  useEffect(() => {
    let buffer = '';
    let konami = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key === KONAMI[konami]) {
        konami += 1;
        if (konami === KONAMI.length) {
          konami = 0;
          sayEgg('merlita-escape-detector: she brought friends. Escape count: 3. I am starting to think the fence is the problem.', 'pigs');
        }
      } else {
        konami = e.key === KONAMI[0] ? 1 : 0;
      }
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-LONGEST);
      const hit = WORDS.find(([w]) => buffer.endsWith(w));
      if (hit) {
        buffer = '';
        hit[1]();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The tab asks you back
  useEffect(() => {
    let original = document.title;
    const onVisibility = () => {
      if (document.hidden) {
        original = document.title;
        document.title = 'Come back, the fuse is fixed.';
      } else if (document.title === 'Come back, the fuse is fixed.') {
        document.title = original;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // A note for whoever opens the console
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      '%cLooking under the hood? Good.%c\n' +
        'The wall between "broken" and "working" is thinner than people assume, and almost nobody bothers to look.\n' +
        'Everything in my grandfather\'s garage had a number. This site is #13.\n' +
        'Try: Ctrl + K, then `fuse`, `merlita` or `tools`. Or just type porca anywhere.',
      'font: 600 14px "DM Sans", sans-serif; color: #f0732d',
      'font: 13px "DM Sans", sans-serif',
    );
  }, []);

  return (
    <>
      {line && (
        <p className="egg-line" role="status" onClick={() => setLine(null)}>
          {line}
        </p>
      )}
      {show && (
        <div className="egg-stage" aria-hidden="true" key={show.key} onAnimationEnd={() => setShow(null)}>
          {show.kind === 'truck' ? (
            <img className="egg-truck" src="/story/d20.webp" alt="" width={220} height={165} />
          ) : (
            Array.from({ length: show.kind === 'pigs' ? 3 : 1 }, (_, i) => (
              <span key={i} className="egg-pig pig--walking" style={{ animationDelay: `${i * 0.45}s` }}>
                <PigSvg />
              </span>
            ))
          )}
        </div>
      )}
    </>
  );
}

export default EasterEggs;
