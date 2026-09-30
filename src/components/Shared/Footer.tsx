import { sayEgg } from "../../utils/eggs";
import { Link } from "react-router-dom";
import { SiGithub, SiLinkedin } from "react-icons/si";

const pages = [
  { name: "Home.", to: "/" },
  { name: "Library.", to: "/library" },
  { name: "News.", to: "/news" },
  { name: "Story.", to: "/story" },
  { name: "Contact.", to: "/#contact" },
];

// Brand marks instead of the words "LinkedIn." and "GitHub."
const socials = [
  { name: "LinkedIn", href: "https://linkedin.com/in/gabriel-moreno-ribeiro", Icon: SiLinkedin },
  { name: "GitHub", href: "https://github.com/gabriel-moreno-ribeiro", Icon: SiGithub },
];

function obfuscatedEmail() {
  const user = 'me';
  const domain = 'gabrielmr.com';
  return `${user}@${domain}`;
}

// Clicking the year: one line per click, in order, then it starts over
const YEAR_LINES = [
  'He numbered everything in the garage except the years. Those he remembered.',
  '121 laptops, 21 states, 198:18:37 hours of Hindi tutorials. The year is the only round number here.',
  'Made in Missão Velha, assembled in Salvador, shipped from São Paulo.',
];
let yearClicks = 0;
function nextYearLine() {
  sayEgg(YEAR_LINES[yearClicks % YEAR_LINES.length]);
  yearClicks += 1;
}

function Footer() {
  const links = [
    { name: "Email.", href: `mailto:${obfuscatedEmail()}` },
    { name: "Resume.", href: "/files/gabriel-moreno-ribeiro-resume.pdf", newTab: true },
    { name: "Privacy.", href: "/privacy" },
    { name: "Terms.", href: "/terms" },
    { name: "llms.txt", href: "/llms.txt" },
  ];

  return (
    <footer className="footer">
      <div className="footer__cta">
        <p className="footer__cta-text">
          Want to talk?
        </p>
        <a
          href={`mailto:${obfuscatedEmail()}`}
          className="footer__cta-link"
        >
          {obfuscatedEmail()}
        </a>
      </div>
      <nav className="links" aria-label="Pages">
        {pages.map((page) => (
          <Link to={page.to} key={page.to}>{page.name}</Link>
        ))}
      </nav>
      <div className="links">
        {socials.map(({ name, href, Icon }) => (
          <a
            key={href}
            className="footer__social"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} (opens in a new tab)`}
            title={name}
          >
            <Icon aria-hidden="true" />
          </a>
        ))}
        {links.map((link, i) => (
          <a
            href={link.href}
            target={link.href.startsWith("/") && !("newTab" in link) ? "_self" : "_blank"}
            rel="noopener noreferrer"
            key={`footer-link-${i}`}
          >
            {link.name}
          </a>
        ))}
      </div>
      <p className="footer__copy">
        &copy;{' '}
        <button type="button" className="footer__year" onClick={nextYearLine} aria-label="A note about the year">
          {new Date().getFullYear()}
        </button>{' '}
        Gabriel Moreno Ribeiro
      </p>
    </footer>
  );
}

export default Footer;
