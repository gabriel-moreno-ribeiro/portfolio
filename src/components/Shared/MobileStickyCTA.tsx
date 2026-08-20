import { FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';

function MobileStickyCTA() {
  return (
    <div className="mobile-sticky-cta">
      <Link to="/contact" className="mobile-sticky-cta__btn">
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
    </div>
  );
}

export default MobileStickyCTA;
