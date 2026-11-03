import { useId } from 'react';

export function Logo({ className = 'size-10' }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-ember-2)" />
          <stop offset="1" stopColor="var(--color-ember)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${id})`} />
      <path
        d="M17 24.5l5 5 9-10"
        fill="none"
        stroke="var(--color-ember-ink)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="35" y="21" width="13" height="5" rx="2.5" fill="var(--color-ember-ink)" />
      <rect x="17" y="36" width="31" height="5" rx="2.5" fill="var(--color-ember-ink)" opacity="0.85" />
      <rect x="17" y="45" width="22" height="5" rx="2.5" fill="var(--color-ember-ink)" opacity="0.6" />
    </svg>
  );
}
