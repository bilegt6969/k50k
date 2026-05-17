export const PLACEHOLDER_IMAGE =
  'https://placehold.co/600x600/f5f5f5/999999?text=No+Image';
export const CURRENCY_FETCH_TIMEOUT = 10000;

export function formatReleaseDate(
  releaseDate: string | null | undefined
): string {
  if (!releaseDate) return 'N/A';
  if (releaseDate.length === 8) {
    try {
      const year = releaseDate.substring(0, 4);
      const month = releaseDate.substring(4, 6);
      const day = releaseDate.substring(6, 8);
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        return new Date(`${year}-${month}-${day}T00:00:00Z`).toLocaleDateString(
          undefined,
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC',
          }
        );
      }
    } catch {
      /* noop */
    }
  }
  return releaseDate;
}

export function getHighResImageUrl(url: string): string {
  if (!url) return PLACEHOLDER_IMAGE;
  return url
    .replace(/width=\d+/, 'width=1500')
    .replace(/\/medium\//, '/original/')
    .replace(/\/attachments\//, '/transform/v1/attachments/');
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement>,
  placeholder = PLACEHOLDER_IMAGE
): void {
  const target = e.currentTarget;
  if (target.src !== placeholder) {
    target.src = placeholder;
  }
}
