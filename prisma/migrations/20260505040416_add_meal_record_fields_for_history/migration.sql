/*
  Warnings:

  - Added the required column `restaurant_name` to the `meal_records` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_meal_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "restaurant_id" TEXT,
    "restaurant_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "photo_url" TEXT,
    "eaten_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meal_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "meal_records_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_meal_records" ("category", "eaten_at", "id", "restaurant_id", "user_id") SELECT "category", "eaten_at", "id", "restaurant_id", "user_id" FROM "meal_records";
DROP TABLE "meal_records";
ALTER TABLE "new_meal_records" RENAME TO "meal_records";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
