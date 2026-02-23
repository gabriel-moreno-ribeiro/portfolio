function Footer() {
  const links = [
    {
      name: "LinkedIn.",
      href: "https://linkedin.com/in/avivashishta",
    },
    {
      name: "Github.",
      href: "https://github.com/AVIVASHISHTA29",
    },
    {
      name: "Email.",
      href: "mailto:avivashishta29@gmail.com",
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
