import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
}

const links: NavLink[] = [
  { href: '/features', label: 'Features' },
  { href: '/industries', label: 'Industries' },
  { href: '/pricing', label: 'Pricing' },
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

