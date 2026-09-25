import { Link } from "react-router-dom";
import { formatRelative, useGitHub } from "../../lib/data";
import { LivePulse } from "../../lib/motion";

const pages = [
  { name: "Home.", to: "/" },
  { name: "Library.", to: "/library" },
  { name: "News.", to: "/news" },
  { name: "Story.", to: "/story" },
  { name: "Contact.", to: "/#contact" },
];

function obfuscatedEmail() {
  const user = 'me';
  const domain = 'gabrielmr.com';
  return `${user}@${domain}`;
}

function Footer() {
  const github = useGitHub();
  const siteCommit = github.data?.siteLastCommit ?? null;
  const links = [
    { name: "LinkedIn.", href: "https://linkedin.com/in/gabriel-moreno-ribeiro" },
    { name: "GitHub.", href: "https://github.com/gabriel-moreno-ribeiro" },
    { name: "Email.", href: `mailto:${obfuscatedEmail()}` },
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
      {/* How fresh this page is: the last commit on the site repo and the build time. */}
      <p className="footer__freshness">
        {siteCommit && (
          <>
            <a
              className="footer__freshness-link"
              href={siteCommit.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              last commit {formatRelative(siteCommit.at)}
            </a>
            <LivePulse
              className="footer__freshness-pulse"
              source={github.source}
              updatedAt={github.updatedAt}
              stale={github.stale}
            />
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>site updated {formatRelative(__BUILD_TIME__)}</span>
      </p>
      <p className="footer__copy">
        &copy; {new Date().getFullYear()} Gabriel Moreno Ribeiro
      </p>
    </footer>
  );
}

export default Footer;
