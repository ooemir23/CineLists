import { PGlite } from "@electric-sql/pglite";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
const root = fileURLToPath(new URL("../", import.meta.url));
const baseline = execFileSync(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/prisma/build/index.js", import.meta.url),
    ),
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    fileURLToPath(
      new URL("../tests/fixtures/pre-security-schema.prisma", import.meta.url),
    ),
    "--script",
  ],
  { cwd: root, encoding: "utf8" },
);
await db.exec(baseline);
await db.exec(`INSERT INTO "User" (id,username,"favoriteGenres",platforms,"favoriteMediaIds") VALUES
('u1','Alice','{}','{}',ARRAY['42','99']),('u2','alice','{}','{}','{}');
INSERT INTO "UserAdminProfile" ("userId", country) VALUES ('u1','DE');
INSERT INTO "MediaItem" (id,"tmdbId",type,title,genres) VALUES ('m42',42,'MOVIE','Movie','{}'),('t42',42,'TV','Show','{}'),('m99',99,'MOVIE','Only movie','{}');
INSERT INTO "Activity" (id,"userId","mediaId",type,"createdAt") VALUES ('a1','u1','m42','WATCHED','2026-01-01'),('a2','u1','m42','WATCHED','2026-02-01');
INSERT INTO "Comment" (id,"userId","activityId",content) VALUES ('c1','u2','a1','Keep this comment');`);
await db.exec(
  fs.readFileSync(
    new URL(
      "../prisma/migrations/20261007180000_security_consistency/migration.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
assert.equal(
  (await db.query("SELECT country FROM \"User\" WHERE id='u1'")).rows[0]
    .country,
  "DE",
);
assert.equal(
  (
    await db.query(
      'SELECT "userId" FROM "UsernameAlias" WHERE username=\'alice\'',
    )
  ).rows[0].userId,
  "u2",
);
const users = (await db.query('SELECT username FROM "User" ORDER BY id')).rows;
assert.match(users[0].username, /^alice_/);
assert.match(users[1].username, /^alice_/);
assert.notEqual(users[0].username, users[1].username);
assert.equal(
  (
    await db.query(
      'SELECT "userId" FROM "UsernameAlias" WHERE username=\'Alice\'',
    )
  ).rows[0].userId,
  "u1",
);
assert.equal(
  (await db.query('SELECT "activityId" FROM "Comment" WHERE id=\'c1\'')).rows[0]
    .activityId,
  "a2",
);
assert.deepEqual(
  (await db.query('SELECT "favoriteMediaIds" FROM "User" WHERE id=\'u1\''))
    .rows[0].favoriteMediaIds,
  ["movie:99", "42"],
);
assert.equal(
  (await db.query('SELECT count(*)::integer AS n FROM "FavoriteMedia"')).rows[0]
    .n,
  1,
);
await assert.rejects(
  db.query(
    `INSERT INTO "Activity" (id,"userId","mediaId",type) VALUES ('a3','u1','m42','WATCHED')`,
  ),
);
await assert.rejects(
  db.query(
    `INSERT INTO "User" (id,username) VALUES ('u3','${users[0].username.toUpperCase()}')`,
  ),
);
await db.query(
  `INSERT INTO "ActivityVote" ("userId","activityId",value) VALUES ('u2','a2',1)`,
);
await assert.rejects(
  db.query(
    `INSERT INTO "ActivityVote" ("userId","activityId",value) VALUES ('u2','a2',1)`,
  ),
);
await assert.rejects(db.query(`UPDATE "ActivityVote" SET value=1000000`));
await db.exec("BEGIN; UPDATE \"Activity\" SET votes=10 WHERE id='a2';");
await assert.rejects(
  db.query(
    `INSERT INTO "ActivityVote" ("userId","activityId",value) VALUES ('missing-user','a2',1)`,
  ),
);
await db.exec("ROLLBACK;");
assert.equal(
  (await db.query("SELECT votes FROM \"Activity\" WHERE id='a2'")).rows[0]
    .votes,
  0,
);
await db.exec(`ALTER TABLE "UserAdminProfile" ADD COLUMN IF NOT EXISTS "totalMinutes" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "UserDailyVisit" (id TEXT PRIMARY KEY,"userId" TEXT NOT NULL,day DATE NOT NULL,views INTEGER NOT NULL,"lastSeen" TIMESTAMP NOT NULL);
INSERT INTO "UserDailyVisit" VALUES ('v1','u1','2026-10-07',3,'2026-10-07'),('orphan','deleted-user','2026-10-07',1,'2026-10-07');
UPDATE "UserAdminProfile" SET "totalMinutes"=4 WHERE "userId"='u1';`);
await db.exec(
  fs.readFileSync(
    new URL(
      "../prisma/migrations/20261007193000_admin_reliability/migration.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
assert.equal(
  (await db.query('SELECT count(*)::int n FROM "MemberDailyVisit"')).rows[0].n,
  1,
);
assert.equal(
  (await db.query('SELECT views FROM "MemberDailyVisit"')).rows[0].views,
  3,
);
assert.equal(
  (await db.query('SELECT count(*)::int n FROM "UserDailyVisit"')).rows[0].n,
  2,
);
assert.equal(
  (
    await db.query(
      'SELECT "activeSeconds" FROM "UserAdminProfile" WHERE "userId"=\'u1\'',
    )
  ).rows[0].activeSeconds,
  240,
);
await assert.rejects(
  db.query(
    `INSERT INTO "MemberDailyVisit" (id,"userId",day) VALUES ('bad','missing','2026-10-07')`,
  ),
);
await assert.rejects(db.query(`UPDATE "MemberDailyVisit" SET views=-1`));
await assert.rejects(
  db.query(
    `INSERT INTO "MemberDailyVisit" (id,"userId",day) VALUES ('duplicate','u1','2026-10-07')`,
  ),
);
await db.close();
console.log(
  "PostgreSQL migration passed: username aliases, duplicates, comment preservation, typed favorites and unique/validation constraints.",
);
