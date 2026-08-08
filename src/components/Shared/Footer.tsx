function Footer() {
  const links = [
    { name: "LinkedIn.", href: "https://linkedin.com/in/gabriel-moreno-ribeiro" },
    { name: "Github.", href: "https://github.com/gabriel-moreno-ribeiro" },
    { name: "Email.", href: "mailto:gabrielmribeiro@hibeex.com.br" },
    { name: "Privacy.", href: "/privacy" },
    { name: "llms.txt", href: "/llms.txt" },
  ];

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__cta">
        <p className="footer__cta-text">
          Building financial AI for small businesses. Want to connect?
        </p>
        <a
          href="mailto:gabrielmribeiro@hibeex.com.br"
          className="footer__cta-link"
        >
          gabrielmribeiro@hibeex.com.br
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
        © {new Date().getFullYear()} Gabriel Moreno Ribeiro
      </p>
    </footer>
  );
}

export default Footer;
