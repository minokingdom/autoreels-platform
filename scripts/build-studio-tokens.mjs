import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

const require = createRequire(import.meta.url);
const core = readFileSync(require.resolve('@astryxdesign/core/astryx.css'), 'utf8');
const neutralKeys = [
  'color-background-body', 'color-background-card', 'color-background-surface',
  'color-overlay', 'color-overlay-hover', 'color-text-primary',
  'color-text-secondary', 'color-border', 'color-border-emphasized',
  'color-text-info', 'color-info', 'color-info-muted', 'color-on-info',
  'color-text-success', 'color-text-warning', 'color-text-error',
  'radius-inner', 'radius-element', 'radius-container',
  'font-size-sm', 'font-size-base', 'font-size-lg', 'duration-fast'
];
const coreKeys = [
  'spacing-1', 'spacing-2', 'spacing-3', 'spacing-4', 'spacing-5',
  'font-weight-medium', 'font-weight-semibold', 'font-weight-bold'
];
const declarations = [...neutralKeys, ...coreKeys].map(key => {
  const value = neutralTheme.tokens[`--${key}`] ?? core.match(new RegExp(`--${key}:\\s*([^;}{]+);`))?.[1];
  if (!value) throw new Error(`Astryx 토큰을 찾을 수 없습니다. ${key}`);
  return `  --astryx-${key}: ${value};`;
});
const css = `/* Astryx Core / Neutral · Meta Platforms, Inc. and affiliates · MIT.
 * https://github.com/meta/astryx/blob/main/LICENSE
 * npm run design:tokens 명령으로 생성합니다.
 */\n:root {\n${declarations.join('\n')}\n}\n`;
const output = new URL('../public/assets/app/astryx-tokens.css', import.meta.url);
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8').replace(/\r\n/g, '\n') !== css) {
    throw new Error('npm run design:tokens로 Astryx 토큰을 갱신하세요.');
  }
} else {
  writeFileSync(output, css);
}
