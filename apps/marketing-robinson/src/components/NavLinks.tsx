import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
}

const links: NavLink[] = [
  { href: '/services', label: 'Services' },
  { href: '/security', label: 'Security' },
  { href: '/why', label: 'Why Robinson' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

interface NavLinksProps {
  className?: string;
  onLinkClick?: () => void;
}

export function NavLinks({ className = '', onLinkClick }: NavLinksProps) {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={className}
          onClick={onLinkClick}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

