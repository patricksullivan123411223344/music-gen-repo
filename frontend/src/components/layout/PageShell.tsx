import type { ReactNode } from 'react';
import '../../css/layout.css';

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** narrow = auth-style centered card; wide = full content width */
  variant?: 'narrow' | 'wide';
}

export default function PageShell({
  title,
  subtitle,
  children,
  variant = 'wide',
}: PageShellProps) {
  return (
    <main className={`page-shell page-shell--${variant}`}>
      <header className="page-shell__header">
        <h1 className="page-shell__title">{title}</h1>
        {subtitle && <p className="page-shell__subtitle">{subtitle}</p>}
      </header>
      <div className="page-shell__content">{children}</div>
    </main>
  );
}
