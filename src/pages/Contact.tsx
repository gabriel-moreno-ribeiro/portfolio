import { motion } from 'motion/react';
import { FormEvent, useState } from 'react';
import { FiArrowLeft, FiSend } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Shared/Footer';
import { useDocumentHead } from '../hooks/useDocumentHead';
import '../styles/components/shared/contact.scss';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

function Contact() {
  useDocumentHead({
    title: 'Contact — Gabriel Moreno Ribeiro',
    description: 'Get in touch with Gabriel Moreno Ribeiro. Send a message about projects, collaborations, or opportunities.',
    canonical: 'https://gabrielmr.com/contact',
  });

  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

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
        navigate('/obrigado');
      } else {
        setErrors({ message: 'Something went wrong. Please try again or email me directly.' });
      }
    } catch {
      setErrors({ message: 'Network error. Please try again or email me directly.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="contact-page">
      <motion.div
        className="contact-page__container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Link to="/" className="contact-page__back">
          <FiArrowLeft /> Back
        </Link>

        <h1 className="contact-page__title">Get in touch</h1>
        <p className="contact-page__subtitle">
          Have a project, question, or opportunity? Send me a message.
        </p>

        <form className="contact-page__form" onSubmit={handleSubmit} noValidate>
          <div className={`contact-page__field ${errors.name ? 'contact-page__field--error' : ''}`}>
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
              placeholder="Your name"
              autoComplete="name"
            />
            {errors.name && <span className="contact-page__error">{errors.name}</span>}
          </div>

          <div className={`contact-page__field ${errors.email ? 'contact-page__field--error' : ''}`}>
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="contact-page__error">{errors.email}</span>}
          </div>

          <div className={`contact-page__field ${errors.message ? 'contact-page__field--error' : ''}`}>
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              value={message}
              onChange={e => { setMessage(e.target.value); setErrors(prev => ({ ...prev, message: undefined })); }}
              placeholder="Tell me about your project or idea..."
              rows={5}
            />
            {errors.message && <span className="contact-page__error">{errors.message}</span>}
          </div>

          <button
            type="submit"
            className="contact-page__submit"
            disabled={submitting}
          >
            {submitting ? 'Sending...' : <>Send Message <FiSend /></>}
          </button>
        </form>

        <p className="contact-page__alt">
          Or email me directly at{' '}
          <a href={'mai' + 'lto:me' + '@gabrielmr.com'}>
            me@gabrielmr.com
          </a>
        </p>
      </motion.div>
      <Footer />
    </div>
  );
}

export default Contact;
