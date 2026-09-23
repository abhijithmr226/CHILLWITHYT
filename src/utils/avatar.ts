/**
 * DiceBear Avatar Utility
 * Provides deterministic, crisp SVG avatars powered by the DiceBear 9.x API
 */

export type DiceBearStyle = 
  | 'bottts'
  | 'lorelei'
  | 'adventurer'
  | 'fun-emoji'
  | 'thumbs'
  | 'notionists'
  | 'micah';

export const DICEBEAR_STYLES: DiceBearStyle[] = [
  'bottts',
  'lorelei',
  'adventurer',
  'fun-emoji',
  'thumbs',
  'notionists',
  'micah',
];

/**
 * Returns a DiceBear avatar URL with a specific seed and style.
 */
export function getDiceBearAvatar(seed: string, style: DiceBearStyle = 'bottts'): string {
  const safeSeed = encodeURIComponent(seed.trim() || 'chiller');
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${safeSeed}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Generate a set of popular preset DiceBear avatars across distinct seeds/styles
 * for users to quickly pick in Settings or Profile views.
 */
export function getDiceBearPresets(seedBase = 'chill'): string[] {
  return [
    `https://api.dicebear.com/9.x/bottts/svg?seed=${seedBase}_cyber&radius=50&backgroundColor=b6e3f4,c0aede`,
    `https://api.dicebear.com/9.x/lorelei/svg?seed=${seedBase}_melody&radius=50&backgroundColor=ffd5dc,ffdfbf`,
    `https://api.dicebear.com/9.x/adventurer/svg?seed=${seedBase}_vibe&radius=50&backgroundColor=d1d4f9,c0aede`,
    `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seedBase}_party&radius=50&backgroundColor=ffdfbf,ffd5dc`,
    `https://api.dicebear.com/9.x/thumbs/svg?seed=${seedBase}_sonic&radius=50&backgroundColor=b6e3f4,d1d4f9`,
    `https://api.dicebear.com/9.x/notionists/svg?seed=${seedBase}_lofi&radius=50&backgroundColor=c0aede,ffd5dc`,
  ];
}

/**
 * Helper to ensure any user avatar URL falls back to DiceBear if empty or invalid
 */
export function resolveAvatar(avatarUrl?: string | null, fallbackSeed = 'guest'): string {
  if (avatarUrl && avatarUrl.trim() && !avatarUrl.includes('unsplash.com/photo-1534528741775-53994a69daeb')) {
    return avatarUrl;
  }
  return getDiceBearAvatar(fallbackSeed);
}
