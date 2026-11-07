export function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function trimmedCodePointLength(value: string | null | undefined): number {
  return codePointLength((value ?? '').trim());
}
