import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const mapSource = readFileSync(
  join(process.cwd(), 'app/lucky-map-of-canada/lucky-map-of-canada.js'),
  'utf8'
);

describe('Lucky Map artwork image hints', () => {
  it('keeps eager/high-priority loading on the native picture fallback without a Next Image-only prop', () => {
    const picture = mapSource.match(/<picture className="w-full">[\\s\\S]*?<\\/picture>/)?.[0];

    expect(picture).toBeTruthy();
    expect(picture).toContain('type="image/avif"');
    expect(picture).toContain('type="image/webp"');
    expect(picture).toContain('src="/IMG_20260731_055452_187611.png"');
    expect(picture).toContain('loading="eager"');
    expect(picture).toContain('fetchPriority="high"');
    expect(picture).not.toMatch(/^\\s*priority\\s*$/m);
  });
});
