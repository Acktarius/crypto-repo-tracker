import type { CoinConfig } from '../types';

/**
 * Default tracked coins and their GitHub repositories.
 * Repos use the owner/name form expected by the GitHub API.
 */
export const DEFAULT_COINS: CoinConfig[] = [
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    repos: ['bitcoin/bitcoin'],
    custom: false,
    color: '#f7931a',
    logoUrl: 'https://assets.coincap.io/assets/icons/btc@2x.png',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    repos: ['ethereum/go-ethereum'],
    custom: false,
    color: '#8a92b2',
    logoUrl: 'https://assets.coincap.io/assets/icons/eth@2x.png',
  },
  {
    id: 'ada',
    symbol: 'ADA',
    name: 'Cardano',
    repos: ['IntersectMBO/cardano-node'],
    custom: false,
    color: '#0033ad',
    logoUrl: 'https://assets.coincap.io/assets/icons/ada@2x.png',
  },
  {
    id: 'ltc',
    symbol: 'LTC',
    name: 'Litecoin',
    repos: ['litecoin-project/litecoin'],
    custom: false,
    color: '#bebebe',
    logoUrl: 'https://assets.coincap.io/assets/icons/ltc@2x.png',
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: 'Dogecoin',
    repos: ['dogecoin/dogecoin'],
    custom: false,
    color: '#c2a633',
    logoUrl: 'https://assets.coincap.io/assets/icons/doge@2x.png',
  },
  {
    id: 'ccx',
    symbol: 'CCX',
    name: 'Conceal',
    repos: [
      'ConcealNetwork/conceal-core',
      'ConcealNetwork/conceal-next-wallet',
    ],
    custom: false,
    color: '#2e7d32',
    logoUrl:
      'https://coin-images.coingecko.com/coins/images/6382/large/conceal.png?1696506751',
  },
  {
    id: 'zano',
    symbol: 'ZANO',
    name: 'Zano',
    repos: ['hyle-team/zano'],
    custom: false,
    color: '#7b2ff7',
  },
  {
    id: 'xmr',
    symbol: 'XMR',
    name: 'Monero',
    repos: ['monero-project/monero'],
    custom: false,
    color: '#ff6600',
    logoUrl: 'https://assets.coincap.io/assets/icons/xmr@2x.png',
  },
];

export const DEFAULT_COIN_MAP: Record<string, CoinConfig> = Object.fromEntries(
  DEFAULT_COINS.map((c) => [c.id, c]),
);

/** A default repo slug used to pre-fill the add-coin form */
export const DEFAULT_LOGO_FALLBACK = '';
