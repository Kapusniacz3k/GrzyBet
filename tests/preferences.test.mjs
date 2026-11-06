import assert from 'node:assert/strict';
import test from 'node:test';
import { decodePreferences } from '../src/features/preferences-format.ts';
import { appThemes } from '../src/constants/app-theme.ts';

test('existing preferences keep hints and the original dark appearance', () => {
  assert.deepEqual(decodePreferences(null), { showHints: true, themeMode: 'dark' });
  for (const showHints of [true, false]) {
    assert.deepEqual(decodePreferences(JSON.stringify({ showHints })), { showHints, themeMode: 'dark' });
  }
});

test('both themes restore together with the hint preference', () => {
  for (const themeMode of ['light', 'dark']) {
    for (const showHints of [true, false]) {
      const saved = { showHints, themeMode };
      assert.deepEqual(decodePreferences(JSON.stringify(saved)), saved);
    }
  }
});

test('invalid settings are rejected instead of silently overwriting a saved choice', () => {
  for (const raw of ['{', 'null', '[]', '{}', '{"showHints":"false"}', '{"showHints":true,"themeMode":"other"}']) {
    assert.throws(() => decodePreferences(raw));
  }
});

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('small text, selected controls and badge names remain readable in both themes', () => {
  for (const [mode, colors] of Object.entries(appThemes)) {
    for (const background of [colors.background, colors.surface, colors.accentSoft]) {
      for (const foreground of [colors.text, colors.textSecondary, colors.textMuted, colors.accent]) {
        assert.ok(contrast(foreground, background) >= 4.5, `${mode}: ${foreground} on ${background}`);
      }
    }
    assert.ok(contrast(colors.onPrimary, colors.primary) >= 4.5, `${mode}: button text`);
    for (const badge of Object.values(colors.badges)) {
      assert.ok(contrast(badge, colors.surface) >= 4.5, `${mode}: badge ${badge}`);
      assert.ok(contrast(badge, colors.accentSoft) >= 4.5, `${mode}: current badge ${badge}`);
    }
  }
});
