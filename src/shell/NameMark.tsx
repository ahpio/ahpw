import type { ReactElement } from 'react';
import { Avatar } from '@softov/scena/ui';

/**
 * A colour for a name: the first three letters pick the hue, and each letter
 * after them moves it less than the one before. Accents and case are ignored;
 * an empty name is grey.
 */
export function textToColor(input: string): string {
  const text = [...input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()];

  if (!text.length) return 'hsl(0 0% 60%)';

  let hash = 2166136261;
  for (const char of text.slice(0, 3)) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  const baseHue = (hash >>> 0) % 360;

  let offset = 0;
  let weight = 14;
  for (const char of text.slice(3)) {
    const code = char.codePointAt(0)!;
    const influence = ((code * 17) % 101) / 50 - 1;
    offset += influence * weight;
    weight *= 0.55;
  }

  const hue = ((baseHue + offset) % 360 + 360) % 360;
  return `hsl(${Math.round(hue)} 65% 52%)`;
}

/**
 * A name as two letters in a circle of its colour: the first letter of each of
 * the first two words, or the first two letters of a single word.
 */
export function NameMark({ name, size, className }: { name: string; size: number; className?: string }): ReactElement {
  return <Avatar name={name} size={size} color={textToColor(name)} {...(className === undefined ? {} : { className })} />;
}
