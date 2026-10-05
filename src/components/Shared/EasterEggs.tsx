// Two small things for whoever looks closely. Mounted once in App.
// - Leave the tab: the title asks you back.
// - Open the console: a note for whoever looks under the hood.
import { useEffect } from 'react';

const AWAY_TITLE = 'Pleasee, come back :)';

function EasterEggs() {
  // The tab asks you back
  useEffect(() => {
    let original = document.title;
    const onVisibility = () => {
      if (document.hidden) {
        original = document.title;
        document.title = AWAY_TITLE;
      } else if (document.title === AWAY_TITLE) {
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
        'Press Ctrl + K for the terminal.',
      'font: 600 14px "DM Sans", sans-serif; color: #f0732d',
      'font: 13px "DM Sans", sans-serif',
    );
  }, []);

  return null;
}

export default EasterEggs;
