/** Keep first occurrence of each id (preserves drag/save order). */
export function dedupeIdsPreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/** Deduplicate records by `_id` (last write wins for stale duplicates). */
export function dedupeById<T extends { _id: string }>(items: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of items) {
    if (item._id) map.set(item._id, item)
  }
  return Array.from(map.values())
}
