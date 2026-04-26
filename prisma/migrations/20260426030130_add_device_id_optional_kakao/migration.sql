-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kakao_id" TEXT,
    "location_lat" REAL,
    "location_lng" REAL,
    "distance_pref" INTEGER NOT NULL DEFAULT 10,
    "allergies" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_users" ("allergies", "created_at", "distance_pref", "id", "kakao_id", "location_lat", "location_lng") SELECT "allergies", "created_at", "distance_pref", "id", "kakao_id", "location_lat", "location_lng" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_kakao_id_key" ON "users"("kakao_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
