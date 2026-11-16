import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SiGithub, SiLinkedin } from "react-icons/si";

const pages = [
  { name: "Home.", to: "/" },
  { name: "Library.", to: "/library" },
  { name: "News.", to: "/news" },
  { name: "Blog.", to: "/blog" },
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

// "THANK YOU" spelled on a contribution-style grid: 7 rows, 53 columns, like a year of days.
const GLYPHS: Record<string, string[]> = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
};
// Each column is its 7 cells, top to bottom: two blank columns either side, one between
// letters, three between the words.
const THANKS: string[] = (() => {
  const blank = '0000000';
  const cols: string[] = [blank, blank];
  'THANK YOU'.split('').forEach((ch, i, all) => {
    if (ch === ' ') return void cols.push(blank, blank);
    for (let c = 0; c < 5; c++) cols.push(GLYPHS[ch].map((row) => row[c]).join(''));
    if (i < all.length - 1) cols.push(blank);
  });
  return [...cols, blank, blank];
})();

function FooterThanks() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setSeen(true);
      io.disconnect();
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="footer__thanks" role="img" aria-label="Thank you" data-seen={seen} ref={ref}>
      {THANKS.map((col, c) =>
        col.split('').map((on, r) => (
          <i
            key={`${c}-${r}`}
            className={on === '1' ? `is-on is-l${(c * 7 + r * 3) % 3}` : undefined}
            style={on === '1' ? ({ '--c': c } as React.CSSProperties) : undefined}
          />
        )),
      )}
    </div>
  );
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
      <FooterThanks />
      <p className="footer__copy">
        &copy; {new Date().getFullYear()} Gabriel Moreno Ribeiro
      </p>
    </footer>
  );
}

export default Footer;
