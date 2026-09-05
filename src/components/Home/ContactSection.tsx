import { FormEvent, useState } from 'react';
import { FiArrowUpRight, FiCalendar, FiCheck, FiGithub, FiLinkedin, FiMail, FiSend } from 'react-icons/fi';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL = ['me', 'gabrielmr.com'].join('@');

const channels = [
  { label: 'Email', value: EMAIL, href: `mailto:${EMAIL}`, Icon: FiMail },
  { label: 'Book a call', value: 'cal.com/gabrielmribeiro', href: 'https://cal.com/gabrielmribeiro', Icon: FiCalendar },
  { label: 'LinkedIn', value: 'gabriel-moreno-ribeiro', href: 'https://linkedin.com/in/gabriel-moreno-ribeiro', Icon: FiLinkedin },
  { label: 'GitHub', value: 'gabriel-moreno-ribeiro', href: 'https://github.com/gabriel-moreno-ribeiro', Icon: FiGithub },
];

function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'Name is required.';
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (!message.trim()) {
      errs.message = 'Message is required.';
    } else if (message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters.';
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setErrors({ message: 'Something went wrong. Please try again or email me directly.' });
      }
    } catch {
      setErrors({ message: 'Network error. Please try again or email me directly.' });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setName('');
    setEmail('');
    setMessage('');
    setErrors({});
    setSent(false);
  }

  return (
    <section className="contact-section" id="contact">
      <div className="contact-section__intro">
        <p className="contact-section__eyebrow">Contact</p>
        <h2 className="contact-section__title" data-color-inverted="true">
          Let's <em>talk.</em>
        </h2>
        <p className="contact-section__lead">
          Building something, hiring, or just curious? Write to me.
        </p>
        <ul className="contact-section__channels">
          {channels.map(({ label, value, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="contact-section__channel"
              >
                <span className="contact-section__channel-icon"><Icon /></span>
                <span className="contact-section__channel-text">
                  <span className="contact-section__channel-label">{label}</span>
                  <span className="contact-section__channel-value">{value}</span>
                </span>
                <FiArrowUpRight className="contact-section__channel-arrow" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="contact-section__card">
        {sent ? (
          <div className="contact-section__sent" role="status">
            <span className="contact-section__sent-icon"><FiCheck /></span>
            <h3>Message sent.</h3>
            <p>Got it. I'll write back soon.</p>
            <button type="button" className="contact-section__link-btn" onClick={reset}>
              Send another message
            </button>
          </div>
        ) : (
          <form className="contact-section__form" onSubmit={handleSubmit} noValidate>
            <div className="contact-section__row">
              <div className={`contact-section__field ${errors.name ? 'contact-section__field--error' : ''}`}>
                <label htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                  placeholder="Your name"
                  autoComplete="name"
                />
                {errors.name && <span className="contact-section__error">{errors.name}</span>}
              </div>

              <div className={`contact-section__field ${errors.email ? 'contact-section__field--error' : ''}`}>
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <span className="contact-section__error">{errors.email}</span>}
              </div>
            </div>

            <div className={`contact-section__field ${errors.message ? 'contact-section__field--error' : ''}`}>
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                value={message}
                onChange={e => { setMessage(e.target.value); setErrors(prev => ({ ...prev, message: undefined })); }}
                placeholder="What are you working on?"
                rows={5}
              />
              {errors.message && <span className="contact-section__error">{errors.message}</span>}
            </div>

            <div className="contact-section__actions">
              <button type="submit" className="contact-section__submit" disabled={submitting}>
                {submitting ? 'Sending...' : <>Send message <FiSend /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default ContactSection;
