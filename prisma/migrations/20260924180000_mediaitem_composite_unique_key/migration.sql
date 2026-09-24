-- MediaItem.tmdbId was globally unique, but movie/TV/person TMDB ids share the
-- same numeric namespace: a movie and a show can legitimately have the same
-- numeric id. Replace the single-column unique index with a composite
-- (type, tmdbId) index so both can be stored without colliding.
--
-- This is schema-only: since tmdbId was already unique, no two existing rows
-- can violate the new composite constraint, so no data migration is needed.
-- Safe to run with `prisma migrate deploy` once ready.

DROP INDEX "MediaItem_tmdbId_key";

CREATE UNIQUE INDEX "MediaItem_type_tmdbId_key" ON "MediaItem"("type", "tmdbId");
