import { describe, expect, it } from 'vitest';
import { nameFor, packageFollows, sourceFollows, starterPackage, starterSource, titleFor } from './starter.js';

describe('the starter of a written plugin', () => {
  it('names the package and the title after the id', () => {
    expect(JSON.parse(starterPackage('weather-now'))).toEqual({ name: 'weather-now', version: '0.1.0', type: 'module', dependencies: {} });
    expect(starterSource('weather-now')).toContain("export const title = 'Weather now';");
    expect(starterSource('weather-now')).toContain('export function apply(host: PluginHost, options: Record<string, unknown>): void {');
  });

  it('has a stand-in while the id is empty', () => {
    expect(nameFor('')).toBe('my-plugin');
    expect(titleFor('')).toBe('My plugin');
    expect(JSON.parse(starterPackage('')).name).toBe('my-plugin');
  });

  it('follows the id while the line is the one it made', () => {
    expect(packageFollows(starterPackage('w'), 'w', 'weather')).toBe(starterPackage('weather'));
    expect(sourceFollows(starterSource('w'), 'w', 'weather')).toBe(starterSource('weather'));
    expect(packageFollows(starterPackage(''), '', 'weather')).toBe(starterPackage('weather'));
  });

  it('keeps a line the admin changed', () => {
    const edited = starterPackage('w').replace('"name": "w"', '"name": "@me/weather"');
    expect(packageFollows(edited, 'w', 'weather')).toBe(edited);
    const retitled = starterSource('w').replace("'W'", "'Forecast'");
    expect(sourceFollows(retitled, 'w', 'weather')).toBe(retitled);
  });
});
