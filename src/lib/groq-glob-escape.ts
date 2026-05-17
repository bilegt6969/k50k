/** Escape user text for GROQ `match` glob patterns (* ? [ \). */
export function globEscapeForGroqMatch(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\*/g, '\\*')
    .replace(/\?/g, '\\?')
}
