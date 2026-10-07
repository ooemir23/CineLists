export type MediaIdentity = { id: number; type: "movie" | "tv" };
export function mediaKey(id: number | string, type: string) {
  return `${type.toLowerCase()}:${id}`;
}
export function parseMediaKey(key: string): MediaIdentity | null {
  const match = /^(movie|tv):([1-9]\d{0,9})$/.exec(key);
  return match
    ? { type: match[1] as MediaIdentity["type"], id: Number(match[2]) }
    : null;
}
