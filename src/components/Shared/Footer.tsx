function Footer() {
  const links = [
    {
      name: "LinkedIn.",
      href: "https://linkedin.com/in/gabriel-moreno-ribeiro",
    },
    {
      name: "Github.",
      href: "https://github.com/gabriel-moreno-ribeiro",
    },
    {
      name: "Email.",
      href: "mailto:gabrielmribeiro@hibeex.com.br",
    },
    {
      name: "llms.txt",
      href: "/llms.txt",
    },
  ];

  return (
    <div className="footer">
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
    </div>
  );
}

export default Footer;
