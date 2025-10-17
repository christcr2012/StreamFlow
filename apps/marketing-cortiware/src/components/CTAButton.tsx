import Link from 'next/link';

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CTAButton({ href, children, className = '', onClick }: CTAButtonProps) {
  return (
    <Link
      href={href}
      className={`px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-text-on-brand rounded-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-normal hover:scale-105 relative overflow-hidden group ${className}`}
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-normal" />
    </Link>
  );
}

