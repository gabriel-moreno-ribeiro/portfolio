import Link from 'next/link'

export function Footer() {
  const links = [
    { label: 'GitHub', href: 'https://github.com/gabriel' },
    { label: 'Twitter', href: 'https://twitter.com/gabriel' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/gabriel' },
    { label: 'Email', href: 'mailto:gabrielcms2112@gmail.com' },
  ]

  return (
    <footer className="border-t border-text-tertiary/10 py-12 mt-20">
      <div className="container-base">
        {/* Content */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
          <div>
            <h3 className="font-semibold mb-2">Gabriel</h3>
            <p className="text-text-secondary max-w-xs">
              Building and fixing things. Electrical engineer exploring the intersection of hardware and software.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-text-tertiary/10 pt-8">
          <p className="text-text-tertiary text-sm text-center">
            Built with Next.js. Deployed on Vercel.{' '}
            <Link href="#" className="hover:text-text-secondary transition-colors">
              View source
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
