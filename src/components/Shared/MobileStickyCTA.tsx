import { useEffect, useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Phones only (CSS). Hidden while the hero and its own buttons are on screen; slides in after that.
const SHOW_AFTER = 520;

function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`mobile-sticky-cta ${visible ? 'is-visible' : ''}`} aria-label="Quick contact" aria-hidden={!visible}>
      <Link to="/#contact" className="mobile-sticky-cta__btn" tabIndex={visible ? 0 : -1}>
        Get in Touch
      </Link>
      <a
        href="https://cal.com/gabrielmribeiro"
        target="_blank"
        rel="noopener noreferrer"
        className="mobile-sticky-cta__btn mobile-sticky-cta__btn--secondary"
        tabIndex={visible ? 0 : -1}
      >
        <FiCalendar /> Book a Call
      </a>
    </nav>
  );
}

export default MobileStickyCTA;
