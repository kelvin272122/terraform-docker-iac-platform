import { codePointLength, trimmedCodePointLength } from './code-points';

describe('code point helpers', () => {
  it('counts astral characters as one code point', () => {
    expect('\u{1F600}'.length).toBe(2);
    expect(codePointLength('\u{1F600}')).toBe(1);
    expect(codePointLength('a'.repeat(99) + '\u{1F600}')).toBe(100);
  });

  it('trims before counting', () => {
    expect(trimmedCodePointLength('  texto  ')).toBe(5);
    expect(trimmedCodePointLength('   ')).toBe(0);
    expect(trimmedCodePointLength(null)).toBe(0);
  });
});
