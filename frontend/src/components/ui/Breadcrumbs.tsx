import { CaretRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={className ?? 'text-sm text-zinc-400'}>
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="font-medium text-zinc-100">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link to={item.href} className="text-zinc-300 transition-colors hover:text-zinc-100">
                  {item.label}
                </Link>
              ) : (
                <span className="text-zinc-300">{item.label}</span>
              )}

              {!isLast ? (
                <span aria-hidden className="text-[var(--dark-text-secondary)]">
                  <CaretRight size={14} weight="bold" />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
