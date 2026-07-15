import { useState } from 'react';
import type { CoinConfig } from '../types';

interface Props {
  coin: CoinConfig;
  size?: number;
  className?: string;
}

/**
 * Renders a coin logo image with a colored glyph fallback (first letter of symbol).
 */
export function CoinLogo({ coin, size = 40, className = '' }: Props) {
  const [errored, setErrored] = useState(false);
  const showImg = coin.logoUrl && !errored;

  if (showImg) {
    return (
      <img
        src={coin.logoUrl}
        alt={coin.name}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setErrored(true)}
        className={`rounded-full bg-base-800 p-0.5 object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: coin.color,
        fontSize: size * 0.4,
      }}
      aria-label={coin.name}
    >
      {coin.symbol.slice(0, 3)}
    </div>
  );
}
