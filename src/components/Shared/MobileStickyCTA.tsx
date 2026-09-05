import { FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';

function MobileStickyCTA() {
  return (
    <nav className="mobile-sticky-cta" aria-label="Quick contact">
      <Link to="/#contact" className="mobile-sticky-cta__btn">
        Get in Touch
      </Link>
      <a
        href="https://cal.com/gabrielmribeiro"
        target="_blank"
        rel="noopener noreferrer"
        className="mobile-sticky-cta__btn mobile-sticky-cta__btn--secondary"
      >
        <FiCalendar /> Book a Call
      </a>
    </nav>
  );
}

export default MobileStickyCTA;
