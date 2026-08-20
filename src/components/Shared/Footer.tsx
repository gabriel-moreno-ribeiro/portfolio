function obfuscatedEmail() {
  const user = 'me';
  const domain = 'gabrielmr.com';
  return `${user}@${domain}`;
}

function Footer() {
  const links = [
    { name: "LinkedIn.", href: "https://linkedin.com/in/gabriel-moreno-ribeiro" },
    { name: "Github.", href: "https://github.com/gabriel-moreno-ribeiro" },
    { name: "Email.", href: `mailto:${obfuscatedEmail()}` },
    { name: "Privacy.", href: "/privacy" },
    { name: "Terms.", href: "/terms" },
    { name: "llms.txt", href: "/llms.txt" },
  ];

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__cta">
        <p className="footer__cta-text">
          Building cool things. Want to connect?
        </p>
        <a
          href={`mailto:${obfuscatedEmail()}`}
          className="footer__cta-link"
          aria-label="Send email to Gabriel"
        >
          {obfuscatedEmail()}
        </a>
      </div>
      <div className="links">
        {links.map((link, i) => (
          <a
            href={link.href}
            target={link.href.startsWith("/") ? "_self" : "_blank"}
            rel="noopener noreferrer"
            key={`footer-link-${i}`}
          >
            {link.name}
          </a>
        ))}
      </div>
      <p className="footer__copy">
        &copy; {new Date().getFullYear()} Gabriel Moreno Ribeiro
      </p>
    </footer>
  );
}

export default Footer;
