'use client';

import { useEffect, useState } from 'react';
import { TelegramIcon, PinterestIcon } from '@/components/icons/SocialIcons';

interface Social {
  telegram: string;
  pinterest: string;
}

// Small social icons shown at the bottom of the profile screen. Links are
// admin-configurable and fetched from the public /api/social-links endpoint.
export function SocialLinksBar() {
  const [social, setSocial] = useState<Social | null>(null);

  useEffect(() => {
    fetch('/api/social-links')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Social | null) => setSocial(data))
      .catch(() => {});
  }, []);

  if (!social) return null;

  const links = [
    { href: social.telegram, label: 'Telegram', Icon: TelegramIcon },
    { href: social.pinterest, label: 'Pinterest', Icon: PinterestIcon },
  ].filter((l) => l.href && l.href.trim());

  if (links.length === 0) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="tappable grid h-10 w-10 place-items-center rounded-full border border-ink-100 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
        >
          <Icon size={20} />
        </a>
      ))}
    </div>
  );
}
